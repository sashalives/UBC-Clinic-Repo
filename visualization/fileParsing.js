
/* GLOBALS */

var width  = 960;           // width of svg image
var height = 400;           // height of svg image
var eWidth = 1300;
var eHeight = 50;
var gWidth = 1200;
var gHeight = 400;
var margin = 20;            // amount of margin around plot area
var pad = margin / 2;       // actual padding amount
var radius = 10;             // fixed node radius
var yfixed = height / 2;  // y position for all nodes

var currentLine = 0; // Starting index for line to access in file
var fileContents;
var fileFiltered;
var energy;
var dots;

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

        // Changes to add bar chart
    var barContainer = d3.select("body")
        .append("svg")  //svg:g???
        .attr("id","barchart")
        .attr("width",eWidth)
        .attr("height", eHeight)
        .style("padding-left","20px");

    var axisContainer = d3.select("body")
        .append("svg")  //svg:g???
        .attr("id","axis")
        .attr("width",eWidth)
        .attr("height", 50)
        .style("padding-left","20px");
    var graphContainer = d3.select("body")
        .append("svg")  //svg:g???
        .attr("id","graph")
        .attr("width",gWidth)
        .attr("height", gHeight);

    fileContents = text;
    fileFiltered = fileContents.split("\n"[0]);

    drawNodes();
    initializeEnergy();
    energyPlot(energy);
    drawGraph();
}

// Draws nodes on plot
function drawNodes() {

    // used to assign nodes color by group
    var color = d3.scale.category10();

    var structure = (fileFiltered[currentLine].split(','))[0].split('');


    //currentLine += 1;
    console.log(structure);

    //var energy = [(fileFiltered[currentLine].split(',')[1])];
    //console.log(energy)

    // Building the arc diagram drawing
    var xscale = d3.scale.linear()
        .domain([0, structure.length - 1])
        .range([radius, width - margin - radius]);

    d3.select("#nodes").selectAll(".node")
        .data(structure)
        .enter()
        .append("circle")
        .attr("class", "node")
        .attr("id", function(d, i) { return d; })
        .attr("cx", function(d, i) { return xscale(i); }) // HELP CONFUSED
        .attr("cy", function(d, i) { return yfixed; })
        .attr("r",  function(d, i) { return radius; })
        .style("fill",   function(d, i) { return color(d); });
}

function initializeEnergy(){
    currentLine += 1;
    energy = [(fileFiltered[currentLine].split(',')[1])];
}
function energyPlot(currentEnergy) {

    //var energy = [(fileFiltered[currentLine].split(',')[1])];
    //console.log(energy)
    // Building the energy bar
    //currentLine += 1;
    //energy = [(fileFiltered[currentLine].split(',')[1])];
    console.log(currentEnergy)
    
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


}

// Updates graph with next data point
function updateData() {
    currentLine += 1;
    energy = [(fileFiltered[currentLine].split(',')[1])];
    energyPlot(energy);
    dots.style("fill","black")
        .attr("r",2)
    dots.filter(function(d,i) { return i == currentLine-1 })        // <== This line
        .style("fill", "red")
        .attr("r", 5);

}

function drawGraph() {
    var data = [];

    var margin = {top: 30, right: 20, bottom: 30, left: 20},
    width = gWidth - margin.left - margin.right,
    height = gHeight - margin.top - margin.bottom;

    var count = 0;
    for (i = 1; i < fileFiltered.length; i++)
    {
        var point = parseFloat(fileFiltered[i].split(',')[1]);
        //console.log(point)
        data.push(point);
        count += 1;
        //console.log(data)
    }

    var min = d3.min(data);
    console.log(min)

    var max = d3.max(data);
    console.log(max)

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
        .data(data);


    dots.enter().append("svg:circle")
        .attr("class", 'point')
        .attr("r", 2)
        .attr("cx", function(d, i) { return x(i)})
        .attr("cy", function(d,i) { return y(d)});


    var tooltip = d3.select("body")
        //.data(data)
        .append("div")
        //.style("position", "absolute")
        .style("z-index", "10")
        .style('padding-bottom', '20px')
        .style("padding-left","20px");
        //.style("visibility", "hidden")
        //.text(" ");


    dots.on('mouseover', function(d,i) {d3.select(this).attr("r", 5).style("fill", "blue"); return tooltip.style("visibility", "visible").text("  Energy: " + d);})
        //.on('mouseover', function(d,i) {return d3.select(this).attr("r", 5).style("fill", "blue")})
        .on('mouseout',  function() {d3.select(this).attr("r", 2).style("fill", "black"); return tooltip.style("visibility", "hidden");})
        //.on('mouseout', function(d,i) {return d3.select(this).attr("r", 2).style("fill", "black")});
        //.on('click', (d, i) -> console.log d, i) **/

            
    dots.filter(function(d,i) { return i == currentLine-1 })        // <== This line
            .style("fill", "green")
            .attr("r", 5);

    dots.exit().remove();

}




