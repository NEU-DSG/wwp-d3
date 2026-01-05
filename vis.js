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
    .attr("class", "title")
    .attr("x", width / 2 + margin.left) //positions it at the middle of the width
    .attr("y", margin.top / 2) //positions it from the top by the margin top
    .attr("font-family", "sans-serif")
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .text("WWP PCA Graph");

// Add x-axis
dataRegion.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))

// Add x-axis label
svg.append("text")
    .attr("x", width / 2 + margin.left)
    .attr("y", height + margin.top + 40)
    .attr("font-family", "sans-serif")
    .attr("text-anchor", "middle")
    .text("PC1");

// Add the y-axis.
dataRegion.append("g")
    .attr("transform", `translate(0,0)`)
    .call(d3.axisLeft(y))

// Add y-axis label
svg.append("text")
    .attr("x", margin.left - 40)
    .attr("y", height / 2 + margin.top)
    .attr("font-family", "sans-serif")
    .attr("text-anchor", "end")
    .attr("fill", "currentColor")
    .text("PC2");

// Add shape legend
let legendGroup = svg.append("g")
    .attr("id", "legendGroup")

let legend = legendGroup.append("g")
    .attr("transform", "translate(" + (margin.left + width) + ", " + (margin.top) + ")");

// Add author legend
let authorLegend = legendGroup.append("g")
    .attr("transform", "translate(" + (margin.left + width) + ", " + (margin.top + 125) + ")");

// Create the tooltip box
const tooltip = d3.select("#container")
    .append("div")
    .attr("class", "tooltip")

