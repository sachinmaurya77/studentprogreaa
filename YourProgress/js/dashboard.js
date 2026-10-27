/* ---------------------------------------------------------------
   DASHBOARDS
   --------------------------------------------------------------- */
function showAdminDashboard(){
  var st = data.students;
  if (st.length == 0) { $("content").innerHTML = noStudentsBox(); return; }
  var cgList = [], attList = [], allSems = [], attention = [];
  st.forEach(function(s){
    var sems = getStudentSems(s.id);
    sems.forEach(function(x){ allSems.push(x); });
    var cg = getCgpa(sems);
    if (cg != null) cgList.push(cg);
    var a = getAttendance(s.id).pct;
    if (a != null) attList.push(a);
    var why = [];
    if (a != null && a < 75) why.push("Attendance " + r1(a) + "%");
    if (sems.length && sems[sems.length - 1].failed.length > 0) why.push(sems[sems.length - 1].failed.length + " failed subject(s) in Sem " + sems[sems.length - 1].sem);
    if (why.length) attention.push(esc(s.name) + " (Roll " + esc(s.roll) + "): " + why.join(", "));
  });
  var passCount = allSems.filter(function(x){ return x.pass; }).length;
  var h = "<div class='box'><h3>Dashboard</h3><div class='tablebox'><table><tr><th>Total students</th><th>Average CGPA</th><th>Average attendance</th><th>Semester pass rate</th><th>Tests attempted</th></tr>" +
    "<tr><td>" + st.length + "</td><td>" + (cgList.length ? r2(average(cgList)) : "-") + "</td><td>" + pct(average(attList)) + "</td><td>" +
    (allSems.length ? r1(passCount / allSems.length * 100) + "%" : "-") + "</td><td>" + data.attempts.length + "</td></tr></table></div></div>";
  h += "<div class='box'><h3>Class average percentage by semester</h3>" + chartBox("c1") + "</div>";
  h += "<div class='box'><h3>Students who need attention</h3>";
  if (attention.length) { h += "<ul>"; attention.forEach(function(a){ h += "<li>" + a + "</li>"; }); h += "</ul>"; }
  else h += "<p>Nobody is below 75% attendance or has failed subjects in the latest semester.</p>";
  h += "</div>";
  var recent = data.attempts.slice().sort(function(a, b){ return a.date < b.date ? 1 : -1; }).slice(0, 5);
  h += "<div class='box'><h3>Recent test attempts</h3>";
  if (recent.length) {
    h += "<div class='tablebox'><table><tr><th>Student</th><th>Test</th><th>Score</th><th>Date</th></tr>";
    recent.forEach(function(a){
      var s = findStudent(a.studentId);
      h += "<tr><td>" + esc(s ? s.name : "Removed student") + "</td><td>" + esc(a.title) + "</td><td>" + a.score + "/" + a.total + "</td><td>" + fmtDateTime(a.date) + "</td></tr>";
    });
    h += "</table></div>";
  } else h += "<p>No tests attempted yet.</p>";
  h += "</div>";
  $("content").innerHTML = h;
  var avgs = [];
  for (var n = 1; n <= 6; n++) {
    var list = allSems.filter(function(x){ return x.sem == n; }).map(function(x){ return x.percent; });
    avgs.push(list.length ? Number(r1(average(list))) : null);
  }
  lineChart("c1", semLabels, [{ label: "Class average %", data: avgs }], 100);
}

function showStudentHome(){
  var me = currentStudent();
  if (!me) { $("content").innerHTML = "<div class='box'>Student record not found. Please login again.</div>"; return; }
  var sems = getStudentSems(me.id), last = sems.length ? sems[sems.length - 1] : null;
  var cg = getCgpa(sems), a = getAttendance(me.id), tries = getAttempts(me.id);
  var h = "<div class='box'><h3>Welcome, " + esc(me.name) + "</h3><p>" + esc(me.course) + " | Semester " + me.sem + " | Roll No. " + esc(me.roll) + "</p></div>";
  h += "<div class='box'><div class='tablebox'><table><tr><th>CGPA</th><th>" + (last ? "Sem " + last.sem + " percentage" : "Latest percentage") + "</th><th>Attendance</th><th>Tests taken</th></tr>" +
    "<tr><td>" + (cg == null ? "-" : r2(cg) + " / 10") + "</td><td>" + (last ? pct(last.percent) : "-") + "</td><td>" + pct(a.pct) + " (" + a.present + " of " + a.total + ")</td><td>" + tries.length + "</td></tr></table></div>";
  if (last && last.failed.length) {
    h += "<div class='failbox'><b>Failed subjects in Semester " + last.sem + ":</b><ul>";
    last.failed.forEach(function(f){ h += "<li>" + esc(f.name) + " - " + failReason(f) + "</li>"; });
    h += "</ul></div>";
  }
  h += "</div>";
  h += "<div class='box'><h3>My percentage by semester</h3>" + chartBox("c1") + "</div>";
  var avail = data.tests.filter(function(t){ return t.published; });
  h += "<div class='box'><h3>Available aptitude tests</h3>";
  if (avail.length) {
    h += "<ul>";
    avail.forEach(function(t){ h += "<li>" + esc(t.title) + " (" + t.questions.length + " questions, " + t.time + " min) <button onclick=\"startExam('" + t.id + "')\">Start</button></li>"; });
    h += "</ul>";
  } else h += "<p>No tests are available right now.</p>";
  h += "</div>";
  $("content").innerHTML = h;
  var vals = [];
  for (var n = 1; n <= 6; n++) { var s = findSemResult(sems, n); vals.push(s ? Number(r1(s.percent)) : null); }
  lineChart("c1", semLabels, [{ label: "Percentage", data: vals }], 100);
}
