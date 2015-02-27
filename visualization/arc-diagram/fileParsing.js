
/* GLOBALS */

var width  = 960;           // width of svg image
var height = 400;           // height of svg image
var margin = 20;            // amount of margin around plot area
var pad = margin / 2;       // actual padding amount
var radius = 10;             // fixed node radius
var yfixed = height / 2;  // y position for all nodes

var currentLine = 0; // Starting index for line to access in file
var fileContents;
var fileFiltered;

function parseStructure(text) {

    // var arcContainer = d3.select("body")
    //     .append("svg")
    //     .attr("id", "arcs")
    //     .attr("width", width)
    //     .attr("height", height);

    var nodeContainer = d3.select("body")
        .append("svg")
        .attr("id", "nodes")
        .attr("width", width)
        .attr("height", height);

    fileContents = text;
    fileFiltered = fileContents.split("\n"[0]);

    drawNodes();
}

// Draws nodes on plot
function drawNodes() {

    // used to assign nodes color by group
    var color = d3.scale.category10();

    var structure = (fileFiltered[currentLine].split(','))[0].split('');

    currentLine += 1;
    console.log(structure);

    var xscale = d3.scale.linear()
        .domain([0, structure.length - 1])
        .range([radius, width - margin - radius]);

    d3.select("#nodes").selectAll(".node")
        .data(structure)
        .enter()
        .append("circle")
        .attr("class", "node")
        .attr("id", function(d, i) { return d; })
        .attr("cx", function(d, i) { return xscale(i); })
        .attr("cy", function(d, i) { return yfixed; })
        .attr("r",  function(d, i) { return radius; })
        .style("fill",   function(d, i) { return color(d); });
}

// Updates graph with next data point

