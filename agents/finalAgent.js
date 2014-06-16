'use strict';

var async = require('async');
var BZRClient = require('bzrflag-client');
var pf = require('../lib/potential-fields');
var Kalman = require('../lib/kalman');

var OccWorld = require('../lib/OccWorld');

var client;

if (process.argv.length > 2) {
  var port = process.argv[2];
  client = new BZRClient(port);
} else {
  console.error('Port required as second argument.');
  process.exit();
}

var worldSize, constants, occ, myBaseLocation, staticFields = [], lastpos = {};
var shotSpeed;

init();

function init() {
  async.series([
    function getConstants(done) {
      client.getConstants(function(c) {
        constants = c;
        shotSpeed = parseFloat(c.shotspeed);
        done(null, c);
      });
    },
    function getMyBaseLocation(done) {
      client.getBases(function(bases) {
        for (var i = bases.length - 1; i >= 0; i--) {
          var base = bases[i];
          if (base.color === constants.team) {
            myBaseLocation = {
              x: (base.corners[0].x + base.corners[1].x + base.corners[2].x + base.corners[3].x) / 4,
              y: (base.corners[0].y + base.corners[1].y + base.corners[2].y + base.corners[3].y) / 4
            };
            done();
          }
        }
      });
    }
  ], continueInit);
}

function continueInit() {
  worldSize = parseInt(constants.worldsize, 10);
  var pos = parseFloat(constants.truepositive);
  var pnons = parseFloat(constants.truenegative);
  var ps = 0.01;
  
  occ = new OccWorld(worldSize, pos, pnons, ps);
  occ.initWebSocket();

  updateContinously();
}

function updateContinously() {
  async.forever(
    function(repeat) {
      console.time('query');
      //console.log('querying');
      async.parallel([function getTanks(done) {
        console.time('get tanks');
        client.getMyTanks(function(myTanks) {
          console.timeEnd('get tanks');
          done(null, myTanks);
        });
      }, function getFlags(done) {
        client.getFlags(function(flags){
          done(null, flags);
        });
      }, function getEnemies(done) {
        client.getOtherTanks(function(enemies) {
          done(null, enemies);
        });
      }], function(err, results) {
        console.timeEnd('query');
        onUpdate(results);
        repeat();
      });
    }
  );
}

var times = [];
var kalmans = {};
function onUpdate(state) {
  var myTanks = state[0];
  var flags = state[1];
  var enemies = state[2];

  // get times for first 5 calls to figure out dt
  if (times.length < 5) {
    times.push(Date.now());
  } else {
    // dt = average time between update calls
    var dt = times.reduce(function(m, t) {
      m.sum += t-m.last;
      m.last = t;
      return m;
    }, {sum: 0, last: times[0]}).sum/(times.length-1);
    
    // update kalman filters
    enemies.forEach(function(tank) {
      var id = tank.callsign;
      var filter = kalmans[id] = kalmans[id] || new Kalman({dt: dt});
      filter.guess = filter.update(tank.loc.x, tank.loc.y);
    });
  }


  staticFields.length = 0;
  for (var i = 0; i < occ.world.length; i += 10) {
    for (var j = 0; j < occ.world[i].length; j += 10) {
      var obstacleConf = 0.009;
      var val = occ.world[i][j];
      if (val < obstacleConf) {
        staticFields.push({
          location: [i - worldSize/2, worldSize/2 - j],
          radius: constants.flagradius,
          spread: 15,
          type: 'avoid',
          alpha: 10
        });
      }
    }
  }

  myTanks.forEach(function(tank) {
    // Use kalman filter to decide to shoot
    var t = Kalman.getTransform(tank);
    enemies.forEach(function(enemy) {
      if (enemy.status !== 'alive') {
        return;
      }

      var filter = kalmans[enemy.callsign];
      if (!filter) {
        return;
      }
      var guess = t(filter.guess[0]);
      // console.log(guess);

      var timeToCrossPath = Kalman.collisionTime(guess);
      var yAtCollisionTime = Kalman.yAtTime(guess, timeToCrossPath);
      var timeForBulletToGetToY = yAtCollisionTime/shotSpeed;
      var pathCrossDiff = Math.abs(timeToCrossPath-timeForBulletToGetToY);
      var yDist = Math.abs(guess[3]);
      console.log(pathCrossDiff);
      if (pathCrossDiff < 10 && yDist < 350) {
        // We might hit it. Fire.
        client.shoot(tank.index);
      }
    });

    client.getOccgrid(tank.index, function(_occ) {
      var grid = _occ.grid, pos = _occ.pos;
      for (var i = 0; i < grid.length; i++) {
        for (var j = 0; j < grid[i].length; j++) {
          var reading = grid[i][j];
          var x = j + pos.x + worldSize/2;
          var y = i - pos.y + worldSize/2;

          if (x >= worldSize || y >= worldSize) continue;
          if (x < 0 || y < 0) continue;
          occ.update(x, y, reading);
        }
      }
    });

    if (lastpos[tank.callsign] && lastpos[tank.callsign].x == tank.loc.x && lastpos[tank.callsign].y == tank.loc.y) {
      console.log(tank.index + ' is stuck! Emergency action happening.');
      client.speed(tank.index, 1);
      client.angvel(tank.index, 0.5, null);
      return;
    } 
    lastpos[tank.callsign] = tank.loc;

    if (tank.flag === '-') {
      var closeFlag = null;
      var flag;
      for (var f = flags.length - 1; f >= 0; f--) {
        flag = flags[f];
        if (
          // our flag is safe
          (flag.color === constants.team 
          && Math.abs(flag.loc.x - myBaseLocation.x) < 20 
          && Math.abs(flag.loc.y - myBaseLocation.y) < 20
          && flag.possessionColor == 'none') 
          // or a flag in our possession already
          || flag.possessionColor === constants.team) continue;
        var distX = Math.abs(tank.loc.x - flag.loc.x);
        var distY = Math.abs(tank.loc.y - flag.loc.y);
        var dist = distX + distY;
        flag.dist = dist;

        if (!closeFlag || (flag.dist < closeFlag.dist)) {
          closeFlag = flag;
        } 
      }

      if (closeFlag) {
        pfMove(tank, closeFlag.loc);
      }
    } else { // we have a flag
      pfMove(tank, myBaseLocation);
    }
  });

  occ.sendVizUpdates();
}


function pfMove(tank, pos) {
  var gradient;
  var captureFields = staticFields.slice(0);
  captureFields.push({
    location: [pos.x, pos.y],
    radius: constants.flagradius,
    spread: 1000,
    type: 'seek',
    alpha: 20
  });
  gradient = pf.gradient([tank.loc.x, tank.loc.y], captureFields);

  var position = {
    'x': tank.loc.x + gradient[0],
    'y': tank.loc.y + gradient[1]
  };
  moveToPosition(tank, position);
}


function moveToPosition(tank, pos, callback) {
  console.log('tank ' + tank.index + ' moving to point ' + pos.x + ',' + pos.y);

  var angle = Math.atan2(pos.y-tank.loc.y,pos.x-tank.loc.x);
  var relativeAngle = Math.atan2(Math.sin(angle - tank.angle), Math.cos(angle - tank.angle));
  var behindAngle = Math.PI;
  var speedScale = Math.abs((behindAngle-relativeAngle)/behindAngle);
  client.speed(tank.index, speedScale * 1.2);
  client.angvel(tank.index, relativeAngle/2, callback);
  // client.shoot(tank.index);
}
