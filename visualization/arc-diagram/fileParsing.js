
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
var structure;

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

    updateGraph();
}

// Draws nodes on plot
function drawNodes() {

    // used to assign nodes color by group
    var color = d3.scale.category10();

    structure = (fileFiltered[currentLine].split(','))[.0]split('');

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

    currentLine += 1;
}

// helper function - parses the current line into links between nodes
function buildLinks(string) {

    var linksArray = [];
    var stringLength = string.length;

    // first, count the number of open parentheses:
    var bonds = (string.match(/\(/g)||[]).length;

    var counter = 0;

    var currentOpen = stringLength+1;
    var prevStart = 0;

    for (b = 0; b < bonds; b++) {

        for (c = prevStart; c < stringLength; c++) {
            if (string.charAt(c) == '(') {
                counter++;

                if (currentOpen == stringLength+1) {
                    prevStart = c;
                    currentOpen = c;
                }
            } 
            else if ((string.charAt(c) == ')') && 
                     (counter > 0)) {
                counter--;

                if (counter == 0) {
                    linksArray.push({"source":currentOpen, "target":c});
                    prevStart += 1;
                    currentOpen = stringLength+1;
                    break;
                }
            }
        }
    }

    return linksArray;
}

// Draws nice arcs for each link on plot
function drawLinks(links) {
    var xscale = d3.scale.linear()
        .domain([0, structure.length - 1])
        .range([radius, width - margin - radius]);

    // scale to generate radians (just for lower-half of circle)
    var radians = d3.scale.linear()
        .range([Math.PI / 2, 3 * Math.PI / 2]);

    // path generator for arcs (uses polar coordinates)
    var arc = d3.svg.line.radial()
        .interpolate("basis")
        .tension(0)
        .angle(function(d) { return radians(d); });

    // add links
    d3.select("#plot").selectAll(".link")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("transform", function(d, i) {
            // arc will always be drawn around (0, 0)
            // shift so (0, 0) will be between source and target
            var xshift = xscale(d["source"]) + (xscale(d["target"]) - xscale(d["source"])) / 2;
            var yshift = yfixed;
            return "translate(" + xshift + ", " + yshift + ")";
        })
        .attr("d", function(d, i) {
            // get x distance between source and target
            var xdist = Math.abs(xscale(d["source"]) - xscale(d["target"]));

            // set arc radius based on x distance
            arc.radius(xdist / 2);

            // want to generate 1/3 as many points per pixel in x direction
            var points = d3.range(0, Math.ceil(xdist / 3));

            // set radian scale domain
            radians.domain([0, points.length - 1]);

            // return path for arc
            return arc(points);
        });
}

// Updates graph with next data point
function updateGraph() {
    var bondString = (fileFiltered[currentLine].split(','))[0];

    console.log(bondString);

    var bondDictionary = buildLinks(bondString);

    console.log(bondDictionary);

    // drawLinks(bondDictionary);
}

