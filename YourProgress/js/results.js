/* ---------------------------------------------------------------
   MODULE 6 - RESULT AND CGPA ANALYSIS
   --------------------------------------------------------------- */
function marksheetHtml(sid){
  var sems = getStudentSems(sid), s = data.settings;
  if (sems.length == 0) return "<div class='box'>No semester marks have been entered yet.</div>";
  var fails = 0;
  sems.forEach(function(x){ fails += x.failed.length; });
  var h = "<div class='box'><h3>Summary</h3><div class='tablebox'><table><tr><th>CGPA</th><th>Overall percentage</th><th>Semesters recorded</th><th>Failed subjects</th></tr>" +
    "<tr><td>" + r2(getCgpa(sems)) + " / 10</td><td>" + r1(getOverallPercent(sems)) + "%</td><td>" + sems.length + " of 6</td><td>" + fails + "</td></tr></table></div></div>";
  sems.forEach(function(x){
    h += "<div class='box'><h3>Semester " + x.sem + " - <span class='" + (x.pass ? "pass'>PASS" : "fail'>FAIL") + "</span></h3>" +
      "<p>Total: <b>" + x.total + "/" + x.max + "</b> | Percentage: <b>" + r1(x.percent) + "%</b> | SGPA: <b>" + r2(x.sgpa) + "</b></p>" +
      "<div class='tablebox'><table><tr><th>Subject</th><th>TH /" + s.thMax + "</th><th>INT /" + s.intMax + "</th><th>Total</th><th>Grade</th><th>Status</th></tr>";
    x.subs.forEach(function(sub){
      h += "<tr><td>" + esc(sub.name) + "</td><td>" + sub.th + "</td><td>" + sub.int + "</td><td>" + sub.total + "/" + sub.max + "</td><td>" + sub.grade + "</td><td class='" + (sub.pass ? "pass'>Pass" : "fail'>Fail") + "</td></tr>";
    });
    h += "</table></div>";
    if (x.failed.length) {
      h += "<div class='failbox'><b>Failed subjects (" + x.failed.length + "):</b><ul>";
      x.failed.forEach(function(f){ h += "<li>" + esc(f.name) + " - " + failReason(f) + "</li>"; });
      h += "</ul></div>";
    } else h += "<div class='okbox'>All subjects passed in this semester.</div>";
    h += "</div>";
  });
  h += "<div class='box small'>Grade points: 80% and above = 10 (O), 70% = 9 (A), 60% = 8 (B), 55% = 7 (C), 50% = 6 (D), 45% = 5 (E), 40% = 4 (P). A failed subject gets 0. " +
    "SGPA = average grade point of the subjects in a semester. CGPA = average grade point of all subjects of all recorded semesters.</div>";
  return h;
}
function showResults(){
  if (user.role == "student") {
    $("content").innerHTML = "<div class='box'><h3>My Results</h3></div>" + marksheetHtml(currentStudent().id);
    return;
  }
  var st = currentStudent();
  if (!st) { $("content").innerHTML = noStudentsBox(); return; }
  var h = "<div class='box'><button class='" + (resTab == "student" ? "" : "grey") + "' onclick=\"resTab='student';showResults()\">Student Marksheet</button>" +
    "<button class='" + (resTab == "class" ? "" : "grey") + "' onclick=\"resTab='class';showResults()\">Class Result</button></div>";
  if (resTab == "student") h += studentSelectHtml() + marksheetHtml(st.id);
  else {
    h += "<div class='box'><p>Semester: <select onchange='classSem=Number(this.value);showResults()'>";
    for (var n = 1; n <= 6; n++) h += "<option" + (classSem == n ? " selected" : "") + ">" + n + "</option>";
    h += "</select></p><h3>Class Result - Semester " + classSem + "</h3>";
    var rows = [];
    sortedStudents().forEach(function(s){
      var rec = findMarks(s.id, classSem);
      if (rec && rec.subjects.length) rows.push({ s: s, c: calcSemester(rec) });
    });
    if (rows.length == 0) h += "<p>No marks entered for this semester yet.</p>";
    else {
      var passed = rows.filter(function(x){ return x.c.pass; }).length;
      h += "<p>" + passed + " of " + rows.length + " students passed (" + r1(passed / rows.length * 100) + "%)</p><div class='tablebox'><table><tr><th>Roll No.</th><th>Student</th><th>Total</th><th>%</th><th>SGPA</th><th>Failed subjects</th><th>Result</th></tr>";
      rows.forEach(function(x){
        h += "<tr><td>" + esc(x.s.roll) + "</td><td>" + esc(x.s.name) + "</td><td>" + x.c.total + "/" + x.c.max + "</td><td>" + r1(x.c.percent) + "%</td><td>" + r2(x.c.sgpa) + "</td><td>" +
          (x.c.failed.length ? x.c.failed.map(function(f){ return esc(f.name); }).join(", ") : "-") + "</td><td class='" + (x.c.pass ? "pass'>PASS" : "fail'>FAIL") + "</td></tr>";
      });
      h += "</table></div>";
    }
    h += "</div>";
  }
  $("content").innerHTML = h;
}
