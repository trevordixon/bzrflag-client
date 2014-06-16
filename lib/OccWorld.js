// WebSocket server for visualization
var WebSocketServer = require('ws').Server;
WebSocketServer.prototype.broadcast = function(data) {
  for (var i in this.clients) this.clients[i].send(data);
};

function OccWorld(worldSize, pos, pnons, ps) {
  this.pos = pos;
  this.pnons = pnons;
  this.ps = ps;

  this.world = new Array(worldSize);
  
  for (var i = 0; i < this.world.length; i++) {
    this.world[i] = new Array(worldSize);
    for (var j = 0; j < this.world[i].length; j++) {
      this.world[i][j] = this.ps;
    }
  }
}

OccWorld.prototype.initWebSocket = function() {
 /* this.wss = new WebSocketServer({port: 4000});
  this.wss.on('connection', (function(ws) {
    if (!this._updatedCells) this._updatedCells = {};
    ws.send(JSON.stringify(this.world));
  }).bind(this));*/
};

OccWorld.prototype.update = function update(i, j, o) {
  // P(o) = P(o|s)P(s) + P(o|~s)P(~s)
  var po = (this.pos*this.world[i][j]) + ((1-this.pnons)*(1-this.world[i][j]));
  if (o) this.world[i][j] =     this.pos*this.world[i][j] / po;
  else   this.world[i][j] = (1-this.pos)*this.world[i][j] / (1-po);

  if (this._updatedCells) this._updatedCells[i + ',' + j] = this.world[i][j];
};

OccWorld.prototype.sendVizUpdates = function sendVizUpdates() {
  if (!this._updatedCells) return;
  this.wss.broadcast(JSON.stringify(this._updatedCells));
  this._updatedCells = {};
};

module.exports = OccWorld;