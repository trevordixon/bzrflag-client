'use strict';

var pf = require('../lib/potential-fields');

function Field(location, radius, spread, type, alpha) {
	this.location = location;
	this.radius = radius;
	this.spread = spread;
	this.type = type;
    this.alpha = alpha;
}


var fields = [
    new Field([20, 20], 2, 9, 'seek', 30),
    new Field([40, 40], 2, 9, 'seek', 30),
    new Field([10, 40], 2, 4, 'avoid', 20)
];

var g = [];
for (var x = 0; x < 80; x++) {
    for (var y = 0; y < 80; y++) {
//        g[x] = g[x] || [];
//        g[x][y] = gradient([x, y], fields);
        var _g = pf.gradient([x, y], fields);
        g.push({
            x: x, y: y,
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
