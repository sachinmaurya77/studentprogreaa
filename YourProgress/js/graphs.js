/* ---------------------------------------------------------------
   MODULE 7 - PERFORMANCE GRAPHS (Semester 1 to 6)
   --------------------------------------------------------------- */
function showGraphs(){
  var st = currentStudent();
  if (!st) { $("content").innerHTML = noStudentsBox(); return; }
  var sems = getStudentSems(st.id);
  var pctList = [], sgpaList = [], cumList = [], attList = [], classList = [];
  var gp = 0, cnt = 0;
  for (var n = 1; n <= 6; n++) {
    var x = findSemResult(sems, n);
    pctList.push(x ? Number(r1(x.percent)) : null);
    sgpaList.push(x ? Number(r2(x.sgpa)) : null);
    if (x) { gp += x.gpSum; cnt += x.count; cumList.push(Number(r2(gp / cnt))); } else cumList.push(null);
    var a = getAttendance(st.id, n).pct;
    attList.push(a == null ? null : Number(r1(a)));
    var others = [];
    data.students.forEach(function(s){ var rec = findMarks(s.id, n); if (rec && rec.subjects.length) others.push(calcSemester(rec).percent); });
    classList.push(others.length ? Number(r1(average(others))) : null);
  }
  var tries = getAttempts(st.id);
  var points = [];
  if (sems.length) {
    var bestSem = sems[0];
    sems.forEach(function(x){ if (x.percent > bestSem.percent) bestSem = x; });
    points.push("Best semester: Semester " + bestSem.sem + " with " + r1(bestSem.percent) + "%.");
    if (sems.length > 1) {
      var l = sems[sems.length - 1], p = sems[sems.length - 2], d = l.percent - p.percent;
      points.push("Semester " + l.sem + " is " + (d >= 0 ? "up" : "down") + " " + r1(Math.abs(d)) + " percentage points compared to Semester " + p.sem + ".");
    }
    points.push("CGPA so far: " + r2(getCgpa(sems)) + " out of 10.");
    var f = 0; sems.forEach(function(x){ f += x.failed.length; });
    points.push(f ? f + " failed subject(s) in total." : "No failed subjects.");
  }
  var at = getAttendance(st.id);
  if (at.pct != null) points.push("Attendance: " + r1(at.pct) + "% in " + at.total + " sessions" + (at.pct < 75 ? " (below 75%)." : "."));
  if (tries.length) points.push("Average aptitude test score: " + r1(average(tries.map(function(t){ return t.score / t.total * 100; }))) + "% in " + tries.length + " attempt(s).");
  var h = studentSelectHtml();
  h += "<div class='box'><h3>" + esc(st.name) + "</h3><p>" + esc(st.course) + " | Roll No. " + esc(st.roll) + " | Semester " + st.sem + "</p>";
  if (points.length) { h += "<ul>"; points.forEach(function(t){ h += "<li>" + esc(t) + "</li>"; }); h += "</ul>"; }
  else h += "<p>Marks, attendance and test data will appear here after they are entered.</p>";
  h += "</div><div class='box'><h3>Percentage - Semester 1 to 6</h3>" + chartBox("c1") + "</div>" +
    "<div class='box'><h3>SGPA and CGPA</h3>" + chartBox("c2") + "</div>" +
    "<div class='box'><h3>Attendance by semester</h3>" + chartBox("c3") + "</div>" +
    "<div class='box'><h3>Aptitude test scores</h3>" + chartBox("c4") + "</div>";
  $("content").innerHTML = h;
  lineChart("c1", semLabels, [{ label: "Student %", data: pctList }, { label: "Class average %", data: classList, dashed: true }], 100);
  lineChart("c2", semLabels, [{ label: "SGPA", data: sgpaList }, { label: "CGPA (cumulative)", data: cumList }], 10);
  barChart("c3", semLabels, attList, "Attendance %", 100, false);
  if (tries.length) {
    var labels = tries.map(function(t, i){ return "#" + (i + 1); });
    lineChart("c4", labels, [{ label: "Score %", data: tries.map(function(t){ return Number(r1(t.score / t.total * 100)); }) }], 100);
  } else $("c4").parentNode.innerHTML = "<p>No aptitude tests attempted yet.</p>";
}
