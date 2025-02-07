import { fetchJSON, renderProjects } from "../global.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const projects = await fetchJSON("../lib/projects.json");
const projectsContainer = document.querySelector(".projects");
renderProjects(projects, projectsContainer, "h2");

const titleElement = document.querySelector(".projects-title");
const projectCount = document.querySelectorAll("article").length;
titleElement.textContent = `${projectCount} Projects`;

function renderPieChart(projectsGiven) {
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );
  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });
  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  let arcs = arcData.map((d) => arcGenerator(d));
  let colors = d3.scaleOrdinal(d3.schemeTableau10);
  arcs.forEach((arc, idx) => {
    d3.select("svg").append("path").attr("d", arc).attr("fill", colors(idx)); // Fill in the attribute for fill color via indexing the colors variable
  });
  let legend = d3.select(".legend");
  data.forEach((d, idx) => {
    legend
      .append("li")
      .attr("style", `--color:${colors(idx)}`) // set the style attribute while passing in parameters
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
  });
  let selectedIndex = -1;
  let svg = d3.select("svg");
  svg.selectAll("path").remove();
  arcs.forEach((arc, i) => {
    svg
      .append("path")
      .attr("d", arc)
      .attr("fill", colors(i))
      .on("click", () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        svg
          .selectAll("path")
          .attr("class", (_, idx) => (idx === selectedIndex ? "selected" : ""));
        legend
          .selectAll("li")
          .attr("class", (_, idx) => (idx === selectedIndex ? "selected" : ""));

        if (selectedIndex === -1) {
          renderProjects(projects, projectsContainer, "h2");
        } else {
          // TODO: filter projects and project them onto webpage
          // Hint: `.label` might be useful
          let selectedLabel = data[selectedIndex].label.toLowerCase();
          let filteredProjects = projects.filter((project) => {
            return project.year.toLowerCase() === selectedLabel;
          });
          renderProjects(filteredProjects, projectsContainer, "h2");
        }
      });
  });
}

function renderPlot(data) {
  // Clear the SVG / legend
  d3.select("svg").selectAll("*").remove();
  d3.select(".legend").selectAll("li").remove();

  // ???
  let newSVG = d3.select("svg");
  newSVG.selectAll("path").remove();

  // Render the projects and pie chart
  //   renderProjects(data, projectsContainer, "h2");
  renderPieChart(data);
}

renderPlot(projects);

let query = "";
let searchInput = document.querySelector(".searchBar");
searchInput.addEventListener("input", (event) => {
  // update query value
  query = event.target.value;
  // filter projects
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join("\n").toLowerCase();
    return values.includes(query.toLowerCase());
  });
  renderPlot(filteredProjects);
  renderProjects(filteredProjects, projectsContainer, "h2");
});
