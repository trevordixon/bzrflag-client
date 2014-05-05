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

var e = new EventEmitter();

var constants, bases, obstacles;

init(updateContinously);
e.on('update', function(state) {
	console.log(state);
});

function init(cb) {
	async.parallel([
		function(done) {
			client.getConstants(function(constants) {
				constants = constants;
				done();
			});
		},
		function(done) {
			client.getBases(function(bases) {
				bases = bases;
				done();
			});
		},
		function(done) {
			client.getObstacles(function(obstacles) {
				obstacles = obstacles;
				done();
			});
		}
	], cb);
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
				e.emit('update', results);
				setImmediate(repeat);
			});
		}
	);
}