
/* GLOBALS */

var width  = 1100;           // width of svg image
var height = 400;           // height of svg image
var gWidth = 1200;
var gHeight = 400;
var margin = 20;            // amount of margin around plot area
var pad = margin / 2;       // actual padding amount
var radius = 20;             // fixed node radius
var yfixed = 50;  // y position for all nodes

var currentLine = 0; // Starting index for line to access in file
var fileContents;
var fileFiltered;
var structure;
var energy;
var currentEnergy;
var dots;
var i;
var maxLen;
var isAnimated = false;
var saddlesOn = false;
var selected = false;
var noneSelectedYet = true;
var minArray = [];
var maxArray = [];
var allText;
var pointData = [];


function parseStructure(text) {

    var nodeContainer = d3.select("#arc-diagram")
        .append("svg")
        .attr("id", "nodes")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 1100 400");

    var barContainer = d3.select("#energy-bar-graph")
        .append("svg")  //svg:g???
        .attr("id","barchart")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 1300 50")
        .style("padding-left","20px");
    var axisContainer = d3.select("#energy-bar-graph")
        .append("svg")  //svg:g???
        .attr("id","axis")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 1300 50")
        .style("padding-left","20px");

    var graphContainer = d3.select("#energy-plot-graph")
        .append("svg")  //svg:g???
        .attr("id","graph")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 1200 400");

    fileContents = text;
    fileFiltered = fileContents.split("\n"[0]);

    initializeGraphics();

    updateData();
}

function initializeGraphics() {
    drawNodes();
    initializeEnergy();
    //energyPlot(energy);
    drawGraph();

}

function initializeEnergy(){
    //console.log(currentLine)
    currentLine += 2;
    energy = [(fileFiltered[currentLine].split(',')[1])];
    //console.log(energy)
}

// Updates graph with next data point
function updateData() {
    energy = [(fileFiltered[currentLine].split(',')[1])];
    //energyPlot(energy);
    //console.log(fileFiltered)
    //console.log(fileFiltered[currentLine].split(',')[1])

    currentEnergy.text(" Current Energy: " + energy);

    dots.style("fill","black")
        .attr("r",2)
    dots.filter(function(d,i) { return i == currentLine -1 })        // <== This line
        .style("fill", "red")
        .attr("r", 5);

    updateArcDiagram();

    currentLine += 1;
}

function backData() {
    //energy = [(fileFiltered[currentLine].split(',')[1])];
    //energyPlot(energy);

    // we start at 2 because at the end of the first iteration we are at 2
    if (currentLine > 2){
        currentLine -= 2;
    }
    // need some method for the last value
    console.log(currentLine)

    dots.style("fill","black")
        .attr("r",2)
    dots.filter(function(d,i) { return i == currentLine -1 })        // <== This line
        .style("fill", "red")
        .attr("r", 5);

    updateArcDiagram();

}

////////////////////// ARC DIAGRAM CODE //////////////////////////

function updateArcDiagram() {
    console.log(currentLine)
    var bondString = (fileFiltered[currentLine].split(','))[0];

    var bondDictionary = buildLinks(bondString);

    console.log(bondDictionary);

    drawLinks(bondDictionary);
}

