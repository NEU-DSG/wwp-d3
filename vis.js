import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Declare the chart dimensions and margins.
const margin = {
    left: 80,
    bottom: 50,
    right: 100,
    top: 70
}

const width = 980 - margin.left - margin.right
const height = 600 - margin.top - margin.bottom

// Declare x scale
const x = d3.scaleLinear()
    .domain([-0.04, 0.06])
    .range([0, width]);

// Declare y scale
const y = d3.scaleLinear()
    .domain([-0.03, 0.05])
    .range([height, 0]);

// Create SVG container
const svg = d3.select("#container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("role", "img")
    .attr("aria-labelledby", "wwp-title")
    .attr("aria-describedby", "wwp-desc")

// Create svg title for aria attributes
svg
    .append("title")
    .attr("id", "wwp-title")
    .text("PCA scatter plot for the Women Writers Project")

// Create svg desc for aria attributes
svg
    .append("desc")
    .attr("id", "wwp-desc")
    .text(`This is a scatter plot plotting the Principal Component Analysis (PCA) outputs of writers from Northeastern University's 
        Women Writers Project. Points are plotted by PCA values, colored by author, and shaped by their genre.`)

// move to-be graphic within the margin
const dataRegion = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`)

// Add the Title
// I'm using this separately than the accessible <title>, I think this should be still good practice from what I've read.
svg.append("text")
    .attr("id", "graph-title")
    .attr("x", width / 2 + margin.left) //positions it at the middle of the width
    .attr("y", margin.top / 2) //positions it from the top by the margin top
    .text("Principal Component Analysis Scatterplot");

// Add x-axis
dataRegion.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))

// Add x-axis label
svg.append("text")
    .attr("id", "x-axis")
    .attr("x", width / 2 + margin.left)
    .attr("y", height + margin.top + 40)
    .text("PC1");

// Add the y-axis.
dataRegion.append("g")
    .attr("transform", `translate(0,0)`)
    .call(d3.axisLeft(y))

// Add y-axis label
svg.append("text")
    .attr("id", "y-axis")
    .attr("x", margin.left - 40)
    .attr("y", height / 2 + margin.top)
    .attr("fill", "currentColor")
    .text("PC2");

// Create the tooltip box
const tooltip = d3.select("#container")
    .append("div")
    .attr("class", "tooltip")

// Creates a global state where all data on genres/centuries, authors, colors, shapes can be kept
const state = {
    authors: new Set(),
    genres: new Set(),
    color: null,
    shape: null,
    activeAuthors: new Set(),
    activeGenres: new Set(),
    shapeField: "Simple Genre"
};

const FEATURED_AUTHORS = [
    "Behn, Aphra",
    "Cavendish, Margaret (Lucas), Duchess of Newcastle",
    "Davies, Lady Eleanor",
    "Elizabeth I",
    "Haywood, Eliza (Fowler)",
    "Philips, Katherine (Fowler)"
]


/**
 * Create the legend for the author fields
 */
function authorLegendCreate(){
    // d3 data join
    const authorLegend = d3.select("#author-legend")
        .selectAll("span")
        .data(state.authors)
        .join("span");
    // creating the checkbox with functionality  
    authorLegend.append("input")
        .attr("type", "checkbox")
        .attr("id", d => `${d}-control`)
        .attr("name", "author-method")
        .attr("value", d => d)
        .attr("checked", true)
        .on("change", function(event, d) {
            if (state.activeAuthors.has(d)) {
                state.activeAuthors.delete(d);
        } else {
            state.activeAuthors.add(d)
        }
        updatePointVisibility()});
    // create the circle symbol for each author
    authorLegend.append("svg")
        .attr("width", 15)
        .attr("height", 15)
        .append("path")
        .attr("transform", "translate(9,9)")
        .attr("d", d3.symbol())
        .style("fill", d => state.color(d))
    // Name
    authorLegend.append("label")
        .attr("for", d => `${d}-control`)
        .text(d => d)
}

/**
 * Create the genre/century legend and shapes
 */
function genreLegendCreate(){
    // rename the legend name
    d3.select("#genre-legend legend")
        .text(state.shapeField === "Simple Genre" ? "Genre" : "Century");
    // d3 data join
    const genreLegend = d3.select("#genre-legend")
        .selectAll("span")
        .data(state.genres)
        .join("span");
    // checkbox and interactivity
    genreLegend.append("input")
        .attr("type", "checkbox")
        .attr("id", d => `${d}-control`)
        .attr("name", "genre-method")
        .attr("value", d => d)
        .attr("checked", true)
        .on("change", function(event, d) {
            if (state.activeGenres.has(d)) {
                state.activeGenres.delete(d);
        } else {
            state.activeGenres.add(d)
        }
        updatePointVisibility()});  
    // appending the shape
    genreLegend.append("svg")
        .attr("width", 15)
        .attr("height", 15)
        .append("path")
        .attr("transform", "translate(9, 9)")
        .attr("d", d => d3.symbol().type(state.shape(d)).size(50)())
        .attr("fill", "black")
    // name
    genreLegend.append("label")
        .attr("for", d => `${d}-control`)
        .text(d => d)
}

/**
 * This function returns the shape scale based on whether it will be the century or the genre
 * 
 * @param {*} shapeField: the column name for the shapefield, either Simple Genre or Simple Date
 * @param {*} data: the CSV data
 * @returns 
 */
function createShapeScale(shapeField, data) {
    const shape = d3.scaleOrdinal()
        .domain(data.map(d => d[shapeField]))
        .range(d3.symbols);
    return shape
}

/**
 * This function creates the author scale based on color
 * 
 * @param {*} data: the CSV data
 * @returns 
 */
function createAuthorScale(data) {
    // Add a column to the dataset of either the author name or Other if they
    // have are not in the FEATURED_AUTHORS list
    data.forEach(d => {
        d.AuthorGrouped = FEATURED_AUTHORS.includes(d['Full Author']) ? d['Full Author'] : "Other"
    })
    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.AuthorGrouped))
        .range(['#325981', '#EE6677', '#228833', '#a19436', '#43a1b1', '#AA3377', '#888888'])
    return color
}

/**
 * Updates the point visibilities based on genre/century and author
 */
function updatePointVisibility() {
        dataRegion.selectAll("path.data-point").each(function (d) {
            // Get the author and genre from the point's classes or data
            const point = d3.select(this);
            // Point is visible only if BOTH its author and genre are active
            const isVisible = state.activeAuthors.has(d.AuthorGrouped) && 
                            state.activeGenres.has(d[state.shapeField]);
            // transition
            point.interrupt()
                .transition()
                .style("opacity", isVisible ? 1 : 0.1)
                .style("pointer-events", isVisible ? "all" : "none");
        });
}

/**
 * Creates the reset button 
 */
function resetButton(){
    d3.select("#reset-button")
    .on("click", function () {
        // clear the state and repopulate it with all authors/genres
        state.activeAuthors.clear();
        state.authors.forEach(a => state.activeAuthors.add(a));
        state.activeGenres.clear();
        state.genres.forEach(g => state.activeGenres.add(g));
        // Update the point visibility
        updatePointVisibility();
        // Reset all button filters
        d3.selectAll(".legends #genre-legend input").property("checked", true)
        d3.selectAll(".legends #author-legend input").property("checked", true)
    });
}

/**
 * 
 * This function plots all of the points on the graph
 * 
 * @param {*} data: The csv data 
 */
function plotPoints(data){
    // add data
    dataRegion.append('g')
        .selectAll("path")
        .data(data)
        .join("path")
        // symbol
        .attr("d", d3.symbol()
            .type(function (d) { return state.shape(d[state.shapeField]); })
            .size(40))
        // position
        .attr("transform", function (d) {
            return `translate(${x(d.PC1)}, ${y(d.PC2)})`;
        })
        // setting class - this is mainly for activating and muting
        .attr("class", function (d) { return `data-point ${d[state.shapeField]} ${d['AuthorGrouped']}` })
        // color
        .style("fill", d => state.color(d.AuthorGrouped))
        // mouseover tooltip function
        .on("mouseover", function (event, d) {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`Author: ${d['Full Author']}<br>PC1: ${d.PC1}<br>PC2: ${d.PC2}<br>${state.shapeField}: ${d[state.shapeField]}<br>WWO Title: ${d['WWO Title']}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function (event, d) {
            tooltip.transition().duration(200).style("opacity", 0);
        });

}

