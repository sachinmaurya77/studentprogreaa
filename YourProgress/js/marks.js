/* ---------------------------------------------------------------
   MODULE 5 - SEMESTER MARKS ENTRY
   --------------------------------------------------------------- */
function findMarks(sid, sem){
  for (var i = 0; i < data.marks.length; i++) if (data.marks[i].studentId == sid && data.marks[i].sem == sem) return data.marks[i];
  return null;
}
function loadMarksRows(){
  var rec = findMarks(mk.sid, mk.sem);
  mk.rows = [];
  if (rec) rec.subjects.forEach(function(s){ mk.rows.push({ name: s.name, th: String(s.th), int: String(s.int) }); });
  else for (var i = 0; i < 6; i++) mk.rows.push({ name: "", th: "", int: "" });
}
function showMarks(){
  var st = currentStudent();
  if (!st) { $("content").innerHTML = noStudentsBox(); return; }
  if (!mk || mk.sid != st.id) { mk = { sid: st.id, sem: st.sem || 1, rows: [] }; loadMarksRows(); }
  var s = data.settings;
  var h = studentSelectHtml();
  h += "<div class='box'><h3>" + esc(st.name) + " - Semester Marks</h3>" +
    "<p class='small'>Each subject has TH marks out of " + s.thMax + " (minimum " + s.thMin + ") and INT marks out of " + s.intMax + " (minimum " + s.intMin + "). Maximum per subject: " + (s.thMax + s.intMax) + ".</p><p>Select semester:<br>";
  for (var n = 1; n <= 6; n++) {
    var saved = findMarks(st.id, n) ? " &#10003;" : "";
    h += "<button class='" + (mk.sem == n ? "" : "grey") + "' onclick='mkSem(" + n + ")'>Sem " + n + saved + "</button>";
  }
  h += "</p><div class='tablebox'><table><tr><th>No.</th><th>Subject name</th><th>TH /" + s.thMax + "</th><th>INT /" + s.intMax + "</th><th>Total</th><th>Status</th><th></th></tr>";
  mk.rows.forEach(function(r, i){
    h += "<tr><td>" + (i + 1) + "</td><td><input style='width:190px' value='" + esc(r.name) + "' oninput=\"mkEdit(" + i + ",'name',this.value)\"></td>" +
      "<td><input type='number' step='0.5' min='0' max='" + s.thMax + "' style='width:75px' value='" + esc(r.th) + "' oninput=\"mkEdit(" + i + ",'th',this.value)\"></td>" +
      "<td><input type='number' step='0.5' min='0' max='" + s.intMax + "' style='width:75px' value='" + esc(r.int) + "' oninput=\"mkEdit(" + i + ",'int',this.value)\"></td>" +
      "<td id='mkT" + i + "'>-</td><td id='mkS" + i + "'>-</td><td><button class='red' onclick='mkDelete(" + i + ")'>X</button></td></tr>";
  });
  h += "</table></div><p><button class='grey' onclick='mkAdd()'>+ Add Subject</button> Number of subjects: <input id='mkCount' type='number' min='1' max='30' value='" + mk.rows.length + "' style='width:70px'> <button class='grey' onclick='mkSetCount()'>Set</button></p>" +
    "<div id='mkSummary'></div><p><button onclick='mkSave()'>Save Semester " + mk.sem + " Marks</button>" +
    (findMarks(st.id, mk.sem) ? " <button class='red' onclick='mkClear()'>Delete this semester</button>" : "") + "</p></div>";
  $("content").innerHTML = h;
  mkCalc();
}
function mkSem(n){ mk.sem = n; loadMarksRows(); showMarks(); }
function mkAdd(){ mk.rows.push({ name: "", th: "", int: "" }); showMarks(); }
function mkDelete(i){ mk.rows.splice(i, 1); showMarks(); }
function mkSetCount(){
  var n = Math.min(30, Math.max(1, parseInt($("mkCount").value) || 1));
  while (mk.rows.length < n) mk.rows.push({ name: "", th: "", int: "" });
  mk.rows.length = n;
  showMarks();
}
function mkEdit(i, field, value){ mk.rows[i][field] = value; mkCalc(); }
// live calculation while typing
function mkCalc(){
  var s = data.settings, subs = [];
  mk.rows.forEach(function(r, i){
    var t = $("mkT" + i), st = $("mkS" + i);
    if (!t) return;
    var bad = (r.th !== "" && (Number(r.th) < 0 || Number(r.th) > s.thMax)) || (r.int !== "" && (Number(r.int) < 0 || Number(r.int) > s.intMax));
    if (r.th === "" || r.int === "" || bad) {
      t.innerHTML = "-"; st.innerHTML = bad ? "<span class='fail'>Invalid</span>" : "-";
      return;
    }
    var c = calcSubject(r);
    subs.push(c);
    t.innerHTML = c.total + "/" + c.max;
    st.innerHTML = c.pass ? "<span class='pass'>Pass</span>" : "<span class='fail'>Fail</span>";
  });
  var total = 0, max = 0, gp = 0, failed = [];
  subs.forEach(function(x){ total += x.total; max += x.max; gp += x.gp; if (!x.pass) failed.push(x); });
  var h = "<div class='tablebox'><table><tr><th>Total marks</th><th>Percentage</th><th>SGPA</th><th>Result</th></tr><tr><td>" + total + " / " + max + "</td><td>" +
    (max ? r1(total / max * 100) + "%" : "-") + "</td><td>" + (subs.length ? r2(gp / subs.length) : "-") + "</td><td>" +
    (subs.length ? (failed.length ? "<span class='fail'>FAIL</span>" : "<span class='pass'>PASS</span>") : "-") + "</td></tr></table></div>";
  if (subs.length) {
    if (failed.length) {
      h += "<div class='failbox'><b>Failed subjects (" + failed.length + "):</b><ul>";
      failed.forEach(function(f){ h += "<li>" + esc(f.name || "Unnamed subject") + " - " + failReason(f) + "</li>"; });
      h += "</ul></div>";
    } else h += "<div class='okbox'>All subjects are passed.</div>";
  }
  $("mkSummary").innerHTML = h;
}
function mkSave(){
  var s = data.settings, subjects = [];
  for (var i = 0; i < mk.rows.length; i++) {
    var r = mk.rows[i];
    if (r.name.trim() == "" && r.th === "" && r.int === "") continue;
    if (r.name.trim() == "") { showMsg("Row " + (i + 1) + ": enter the subject name."); return; }
    if (r.th === "" || r.int === "") { showMsg(r.name + ": enter both TH and INT marks."); return; }
    if (Number(r.th) < 0 || Number(r.th) > s.thMax || Number(r.int) < 0 || Number(r.int) > s.intMax) { showMsg(r.name + ": marks are outside the allowed range."); return; }
    subjects.push({ name: r.name.trim(), th: Number(r.th), int: Number(r.int) });
  }
  if (subjects.length == 0) { showMsg("Enter marks for at least one subject."); return; }
  data.marks = data.marks.filter(function(m){ return !(m.studentId == mk.sid && m.sem == mk.sem); });
  data.marks.push({ id: newId(), studentId: mk.sid, sem: mk.sem, subjects: subjects });
  saveData(); loadMarksRows(); showMsg("Semester " + mk.sem + " marks saved."); showMarks();
}
function mkClear(){
  askConfirm("Delete all Semester " + mk.sem + " marks of this student?", "Delete", function(){
    data.marks = data.marks.filter(function(m){ return !(m.studentId == mk.sid && m.sem == mk.sem); });
    saveData(); loadMarksRows(); showMarks();
  });
}
