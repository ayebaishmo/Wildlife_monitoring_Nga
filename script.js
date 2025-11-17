const CSV_PATH = "data.csv"; // CSV file in the same folder
let rawData = [];
let filteredData = [];
let adultsChart, nestsChart, totalChart, seenPieChart;

// Load CSV
async function loadCSV() {
  return new Promise((resolve, reject) => {
    Papa.parse(CSV_PATH, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: results => {
        rawData = results.data.map(r => ({
          Species: r.Species || '',
          DateObserved: r['Date observed'] || '',
          Observer: r.Observer || '',
          NoEggs: parseInt(r['No eggs'] || 0),
          NoOffspring: parseInt(r['No of offspring’s'] || 0),
          NoNests: parseInt(r['No of nests'] || 0),
          NoAdults: parseInt(r['No adults'] || 0),
          Total: parseInt(r.Total || 0),
          Comment: r.Comment || ''
        }));
        resolve(rawData);
      },
      error: err => reject(err)
    });
  });
}

// Initialize filters
function initFilters(data) {
  const speciesSet = new Set();
  const observerSet = new Set();
  data.forEach(d => {
    speciesSet.add(d.Species);
    observerSet.add(d.Observer);
  });

  const speciesSel = document.getElementById("speciesFilter");
  const obsSel = document.getElementById("observerFilter");

  [...speciesSet].sort().forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    speciesSel.appendChild(opt);
  });
  [...observerSet].sort().forEach(o => {
    const opt = document.createElement("option");
    opt.value = o;
    opt.textContent = o;
    obsSel.appendChild(opt);
  });
}

// Apply filters
function applyFilters() {
  const species = document.getElementById("speciesFilter").value;
  const observer = document.getElementById("observerFilter").value;
  const search = document.getElementById("tableSearch").value.toLowerCase();

  filteredData = rawData.filter(d =>
    (species === "all" || d.Species === species) &&
    (observer === "all" || d.Observer === observer) &&
    (d.Species.toLowerCase().includes(search) ||
     d.Observer.toLowerCase().includes(search) ||
     d.Comment.toLowerCase().includes(search))
  );

  updateCharts(filteredData);
  buildTable(filteredData);
}

// Update charts
function updateCharts(data) {
  const labels = data.map(d => d.Species);
  const adults = data.map(d => d.NoAdults);
  const nests = data.map(d => d.NoNests);
  const totals = data.map(d => d.Total);
  const seenCount = data.filter(d => d.Total > 0).length;
  const notSeenCount = data.filter(d => d.Total === 0).length;

  // Destroy previous charts if exist
  if (adultsChart) adultsChart.destroy();
  if (nestsChart) nestsChart.destroy();
  if (totalChart) totalChart.destroy();
  if (seenPieChart) seenPieChart.destroy();

  // Adults chart
  adultsChart = new Chart(document.getElementById("adultsChart"), {
    type: "bar",
    data: { labels, datasets: [{ label: "Adults", data: adults, backgroundColor: "#3b82f6" }] },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  // Nests chart
  nestsChart = new Chart(document.getElementById("nestsChart"), {
    type: "bar",
    data: { labels, datasets: [{ label: "Nests", data: nests, backgroundColor: "#ef4444" }] },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  // Total line chart
  totalChart = new Chart(document.getElementById("totalChart"), {
    type: "line",
    data: { labels, datasets: [{ label: "Total", data: totals, borderColor: "#10b981", backgroundColor: "#6ee7b7", fill: false, tension: 0.3 }] },
    options: { responsive: true }
  });

  // Seen vs Not Seen Pie
  seenPieChart = new Chart(document.getElementById("seenPieChart"), {
    type: "pie",
    data: {
      labels: ["Seen", "Not Seen"],
      datasets: [{ data: [seenCount, notSeenCount], backgroundColor: ["#22c55e", "#f87171"] }]
    },
    options: { responsive: true }
  });
}

// Build table
function buildTable(data) {
  const tbody = document.querySelector("#dataTable tbody");
  tbody.innerHTML = "";
  data.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="border px-2 py-1">${r.Species}</td>
      <td class="border px-2 py-1">${r.DateObserved}</td>
      <td class="border px-2 py-1">${r.Observer}</td>
      <td class="border px-2 py-1">${r.NoEggs}</td>
      <td class="border px-2 py-1">${r.NoOffspring}</td>
      <td class="border px-2 py-1">${r.NoNests}</td>
      <td class="border px-2 py-1">${r.NoAdults}</td>
      <td class="border px-2 py-1">${r.Total}</td>
      <td class="border px-2 py-1">${r.Comment}</td>
    `;
    tbody.appendChild(tr);
  });

  // Make table sortable
  new Tablesort(document.getElementById("dataTable"));
}

// Export CSV
function exportCSV() {
  let csv = "Species,Date observed,Observer,No eggs,No of offspring’s,No of nests,No adults,Total,Comment\n";
  filteredData.forEach(r => {
    csv += `${r.Species},${r.DateObserved},${r.Observer},${r.NoEggs},${r.NoOffspring},${r.NoNests},${r.NoAdults},${r.Total},${r.Comment}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "wildlife_filtered.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// Initialize dashboard
document.addEventListener("DOMContentLoaded", async () => {
  await loadCSV();
  filteredData = rawData;
  initFilters(rawData);
  updateCharts(rawData);
  buildTable(rawData);

  document.getElementById("speciesFilter").addEventListener("change", applyFilters);
  document.getElementById("observerFilter").addEventListener("change", applyFilters);
  document.getElementById("tableSearch").addEventListener("input", applyFilters);
  document.getElementById("exportBtn").addEventListener("click", exportCSV);
});
