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

var constants, bases, obstacles, staticFields, myBaseField, myColor;
var occ;

init(continueInit);
function onUpdate(state) {
  var start = Date.now();

  var myTanks = state[0];
  var flags = state[1];
  var fields = staticFields.slice(0);

  var i;

  occ.update(0, 0, true);

  myTanks.forEach(function(tank) {
    var gradient;
    if (tank.flag !== '-') {//our tank has a flag!!
      var winFields = fields.slice(0);
      winFields.push(myBaseField);
      // console.log('I haz flag! Going home.');
      gradient = pf.gradient([tank.loc.x, tank.loc.y], winFields);
    } else {
      gradient = pf.gradient([tank.loc.x, tank.loc.y], fields);
    } 

    var position = {
      "x": tank.loc.x + gradient[0],
      "y": tank.loc.y + gradient[1]
    }
    moveToPosition(tank, position, function() {

      console.log('updated instructions in ' + (Date.now() - start));
    });
  });
}

function init(cb) {
  async.parallel([
    function(done) {
      client.getConstants(function(c) {
        constants = c;
        done();
      });
    },
    function(done) {
      client.getBases(function(b) {
        bases = b;
        done();
      });
    },
    function(done) {
      client.getObstacles(function(o) {
        obstacles = o;
        done();
      });
    }
  ], cb);
}

function continueInit() {
  occ = new OccWorld(worldSize, pos, pnons, ps);
  myColor = constants['team'];
  var i;
  for (i = 0; i < bases.length; ++i) {
    if (bases[i]['color'] === myColor) {
      var myBase = bases[i];
      var baseCircle = require('../lib/smallest-circle')(myBase.corners);
      myBaseField = {
        location: [baseCircle.x, baseCircle.y],
        radius: baseCircle.r,
        spread: 100,
        type: 'seek',
        alpha: 10
      };
    }
  }
  updateContinously();
}

var start;
function updateContinously() {
  async.forever(
    function(repeat) {
      start = Date.now();
      console.log('querying');
      async.parallel([function getTanks(done) {
        var startT = Date.now();
        client.getMyTanks(function(myTanks) {
          console.log('got tanks in ' + (Date.now() - startT));
          done(null, myTanks);
        });
      }, function getGrids(done) {

      }], function(err, results) {
        console.log('took ' + (Date.now() - start));
        onUpdate(results);
        repeat();
      });
    }
  );
}

function moveToPosition(tank, pos, callback) {
  var angle = Math.atan2(pos.y-tank.loc.y,pos.x-tank.loc.x);
  var relativeAngle = Math.atan2(Math.sin(angle - tank.angle), Math.cos(angle - tank.angle));
  var distance = Math.sqrt(Math.pow(pos.x-tank.loc.x,2)+Math.pow(pos.y-tank.loc.y,2));
  client.speed(tank.index, Math.min(distance/60,1));
  client.angvel(tank.index, relativeAngle/2, callback);
  client.shoot(tank.index);
};

















