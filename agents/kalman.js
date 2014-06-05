'use strict';

var BZRClient = require('bzrflag-client');
var kalmanVisualization = require('../lib/kalmanviz');
var kalmanViz = new kalmanVisualization();
kalmanViz.initWebSocket();
var filters = [];

var client;

if (process.argv.length > 2) {
  var port = process.argv[2];
  client = new BZRClient(port);
} else {
  console.error('Port required as second argument.');
  process.exit();
}


var constants, shotSpeed, bulletLife;

client.getConstants(function(c) {
  constants = c;
  shotSpeed = parseFloat(c.shotspeed);
  bulletLife = c.shotrange/c.shotspeed;
  setInterval(aimAndFire, 100);
});

function getTransform(tank) {
  var c = Math.cos(-tank.angle+Math.PI/2);
  var s = Math.sin(-tank.angle+Math.PI/2);
  return function transform(state) {
    return [
      c*(state[0]-tank.loc.x) - s*(state[3]-tank.loc.y),
      c*state[1] - s*state[4],
      c*state[2] - s*state[5],
      s*(state[0]-tank.loc.x) + c*(state[3]-tank.loc.y),
      s*state[1] + c*state[4],
      s*state[2] + c*state[5],
    ];
  };
}

// 0 = 0.5*ax*t*t + vx*t + x0
// t = -vx ± Math.sqrt(vx^2 - (4)(0.5*ax)(x0))
//     ---------------------------------------
//                       ax

function collisionTime(state) {
  var a = 0.5*state[2];
  var b = state[1];
  var c = state[0];

  var sqrtBsquareMinues4AC = Math.sqrt(b*b - 4*a*c);

  var t1 = (-b - sqrtBsquareMinues4AC)/(2*a);
  var t2 = (-b + sqrtBsquareMinues4AC)/(2*a);

  if (isNaN(t1)) return t2;
  if (isNaN(t2)) return t1;

  if (t1 < 0) return t2;
  if (t2 < 0) return t1;
  if (t1 < t2) return t1;
  else return t2;
}

function yAtTime(state, t) {
  return state[3] + state[4]*t + 0.5*state[5]*t*t;
}

function aimAndFire() {
  client.getMyTanks(function(tanks) {
    filters.unshift(new (require('../lib/kalman'))()); //add to front of array

    var me = tanks[0];
    // console.log(me);
    var t = getTransform(me);

    client.getOtherTanks(function(tanks) {
      var target = tanks[0];
      // console.log(target);
      var guess, curFilter;

      for (var f = 0; f <= 40 && f < filters.length; f++) {
        var res = filters[f].update(target.loc.x, target.loc.y);
        if (f == 40) {
          guess = t(res[0]);
          curFilter = filters[f];
        }
      }

      if (filters.length > 40)
        filters.pop();

      if (guess && curFilter)
      {
        //console.log(guess);
        
        var timeToCrossPath = collisionTime(guess);
        // If time > bulletTime, maybe don't fire.

        var yAtCollisionTime = yAtTime(guess, timeToCrossPath);
        // console.log('Cross in ' + timeToCrossPath + ' at ' + yAtCollisionTime);

        var timeForBulletToGetToY = yAtCollisionTime/shotSpeed;
        // console.log('Bullet will take ' + timeForBulletToGetToY);

        var pathCrossDiff = Math.abs(timeToCrossPath-timeForBulletToGetToY);
        var yDist = Math.abs(guess[3]);
        console.log('path diff: ', pathCrossDiff);
        console.log( 'yDist: ', yDist);
        if (pathCrossDiff < 0.2 && yDist < 350) {
          // We might hit it. Fire.
          client.shoot(0);
        }

        var futurePos = curFilter.project(guess);
        var angle = Math.atan2(futurePos[0], futurePos[3]);

        kalmanViz.sendVizUpdates(guess, futurePos);

        // Experiment with this. Too slow right now.
        var correctiveAngvel = 10 * (-angle/(Math.PI/2));
        console.log('angvel: ', correctiveAngvel);
        client.angvel(0, correctiveAngvel);
      }
    });
  });
}