/**
 * This function runs all of the code to draw all parts of the visualization
 * 
 * @param {*} data: The CSV data
 */
function draw(data) {
    state.shape = createShapeScale(state.shapeField, data)
    state.color = createAuthorScale(data)
    state.authors = new Set(state.color.domain());
    state.genres = new Set(state.shape.domain());
    state.activeAuthors = new Set(state.color.domain());
    state.activeGenres = new Set(state.shape.domain());

    plotPoints(data)
    genreLegendCreate()
    authorLegendCreate()
    resetButton();
}

// attaching the functionality for the genre/century switcher radio button
d3.selectAll("#shape-field-selector input")
    .on("change", function(event, d) {
        const selectedValue = event.target.value;
        reset();
        state.shapeField = selectedValue
        draw(globalData);
    });

/**
 * This function resets and removes the relevant parts of the graph to be redrawn
 */
function reset() {
    d3.selectAll("path.data-point")
        .remove();
    d3.select("#genre-legend")
        .selectAll("span")
        .remove()
    d3.select("#author-legend")
        .selectAll("span")
        .remove()
    d3.select("#reset-button").on("click", null);
}


// specifying the global data and drawing the graph.
let globalData;
d3.csv("wwo-pca-edited.csv").then(function(data) {
    globalData = data;
    draw(globalData);
});