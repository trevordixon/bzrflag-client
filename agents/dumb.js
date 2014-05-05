var BZRClient = require('bzrflag-client');

function Team(client){
	this.client = client;
	this.myTanks = {};
	this.init();
}

Team.prototype.init = function() {
	var me = this;
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
		done.call(me);
	});
};

Team.prototype.continuouslyUpdate = function() {
	this.update(function() {
		setImmediate(this.continuouslyUpdate.bind(this));
	});
};

Team.prototype.moveForwardFor3to8SecondsThenRotate60DegreesAdNauseum = function moveForwardFor3to8SecondsThenRotate60DegreesAdNauseum(tank) {
	var self = this;
	this.client.speed(tank.index, 1);
	setTimeout(function() {
		self.client.speed(tank.index, 0);
		self.rotate60Degrees(tank, function doneTurning() {
			self.moveForwardFor3to8SecondsThenRotate60DegreesAdNauseum(tank);
		});
	}, (Math.random() * 5000) + 3000);
}

Team.prototype.rotate60Degrees = function rotate60Degrees(tank, cb) {
	var self = this;
	this.client.angvel(tank.index, 0.5, function() {
		setTimeout(function() {
			self.client.angvel(tank.index, 0, cb);
		}, 2000);
	});

}

Team.prototype.shootRandomly = function shootRandomly(tank) {
	var self = this;
	setTimeout(function() {
		self.client.shoot(tank.index);
		self.shootRandomly(tank);
	}, (Math.random() * 1000) + 1500);
}

Team.prototype.start = function start() {
	this.continuouslyUpdate();
	this.update(function() {
		for (id in this.myTanks) {
			var tank = this.myTanks[id];
			this.moveForwardFor3to8SecondsThenRotate60DegreesAdNauseum(tank);
			this.shootRandomly(tank);
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