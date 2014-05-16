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

var constants, occ;

init();

function init() {
  client.getConstants(function(c) {
    constants = c;
    continueInit();
  });
}

function continueInit() {
  var worldSize = constants['worldsize'];
  var pos = constants['truepositive'];
  var pnons = constants['truenegative'];
  var ps = 0.01;
  occ = new OccWorld(worldSize, pos, pnons, ps);

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
          done(null, null);
      }], function(err, results) {
        console.log('took ' + (Date.now() - start));
        onUpdate(results);
        repeat();
      });
    }
  );
}

function onUpdate(state) {
  var start = Date.now();

  var myTanks = state[0];

  occ.update(0, 0, true);

  myTanks.forEach(function(tank) {
    
    var grid = client.getOccgrid(tank.index, function(grid) {
      console.log(grid);
    });

/*    var gradient = pf.gradient([tank.loc.x, tank.loc.y], fields);
    var position = {
      "x": tank.loc.x + gradient[0],
      "y": tank.loc.y + gradient[1]
    }
    moveToPosition(tank, position, function() {
      console.log('updated instructions in ' + (Date.now() - start));
    });
*/

  });
}

function moveToPosition(tank, pos, callback) {
  var angle = Math.atan2(pos.y-tank.loc.y,pos.x-tank.loc.x);
  var relativeAngle = Math.atan2(Math.sin(angle - tank.angle), Math.cos(angle - tank.angle));
  var distance = Math.sqrt(Math.pow(pos.x-tank.loc.x,2)+Math.pow(pos.y-tank.loc.y,2));
  client.speed(tank.index, Math.min(distance/60,1));
  client.angvel(tank.index, relativeAngle/2, callback);
  client.shoot(tank.index);
};

















