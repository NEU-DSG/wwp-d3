import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Declare the chart dimensions and margins.
// const width = 900;
// const height = 500;

const margin = {
    left: 80,
    bottom: 50,
    right: 80,
    top: 70
}

const width = 960 - margin.left - margin.right
const height = 600 - margin.top - margin.bottom

// Declare x scale
const x = d3.scaleLinear()
    .domain([-0.04, 0.06])
    .range([0, width ]);

// Declare y scale
const y = d3.scaleLinear()
    .domain([-0.03, 0.05])
    .range([height, 0]);

// Create SVG container
const svg = d3.select("#container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

// move to-be graphic within the margin
const dataRegion = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)

// Add the Title
svg.append("text")
  .attr("class", "title")
  .attr("x", width/2 + margin.left) //positions it at the middle of the width
  .attr("y", margin.top) //positions it from the top by the margin top
  .attr("font-family", "sans-serif")
  .attr("text-anchor", "middle")
  .attr("font-weight", "bold")
  .text("WWP PCA Graph");

// Add x-axis
dataRegion.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    // Add label

// Add x-axis label
svg.append("text")
    .attr("x", width/2 + margin.left)
    .attr("y", height + margin.top + 40)
    .attr("font-family", "sans-serif")
    .attr("text-anchor", "end")
    .text("PC1");

// Add the y-axis.
dataRegion.append("g")
    .attr("transform", `translate(0,0)`)
    .call(d3.axisLeft(y))

// Add y-axis label
svg.append("text")
    .attr("x", margin.left - 40)
    .attr("y", height/2 + margin.top)
    .attr("font-family", "sans-serif")
    .attr("text-anchor", "end")
    .attr("fill", "currentColor")
    .text("PC2");

// Add legend
var legend = svg.append("g")
   .attr("transform", "translate(" + (margin.left + width) + ", " + (margin.top)+ ")");


// Create the tooltip box
const tooltip = d3.select("#container")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("padding", "10px")
    .style("background", "rgba(0,0,0,0.7)")
    .style("color", "white")
    .style("border-radius", "5px")
    .style("pointer-events", "none");

// import the csv and display points
d3.csv("wwo-pca-edited.csv").then(function(data) {
    // assign shapes
    const shape = d3.scaleOrdinal()
        .domain(data.map(d => d['Simple Genre']))
        .range(d3.symbols);
    // add data
    dataRegion.append('g')
        .selectAll("path")
        .data(data)
        .join("path")
        .attr("d", d3.symbol()
            .type(function(d) { return shape(d['Simple Genre']); })
            .size(40))
        .attr("transform", function(d) { 
        return `translate(${x(d.PC1)}, ${y(d.PC2)})`; 
        })
        .style("fill", "#69b3a2")
        // mouseover tooltip function
        .on("mouseover", function(event, d) {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`Author: ${d.Author}<br>PC1: ${d.PC1}<br>PC2: ${d.PC2}<br>Simple Genre: ${d['Simple Genre']}<br>WWO Title: ${d['WWO Title']}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function(event, d) {
            tooltip.transition().duration(200).style("opacity", 0);
        });
    
    const genres = shape.domain();

    // Create a group for each legend item
    const legendItems = legend.selectAll(".legend-item")
        .data(genres)
        .join("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 25})`); // stack vertically, 25px apart

    // Add the symbol to each item
    legendItems.append("path")
        .attr("d", d => d3.symbol().type(shape(d)).size(100)())
        .style("fill", "#69b3a2")
        .attr("transform", "translate(10, 0)"); // offset from left edge

    // Add the text label to each item
    legendItems.append("text")
        .attr("x", 25) // position text to the right of symbol
        .attr("y", 5)  // vertically center with symbol
        .attr("font-size", "12px")
        .text(d => d);
});


// Append the SVG element.

container.append(svg.node());