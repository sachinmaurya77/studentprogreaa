/* ---------------------------------------------------------------
   SETTINGS AND SAMPLE DATA
   --------------------------------------------------------------- */
function showSettings(){
  var s = data.settings;
  var h = "<div class='box'><h3>Marking Scheme</h3><p class='small'>Used for totals, pass / fail and grades. Old results are recalculated automatically.</p>" +
    "<p>TH maximum marks<br><input type='number' id='s_thmax' min='1' value='" + s.thMax + "'></p>" +
    "<p>TH minimum marks to pass<br><input type='number' id='s_thmin' min='0' value='" + s.thMin + "'></p>" +
    "<p>INT maximum marks<br><input type='number' id='s_inmax' min='1' value='" + s.intMax + "'></p>" +
    "<p>INT minimum marks to pass<br><input type='number' id='s_inmin' min='0' value='" + s.intMin + "'></p>" +
    "<p class='small'>Maximum per subject = " + (s.thMax + s.intMax) + ". For 11 subjects the semester total = " + ((s.thMax + s.intMax) * 11) + ".</p>" +
    "<button onclick='saveScheme()'>Save Marking Scheme</button></div>";
  h += "<div class='box'><h3>Admin Account</h3><p>Username<br><input id='a_user' value='" + esc(s.adminUser) + "'></p>" +
    "<p>Current password<br><input type='password' id='a_old'></p><p>New password (min 6 characters)<br><input type='password' id='a_new'></p>" +
    "<button onclick='saveAdmin()'>Update Account</button></div>";
  h += "<div class='box'><h3>Data</h3><p class='small'>All data is saved in this browser only.</p>" +
    "<button class='grey' onclick='loadSampleData()'>Load Sample Data</button> <button class='red' onclick='resetAll()'>Reset Everything</button></div>";
  $("content").innerHTML = h;
}
function saveScheme(){
  var a = parseFloat($("s_thmax").value), b = parseFloat($("s_thmin").value), c = parseFloat($("s_inmax").value), d = parseFloat($("s_inmin").value);
  if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d) || a < 1 || c < 1 || b < 0 || d < 0) { showMsg("Enter valid numbers."); return; }
  if (b > a || d > c) { showMsg("Minimum marks cannot be more than maximum marks."); return; }
  data.settings.thMax = a; data.settings.thMin = b; data.settings.intMax = c; data.settings.intMin = d;
  mk = null; saveData(); showMsg("Marking scheme saved."); showSettings();
}
function saveAdmin(){
  var u = $("a_user").value.trim(), o = $("a_old").value, n = $("a_new").value;
  if (u == "") { showMsg("Username cannot be empty."); return; }
  if (o != "" || n != "") {
    if (o != data.settings.adminPass) { showMsg("Current password is wrong."); return; }
    if (n.length < 6) { showMsg("New password must have at least 6 characters."); return; }
    data.settings.adminPass = n;
  } else if (u == data.settings.adminUser) { showMsg("Nothing to update."); return; }
  data.settings.adminUser = u; saveData(); showMsg("Account updated."); showSettings();
}
function resetAll(){
  askConfirm("Delete all students, marks, attendance, tests and settings? This cannot be undone.", "Reset", function(){
    try { localStorage.removeItem(KEY); } catch (e) {}
    data = null; loadData();
    selectedStudentId = null; mk = null; att = null; editTest = null;
    showMsg("All data cleared."); showSettings();
  });
}

