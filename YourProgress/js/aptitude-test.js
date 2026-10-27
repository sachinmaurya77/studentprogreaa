/* ---------------------------------------------------------------
   MODULE 3 - ONLINE APTITUDE TEST (student side)
   --------------------------------------------------------------- */
function showStudentTests(){
  if (exam) { showExam(); return; }
  var me = currentStudent();
  var avail = data.tests.filter(function(t){ return t.published; });
  var tries = getAttempts(me.id).reverse();
  var h = "<div class='box'><h3>Available Tests</h3>";
  if (avail.length == 0) h += "<p>No tests are published yet.</p>";
  else {
    h += "<div class='tablebox'><table><tr><th>Test</th><th>Questions</th><th>Time</th><th>Best score</th><th></th></tr>";
    avail.forEach(function(t){
      var mine = tries.filter(function(a){ return a.testId == t.id; });
      var best = mine.length ? Math.max.apply(null, mine.map(function(a){ return a.score; })) + "/" + t.questions.length : "-";
      h += "<tr><td>" + esc(t.title) + "</td><td>" + t.questions.length + "</td><td>" + t.time + " min</td><td>" + best + "</td><td><button onclick=\"startExam('" + t.id + "')\">" + (mine.length ? "Try again" : "Start") + "</button></td></tr>";
    });
    h += "</table></div>";
  }
  h += "</div><div class='box'><h3>My Attempts</h3>";
  if (tries.length == 0) h += "<p>You have not attempted any test yet.</p>";
  else {
    h += "<div class='tablebox'><table><tr><th>Test</th><th>Score</th><th>%</th><th>Date</th><th></th></tr>";
    tries.forEach(function(a){
      h += "<tr><td>" + esc(a.title) + "</td><td>" + a.score + "/" + a.total + "</td><td>" + r1(a.score / a.total * 100) + "%</td><td>" + fmtDateTime(a.date) + "</td><td><button class='grey' onclick=\"reviewAttempt('" + a.id + "')\">Review</button></td></tr>";
    });
    h += "</table></div>";
  }
  $("content").innerHTML = h + "</div>";
}
function startExam(id){
  var t = findTest(id);
  if (!t || !t.published || t.questions.length == 0) { showMsg("This test is not available."); return; }
  exam = { testId: id, answers: [], start: Date.now(), end: Date.now() + t.time * 60000 };
  for (var i = 0; i < t.questions.length; i++) exam.answers.push(-1);
  clearInterval(examTimer);
  examTimer = setInterval(tickExam, 1000);
  destroyCharts();
  page = "tests"; highlightMenu();
  showExam();
  window.scrollTo(0, 0);
}
function timeLeft(){ return Math.max(0, Math.round((exam.end - Date.now()) / 1000)); }
function tickExam(){
  if (!exam) { clearInterval(examTimer); return; }
  var left = timeLeft(), el = $("timer");
  if (el) el.innerHTML = two(Math.floor(left / 60)) + ":" + two(left % 60);
  if (left <= 0) submitExam(true);
}
function showExam(){
  var t = findTest(exam.testId), left = timeLeft();
  var h = "<div id='examBar'><div><b>" + esc(t.title) + "</b><br><span class='small'>" + t.questions.length + " questions</span></div><div id='timer'>" + two(Math.floor(left / 60)) + ":" + two(left % 60) + "</div></div>";
  t.questions.forEach(function(q, i){
    h += "<div class='box'><p><b>" + (i + 1) + ". " + esc(q.q) + "</b></p>";
    for (var j = 0; j < q.options.length; j++) {
      h += "<label class='opt'><input type='radio' name='q" + i + "'" + (exam.answers[i] == j ? " checked" : "") + " onchange='exam.answers[" + i + "]=" + j + "'> " + "ABCD".charAt(j) + ". " + esc(q.options[j]) + "</label>";
    }
    h += "</div>";
  });
  h += "<div class='box'><button onclick='submitExam(false)'>Submit Test</button></div>";
  $("content").innerHTML = h;
}
function submitExam(auto){
  if (!exam) return;
  var unanswered = exam.answers.filter(function(a){ return a < 0; }).length;
  if (!auto && unanswered > 0) {
    askConfirm("You have " + unanswered + " unanswered question(s). Submit anyway?", "Submit", function(){ submitExam(true); });
    return;
  }
  var t = findTest(exam.testId);
  var snap = t.questions.map(function(q, i){ return { q: q.q, options: q.options, answer: q.answer, pick: exam.answers[i] }; });
  var score = snap.filter(function(s){ return s.pick == s.answer; }).length;
  var att = { id: newId(), testId: t.id, title: t.title, studentId: user.id, score: score, total: snap.length,
    secs: Math.round((Math.min(Date.now(), exam.end) - exam.start) / 1000), date: new Date().toISOString(), answers: snap };
  data.attempts.push(att);
  saveData();
  var timeUp = Date.now() >= exam.end;
  stopExam();
  closeDialog();
  if (timeUp) showMsg("Time is up. Your test was submitted.");
  showResult(att);
}
function reviewAttempt(id){
  for (var i = 0; i < data.attempts.length; i++) if (data.attempts[i].id == id) showResult(data.attempts[i]);
}
function showResult(a){
  var p = a.score / a.total * 100;
  var skipped = a.answers.filter(function(s){ return s.pick < 0; }).length;
  var h = "<div class='box'><h3>Test Result</h3><p>" + esc(a.title) + " | " + fmtDateTime(a.date) + "</p>" +
    "<p style='font-size:28px'><b>" + a.score + " / " + a.total + "</b> (" + r1(p) + "%)</p>" +
    "<p>Correct: " + a.score + " | Wrong: " + (a.total - a.score - skipped) + " | Skipped: " + skipped + " | Time taken: " + two(Math.floor(a.secs / 60)) + ":" + two(a.secs % 60) + "</p>" +
    "<button onclick=\"showPage('tests')\">Back to tests</button></div>";
  a.answers.forEach(function(s, i){
    h += "<div class='box'><p><b>" + (i + 1) + ". " + esc(s.q) + "</b></p>";
    for (var j = 0; j < s.options.length; j++) {
      var cls = j == s.answer ? "good" : (j == s.pick ? "fail" : "");
      h += "<div class='opt " + cls + "'>" + "ABCD".charAt(j) + ". " + esc(s.options[j]) + (j == s.answer ? " (correct answer)" : "") + (j == s.pick && j != s.answer ? " (your answer)" : "") + "</div>";
    }
    if (s.pick < 0) h += "<p class='small'>You skipped this question.</p>";
    h += "</div>";
  });
  $("content").innerHTML = h;
  window.scrollTo(0, 0);
}
