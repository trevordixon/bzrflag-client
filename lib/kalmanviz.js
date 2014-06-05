'use strict';

var WebSocketServer = require('ws').Server;
WebSocketServer.prototype.broadcast = function(data) {
  for (var i in this.clients) this.clients[i].send(data);
};

function KalmanViz() {
}

KalmanViz.prototype.initWebSocket = function() {
  this.wss = new WebSocketServer({port: 4000});
  this.wss.on('connection', (function(ws) {
  }).bind(this));
};

KalmanViz.prototype.sendVizUpdates = function sendVizUpdates(guessCurrent, guessFuture) {
  this.wss.broadcast(JSON.stringify(
    {
      current: guessCurrent, 
      future: guessFuture
    }));
};

module.exports = KalmanViz;