function drawNodes() {

    // used to assign nodes color by group
    var color = d3.scale.category10();

    structure = (fileFiltered[currentLine].split(','))[0].split('');

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

////////////////////// ENERGY PLOT CODE //////////////////////////
/*
function energyPlot(currentEnergy) {

    //var energy = [(fileFiltered[currentLine].split(',')[1])];
    //console.log(energy)
    // Building the energy bar
    //currentLine += 1;
    //energy = [(fileFiltered[currentLine].split(',')[1])];
    // console.log(currentEnergy)
    
    var min = -5  //get values from array of text 
    var max = 5

    var x = d3.scale.linear()
    .domain([min,max])
    .range([10, width]);

    var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .ticks(20);


    var bars = d3.select("#barchart").selectAll(".bar")
        .data(currentEnergy)
    
    // enter selection    
    bars.enter()
        .append("rect");

    // update selection
    bars.attr("class","bar")
        .attr ("fill","#800")
        .attr("x", function(d, i) { return x(Math.min(0, d)); })
        .attr("width", function(d, i) { return Math.abs(x(d) - x(0)); })
        .attr("height", 50)
        .text(function(d) { return d; });

    // exit selection
    bars.exit().remove();

    d3.select("#axis")
        .append("svg")
        .attr("class", "axis")
        .call(xAxis);

} */

////////////////////// ENERGY GRAPH CODE //////////////////////////

function drawGraph() {

    var originalIndices = [];

    var margin = {top: 30, right: 20, bottom: 30, left: 20},
    width = gWidth - margin.left - margin.right,
    height = gHeight - margin.top - margin.bottom;

    var count = 0;
    for (i = 2; i < fileFiltered.length; i++)
    {
        var point = parseFloat(fileFiltered[i].split(',')[1]);
        //FIXME - MAY NEED PARSE INT HERE
        var index = fileFiltered[i].split(',')[2];
        pointData.push(point);
        originalIndices.push(index);
        count += 1;
        //console.log(data)
    }

    var min = d3.min(pointData);
    // console.log(min)

    var max = d3.max(pointData);
    // console.log(max)

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

    //var path = graph.append("path")
      //  .attr("class", "line")
       // .attr("d", valueline(data));

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
        .text(" Current Energy: " + energy);

    var hoverEnergy = d3.select("body")
        //.data(data)
        .append("div")
        .attr("id","hover-energy")
        //.style("position", "absolute")
        .style("z-index", "10")
        .style('padding-bottom', '20px')
        .style("padding-left","20px")
        .style("color", "blue");


    dots.on('mouseover', function(d,i) {if (saddlesOn == false && i != currentLine-2 ){ d3.select(this).attr("r", 5).style("fill", "blue"); selected = false; return hoverEnergy.style("visibility", "visible").text("  Energy: " + d + " at Index: " + i + " with Original Index:" + originalIndices[i]);} })
        //.on('mouseover', function(d,i) {return d3.select(this).attr("r", 5).style("fill", "blue")})
        .on('mouseout',  function(d,i) {if (saddlesOn == false && i != currentLine -2 && selected == false) {d3.select(this).attr("r", 2).style("fill", "black"); return hoverEnergy.style("visibility", "hidden");} })
        //.on('mouseout', function(d,i) {return d3.select(this).attr("r", 2).style("fill", "black")});
       
        // TODO : uncomment and test
        .on('click', function(d,i) {if (isAnimated == false){ currentLine = i+1; updateData(); selected=true; noneSelectedYet=false;} if (saddlesOn == true) { showSaddlePoints(); } return; });



            
    //dots.filter(function(d,i) { return i == currentLine })        // <== This line
      //      .style("fill", "green")
       //     .attr("r", 5);

    dots.exit().remove();

}



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
                //alert(allText);
            }
        }
    }
    rawFile.send(null);
}




function parseSaddlePoints()
{
    var text = allText;
    var saddleArray = text.split("\n");
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


// appending tags so you can have multiple id attributes on a tag 
function showSaddlePoints()
{
    saddlesOn = true;
    parseSaddlePoints();
    console.log(minArray)
    console.log(maxArray)
    dots.style("fill","grey")
        .attr("r",2);

    dots.filter(function(d,i) { return i == currentLine-2 })        // <== This line
        .style("fill", "red")
        .attr("r", 5);

    for (l = 0; l < minArray.length; l++)
    {
        dots.filter(function(d,i) { if (minArray[l] != currentLine-2){ return i == minArray[l]; } })        // <== This line
            .style("fill", "green")
            .attr("r", 5);
        }
    for (l = 0; l < maxArray.length; l++)
    {
        dots.filter(function(d,i) { if (maxArray[l] != currentLine-2){ return i == maxArray[l]; } })        // <== This line
            .style("fill", "purple")
            .attr("r", 5);
        }


}

function hideSaddlePoints()
{
    dots.style("fill","black")
        .attr("r",2);

    dots.filter(function(d,i) { return i == currentLine-2 })        // <== This line
        .style("fill", "red")
        .attr("r", 5);

    saddlesOn = false;

    console.log(selected)
}


function animateGraph()
{
        maxLen = pointData.length-1;
        //console.log(fileFiltered.length)

        i = 0;
        anim = window.setInterval(function () {if (i < maxLen){isAnimated = true; updateData();  i++;}}, 1000);


}

function stopGraph()
{
    i = maxLen;
    isAnimated = false;
}



