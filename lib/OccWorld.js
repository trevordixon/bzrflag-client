function OccWorld(worldSize, pos, pnons, ps) {
  this.pos = pos;
  this.pnons = pnons;
  this.ps = ps;

  this.pnos = 1-this.pos;
  // P(o) = P(o|s)P(s) + P(o|~s)P(~s)
  this.po = (this.pos*this.ps) + ((1-this.pnons)*(1-this.ps));
  this.pno = 1-this.po;

  this.world = new Array(worldSize);
  
  for (var i = 0; i < this.world.length; i++) {
    this.world[i] = new Array(worldSize);
    for (var j = 0; j < this.world[i].length; j++) {
      this.world[i][j] = this.ps;
    }
  }
}

OccWorld.prototype.update = function update(i, j, o) {
  if (o) this.world[i][j] =  this.pos*this.world[i][j] / this.po;
  else   this.world[i][j] = this.pnos*this.world[i][j] / this.pno;
};

module.exports = OccWorld;