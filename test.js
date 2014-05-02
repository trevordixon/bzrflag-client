'use strict';

function sq(x) { return x*x; }
function addArrays(a, b) {
    return a.map(function(n, i) {
        return n + b[i];
    });
}
function sign(n) { return (n >= 0) ? 1 : -1; }
function distance(l1, l2) {
    return Math.sqrt(sq(l1[0] - l2[0]) + sq(l1[1] - l2[1]));
}
function angle(l1, l2) {
    return Math.atan2((l2[1] - l1[1]), (l2[0] - l1[0]));
}

var fieldFunction = {
    seek: function(location, goal) {
        var d = distance(location, goal.location);
        if (d < goal.radius) return [0, 0];

        var reach = goal.radius + goal.spread,
            theta = angle(location, goal.location);

        if (d <= reach) {
            return [
                0.1234 * (d-goal.radius) * Math.cos(theta),
                0.1234 * (d-goal.radius) * Math.sin(theta)
            ];
        } else {
            return [
                0.1234 * goal.spread * Math.cos(theta),
                0.1234 * goal.spread * Math.sin(theta)
            ];
        }
    },

    avoid: function(location, obstacle) {
        var d = distance(location, obstacle.location),
            theta = angle(location, obstacle.location);

        if (d < obstacle.radius)
            return [
                -1 * sign(Math.cos(theta)) * 1,
                -1 * sign(Math.sin(theta)) * 1
            ];

        var reach = obstacle.radius + obstacle.spread;

        if (d <= reach) {
            return [
                -1 * 0.4321 * (obstacle.spread + obstacle.radius - d) * Math.cos(theta),
                -1 * 0.4321 * (obstacle.spread + obstacle.radius - d) * Math.sin(theta)
            ];
        } else {
            return [0, 0];
        }
    },

    tangent: function(location, field) {
        return [0, 0];
    }
};

function gradient(location, fields) {
    return fields.reduce(function(g, field) {
        var _g = fieldFunction[field.type](location, field);
        return addArrays(g, _g);
    }, [0, 0]);
}



var fields = [ { location: [ 120, 120 ],
    radius: 42.42640687119285,
    spread: 5,
    type: 'avoid' },
  { location: [ 120, 180 ],
    radius: 42.42640687119285,
    spread: 5,
    type: 'avoid' },
  { location: [ 180, 120 ],
    radius: 42.42640687119285,
    spread: 5,
    type: 'avoid' },
  { location: [ 120, -120 ],
    radius: 42.42640687119285,
    spread: 5,
    type: 'avoid' },
  { location: [ 180, -120 ],
    radius: 42.42640687119285,
    spread: 5,
    type: 'avoid' },
  { location: [ 120, -180 ],
    radius: 42.42640687119285,
    spread: 5,
    type: 'avoid' },
  { location: [ -120, -120 ],
    radius: 42.42640687119285,
    spread: 5,
    type: 'avoid' },
  { location: [ -120, -180 ],
    radius: 42.42640687119285,
    spread: 5,
    type: 'avoid' },
  { location: [ -180, -120 ],
    radius: 42.42640687119285,
    spread: 5,
    type: 'avoid' },
  { location: [ -120, 120 ],
    radius: 42.42640687119285,
    spread: 5,
    type: 'avoid' },
  { location: [ -120, 180 ],
    radius: 42.42640687119285,
    spread: 5,
    type: 'avoid' },
  { location: [ -180, 120 ],
    radius: 42.42640687119285,
    spread: 5,
    type: 'avoid' },
  { location: [ 0, 0 ],
    radius: 60.8276253029822,
    spread: 5,
    type: 'avoid' },
  { location: [ 0, -370 ], radius: 1, spread: 100, type: 'seek' },
  { location: [ 370, 0 ], radius: 1, spread: 100, type: 'seek' },
  { location: [ -370, 0 ], radius: 1, spread: 100, type: 'seek' } ];


var start = Date.now();
var g = [], size = 800;
for (var x = 0; x < size; x++) {
    for (var y = 0; y < size; y++) {
//        g[x] = g[x] || [];
//        g[x][y] = gradient([x, y], fields);
        var _g = gradient([x, y], fields);
        g.push({
            x: x, y: y,
            value: {
                x: _g[0],
                y: _g[1]
            }
        });
    }
}
console.log(Date.now() - start);
console.log(g);
