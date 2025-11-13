let data = [];
let commits = [];
let xScale;
let yScale;
let selectedCommits = [];
let commitProgress = 100;
let timeScale;
let commitMaxTime;
let timeFilter = -1;

async function loadData() {
  data = await d3.csv("loc.csv", (row) => ({
    ...row,
    line: Number(row.line), // or just +row.line
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + "T00:00" + row.timezone),
    datetime: new Date(row.datetime),
  }));
  displayStats();
  processCommits();
  initializeTimeScale();
}
document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  updateTooltipVisibility(false);

  const slider = document.getElementById("commit-slider");
  slider.addEventListener("input", (event) => {
    commitProgress = event.target.value;
    updateCommitProgress(commitProgress);
    updateTimeDisplay();
  });
});

function initializeTimeScale() {
  timeScale = d3.scaleTime()
    .domain([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)])
    .range([0, 100]);
  commitMaxTime = timeScale.invert(commitProgress);
}

function processCommits() {
  commits = d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: "https://github.com/vis-society/lab-7/commit/" + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };
      Object.defineProperty(ret, "lines", {
        value: lines,
        enumerable: true,
        configurable: false,
        writable: false,
        // What other options do we need to set?
        // Hint: look up configurable, writable, and enumerable
      });
      return ret;
    });
}

function displayStats() {
  // Process commits first
  processCommits();
  // Create the dl element
  const dl = d3.select("#stats").append("dl").attr("class", "stats");

  // Add total LOC
  dl.append("dt").html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append("dd").text(data.length);

  // Add total commits
  dl.append("dt").text("Total commits");
  dl.append("dd").text(commits.length);

  // average commit day
  let total_days = [0, 0, 0, 0, 0, 0, 0];
  let weekday = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  commits.forEach((commit) => {
    // console.log(commit.datetime.getDay());
    total_days[commit.datetime.getDay() - 1] += 1;
  });
  const index = total_days.indexOf(Math.max(...total_days));

  dl.append("dt").text("Avg. commit day");
  dl.append("dd").text(
    weekday[index] +
      " (" +
      Math.round((Math.max(...total_days) / commits.length) * 100) +
      "%)"
  );

  // average lines committed
  let total_lines = 0;
  console.log(commits);
  commits.forEach((commit) => {
    total_lines += commit.lines.length;
  });
  dl.append("dt").text("Avg. lines commit");
  dl.append("dd").text(Math.round(total_lines / commits.length));

  const workByPeriod = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString("en", { dayPeriod: "short" })
  );
  const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];

  // Time worked
  dl.append("dt").text("Avg. Time of Day");
  dl.append("dd").text(maxPeriod);

  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (v) => v.line),
    (d) => d.file
  );
  const averageFileLength = d3.mean(fileLengths, (d) => d[1]);

  dl.append("dt").text("Avg. File Length");
  dl.append("dd").text(averageFileLength);

  createScatterPlot();
}

function createScatterPlot() {
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  const width = 1000;
  const height = 600;
  yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);
  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("overflow", "visible");

  const dots = svg.append("g").attr("class", "dots");

  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  // Update scales with new ranges
  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);

  const gridlines = svg
    .append("g")
    .attr("class", "gridlines")
    .attr("transform", `translate(${usableArea.left}, 0)`);

  // Create gridlines as an axis with no labels and full-width ticks
  gridlines.call(
    d3.axisLeft(yScale).tickFormat("").tickSize(-usableArea.width)
  );

  // Create the axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, "0") + ":00");

  // Add X axis
  svg
    .append("g")
    .attr("transform", `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  // Add Y axis
  svg
    .append("g")
    .attr("transform", `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([5, 60]); // adjust these values based on your experimentation

  dots
    .selectAll("circle")
    .data(sortedCommits)
    .join("circle")
    .attr("cx", (d) => xScale(d.datetime))
    .attr("cy", (d) => yScale(d.hourFrac))
    .attr("r", (d) => rScale(d.totalLines))
    .attr("fill", "steelblue")
    .style("fill-opacity", 0.7)
    .on("mouseenter", function (event, d, i) {
      d3.select(event.currentTarget).style("fill-opacity", 1); // Full opacity on hover
      d3.select(event.currentTarget).classed('selected', true);
      updateTooltipContent(d);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on("mouseleave", function (event) {
      d3.select(event.currentTarget).style("fill-opacity", 0.7); // Restore transparency
      d3.select(event.currentTarget).classed('selected', false);
      updateTooltipContent({}); // Clear tooltip content
      updateTooltipVisibility(false);
    });
  brushSelector();
}

function updateTooltipContent(commit) {
  const link = document.getElementById("commit-link");
  const date = document.getElementById("commit-date");
  const time = document.getElementById("time");
  const author = document.getElementById("author");
  const linesEdited = document.getElementById("lines-edited");

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString("en", {
    dateStyle: "full",
  });
  time.textContent = commit.datetime?.toLocaleString("en", {
    timeStyle: "short",
  });
  author.textContent = commit.author;
  linesEdited.textContent = commit.lines.length;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById("commit-tooltip");
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById("commit-tooltip");
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function brushSelector() {
  const svg = document.querySelector("svg");
  d3.select(svg).call(d3.brush().on("start brush end", brushed));
  d3.select(svg).selectAll(".dots, .overlay ~ *").raise();
}

let brushSelection = null;

function brushed(evt) {
  let brushSelection = evt.selection;
  selectedCommits = !brushSelection
    ? []
    : commits.filter((commit) => {
        let min = { x: brushSelection[0][0], y: brushSelection[0][1] };
        let max = { x: brushSelection[1][0], y: brushSelection[1][1] };
        let x = xScale(commit.date);
        let y = yScale(commit.hourFrac);

        return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
      });
   updateSelection();
   updateSelectionCount();
   updateLanguageBreakdown();
}

function isCommitSelected(commit) {
  return selectedCommits.includes(commit);
}

function updateSelection() {
  // Update visual state of dots based on selection
  d3.selectAll("circle").classed("selected", (d) => isCommitSelected(d));
}

function updateSelectionCount() {
  const countElement = document.getElementById("selection-count");
  countElement.textContent = `${
    selectedCommits.length || "No"
  } commits selected`;

  return selectedCommits;
}

function updateLanguageBreakdown() {
  const container = document.getElementById("language-breakdown");

  if (selectedCommits.length === 0) {
    container.innerHTML = "";
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  // Update DOM with breakdown
  container.innerHTML = "";

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format(".1~%")(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }

  return breakdown;
}

function updateCommitProgress(progress) {
  // Implement the logic to update the visualization based on commitProgress
  console.log(`Commit progress: ${progress}`);
  commitMaxTime = timeScale.invert(progress);
  updateTimeDisplay();
  // Example: Update the opacity of dots based on progress
  d3.selectAll("circle").style("opacity", (d) => {
    return d.datetime <= commitMaxTime ? 1 : 0.1;
  });
}

function updateTimeDisplay() {
  const timeSlider = document.getElementById("commit-slider");
  const selectedTime = document.getElementById("selected-time");
  const anyTimeLabel = document.getElementById("any-time");

  timeFilter = Number(timeSlider.value); // Get slider value
  if (timeFilter === -1) {
    selectedTime.textContent = ""; // Clear time display
    anyTimeLabel.style.display = "block"; // Show "(any time)"
  } else {
    selectedTime.textContent = commitMaxTime.toLocaleString(); // Display formatted time
    anyTimeLabel.style.display = "none"; // Hide "(any time)"
  }
}