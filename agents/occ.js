'use strict';

var EventEmitter = require('events').EventEmitter;
var async = require('async');
var BZRClient = require('bzrflag-client');
var pf = require('../lib/potential-fields');
var OccWorld = require('../lib/OccWorld');

var client;

if (process.argv.length > 2) {
  var port = process.argv[2];
  client = new BZRClient(port);
} else {
  console.error('Port required as second argument.')
  process.exit();
}

var worldSize, constants, occ;

init();

function init() {
  client.getConstants(function(c) {
    constants = c;
    continueInit();
  });
}

function continueInit() {
  worldSize = parseInt(constants['worldsize'], 10);
  var pos = parseFloat(constants['truepositive']);
  var pnons = parseFloat(constants['truenegative']);
  var ps = 0.01;
  
  occ = new OccWorld(worldSize, pos, pnons, ps);
  occ.initWebSocket();

  updateContinously();
}

var start;
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
      }, function getGrids(done) {
          done(null, null);
      }], function(err, results) {
        console.timeEnd('query');
        onUpdate(results);
        repeat();
      });
    }
  );
}

function shouldIGoToThisPoint(i, j, val, fields) {
  var obstacleConf = .009;
  var clearConf = 0.101;
  
  if (val < obstacleConf) { // is obstacle
    fields.push({
      location: [i - worldSize/2, worldSize/2 - j],
      radius: 1,
      spread: 1500,
      type: 'avoid',
      alpha: 1000000
    });
    return false;
  } else if (val > obstacleConf  && val < clearConf) { // is undiscovered
    fields.push({
      location: [i - worldSize/2, worldSize/2 - j],
      radius: 1,
      spread: 40,
      type: 'seek',
      alpha: 10
    });
    return true;
  }
}

function onUpdate(state) {
  var myTanks = state[0];
  myTanks.forEach(function(tank) {
    //console.log('get grid');
    client.getOccgrid(tank.index, function(_occ) {
      //console.log('got grid');
      var grid = _occ.grid, pos = _occ.pos;
      for (var i = 0; i < grid.length; i++) {
        for (var j = 0; j < grid[i].length; j++) {
          var reading = grid[i][j];
          var x = j + pos.x + worldSize/2;
          var y = i - pos.y + worldSize/2;

          if (x >= worldSize || y >= worldSize) continue;
          if (x < 0 || y < 0) continue;
          occ.update(x, y, reading);
        };
      }
    });

    var finishedMyQuadrant = explore(tank, false);
    if (finishedMyQuadrant) {
      console.log("Help a brother out! -Tank " + tank.index);
      explore(tank, true);
    }
  });

  occ.sendVizUpdates();
}

