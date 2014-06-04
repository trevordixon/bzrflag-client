var BZRClient = require('bzrflag-client');

var client;

if (process.argv.length > 2) {
	var port = process.argv[2];
	client = new BZRClient(port);
} else {
	console.error('Port required as second argument.')
}

(function randomMove() {
	// use Math.random() here.
	var speed = Math.random();
	var angvel = Math.random() * 2 - 1;
	client.speed(0, speed);
	client.angvel(0, angvel);

    setTimeout(randomMove, 1500);
})();