'use strict';

var EventEmitter = require('events').EventEmitter;
var async = require('async');
var BZRClient = require('bzrflag-client');
var pf = require('../lib/potential-fields');

function Field(location, radius, spread, type, alpha) {
	this.location = location;
	this.radius = radius;
	this.spread = spread;
	this.type = type;
	this.alpha = alpha;
}

var client;

if (process.argv.length > 2) {
	var port = process.argv[2];
	client = new BZRClient(port);
} else {
	console.error('Port required as second argument.')
	process.exit();
}

var constants, bases, obstacles;
var staticFields = [];

init(continueInit);
function onUpdate(state) {
	var myTanks = state[0];
	var flags = state[1];
	var fields = staticFields.slice(0);
	var i;
	for (i = 0; i < flags.length; ++i) {
		if (flags[i]['color'] !== constants['team'] && flags[i]['possessionColor'] !== constants['team']) {// not my flag and not in my possession
			fields.push(new Field([flags[i]['loc']['x'], flags[i]['loc']['y']], constants['flagradius'], 900, 'seek', 5));
		}
	}

	var t = 0;
	for (t = 0; t < myTanks.length; ++t) {
		var gradient = pf.gradient([myTanks[t]['loc']['x'], myTanks[t]['loc']['y']], fields);
		console.log(gradient);
	}

	console.log('updated instructions');
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
	initStaticFields();
	updateContinously();
}

function initStaticFields() {
	var i;
	for (i = 0; i < obstacles.length; ++i) {
		var j;
		for (j = 0; j < obstacles[i].length; ++j) {
			staticFields.push(new Field([obstacles[i][j]['x'], obstacles[i][j]['y']], 1, 50, 'avoid', 2));
		}
	}
}

function updateContinously() {
	async.whilst(
		function() { return true; },
		function(repeat) {
			async.parallel([function getTanks(done) {
				client.getMyTanks(function(myTanks) {
					done(null, myTanks);
				});
			}, function getFlags(done) {
				client.getFlags(function(flags){
					done(null, flags);
				});
			}], function(err, results) {
				setImmediate(onUpdate, results);
				setImmediate(repeat);
			});
		}
	);
}