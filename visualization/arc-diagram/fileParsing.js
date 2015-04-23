
/* GLOBALS */

var width  = 1100;           // width of svg image
var height = 500;           // height of svg image
var gWidth = 1200;          // width for graph
var gHeight = 400;          // height for graph
var margin = 20;            // amount of margin around plot area
var pad = margin / 2;       // actual padding amount
var radius = 20;             // fixed node radius
var yfixed = 50;  // y position for all nodes

var currentLine = 0; // Starting index for line to access in file
var fileContents;
var fileFiltered;
var structure;
var energy;         //value of energy at the current line
var currentEnergy;  // point on the graph that represents the energy at the current line
var dots;           // set of points on the graph
var i;
var maxLen;
var isAnimated = false; // boolean indicates if the graph is in animation mode you can't select other points
var saddlesOn = false;  // boolean indicates if the graph has saddle points turned on, no hover over feature in this mode
var selected = false; // boolean if you have clicked on a point it becomes selected, helpful for coloring
var noneSelectedYet = true; // boolean indicating you have not yet made any selections in the graph
var firstBack = true; //the first time we go back the index needs to be updated correctly 
var minArray = [];      // values for min saddle points
var maxArray = [];      // values for max sadddle points
var allText;
var pointData = [];     // values for all points 
var originalIndices = []; //values for the original indecies assosiated with a point

//loads the file text for generating diagrams
function loadStructure(file){
    d3.text(file, parseStructure);
}

// generates the containers for the diagram and parses the file for ease of use
function parseStructure(text) {

    var nodeContainer = d3.select("#arc-diagram")
        .append("svg")
        .attr("id", "nodes")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 1100 500");

    var graphContainer = d3.select("#energy-plot-graph")
        .append("svg")  //svg:g???
        .attr("id","graph")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 1200 400")
        .style("padding-left","10px");

    fileContents = text;
    fileFilteredComs = fileContents.split("\n"[0]);
    fileFiltered = fileFilteredComs.slice(6);
    console.log(fileFiltered)
    initializeGraphics();

    updateData();
}

// initialize the first image you see before updates
function initializeGraphics() {
    drawNodes();
    initializeEnergy();
    drawGraph();

}

// get the value for the first energy from the file
function initializeEnergy(){
    currentLine += 2;
    energy = [(fileFiltered[currentLine].split(',')[1])];
}

// Updates graph with next data point
function updateData() {
    firstBack = true;
    energy = [(fileFiltered[currentLine].split(',')[1])];

    currentEnergy.text(" Current Energy: " + energy + " at Index: " + (currentLine-2).toString() + " with Original Index: " + originalIndices[currentLine-2]);

    dots.style("fill","black")
        .attr("r",2)
    dots.filter(function(d,i) { return i == currentLine -2 })        // <== This line
        .style("fill", "red")
        .attr("r", 5);

    updateArcDiagram();

    currentLine += 1;
}

// Updates graph with the previous data point 
function backData() {
    if (firstBack == true && currentLine > 1)
    {
        currentLine -= 2;
        firstBack = false;
    }

    else if (firstBack == false && currentLine > 1){
        currentLine -= 1;
    }

    dots.style("fill","black")
        .attr("r",2)
    dots.filter(function(d,i) { return i == currentLine -1 })       
        .style("fill", "red")
        .attr("r", 5);

    updateArcDiagram();

}

////////////////////// ARC DIAGRAM CODE //////////////////////////

function updateArcDiagram() {
    console.log(currentLine)
    var bondString = (fileFiltered[currentLine].split(','))[0];

    var bondDictionary = buildLinks(bondString);

    drawLinks(bondDictionary);
}