function explore(tank, anyQuadrant) {
  var tankGroup = (tank.index % 8) + 1;
  var pointFound = false;
  var pFields = [];

  // from outside in
  if (tankGroup == 1 || (!pointFound && anyQuadrant)) { // top left
    for (var i = 0; i < occ.world.length/2 && !pointFound; i++) {
      for (var j = 0; j < occ.world[i].length/4 && !pointFound; j++) {
        if (shouldIGoToThisPoint(i, j, occ.world[i][j], pFields))
          pointFound = true;
      }
    }
    console.log("Tank " + tank.index + " working in quadrant 1");
  } 
  if (tankGroup == 2 || (!pointFound && anyQuadrant)) { // top right
    for (var i = occ.world.length - 1; i >= occ.world.length/2 && !pointFound; i--) {
      for (var j = 0; j < occ.world[i].length/4 && !pointFound; j++) {
        if (shouldIGoToThisPoint(i, j, occ.world[i][j], pFields))
          pointFound = true;
      }
    }
    console.log("Tank " + tank.index + " working in quadrant 2");
  }
  if (tankGroup == 3 || (!pointFound && anyQuadrant)) { // bottom left
    for (var i = 0; i < occ.world.length/2 && !pointFound; i++) {
      for (var j = occ.world[i].length - 1; j >= 3 * occ.world[i].length/4 && !pointFound; j--) {
        if (shouldIGoToThisPoint(i, j, occ.world[i][j], pFields))
          pointFound = true;
      }
    }
    console.log("Tank " + tank.index + " working in quadrant 3");
  }
  if (tankGroup == 4 || (!pointFound && anyQuadrant)) { // bottom right
    for (var i = occ.world.length - 1; i >= occ.world.length/2 && !pointFound; i--) {
      for (var j = occ.world[i].length - 1; j >= 3 * occ.world[i].length/4 && !pointFound; j--) {
        if (shouldIGoToThisPoint(i, j, occ.world[i][j], pFields))
          pointFound = true;
      }
    }
    console.log("Tank " + tank.index + " working in quadrant 4");
  }
  //from inside to outside
  if (tankGroup == 5 || (!pointFound && anyQuadrant)) { // middle top left
    for (var i = occ.world.length/2; i >= 0 && !pointFound; i--) {
      for (var j = occ.world[i].length/2; j >= occ.world[i].length/4 && !pointFound; j--) {
        if (shouldIGoToThisPoint(i, j, occ.world[i][j], pFields))
          pointFound = true;
      }
    }
    console.log("Tank " + tank.index + " working in quadrant 5");
  }
  if (tankGroup == 6 || (!pointFound && anyQuadrant)) { // middle top right
    for (var i = occ.world.length/2; i < occ.world.length && !pointFound; i++) {
      for (var j = occ.world[i].length/2; j >= occ.world[i].length/4 && !pointFound; j--) {
        if (shouldIGoToThisPoint(i, j, occ.world[i][j], pFields))
          pointFound = true;
      }
    }
    console.log("Tank " + tank.index + " working in quadrant 6");
  }
  if (tankGroup == 7 || (!pointFound && anyQuadrant)) { // middle bottom left
    for (var i = occ.world.length/2; i >= 0 && !pointFound; i--) {
      for (var j = occ.world[i].length/2; j < 3 * occ.world[i].length/4 && !pointFound; j++) {
        if (shouldIGoToThisPoint(i, j, occ.world[i][j], pFields))
          pointFound = true;
      }
    }
    console.log("Tank " + tank.index + " working in quadrant 7");
  }
  if (tankGroup == 8 || (!pointFound && anyQuadrant)) { // middle bottom right
    for (var i = occ.world.length/2; i < occ.world.length && !pointFound; i++) {
      for (var j = occ.world[i].length/2; j < 3 * occ.world[i].length/4 && !pointFound; j++) {
        if (shouldIGoToThisPoint(i, j, occ.world[i][j], pFields))
          pointFound = true;
      }
    }
    console.log("Tank " + tank.index + " working in quadrant 8");
  }

  if (pointFound)
  {
    var gradient = pf.gradient([tank.loc.x, tank.loc.y], pFields);
    var position = {
      "x": tank.loc.x + gradient[0],
      "y": tank.loc.y + gradient[1]
    }
    moveToPosition(tank, position, function() {
      //console.log('updated instructions in ' + (Date.now() - start));
    });
  }

  return !pointFound;

  occ.sendVizUpdates();
}

function moveToPosition(tank, pos, callback) {
  console.log("tank " + tank.index + " moving to point " + pos.x + "," + pos.y);

  var angle = Math.atan2(pos.y-tank.loc.y,pos.x-tank.loc.x);
  var relativeAngle = Math.atan2(Math.sin(angle - tank.angle), Math.cos(angle - tank.angle));
  var distance = Math.sqrt(Math.pow(pos.x-tank.loc.x,2)+Math.pow(pos.y-tank.loc.y,2));
  client.speed(tank.index, 1);
  client.angvel(tank.index, relativeAngle/2, callback);
  //client.shoot(tank.index);
};