var semSubjects = {
  1: ["Programming Principles", "Digital Electronics", "Discrete Mathematics", "Communication Skills", "Environmental Awareness", "Programming Lab", "Electronics Lab", "Mathematics Lab"],
  2: ["Object Oriented Programming", "Data Structures", "Linear Algebra", "Database Systems", "Web Programming", "OOP Lab", "Data Structures Lab", "DBMS Lab"],
  3: ["Operating Systems", "Computer Networks", "Python Programming", "Statistics", "Software Engineering", "Python Lab", "Networks Lab", "Statistics Lab", "Soft Skills"],
  4: ["Java Programming", "Theory of Computation", "Computer Graphics", "Core Java Lab", "Graphics Lab", "Applied Mathematics", "Research Methods"],
  5: ["Cyber and Information Security", "Ethical Hacking", "Android Development", "Data Mining", "Mini Project", "Security Lab", "Android Lab", "Ethical Hacking Lab", "Indian Knowledge Systems"],
  6: ["Cloud Computing", "Machine Learning", "Software Testing", "Information Retrieval", "Project Management", "Data Analytics", "Cyber Law", "Cloud Lab", "Machine Learning Lab", "Testing Lab", "Major Project"]
};
// adds 4 demo students with 6 semesters of marks, attendance and test attempts
function loadSampleData(){
  var s = data.settings;
  var people = [
    { roll: "151", name: "Sachin Maurya", base: [0.68, 0.70, 0.72, 0.75, 0.78, 0.82], att: 0.93, test: 0.8 },
    { roll: "101", name: "Priya Sharma", base: [0.86, 0.88, 0.87, 0.90, 0.89, 0.91], att: 0.97, test: 0.9 },
    { roll: "118", name: "Rohan Patil", base: [0.58, 0.50, 0.60, 0.55, 0.63, 0.66], att: 0.68, test: 0.55 },
    { roll: "134", name: "Aditi Singh", base: [0.70, 0.66, 0.72, 0.74, 0.71, 0.77], att: 0.84, test: 0.7 }
  ];
  var dates = [], d = new Date();
  while (dates.length < 12) {
    d.setDate(d.getDate() - 1);
    if (d.getDay() != 0 && d.getDay() != 6) dates.push(d.getFullYear() + "-" + two(d.getMonth() + 1) + "-" + two(d.getDate()));
  }
  var lectures = ["Cloud Computing", "Machine Learning", "Software Testing"];
  var test = data.tests[0], added = 0;
  people.forEach(function(p){
    var exists = false;
    data.students.forEach(function(x){ if (String(x.roll) == p.roll) exists = true; });
    if (exists) return;
    added++;
    var id = newId();
    data.students.push({ id: id, roll: p.roll, name: p.name, course: "B.Sc. Computer Science", sem: 6, email: p.name.split(" ")[0].toLowerCase() + "@example.com", phone: "", pass: p.roll });
    for (var sem = 1; sem <= 6; sem++) {
      var subs = semSubjects[sem].map(function(name){
        var ability = p.base[sem - 1] + (Math.random() - 0.5) * 0.16;
        var th = Math.round(Math.min(1, Math.max(0.3, ability + (Math.random() - 0.5) * 0.14)) * s.thMax);
        var it = Math.round(Math.min(1, Math.max(0.4, ability + 0.05 + (Math.random() - 0.5) * 0.12)) * s.intMax);
        return { name: name, th: th, int: it };
      });
      if (p.roll == "118" && sem == 2) subs[2].th = Math.max(0, s.thMin - 4);   // one failed subject for demo
      if (p.roll == "118" && sem == 4) subs[4].int = Math.max(0, s.intMin - 3);
      data.marks.push({ id: newId(), studentId: id, sem: sem, subjects: subs });
    }
    dates.forEach(function(dt, i){
      var session = findSession(6, dt, lectures[i % 3]);
      if (!session) { session = { id: newId(), sem: 6, date: dt, subject: lectures[i % 3], records: {} }; data.attendance.push(session); }
      session.records[id] = Math.random() < p.att ? "P" : "A";
    });
    if (test) [10, 3].forEach(function(daysAgo, k){
      var prob = Math.min(0.95, Math.max(0.2, p.test - 0.1 + k * 0.1));
      var snap = test.questions.map(function(q){
        var right = Math.random() < prob;
        var wrong = [0, 1, 2, 3].filter(function(x){ return x != q.answer; });
        return { q: q.q, options: q.options, answer: q.answer, pick: right ? q.answer : wrong[Math.floor(Math.random() * 3)] };
      });
      var when = new Date(); when.setDate(when.getDate() - daysAgo);
      data.attempts.push({ id: newId(), testId: test.id, title: test.title, studentId: id, score: snap.filter(function(x){ return x.pick == x.answer; }).length,
        total: snap.length, secs: Math.round(300 + Math.random() * 500), date: when.toISOString(), answers: snap });
    });
  });
  saveData();
  showMsg(added ? "Added " + added + " sample student(s)." : "Sample students are already added.");
  if (user) showPage(page);
}
