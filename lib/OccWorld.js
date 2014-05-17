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

OccWorld.prototype.update = function update(i, j, o) {
  // P(o) = P(o|s)P(s) + P(o|~s)P(~s)
  var po = (this.pos*this.world[i][j]) + ((1-this.pnons)*(1-this.world[i][j]));
  if (o) this.world[i][j] =     this.pos*this.world[i][j] / po;
  else   this.world[i][j] = (1-this.pos)*this.world[i][j] / (1-po);
};

module.exports = OccWorld;