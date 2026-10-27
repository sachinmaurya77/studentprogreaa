/* ---------------------------------------------------------------
   MODULE 1 - STUDENTS
   --------------------------------------------------------------- */
function showStudents(){
  var list = sortedStudents();
  var h = "<div class='box'><h3>Students</h3><button onclick='studentForm()'>+ Add Student</button> " +
    "<p>Search: <input id='search' placeholder='name, roll no. or course' oninput='filterRows(this.value)'></p>";
  if (list.length == 0) h += "<p>No students added yet.</p>";
  else {
    h += "<div class='tablebox'><table id='stuTable'><tr><th>Roll No.</th><th>Name</th><th>Course</th><th>Sem</th><th>Attendance</th><th>CGPA</th><th>Action</th></tr>";
    list.forEach(function(s){
      var cg = getCgpa(getStudentSems(s.id)), a = getAttendance(s.id).pct;
      h += "<tr class='datarow'><td>" + esc(s.roll) + "</td><td>" + esc(s.name) + "</td><td>" + esc(s.course) + "</td><td>" + s.sem + "</td>" +
        "<td>" + (a == null ? "-" : "<span class='" + (a < 75 ? "fail" : "pass") + "'>" + r1(a) + "%</span>") + "</td><td>" + (cg == null ? "-" : r2(cg)) + "</td>" +
        "<td><button onclick=\"viewProgress('" + s.id + "')\">Graphs</button><button class='grey' onclick=\"studentForm('" + s.id + "')\">Edit</button><button class='red' onclick=\"deleteStudent('" + s.id + "')\">Delete</button></td></tr>";
    });
    h += "</table></div>";
  }
  $("content").innerHTML = h + "</div>";
}
function filterRows(q){
  q = q.toLowerCase();
  var rows = document.querySelectorAll("#stuTable tr.datarow");
  for (var i = 0; i < rows.length; i++) rows[i].style.display = rows[i].textContent.toLowerCase().indexOf(q) >= 0 ? "" : "none";
}
function viewProgress(id){ selectedStudentId = id; showPage("graphs"); }
function studentForm(id){
  var s = id ? findStudent(id) : {};
  var h = "<h3>" + (id ? "Edit Student" : "Add Student") + "</h3>" +
    "<p>Roll No. *<br><input id='s_roll' value='" + esc(s.roll || "") + "'></p>" +
    "<p>Student Name *<br><input id='s_name' value='" + esc(s.name || "") + "'></p>" +
    "<p>Course *<br><input id='s_course' value='" + esc(s.course || "B.Sc. Computer Science") + "'></p>" +
    "<p>Current Semester<br><select id='s_sem'>";
  for (var n = 1; n <= 6; n++) h += "<option" + (s.sem == n ? " selected" : "") + ">" + n + "</option>";
  h += "</select></p>" +
    "<p>Email<br><input id='s_email' value='" + esc(s.email || "") + "'></p>" +
    "<p>Phone<br><input id='s_phone' value='" + esc(s.phone || "") + "'></p>" +
    "<p>Password " + (id ? "(leave blank to keep the old one)" : "(blank = roll number)") + "<br><input id='s_pass'></p>" +
    "<p id='s_err' class='fail'></p>" +
    "<button onclick=\"saveStudent('" + (id || "") + "')\">Save</button> <button class='grey' onclick='closeDialog()'>Cancel</button>";
  openDialog(h);
}
function saveStudent(id){
  var roll = $("s_roll").value.trim(), name = $("s_name").value.trim(), course = $("s_course").value.trim();
  if (roll == "" || name == "" || course == "") { $("s_err").innerHTML = "Roll no., name and course are required."; return; }
  var dup = false;
  data.students.forEach(function(s){ if (s.id != id && String(s.roll).toLowerCase() == roll.toLowerCase()) dup = true; });
  if (dup) { $("s_err").innerHTML = "This roll number already exists."; return; }
  var rec = id ? findStudent(id) : { id: newId() };
  rec.roll = roll; rec.name = name; rec.course = course;
  rec.sem = Number($("s_sem").value);
  rec.email = $("s_email").value.trim(); rec.phone = $("s_phone").value.trim();
  var pw = $("s_pass").value;
  if (pw != "") rec.pass = pw;
  else if (!id) rec.pass = roll;
  if (!id) data.students.push(rec);
  saveData(); closeDialog(); showMsg(id ? "Student updated." : "Student added."); showStudents();
}
function deleteStudent(id){
  var s = findStudent(id);
  askConfirm("Delete " + s.name + "? Marks, attendance and test attempts of this student will also be deleted.", "Delete", function(){
    data.students = data.students.filter(function(x){ return x.id != id; });
    data.marks = data.marks.filter(function(m){ return m.studentId != id; });
    data.attempts = data.attempts.filter(function(a){ return a.studentId != id; });
    data.attendance.forEach(function(a){ delete a.records[id]; });
    data.attendance = data.attendance.filter(function(a){ return Object.keys(a.records).length > 0; });
    if (selectedStudentId == id) selectedStudentId = null;
    saveData(); showMsg("Student deleted."); showStudents();
  });
}