// import the csv and pass to function
d3.csv("wwo-pca-edited.csv").then(function (data) {
    // Create shape scale
    const shape = d3.scaleOrdinal()
        .domain(data.map(d => d['Simple Genre']))
        .range(d3.symbols);
    // Create author-color scale but group together authors with 1 publication
    // Create a rollup map of author count
    const authorCounts = d3.rollup(data, v => v.length, d => d.Author)
    // Add a column to the dataset of either the author name or Other if they
    // have less than five publications
    data.forEach(d => {
        d.AuthorGrouped = authorCounts.get(d.Author) > 5 ? d.Author : "Other"
    })
    // Create scale off of the new column
    // Changing the color scheme to try and be more accessible to fit WCAG contrast rules
    // Turns out finding a categorical color scheme for a large amount of categories that both fit
    // the 3:1 graphics contrast WCAG rule and be friendly to colorblindness is a difficult problem
    // Ended up reducing the categories and going off of Paul Tol's color schemes: 
    // https://cran.r-project.org/web/packages/khroma/vignettes/tol.html#sec:high-contrast
    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.AuthorGrouped))
        .range(['#325981', '#EE6677', '#228833', '#a19436', '#43a1b1', '#AA3377', '#888888'])
        // .range(['#6929c4', '#1192e8', '#005d5d', '#9f1853', '#fa4d56', '#570408', '#198038']);
        // .range(['#ee7733', '#0077bb', '#33bbee', '#ee3377', '#cc3311', '#009988', '#bbbbb']);
        // .range(['#cc6677', '#332288', '#ddcc77', '#117733', '#88ccee', '#882255', '#44aa99', '#999933', '#aa4499', '#e67433']);
        // .range(d3.schemeCategory10)
    // add data
    dataRegion.append('g')
        .selectAll("path")
        .data(data)
        .join("path")
        // symbol
        .attr("d", d3.symbol()
            .type(function (d) { return shape(d['Simple Genre']); })
            .size(40))
        // position
        .attr("transform", function (d) {
            return `translate(${x(d.PC1)}, ${y(d.PC2)})`;
        })
        // setting class - this is mainly for activating and muting
        .attr("class", function (d) { return `data-point ${d['Simple Genre']} ${d['AuthorGrouped']}` })
        // color
        .style("fill", d => color(d.AuthorGrouped))
        // mouseover tooltip function
        .on("mouseover", function (event, d) {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`Author: ${d['Full Author']}<br>PC1: ${d.PC1}<br>PC2: ${d.PC2}<br>Simple Genre: ${d['Simple Genre']}<br>WWO Title: ${d['WWO Title']}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function (event, d) {
            tooltip.transition().duration(200).style("opacity", 0);
        });

    const genres = shape.domain();
    const authors = color.domain();

    // Track which authors and genres are active (now all visible)
    let activeAuthors = new Set(authors);
    let activeGenres = new Set(genres);

    // Function to update point visibility based on both legend states
    function updatePointVisibility() {
        dataRegion.selectAll("path.data-point").each(function () {
            const point = d3.select(this);
            const classList = this.classList;
            // Get the author and genre from the point's classes or data
            let pointAuthor, pointGenre;
            let isVisible = false;

            // Loop through the classes to find which author and genre this point has
            classList.forEach(className => {
                if (activeAuthors.has(className)) {
                    pointAuthor = className;
                }
                if (activeGenres.has(className)) {
                    pointGenre = className;
                }
            });
            // Point is visible only if BOTH its author and genre are active
            isVisible = pointAuthor && pointGenre &&
                activeAuthors.has(pointAuthor) && activeGenres.has(pointGenre);

            point.transition().style("opacity", isVisible ? 1 : 0.1)
                .style("pointer-events", isVisible ? "all" : "none");
        });
    }

    // Function to create an author legend item
    // One author legend item is the circle with its color, and then the name of the author
    const authorLegendItems = authorLegend.selectAll(".author-legend-item")
        .data(authors)
        .join("g")
        .attr("tabindex", 0)
        // setting ARIA roles and properties
        // on second thought going to comment the aria-pressed tags out because I'm not sure if 
        // its helpful if the scatter plot points themselves are also not broadly accessibly
        .attr("role", "button")
        // .attr("aria-pressed", "true")
        .attr("class", "author-legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 25})`)
        .on("click", function (event, d) {
            // Toggle this author in the Set
            if (activeAuthors.has(d)) {
                activeAuthors.delete(d);
                d3.select(this).transition().style("opacity", 0.3);
                // d3.select(this).attr("aria-pressed", "false")
            } else {
                activeAuthors.add(d);
                d3.select(this).transition().style("opacity", 1);
                // d3.select(this).attr("aria-pressed", "true")
            }
            // Update all points based on both legends
            updatePointVisibility();
        })
        // update on keypress as well (enter and space)
        .on("keydown", function (event, d) {
            if (event.key === "Enter" || event.key === " ") {
                // Toggle this author in the Set
                if (activeAuthors.has(d)) {
                    activeAuthors.delete(d);
                    d3.select(this).transition().style("opacity", 0.3);
                    // d3.select(this).attr("aria-pressed", "false")
                } else {
                    activeAuthors.add(d);
                    d3.select(this).transition().style("opacity", 1);
                    // d3.select(this).attr("aria-pressed", "true")
                }
                // Update all points based on both legends
                updatePointVisibility();
            }
        })
        .on("mouseover", function (event, d) {
            d3.select(this).style("cursor", "pointer");
        });

    authorLegendItems.append("circle")
        .attr("r", 5)
        .style("fill", d => color(d))
        .attr("transform", "translate(10, 0)"); // offset from left edge

    authorLegendItems.append("text")
        .attr("x", 25) // position text to the right of symbol
        .attr("y", 5)  // vertically center with symbol
        .attr("font-size", "12px")
        .text(d => d)


    // Create a group for each legend item
    // One legend item is the shape and the name of the genre together.
    const legendItems = legend.selectAll(".legend-item")
        .data(genres)
        .join("g")
        .attr("tabindex", 0)
        // Setting ARIA role and properties
        .attr("role", "button")
        // .attr("aria-pressed", "true")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 25})`) // stack vertically, 25px apart
        .on("click", function (event, d) {
            // Toggle this genre in the Set
            if (activeGenres.has(d)) {
                activeGenres.delete(d);
                d3.select(this).transition().style("opacity", 0.3);
                // d3.select(this).attr("aria-pressed", "false")
            } else {
                activeGenres.add(d);
                d3.select(this).transition().style("opacity", 1);
                // d3.select(this).attr("aria-pressed", "true")
            }
            // Update all points based on both legends
            updatePointVisibility();
        })
        // update on keypress as well (enter and space)
        .on("keydown", function (event, d) {
            if (event.key === "Enter" || event.key === " ") {
                // Toggle this genre in the Set
                if (activeGenres.has(d)) {
                    activeGenres.delete(d);
                    d3.select(this).transition().style("opacity", 0.3);
                    // d3.select(this).attr("aria-pressed", "false")
                } else {
                    activeGenres.add(d);
                    d3.select(this).transition().style("opacity", 1);
                    // d3.select(this).attr("aria-pressed", "true")
                }
                // Update all points based on both legends
                updatePointVisibility();
            }
        })
        .on("mouseover", function (event, d) {
            d3.select(this).style("cursor", "pointer");
        });

    // Add the symbol to each item
    legendItems.append("path")
        .attr("d", d => d3.symbol().type(shape(d)).size(100)())
        .attr("transform", "translate(10, 0)"); // offset from left edge

    // Add the text label to each item
    legendItems.append("text")
        .attr("x", 25) // position text to the right of symbol
        .attr("y", 5)  // vertically center with symbol
        .attr("font-size", "12px")
        .text(d => d)

    // Make reset button 
    d3.select("#container")
        .append("button")
        .style("position", "absolute")
        .style("left", width + margin.left + 10 + "px")
        .style("top", (margin.top + 450) + "px")
        .attr("type", "button")
        .text("Reset")
        // On click button should reset all active authors and genres
        // And update all visibility for points and legend.
        .on("click", function () {
            activeAuthors = new Set(authors)
            activeGenres = new Set(genres);
            updatePointVisibility();
            d3.selectAll(".author-legend-item").transition().style("opacity", 1)
            d3.selectAll(".legend-item").transition().style("opacity", 1)
        });
});

// Append the SVG element.
d3.select("#container").node().appendChild(svg.node());