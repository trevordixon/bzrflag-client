'use strict';

var normalizeAngle = require('./normalizeAngle');

/*
	var field = {
		location: [12, 12],
		radius: 20,
		spread: 15,
		type: 'seek' // or 'avoid' or 'tangent',
		alpha: 2
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

var fieldFunction = {
	seek: function(location, goal) {
		var d = distance(location, goal.location);
		if (d < goal.radius) return [0, 0];

		var reach = goal.radius + goal.spread,
			theta = angle(location, goal.location);

		if (d <= reach) {
			return [
				goal.alpha * (d-goal.radius) * Math.cos(theta),
				goal.alpha * (d-goal.radius) * Math.sin(theta)
			];
		} else {
			return [
				(goal.alpha * goal.spread * Math.cos(theta))/(d/reach),
				(goal.alpha * goal.spread * Math.sin(theta))/(d/reach)
			];
		}
	},

	avoid: function(location, obstacle) {
		var d = distance(location, obstacle.location),
			theta = angle(location, obstacle.location);

		if (d < obstacle.radius)
			return [
				-1 * sign(Math.cos(theta)) * 1 * obstacle.alpha,
				-1 * sign(Math.sin(theta)) * 1 * obstacle.alpha
			];

		var reach = obstacle.radius + obstacle.spread;

		if (d <= reach) {
			return [
				-1 * (reach - d) * Math.cos(theta) * obstacle.alpha,
				-1 * (reach - d) * Math.sin(theta) * obstacle.alpha
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