var ps = 0.01;

var worldSize = 800;
var s = new Array(worldSize);
for (var i = 0; i < s.length; i++) {
  s[i] = new Array(worldSize);
  for (var j = 0; j < s[i].length; j++) {
    s[i][j] = ps;
  }
}

var updateS = (function(pos, pnons, ps) {
  // var pos = 0.97;                       // P(o|s)
  // var pnons = 0.9;                      // P(~o|~s)
  // var ps = 0.01;                        // P(s)
  var po = (pos*ps) + ((1-pnons)*(1-ps));  // P(o) = P(o|s)P(s) + P(o|~s)P(~s)
  console.log(po);

  return function updateS(i, j, o) {
    // update p(si,j = occupied | oi,j) = p(oi,j | si,j = occupied)p(si,j = occupied) / p(oi,j)
    s[i][j] = pos*s[i][j] / po;
  }
})(0.97, 0.9, ps);

function OccWorld(worldSize, pos, pnons, ps) {
  this.world = [[], []];
}

OccWorld.prototype.update = function update(i, j, o) {

};

module.exports = OccWorld;