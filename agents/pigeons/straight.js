'use strict';

var EventEmitter = require('events').EventEmitter;
var async = require('async');
var BZRClient = require('bzrflag-client');

var client;

if (process.argv.length > 2) {
  var port = process.argv[2];
  client = new BZRClient(port);
} else {
  console.error('Port required as second argument.')
  process.exit();
}

var worldSize, constants;

init();

function init() {
  client.getConstants(function(c) {
    constants = c;
    continueInit();
  });
}

function continueInit() {
  worldSize = parseInt(constants['worldsize'], 10);
  updateContinously();
}

var start;
function updateContinously() {
  async.forever(
    function(repeat) {
      async.parallel([function getTanks(done) {
        client.getMyTanks(function(myTanks) {
          done(null, myTanks);
        });
      }], function(err, results) {
        onUpdate(results);
        repeat();
      });
    }
  );
}

function onUpdate(state) {
  var myTanks = state[0];
  myTanks.forEach(function(tank) {
    moveToPosition(tank, {x: -300, y: 400}, null);
  });
}

function moveToPosition(tank, pos, callback) {
  var angle = Math.atan2(pos.y-tank.loc.y,pos.x-tank.loc.x);
  var relativeAngle = Math.atan2(Math.sin(angle - tank.angle), Math.cos(angle - tank.angle));
  var distance = Math.sqrt(Math.pow(pos.x-tank.loc.x,2)+Math.pow(pos.y-tank.loc.y,2));
  client.speed(tank.index, 1);
  client.angvel(tank.index, relativeAngle/2, callback);
};
