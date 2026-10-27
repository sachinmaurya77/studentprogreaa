/* ---------------------------------------------------------------
   CHART HELPERS
   --------------------------------------------------------------- */
function chartBox(id){ return "<div class='chartbox'><canvas id='" + id + "'></canvas></div>"; }
function destroyCharts(){
  for (var k in charts) { try { charts[k].destroy(); } catch (e) {} }
  charts = {};
}
function makeChart(id, type, labels, datasets, options){
  var c = $(id);
  if (!c) return;
  if (typeof Chart == "undefined") {
    c.parentNode.innerHTML = "<p>Graph could not load. Please check the internet connection.</p>";
    return;
  }
  var style = getComputedStyle(document.documentElement);
  Chart.defaults.color = style.getPropertyValue("--text").trim();
  Chart.defaults.borderColor = style.getPropertyValue("--line").trim();
  options.responsive = true;
  options.maintainAspectRatio = false;
  charts[id] = new Chart(c, { type: type, data: { labels: labels, datasets: datasets }, options: options });
}
var colors = ["#2f6fd0", "#e67e22", "#1b9e77", "#8e44ad"];
function lineChart(id, labels, sets, max){
  var ds = sets.map(function(s, i){
    return { label: s.label, data: s.data, borderColor: colors[i], backgroundColor: colors[i], spanGaps: true, tension: 0.2, borderDash: s.dashed ? [6, 5] : [] };
  });
  makeChart(id, "line", labels, ds, { scales: { y: { min: 0, max: max } } });
}
function barChart(id, labels, values, label, max, horizontal){
  var opt = { plugins: { legend: { display: false } } };
  var scale = { min: 0, max: max };
  if (horizontal) { opt.indexAxis = "y"; opt.scales = { x: scale }; }
  else { opt.scales = { y: scale }; }
  makeChart(id, "bar", labels, [{ label: label, data: values, backgroundColor: colors[2] }], opt);
}
