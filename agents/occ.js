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
  var worldSize = parseInt(constants['worldsize'], 10);
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
      console.log('querying');
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

function onUpdate(state) {
  var myTanks = state[0];
  myTanks.forEach(function(tank) {
    console.log('get grid');
    client.getOccgrid(tank.index, function(_occ) {
      console.log('got grid');
      var grid = _occ.grid, pos = _occ.pos;
      for (var i = 0; i < grid.length; i++) {
        for (var j = 0; j < grid[i].length; j++) {
          var reading = grid[i][j];
          if ((i + pos.x + 400) >= 800 || (j - pos.y + 400) >= 800) continue;
          if ((i + pos.x + 400) < 0 || (j - pos.y + 400) < 0) continue;
          occ.update(i + pos.x + 400, j - pos.y + 400, reading);
        };
      }
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

  occ.sendVizUpdates();
}

function moveToPosition(tank, pos, callback) {
  var angle = Math.atan2(pos.y-tank.loc.y,pos.x-tank.loc.x);
  var relativeAngle = Math.atan2(Math.sin(angle - tank.angle), Math.cos(angle - tank.angle));
  var distance = Math.sqrt(Math.pow(pos.x-tank.loc.x,2)+Math.pow(pos.y-tank.loc.y,2));
  client.speed(tank.index, Math.min(distance/60,1));
  client.angvel(tank.index, relativeAngle/2, callback);
  client.shoot(tank.index);
};