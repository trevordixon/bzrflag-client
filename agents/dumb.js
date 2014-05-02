var BZRClient = require('bzrflag-client');

function Team(client){
	this.client = client;
	this.myTanks = {};
	this.init();
}

Team.prototype.init = function() {
	var me = this;
	this.client.getConstants(function(constants){
		me.constants = constants;
	});
	this.client.getBases(function(bases){
		me.bases = bases;
	});
	this.client.getMyTanks(function(myTanks, time){
		myTanks.forEach(function(tank){
			me.myTanks[tank.index] = tank;
			me.lastUpdated = time;
		});
	});
};

Team.prototype.update = function(done) {
	var me = this;
	var client = this.client;
	client.getMyTanks(function(myTanks, time){
		var dt = time-me.lastUpdated;
		myTanks.forEach(function(tank){
			var dvx = (tank.vx - me.myTanks[tank.index].vx)/dt;
			var dvy = (tank.vy - me.myTanks[tank.index].vy)/dt;
			var dangvel = (tank.angvel - me.myTanks[tank.index].angvel)/dt;
			me.myTanks[tank.index] = tank;
			me.myTanks[tank.index].dvx = dvx;
			me.myTanks[tank.index].dvy = dvy;
			me.myTanks[tank.index].dangvel = dangvel;
		});

		me.lastUpdated = time;
		done();
	});
};

function moveForwardFor3to8SecondsThenRotate60DegreesAdNauseum(tank) {
	var self = this;
	this.client.speed(tank.index, 1);
	setTimeout(function() {
		self.client.speed(tank.index, 0);
		rotate60Degrees(tank, function doneTurning() {
			moveForwardFor3to8SecondsThenRotate60DegreesAdNauseum(tank);
		});
	}, (Math.random() * 5000) + 3000);
}

function rotate60Degrees(tank, cb) {
	// TODO: rotate 60 degrees, then call cb
}

function shootRandomly(tank) {
	// TODO: make the tank shoot every 1.5-2.5 seconds
}

Team.prototype.start = function start() {
	var self = this;
	this.update(function () {
		for (id in self.myTanks) {
			var tank = me.myTanks[id];
			moveForwardFor3to8SecondsThenRotate60DegreesAdNauseum(tank);
			shootRandomly(tank);
		}
	});
};

if (process.argv.length > 2) {
	var port = process.argv[2];
	var team = new Team(new BZRClient(port));
	team.start();
} else {
	console.error('Port required as second argument.')
}