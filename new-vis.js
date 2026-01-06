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

const state = {
    authors: new Set(),
    genres: new Set(),
    color: null,
    shape: null,
    activeAuthors: new Set(),
    activeGenres: new Set(),
    shapeField: "Simple Genre"
};


function authorLegendCreate(){
    const authorLegend = d3.select("#author-legend")
        .selectAll("span")
        .data(state.authors)
        .join("span");

    authorLegend.append("svg")
        .attr("width", 15)
        .attr("height", 15)
        .append("path")
        .attr("transform", "translate(9,9)")
        .attr("d", d3.symbol())
        .style("fill", d => state.color(d))
    
    authorLegend.append("label")
        .attr("for", d => `${d}-control`)
        .text(d => d)

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
}


function genreLegendCreate(){
    const genreLegend = d3.select("#genre-legend")
        .selectAll("span")
        .data(state.genres)
        .join("span");

    genreLegend.append("svg")
        .attr("width", 15)
        .attr("height", 15)
        .append("path")
        .attr("transform", "translate(9, 9)")
        .attr("d", d => d3.symbol().type(state.shape(d)).size(50)())
        .attr("fill", "black")

    genreLegend.append("label")
        .attr("for", d => `${d}-control`)
        .text(d => d)
    
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
}

function createShapeScale(shapeField, data) {
    const shape = d3.scaleOrdinal()
        .domain(data.map(d => d[shapeField]))
        .range(d3.symbols);
    return shape
}

function createAuthorScale(data) {
    // Create author-color scale but group together authors with 1 publication
    // Create a rollup map of author count
    const authorCounts = d3.rollup(data, v => v.length, d => d.Author)
    // Add a column to the dataset of either the author name or Other if they
    // have less than five publications
    data.forEach(d => {
        d.AuthorGrouped = authorCounts.get(d.Author) > 5 ? d.Author : "Other"
    })
    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.AuthorGrouped))
        .range(['#325981', '#EE6677', '#228833', '#a19436', '#43a1b1', '#AA3377', '#888888'])
    return color
}

function updatePointVisibility() {
        dataRegion.selectAll("path.data-point").each(function (d) {
            // const point = d3.select(this);
            // const classList = this.classList;
            // // Get the author and genre from the point's classes or data
            // let pointAuthor, pointGenre;
            // // let isVisible = false;

            // // Loop through the classes to find which author and genre this point has
            // classList.forEach(className => {
            //     if (state.authors.has(className)) {
            //         pointAuthor = className;
            //     }
            //     if (state.genres.has(className)) {
            //         pointGenre = className;
            //     }
            // });
            // const isVisible = pointAuthor && pointGenre &&
            // state.activeAuthors.has(pointAuthor) && state.activeGenres.has(pointGenre);
            // // Point is visible only if BOTH its author and genre are active
            // // isVisible = pointAuthor && pointGenre &&
            // //     state.activeAuthors.has(pointAuthor) && state.activeGenres.has(pointGenre);

            // point.transition().style("opacity", isVisible ? 1 : 0.1)
            //     .style("pointer-events", isVisible ? "all" : "none");
            const point = d3.select(this);
            const isVisible = state.activeAuthors.has(d.AuthorGrouped) && 
                            state.activeGenres.has(d[state.shapeField]);
            
            point.interrupt()
                .transition()
                .style("opacity", isVisible ? 1 : 0.1)
                .style("pointer-events", isVisible ? "all" : "none");
        });
}

function resetButton(){
    d3.select("#reset-button")
    .on("click", function () {
        state.activeAuthors.clear();
        state.authors.forEach(a => state.activeAuthors.add(a));
        state.activeGenres.clear();
        state.genres.forEach(g => state.activeGenres.add(g));
        updatePointVisibility(state.activeAuthors, state.activeGenres, new Set(state.authors), new Set(state.genres));
        d3.selectAll(".legends #genre-legend input").property("checked", true)
        d3.selectAll(".legends #author-legend input").property("checked", true)
    });
}


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
            tooltip.html(`Author: ${d['Full Author']}<br>PC1: ${d.PC1}<br>PC2: ${d.PC2}<br>Simple Genre: ${d[state.shapeField]}<br>WWO Title: ${d['WWO Title']}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function (event, d) {
            tooltip.transition().duration(200).style("opacity", 0);
        });

    // const genres = shape.domain();
    // const authors = color.domain();

    // // Track which authors and genres are active (now all visible)
    // let state.activeAuthors = new Set(authors);
    // let state.activeGenres = new Set(genres);

    // return {genres, authors, state.activeAuthors, state.activeGenres}

}

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

d3.selectAll("#shape-field-selector input")
    .on("change", function(event, d) {
        const selectedValue = event.target.value;
        reset();
        state.shapeField = selectedValue
        draw(globalData);
    });

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



let globalData;
d3.csv("wwo-pca-edited.csv").then(function(data) {
    globalData = data;
    draw(globalData);
});

// Append the SVG element.
// d3.select("#container").node().appendChild(svg.node());