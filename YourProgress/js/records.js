/* ---------------------------------------------------------------
   finding records
   --------------------------------------------------------------- */
function findStudent(id){
  for (var i = 0; i < data.students.length; i++) if (data.students[i].id == id) return data.students[i];
  return null;
}
function findTest(id){
  for (var i = 0; i < data.tests.length; i++) if (data.tests[i].id == id) return data.tests[i];
  return null;
}
function findMaterial(id){
  for (var i = 0; i < data.materials.length; i++) if (data.materials[i].id == id) return data.materials[i];
  return null;
}
function sortedStudents(){
  return data.students.slice().sort(function(a, b){
    return String(a.roll).localeCompare(String(b.roll), undefined, { numeric: true });
  });
}
function currentStudent(){
  if (user.role == "student") return findStudent(user.id);
  var s = findStudent(selectedStudentId);
  if (s) return s;
  var list = sortedStudents();
  return list.length ? list[0] : null;
}
function studentSelectHtml(){
  if (user.role != "admin") return "";
  var cur = currentStudent();
  var h = "<div class='box'>Select student: <select onchange=\"selectedStudentId=this.value; mk=null; showPage(page)\">";
  sortedStudents().forEach(function(s){
    h += "<option value='" + s.id + "'" + (cur && cur.id == s.id ? " selected" : "") + ">" + esc(s.roll) + " - " + esc(s.name) + "</option>";
  });
  return h + "</select></div>";
}
function noStudentsBox(){
  return "<div class='box'><h3>No students yet</h3><p>Add a student first, or load sample data to see how the system works.</p>" +
    "<button onclick=\"showPage('students')\">Go to Students</button> <button class='grey' onclick='loadSampleData()'>Load Sample Data</button></div>";
}
