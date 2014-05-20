'use strict';

var pf = require('../lib/potential-fields');

function Field(location, radius, spread, type, alpha) {
	this.location = location;
	this.radius = radius;
	this.spread = spread;
	this.type = type;
    this.alpha = alpha;
}

[ { location: [ 0, -59 ],
    radius: 1,
    spread: 5,
    type: 'tangent',
    alpha: 50 },
  { location: [ 0, -60 ],
    radius: 1,
    spread: 5,
    type: 'tangent',
    alpha: 50 },
  { location: [ 0, -61 ],
    radius: 1,
    spread: 5,
    type: 'tangent',
    alpha: 50 },
  { location: [ 0, -62 ],
    radius: 1,
    spread: 5,
    type: 'tangent',
    alpha: 50 },
  { location: [ 0, -63 ],
    radius: 1,
    spread: 5,
    type: 'tangent',
    alpha: 50 },
  { location: [ 0, -64 ],
    radius: 1,
    spread: 5,
    type: 'tangent',
    alpha: 50 },
  { location: [ 0, -65 ],
    radius: 1,
    spread: 5,
    type: 'tangent',
    alpha: 50 },
  { location: [ 0, -66 ],
    radius: 1,
    spread: 5,
    type: 'tangent',
    alpha: 50 },
  { location: [ 0, -67 ],
    radius: 1,
    spread: 5,
    type: 'tangent',
    alpha: 50 },
  { location: [ 0, -68 ],
    radius: 1,
    spread: 5,
    type: 'tangent',
    alpha: 50 },
  { location: [ 0, -69 ],
    radius: 1,
    spread: 5,
    type: 'tangent',
    alpha: 50 },
  { location: [ 0, -70 ],
    radius: 1,
    spread: 5,
    type: 'tangent',
    alpha: 50 },
  { location: [ 0, -71 ],
    radius: 1,
    spread: 5,
    type: 'tangent',
    alpha: 50 },
  { location: [ 0, -72 ],
    radius: 1,
    spread: 5,
    type: 'tangent',
    alpha: 50 },
  { location: [ 0, -73 ],
    radius: 1,
    spread: 5,
    type: 'tangent',
    alpha: 50 },
  { location: [ 0, -74 ],
    radius: 1,
    spread: 5,
    type: 'tangent',
    alpha: 50 },
  { location: [ 0, -75 ],
    radius: 1,
    spread: 5,
    type: 'tangent',
    alpha: 50 },
  { location: [ 0, -76 ],
    radius: 1,
    spread: 5,
    type: 'tangent',
    alpha: 50 },
  { location: [ 0, -77 ],
    radius: 1,
    spread: 5,
    type: 'tangent',
    alpha: 50 },
  { location: [ 0, -78 ],
    radius: 1,
    spread: 5,
    type: 'tangent',
    alpha: 50 },
  { location: [ 0, -79 ],
    radius: 1,
    spread: 40,
    type: 'seek',
    alpha: 0.0001 } ]
;

var g = [];
for (var x = 0; x < 80; x++) {
    for (var y = 0; y < 80; y++) {
//        g[x] = g[x] || [];
//        g[x][y] = gradient([x, y], fields);
        var _g = pf.gradient([30*x, 30*y], fields);
        g.push({
            x: x, y: y,
var fields = 
            value: {
                x: _g[0],
                y: _g[1]
            }
        });
    }
}

var width = 1200, height = 900;

var xscale = d3.scale.linear()
               .domain([0,80])
               .range([0,width]),
    yscale = d3.scale.linear()
               .domain([0,80])
               .range([0,height]),
    map = d3.floorplan().xScale(xscale).yScale(yscale),
    vectorfield = d3.floorplan.vectorfield(),
    mapdata = {};

map.addLayer(vectorfield);

var data = {
	'binSize': 2,
	'map': g
};

mapdata[vectorfield.id()] = data;
	
var svg = d3.select('#demo').append('svg')
    .attr('width',width)
    .attr('height', height)
    .datum(mapdata).call(map);

svg.select('defs').append('marker')
    .attr('id', 'arrowhead')
    .attr('refX', 0)
    .attr('refY', 1.5)
    .attr('markerWidth', 4)
    .attr('markerHeight', 4)
    .attr('orient', 'auto')
    .append('path')
        .attr('d', 'M 0,0 V 3 L4,1.5 Z');

svg.select('defs').append('marker')
    .attr('id', 'arrowhead-small')
    .attr('refX', 0)
    .attr('refY', 1)
    .attr('markerWidth', 3)
    .attr('markerHeight', 2)
    .attr('orient', 'auto')
    .append('path')
        .attr('d', 'M 0,0 V 2 L3,1 Z');
