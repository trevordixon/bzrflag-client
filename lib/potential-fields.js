'use strict';

var normalizeAngle = require('./normalizeAngle');

/*
	var field = {
		location: [12, 12],
		radius: 20,
		spread: 15,
		type: 'seek' // or 'avoid' or 'tangent'
	}
*/

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
	return Math.atan2(l2[1] - l1[1], l2[0] - l1[0]);
}

var insideReachAlpha = 0.2;
var outsideReachAlpha = 0.12;
var fieldFunction = {
	seek: function(location, goal) {
		var d = distance(location, goal.location);
		if (d < goal.radius) return [0, 0];

		var reach = goal.radius + goal.spread,
			theta = angle(location, goal.location);

		if (d <= reach) {
			return [
				insideReachAlpha * (d-goal.radius) * Math.cos(theta),
				insideReachAlpha * (d-goal.radius) * Math.sin(theta)
			];
		} else {
			return [
				(outsideReachAlpha * goal.spread * Math.cos(theta))/(d/reach),
				(outsideReachAlpha * goal.spread * Math.sin(theta))/(d/reach)
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
				-1 * 0.4321 * (reach - d) * Math.cos(theta),
				-1 * 0.4321 * (reach - d) * Math.sin(theta)
			];
		} else {
			return [0, 0];
		}
	},

	tangent: function(location, field) {
		var xy = fieldFunction.avoid(location, field),
			origin = [0,0],
			a = angle(xy, origin),
			m = distance(xy, origin),
			newA = normalizeAngle(a + Math.PI / 2),
			newx = Math.cos(newA) * m,
			newy = Math.sin(newA) * m;
		return [newx, newy];
	}
};

function gradient(location, fields) {
	return fields.reduce(function(g, field) {
		var _g = fieldFunction[field.type](location, field);
		return addArrays(g, _g);
	}, [0, 0]);
}

module.exports = {
	gradient: gradient,
	distance: distance,
	angle: angle
};