/* ---------------------------------------------------------------
   LOGIN, MENU, PAGE SWITCHING
   --------------------------------------------------------------- */
var adminMenu = [["dashboard", "Dashboard"], ["students", "Students"], ["tests", "PDF & Tests"], ["attendance", "Attendance"],
  ["marks", "Semester Marks"], ["results", "Results & CGPA"], ["graphs", "Graphs"], ["settings", "Settings"], ["logout", "Logout"]];
var studentMenu = [["dashboard", "Home"], ["tests", "Aptitude Tests"], ["attendance", "My Attendance"],
  ["results", "My Results"], ["graphs", "My Graphs"], ["logout", "Logout"]];

function showLogin(){
  user = null;
  destroyCharts();
  $("menu").style.display = "none";
  $("userinfo").innerHTML = "";
  $("content").innerHTML =
    "<div class='box' style='max-width:380px;margin:25px auto'>" +
    "<h3>Login</h3>" +
    "<p>Login as:<br><select id='role'><option value='admin'>Admin / Teacher</option><option value='student'>Student</option></select></p>" +
    "<p>Username / Roll No:<br><input id='uname'></p>" +
    "<p>Password:<br><input type='password' id='pwd' onkeydown=\"if(event.key=='Enter')doLogin()\"></p>" +
    "<button onclick='doLogin()'>Login</button>" +
    "<p class='small'>Admin: username <b>admin</b>, password <b>admin123</b><br>Student: roll number and password (first password is the roll number)</p></div>";
}
function doLogin(){
  var role = $("role").value, u = $("uname").value.trim(), p = $("pwd").value;
  if (u == "" || p == "") { showMsg("Please enter username and password."); return; }
  if (role == "admin") {
    if (u.toLowerCase() == data.settings.adminUser.toLowerCase() && p == data.settings.adminPass) user = { role: "admin" };
    else { showMsg("Wrong username or password."); return; }
  } else {
    var found = null;
    data.students.forEach(function(s){ if (String(s.roll).toLowerCase() == u.toLowerCase() && s.pass == p) found = s; });
    if (!found) { showMsg("Wrong roll number or password."); return; }
    user = { role: "student", id: found.id };
  }
  selectedStudentId = null; mk = null; att = null; editTest = null;
  buildMenu();
  showPage("dashboard");
}
function buildMenu(){
  var items = user.role == "admin" ? adminMenu : studentMenu;
  var h = "";
  items.forEach(function(m){ h += "<button id='m_" + m[0] + "' onclick=\"showPage('" + m[0] + "')\">" + m[1] + "</button>"; });
  $("menu").innerHTML = h;
  $("menu").style.display = "block";
  var who = user.role == "admin" ? "Admin" : (findStudent(user.id) ? findStudent(user.id).name : "Student");
  $("userinfo").innerHTML = esc(who);
}
function highlightMenu(){
  var buttons = $("menu").getElementsByTagName("button");
  for (var i = 0; i < buttons.length; i++) buttons[i].className = (buttons[i].id == "m_" + page) ? "active" : "";
}
function stopExam(){
  clearInterval(examTimer);
  exam = null;
}
function showPage(name){
  if (name == "logout") {
    if (exam) { askConfirm("Leave this test? Your answers will be lost.", "Leave test", function(){ stopExam(); showLogin(); }); return; }
    showLogin();
    return;
  }
  if (exam && name != "tests") {
    askConfirm("Leave this test? Your answers will be lost.", "Leave test", function(){ stopExam(); showPage(name); });
    return;
  }
  if (name != "tests") editTest = null;
  destroyCharts();
  page = name;
  highlightMenu();
  var admin = user.role == "admin";
  if (name == "dashboard") { admin ? showAdminDashboard() : showStudentHome(); }
  else if (name == "students") showStudents();
  else if (name == "tests") { admin ? showAdminTests() : showStudentTests(); }
  else if (name == "attendance") { admin ? showAdminAttendance() : showMyAttendance(); }
  else if (name == "marks") showMarks();
  else if (name == "results") showResults();
  else if (name == "graphs") showGraphs();
  else if (name == "settings") showSettings();
  window.scrollTo(0, 0);
}
