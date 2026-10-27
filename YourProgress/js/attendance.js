/* ---------------------------------------------------------------
   MODULE 4 - ATTENDANCE
   --------------------------------------------------------------- */
function findSession(sem, date, subject){
  for (var i = 0; i < data.attendance.length; i++) {
    var a = data.attendance[i];
    if (a.sem == sem && a.date == date && (a.subject || "").toLowerCase() == (subject || "").toLowerCase()) return a;
  }
  return null;
}
function attReload(){
  var list = data.students.filter(function(s){ return s.sem == att.sem; });
  var ex = findSession(att.sem, att.date, att.subject);
  att.marks = {};
  list.forEach(function(s){ att.marks[s.id] = (ex && ex.records[s.id]) ? ex.records[s.id] : "P"; });
  att.exists = !!ex;
}
function attChange(field, value){
  att[field] = field == "sem" ? Number(value) : value;
  attReload();
  showAdminAttendance();
}
// when the subject changes, only reload if that session was already saved
function attSubject(v){
  att.subject = v;
  if (findSession(att.sem, att.date, v)) { attReload(); showAdminAttendance(); }
}
function attAll(v){
  for (var k in att.marks) att.marks[k] = v;
  showAdminAttendance();
}
function saveAttendance(){
  var ids = Object.keys(att.marks);
  if (ids.length == 0) { showMsg("There are no students in this semester."); return; }
  if (att.date == "") { showMsg("Please choose a date."); return; }
  var s = findSession(att.sem, att.date, att.subject.trim());
  if (!s) { s = { id: newId(), sem: att.sem, date: att.date, subject: att.subject.trim(), records: {} }; data.attendance.push(s); }
  ids.forEach(function(id){ s.records[id] = att.marks[id]; });
  saveData(); attReload(); showMsg("Attendance saved."); showAdminAttendance();
}
function deleteSession(id){
  askConfirm("Delete this attendance session?", "Delete", function(){
    data.attendance = data.attendance.filter(function(s){ return s.id != id; });
    saveData(); attReload(); showAdminAttendance();
  });
}
function showAdminAttendance(){
  if (!att) {
    var counts = {}, best = 6, bestN = 0;
    data.students.forEach(function(s){ counts[s.sem] = (counts[s.sem] || 0) + 1; if (counts[s.sem] > bestN) { bestN = counts[s.sem]; best = s.sem; } });
    att = { sem: best, date: today(), subject: "", marks: {}, exists: false };
    attReload();
  }
  destroyCharts();
  var list = sortedStudents().filter(function(s){ return s.sem == att.sem; });
  var h = "<div class='box'><h3>Mark Attendance</h3><p>Semester: <select onchange=\"attChange('sem',this.value)\">";
  for (var n = 1; n <= 6; n++) h += "<option" + (att.sem == n ? " selected" : "") + ">" + n + "</option>";
  h += "</select></p><p>Date: <input type='date' value='" + att.date + "' onchange=\"attChange('date',this.value)\"></p>" +
    "<p>Subject / lecture (optional): <input value='" + esc(att.subject) + "' oninput='att.subject=this.value' onchange=\"attSubject(this.value)\"></p>";
  if (att.exists) h += "<p class='fail'>Attendance for this date is already saved. Saving will update it.</p>";
  if (list.length == 0) h += "<p>No students are in Semester " + att.sem + ". Change the current semester of a student in the Students page.</p>";
  else {
    h += "<button class='grey' onclick=\"attAll('P')\">All Present</button> <button class='grey' onclick=\"attAll('A')\">All Absent</button>" +
      "<div class='tablebox'><table><tr><th>Roll No.</th><th>Name</th><th>Attendance</th></tr>";
    list.forEach(function(s){
      var p = att.marks[s.id] == "P";
      h += "<tr><td>" + esc(s.roll) + "</td><td>" + esc(s.name) + "</td><td>" +
        "<label><input type='radio' name='att_" + s.id + "'" + (p ? " checked" : "") + " onclick=\"att.marks['" + s.id + "']='P'\"> Present</label> " +
        "<label><input type='radio' name='att_" + s.id + "'" + (!p ? " checked" : "") + " onclick=\"att.marks['" + s.id + "']='A'\"> Absent</label></td></tr>";
    });
    h += "</table></div><p><button onclick='saveAttendance()'>Save Attendance</button></p>";
  }
  h += "</div>";
  if (list.length) {
    h += "<div class='box'><h3>Attendance Summary - Semester " + att.sem + "</h3><div class='tablebox'><table><tr><th>Student</th><th>Present</th><th>Sessions</th><th>Percentage</th></tr>";
    list.forEach(function(s){
      var a = getAttendance(s.id, att.sem);
      h += "<tr><td>" + esc(s.name) + "</td><td>" + a.present + "</td><td>" + a.total + "</td><td>" + (a.pct == null ? "-" : "<span class='" + (a.pct < 75 ? "fail" : "pass") + "'>" + r1(a.pct) + "%</span>") + "</td></tr>";
    });
    h += "</table></div></div><div class='box'><h3>Attendance Graph</h3><div class='chartbox' style='height:" + Math.max(220, list.length * 32 + 50) + "px'><canvas id='c1'></canvas></div></div>";
  }
  var sessions = data.attendance.filter(function(s){ return s.sem == att.sem; }).sort(function(a, b){ return a.date < b.date ? 1 : -1; });
  if (sessions.length) {
    h += "<div class='box'><h3>Saved Sessions - Semester " + att.sem + "</h3><div class='tablebox'><table><tr><th>Date</th><th>Subject</th><th>Present</th><th></th></tr>";
    sessions.slice(0, 15).forEach(function(s){
      var v = Object.keys(s.records).map(function(k){ return s.records[k]; });
      h += "<tr><td>" + fmtDate(s.date) + "</td><td>" + esc(s.subject) + "</td><td>" + v.filter(function(x){ return x == "P"; }).length + "/" + v.length + "</td><td><button class='red' onclick=\"deleteSession('" + s.id + "')\">Delete</button></td></tr>";
    });
    h += "</table></div></div>";
  }
  $("content").innerHTML = h;
  if (list.length) {
    var names = [], vals = [];
    list.forEach(function(s){ var a = getAttendance(s.id, att.sem); if (a.pct != null) { names.push(s.name); vals.push(Number(r1(a.pct))); } });
    if (names.length) barChart("c1", names, vals, "Attendance %", 100, true);
    else $("c1").parentNode.innerHTML = "<p>Save attendance to see the graph.</p>";
  }
}
function showMyAttendance(){
  var me = currentStudent(), all = getAttendance(me.id);
  var h = "<div class='box'><h3>My Attendance</h3><div class='tablebox'><table><tr><th>Overall</th><th>Present</th><th>Absent</th><th>Sessions</th></tr>" +
    "<tr><td>" + pct(all.pct) + "</td><td>" + all.present + "</td><td>" + (all.total - all.present) + "</td><td>" + all.total + "</td></tr></table></div>";
  if (all.pct != null && all.pct < 75) h += "<div class='failbox'>Your attendance is below 75%.</div>";
  h += "</div><div class='box'><h3>Present and Absent</h3>" + chartBox("c1") + "</div>";
  h += "<div class='box'><h3>Attendance by semester</h3>" + chartBox("c2") + "</div>";
  var rec = data.attendance.filter(function(s){ return s.records[me.id]; }).sort(function(a, b){ return a.date < b.date ? 1 : -1; });
  h += "<div class='box'><h3>Recent sessions</h3>";
  if (rec.length == 0) h += "<p>No attendance has been recorded yet.</p>";
  else {
    h += "<div class='tablebox'><table><tr><th>Date</th><th>Subject</th><th>Sem</th><th>Status</th></tr>";
    rec.slice(0, 30).forEach(function(s){
      var p = s.records[me.id] == "P";
      h += "<tr><td>" + fmtDate(s.date) + "</td><td>" + esc(s.subject) + "</td><td>" + s.sem + "</td><td class='" + (p ? "pass" : "fail") + "'>" + (p ? "Present" : "Absent") + "</td></tr>";
    });
    h += "</table></div>";
  }
  $("content").innerHTML = h + "</div>";
  if (all.total > 0) makeChart("c1", "doughnut", ["Present", "Absent"], [{ data: [all.present, all.total - all.present], backgroundColor: ["#1b9e77", "#d9534f"] }], {});
  else $("c1").parentNode.innerHTML = "<p>No data yet.</p>";
  var vals = [];
  for (var n = 1; n <= 6; n++) { var p2 = getAttendance(me.id, n).pct; vals.push(p2 == null ? null : Number(r1(p2))); }
  barChart("c2", semLabels, vals, "Attendance %", 100, false);
}
