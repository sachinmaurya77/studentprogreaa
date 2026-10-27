/* ---------------------------------------------------------------
   MARKS, CGPA AND ATTENDANCE CALCULATIONS
   --------------------------------------------------------------- */
// grade point from percentage (10 point scale)
function gradePoint(p){
  if (p >= 80) return 10;
  if (p >= 70) return 9;
  if (p >= 60) return 8;
  if (p >= 55) return 7;
  if (p >= 50) return 6;
  if (p >= 45) return 5;
  if (p >= 40) return 4;
  return 0;
}
function gradeLetter(gp){
  var letters = ["F", "", "", "", "P", "E", "D", "C", "B", "A", "O"];
  return letters[gp];
}
// one subject: TH + INT, pass only if both are above the minimum
function calcSubject(sub){
  var s = data.settings;
  var th = Number(sub.th) || 0;
  var it = Number(sub.int) || 0;
  var total = th + it;
  var max = s.thMax + s.intMax;
  var thOk = th >= s.thMin;
  var intOk = it >= s.intMin;
  var pass = thOk && intOk;
  var percent = max > 0 ? total / max * 100 : 0;
  var gp = pass ? gradePoint(percent) : 0;
  return { name: sub.name, th: th, int: it, total: total, max: max, percent: percent, thOk: thOk, intOk: intOk, pass: pass, gp: gp, grade: gradeLetter(gp) };
}
// one semester
function calcSemester(rec){
  var subs = rec.subjects.map(calcSubject);
  var total = 0, max = 0, gp = 0, failed = [];
  subs.forEach(function(x){
    total += x.total; max += x.max; gp += x.gp;
    if (!x.pass) failed.push(x);
  });
  return {
    sem: rec.sem, subs: subs, total: total, max: max,
    percent: max > 0 ? total / max * 100 : 0,
    sgpa: subs.length ? gp / subs.length : 0,
    gpSum: gp, count: subs.length, failed: failed, pass: failed.length == 0
  };
}
function getStudentSems(sid){
  return data.marks.filter(function(m){ return m.studentId == sid && m.subjects.length > 0; })
    .sort(function(a, b){ return a.sem - b.sem; }).map(calcSemester);
}
function getCgpa(sems){
  var gp = 0, n = 0;
  sems.forEach(function(s){ gp += s.gpSum; n += s.count; });
  return n > 0 ? gp / n : null;
}
function getOverallPercent(sems){
  var t = 0, m = 0;
  sems.forEach(function(s){ t += s.total; m += s.max; });
  return m > 0 ? t / m * 100 : 0;
}
function findSemResult(sems, n){
  for (var i = 0; i < sems.length; i++) if (sems[i].sem == n) return sems[i];
  return null;
}
function failReason(f){
  var s = data.settings, r = [];
  if (!f.thOk) r.push("TH " + f.th + "/" + s.thMax + " (minimum " + s.thMin + ")");
  if (!f.intOk) r.push("INT " + f.int + "/" + s.intMax + " (minimum " + s.intMin + ")");
  return r.join(", ");
}
// attendance of a student (all semesters, or one semester)
function getAttendance(sid, sem){
  var total = 0, present = 0;
  data.attendance.forEach(function(a){
    if (sem && a.sem != sem) return;
    var r = a.records[sid];
    if (r) { total++; if (r == "P") present++; }
  });
  return { total: total, present: present, pct: total > 0 ? present / total * 100 : null };
}
function getAttempts(sid){
  return data.attempts.filter(function(a){ return a.studentId == sid; })
    .sort(function(a, b){ return a.date < b.date ? -1 : 1; });
}
