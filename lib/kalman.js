'use strict';

var math = require('mathjs')();

// Multiply more than two matrices in sequence (recursive)
// multiply(a, b, c, d, ...) = multiply(math.multiply(a, b), c, d, ...)
function multiply(a, b, remaining) {
  var result = math.multiply(a, b);

  if (arguments.length < 3) {
    return result;
  } else {
    remaining = Array.prototype.slice.call(arguments, 2);
    remaining.unshift(result);
    return multiply.apply(null, remaining);
  }
}

/*

  Mapping of variable names from project requirements to those used on slide 3 of
  http://www.cems.uvm.edu/~gmirchan/classes/EE275/2012/ClassProjects/KalmnFltrTrkg.pdf

     H = H
     F = A
    Σx = Q
    Σt = Pn-1
  Σt+1 = Pn
    Σz = R
  µt+1 = xn
    µt = xpredicted
  Kt+1 = K
  Zt+1 = zn

*/

function Kalman(opts) {
  opts = opts || {};

  var dt = this.dt = opts.dt || 0.1;
  
  // Constants

  // Also H in lab requirements
  this.H = [
    [1, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0],
  ];

  this.HT = math.transpose(this.H);

  // F
  this.A = opts.A || [
    // x vals
    [1, dt, 0.5 * dt * dt, 0, 0, 0],
    [0,  1,       dt,      0, 0, 0],
    [0,  0,        1,      0, 0, 0],
    // y vals
    [0, 0, 0, 1, dt, 0.5 * dt * dt],
    [0, 0, 0, 0,  1,       dt     ],
    [0, 0, 0, 0,  0,        1     ],
  ];

  this.AT = math.transpose(this.A);

  // Σx
  this.Q = opts.Q || [
    [0.1,   0,   0,   0,   0,   0],
    [  0, 0.1,   0,   0,   0,   0],
    [  0,   0, 100,   0,   0,   0],
    [  0,   0,   0, 0.1,   0,   0],
    [  0,   0,   0,   0, 0.1,   0],
    [  0,   0,   0,   0,   0, 100],
  ];

  // Σz
  this.R = opts.R || [
    [25,  0],
    [ 0, 25],
  ];

  // Initial intermediary values

  // µt
  this.lastX = [0, 0, 0, 0, 0, 0];
  
  // Σt
  this.lastP = [
    [1,    0,   0,   0,   0,   0],
    [  0, 0.1,   0,   0,   0,   0],
    [  0,   0, 0.1,   0,   0,   0],
    [  0,   0,   0,  1,   0,   0],
    [  0,   0,   0,   0, 0.1,   0],
    [  0,   0,   0,   0,   0, 0.1],
  ];
}

Kalman.prototype.update = function update(z0, z1) {
  var z = [z0, z1];

  // F × µt
  var xpr = math.multiply(this.A, this.lastX);
  
  // F × Σt × FT + Σx
  var Ppr = math.add(
    multiply(this.A, this.lastP, this.AT),
    this.Q
  );

  // Zt+1 − H × F × µt
  var y = math.subtract(
    z,
    multiply(this.H, xpr)
  );

  // H × (F × Σt × FT + Σx) × HT + Σz
  var S = math.add(
    multiply(this.H, Ppr, this.HT),
    this.R
  );

  // Kt+1
  var K = multiply(Ppr, this.HT, math.inv(S));

  // µt+1
  var newX = math.add(xpr, math.multiply(K, y));
  
  // Σt+1
  var newP = math.multiply(
    math.subtract(math.eye(6), math.multiply(K, this.H)),
    Ppr
  ).toArray();

  this.lastX = newX;
  this.lastP = newP;

  return [newX, newP];
};

// Projects one step ahead. If optional parameter isn't supplied,
// it uses the current best guess about state. Pass the output of
// the last call to project back in to project multiple steps ahead.
Kalman.prototype.project = function project(lastX) {
  lastX = lastX || this.lastX;
  return math.multiply(this.A, lastX);
};

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

Kalman.getTransform = getTransform;
Kalman.collisionTime = collisionTime;
Kalman.yAtTime = yAtTime;

module.exports = Kalman;