function drawNodes() {

    // used to assign nodes color by group
    var color = d3.scale.category10();

    structure = (fileFiltered[currentLine].split(','))[0].split('');

    console.log(structure);

    radius = (width - margin - 2*structure.length)/(2*structure.length);

    console.log(radius);

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
        .attr("cy", function(d, i) { return 50; })
        .attr("r",  function(d, i) { return radius; })
        .style("fill",   function(d, i) { return color(d); });

    d3.select("#nodes").selectAll(".text")
        .data(structure)
        .enter()
        .append("g")
        .append("text")
        .attr("dx", function(d, i) {return xscale(i); })
        .attr("dy", function(d, i) {return 50 + (radius/3);})
        .attr("text-anchor", "middle")
        .text(function(d) {return d;});

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

    // remove old links
    d3.select("#nodes").selectAll(".link").remove();
    // add links
    d3.select("#nodes").selectAll(".link")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("transform", function(d, i) {
            // arc will always be drawn around (0, 0)
            // shift so (0, 0) will be between source and target
            var xshift = xscale(d.source) + (xscale(d.target) - xscale(d.source)) / 2;
            var yshift = yfixed + radius;
            return "translate(" + xshift + ", " + yshift + ")";
        })
        .attr("d", function(d, i) {
            // get x distance between source and target
            var xdist = Math.abs(xscale(d.source) - xscale(d.target));

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


////////////////////// ENERGY GRAPH CODE //////////////////////////

function drawGraph() {

    var margin = {top: 30, right: 20, bottom: 30, left: 20},
    width = gWidth - margin.left - margin.right,
    height = gHeight - margin.top - margin.bottom;
    console.log(fileFiltered.length)

    // parsing file for energy data points and their original indecies
    var count = 0;
    for (i = 2; i < fileFiltered.length-1; i++)
    {
        var point = parseFloat(fileFiltered[i].split(',')[1]);
        var index = fileFiltered[i].split(',')[2];
        pointData.push(point);
        originalIndices.push(index);
        count += 1;
    }

    var min = d3.min(pointData);

    var max = d3.max(pointData);

    var y = d3.scale.linear()
        .domain([min,max])
        .range([height,0]);

    var x = d3.scale.linear()
        .domain([0, count])
        .range([0, width]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var valueline = d3.svg.line()
        .x(function(d,i) { return x(i); })
        .y(function(d,i) { return y(d); });

    var graph = d3.select("#graph")
            .append("g")
             .attr("transform", 
                "translate(" + margin.left + "," + margin.top + ")");


    graph.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    graph.append("g")
        .attr("class", "y axis")
        .call(yAxis);


    dots = graph.selectAll('.point')
        .data(pointData);


    dots.enter().append("svg:circle")
        .attr("class", 'point')
        .attr("r", 2)
        .attr("cx", function(d, i) { return x(i)})
        .attr("cy", function(d,i) { return y(d)});

    currentEnergy = d3.select("body")
        .append("div")
        .attr("id", "current-energy")
        .style("z-index", "10")
        .style('padding-bottom', '20px')
        .style("padding-left","20px")
        .style("padding-righ", "20px")
        .style("color","red")
        .text(" Current Energy: " + energy + " with Original Index " + originalIndices[currentLine-2]);

    var hoverEnergy = d3.select("body")
        .append("div")
        .attr("id","hover-energy")
        .style("z-index", "10")
        .style('padding-bottom', '20px')
        .style("padding-left","20px")
        .style("color", "blue");

    // Allowes for the hover over feature and the ability to navigate to a new point
    dots.on('mouseover', function(d,i) {if (saddlesOn == false && i != currentLine-3 ){ d3.select(this).attr("r", 5).style("fill", "blue"); selected = false; return hoverEnergy.style("visibility", "visible").text("  Energy: " + d + " at Index: " + i + " with Original Index: " + originalIndices[i]);} })
        .on('mouseout',  function(d,i) {if (saddlesOn == false && i != currentLine -3 && selected == false) {d3.select(this).attr("r", 2).style("fill", "black"); return hoverEnergy.style("visibility", "hidden");} })
        .on('click', function(d,i) {if (isAnimated == false){ currentLine = i+2; updateData(); selected=true; noneSelectedYet=false;} if (saddlesOn == true) { showSaddlePoints(); } return; });


    dots.exit().remove();

}

// Loads the data for saddle points from text file
function loadSaddlePoints(file)
{
    readTextFile(file);
    parseSaddlePoints();
}

// Used for loading, reads the contents of the file
function readTextFile(file)
{
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                allText = rawFile.responseText;
            }
        }
    }
    rawFile.send(null);
}



// parses the contents of the saddle point file into min values and max values
function parseSaddlePoints()
{
    var text = allText;
    var saddleArrayComs = text.split("\n");
    var saddleArray = saddleArrayComs.slice(7);
    console.log(saddleArray)
    var minIndex = saddleArray.indexOf("Min:");
    var maxIndex = saddleArray.indexOf("Max:");
    console.log(maxIndex)
    console.log(minIndex)
    for (i= maxIndex+1; i < minIndex; i++)
    {
        var minAdd = saddleArray[i].split(",");
        minArray = minArray.concat(minAdd);
    }
    for(i= minIndex+1; i< saddleArray.length; i++)
    {
        var maxAdd = saddleArray[i].split(",");
        maxArray = maxArray.concat(maxAdd);
    }

    


}

// the min and max values are used as filters in order to show them visually on the graph
function showSaddlePoints()
{
    saddlesOn = true;
    console.log(minArray)
    console.log(maxArray)
    dots.style("fill","grey")
        .attr("r",2);

    dots.filter(function(d,i) { return i == currentLine-3 })     
        .style("fill", "red")
        .attr("r", 5);

    for (l = 0; l < minArray.length; l++)
    {
        dots.filter(function(d,i) { if (minArray[l] != currentLine-3){ return i == minArray[l]; } })        // <== This line
            .style("fill", "green")
            .attr("r", 5);
        }
    for (l = 0; l < maxArray.length; l++)
    {
        dots.filter(function(d,i) { if (maxArray[l] != currentLine-3){ return i == maxArray[l]; } })        // <== This line
            .style("fill", "purple")
            .attr("r", 5);
        }


}

// Returns the visual to the original graph
function hideSaddlePoints()
{
    dots.style("fill","black")
        .attr("r",2);

    dots.filter(function(d,i) { return i == currentLine-3 })      
        .style("fill", "red")
        .attr("r", 5);

    saddlesOn = false;

    console.log(selected)
}

// Steps through all the structures until you reach the end and updates current line
function animateGraph()
{
        maxLen = pointData.length-1;
        i = 0;
        anim = window.setInterval(function () {if (i < maxLen){isAnimated = true; updateData();  i++;}}, 1000);


}

// Stops the animation
function stopGraph()
{
    i = maxLen;
    isAnimated = false;
}



