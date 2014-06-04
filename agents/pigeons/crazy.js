var BZRClient = require('bzrflag-client');

var client;

if (process.argv.length > 2) {
	var port = process.argv[2];
	client = new BZRClient(port);
} else {
	console.error('Port required as second argument.')
}

while (true)
{
	console.log("updating");
	// use Math.random() here.
	client.speed(0, 1);
	client.angvel(0, 0.5);
}

