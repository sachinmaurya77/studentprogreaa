/* ---------------------------------------------------------------
   MODULE 2 - PDF AND MCQ MANAGEMENT
   --------------------------------------------------------------- */
// read all the text from a PDF file (pdf.js)
async function extractPdf(file, onPage){
  if (typeof pdfjsLib == "undefined") throw new Error("PDF reader could not load. Use 'Paste text instead'.");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  var buf = new Uint8Array(await file.arrayBuffer());
  var pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  var text = "";
  var n = Math.min(pdf.numPages, 300);
  for (var p = 1; p <= n; p++) {
    var pg = await pdf.getPage(p);
    var content = await pg.getTextContent();
    var line = "";
    content.items.forEach(function(it){ line += it.str + (it.hasEOL ? "\n" : " "); });
    text += line + "\n";
    onPage(p, n);
  }
  return { text: text, pages: pdf.numPages };
}
// clean the text: short lines (headings) get a full stop so they do not mix with the next sentence
function cleanText(text){
  text = text.replace(/\r/g, "").replace(/-\n(?=[a-z])/g, "").replace(/[•●▪◦■]/g, "\n");
  var out = [];
  text.split("\n").forEach(function(line){
    line = line.replace(/\s+/g, " ").trim();
    if (line == "") return;
    // a heading is short, starts with a capital letter and has no full stop at the end
    var w = line.split(" ");
    var lastWord = w[w.length - 1].toLowerCase();
    var joiners = ["and", "or", "of", "the", "a", "an", "to", "in", "on", "for", "with", "is", "are", "by"];
    if (w.length <= 6 && /^[A-Z0-9]/.test(line) && !/[.,;:!?)]$/.test(line) && joiners.indexOf(lastWord) < 0) line += ".";
    out.push(line);
  });
  return out.join(" ");
}

var stopWords = ("about above after again against because before being below between both could does doing down during each "+
  "from further have having here himself herself into itself more most once only other over same should some such than that their them "+
  "then there these they this those through under until very were what when where which while will with would your also called used using "+
  "known like many much must even just well first second three every whether allows keeps handles provides controls decide share uses track").split(" ");

// MAIN LOGIC: create fill-in-the-blank MCQs from the text
function makeMCQs(text, howMany){
  // 1. split text into sentences
  var t = text.replace(/\s+/g, " ").replace(/e\.g\./gi, "eg").replace(/i\.e\./gi, "ie");
  var parts = t.replace(/([.!?])\s+/g, "$1\n").split("\n");
  var sentences = [];
  parts.forEach(function(s){
    s = s.trim();
    var words = s.split(" ").length;
    if (words >= 8 && words <= 30 && s.length < 250 && /^[A-Z]/.test(s) && s.indexOf("http") < 0) sentences.push(s);
  });
  // 2. count how many times each word is used in the whole text
  var freq = {};
  (t.toLowerCase().match(/[a-z]{5,}/g) || []).forEach(function(w){
    if (stopWords.indexOf(w) < 0) freq[w] = (freq[w] || 0) + 1;
  });
  // 3. important words = words used again and again
  var allWords = Object.keys(freq).sort(function(a, b){ return freq[b] - freq[a]; });
  var topWords = allWords.filter(function(w){ return freq[w] >= 2; }).slice(0, 60);
  if (topWords.length < 6) topWords = allWords.slice(0, 60);
  if (topWords.length < 4) return [];
  // 4. for every sentence find its most important word
  var candidates = [];
  sentences.forEach(function(s){
    for (var i = 0; i < topWords.length; i++) {
      var re = new RegExp("\\b" + topWords[i] + "\\b", "i");
      var m = s.match(re);
      if (m && m.index > 0) { candidates.push({ s: s, re: re, answer: m[0], key: topWords[i] }); break; }
    }
  });
  // 5. pick sentences evenly from the whole text
  var chosen = [], usedIdx = {}, usedWord = {};
  function tryAdd(idx){
    var c = candidates[idx];
    if (!c || usedIdx[idx] || (usedWord[c.key] || 0) >= 2) return;
    usedIdx[idx] = true; usedWord[c.key] = (usedWord[c.key] || 0) + 1;
    chosen.push(c);
  }
  var i;
  for (i = 0; i < howMany && candidates.length > 0; i++) tryAdd(Math.floor(i * candidates.length / howMany));
  for (i = 0; i < candidates.length && chosen.length < howMany; i++) tryAdd(i);
  // 6. make question and options
  var result = [];
  chosen.forEach(function(c){
    var question = c.s.replace(c.re, "______");
    var ans = c.answer;
    var capital = /^[A-Z]/.test(ans);
    var pool = topWords.filter(function(w){ return w != c.key && Math.abs(w.length - c.key.length) <= 4; });
    if (pool.length < 3) pool = topWords.filter(function(w){ return w != c.key; });
    var wrong = shuffle(pool).slice(0, 3).map(function(w){ return capital ? w.charAt(0).toUpperCase() + w.slice(1) : w; });
    if (wrong.length < 3) return;
    var opts = shuffle([ans].concat(wrong));
    result.push({ q: "Fill in the blank: " + question, options: opts, answer: opts.indexOf(ans) });
  });
  return result;
}

function showAdminTests(){
  if (editTest) { showTestEditor(); return; }
  var h = "<div class='box'><h3>Upload Study Material (PDF)</h3><p class='small'>The text of the PDF is read in your browser and used to make MCQ questions.</p>" +
    "<p>Title (optional)<br><input id='pdfTitle'></p><p>Subject (optional)<br><input id='pdfSubject'></p>" +
    "<p>PDF file<br><input type='file' id='pdfFile' accept='application/pdf,.pdf'></p>" +
    "<button onclick='uploadPdf()'>Upload PDF</button> <button class='grey' onclick='pasteForm()'>Paste text instead</button>" +
    "<p id='pdfStatus'></p></div>";
  h += "<div class='box'><h3>Study Material</h3>";
  if (data.materials.length == 0) h += "<p>No study material yet.</p>";
  else {
    h += "<div class='tablebox'><table><tr><th>Title</th><th>Subject</th><th>Pages</th><th>Words</th><th>Action</th></tr>";
    data.materials.forEach(function(m){
      h += "<tr><td>" + esc(m.title) + "</td><td>" + esc(m.subject) + "</td><td>" + (m.pages || "-") + "</td><td>" + m.words + "</td>" +
        "<td><button onclick=\"generateForm('" + m.id + "')\">Generate MCQs</button><button class='grey' onclick=\"previewMaterial('" + m.id + "')\">Preview</button><button class='red' onclick=\"deleteMaterial('" + m.id + "')\">Delete</button></td></tr>";
    });
    h += "</table></div>";
  }
  h += "</div><div class='box'><h3>Aptitude Tests</h3><button onclick='newTest()'>+ New blank test</button>";
  if (data.tests.length == 0) h += "<p>No tests yet.</p>";
  else {
    h += "<div class='tablebox'><table><tr><th>Title</th><th>Questions</th><th>Time</th><th>Attempts</th><th>Status</th><th>Action</th></tr>";
    data.tests.forEach(function(t){
      var n = data.attempts.filter(function(a){ return a.testId == t.id; }).length;
      h += "<tr><td>" + esc(t.title) + "</td><td>" + t.questions.length + "</td><td>" + t.time + " min</td><td>" + n + "</td>" +
        "<td>" + (t.published ? "<span class='pass'>Published</span>" : "Draft") + "</td>" +
        "<td><button onclick=\"openEditTest('" + t.id + "')\">Edit</button><button class='grey' onclick=\"togglePublish('" + t.id + "')\">" + (t.published ? "Unpublish" : "Publish") +
        "</button><button class='grey' onclick=\"testResults('" + t.id + "')\">Results</button><button class='red' onclick=\"deleteTest('" + t.id + "')\">Delete</button></td></tr>";
    });
    h += "</table></div>";
  }
  $("content").innerHTML = h + "</div>";
}
function setPdfStatus(t){ var e = $("pdfStatus"); if (e) e.innerHTML = esc(t); }
function addMaterial(title, subject, text, pages){
  text = cleanText(text).slice(0, 150000);
  data.materials.push({ id: newId(), title: title, subject: subject, text: text, pages: pages || 0, words: (text.match(/\S+/g) || []).length });
  saveData();
}
async function uploadPdf(){
  var f = $("pdfFile").files[0];
  if (!f) { setPdfStatus("Please choose a PDF file first."); return; }
  if (!/\.pdf$/i.test(f.name)) { setPdfStatus("This file is not a PDF."); return; }
  setPdfStatus("Reading PDF...");
  try {
    var r = await extractPdf(f, function(p, n){ setPdfStatus("Reading page " + p + " of " + n + "..."); });
    if (cleanText(r.text).replace(/\s/g, "").length < 200) { setPdfStatus("This PDF has almost no text (it may be a scanned image). Try another PDF or paste the text."); return; }
    addMaterial($("pdfTitle").value.trim() || f.name.replace(/\.pdf$/i, ""), $("pdfSubject").value.trim(), r.text, r.pages);
    showMsg("Study material saved."); showAdminTests();
  } catch (e) {
    setPdfStatus("Could not read this PDF: " + (e && e.message ? e.message : e));
  }
}
function pasteForm(){
  openDialog("<h3>Paste study text</h3><p>Title *<br><input id='pt_title'></p><p>Subject<br><input id='pt_subject'></p>" +
    "<p>Text * (at least a few paragraphs)<br><textarea id='pt_text' rows='8'></textarea></p><p id='pt_err' class='fail'></p>" +
    "<button onclick='savePaste()'>Save</button> <button class='grey' onclick='closeDialog()'>Cancel</button>");
}
function savePaste(){
  var title = $("pt_title").value.trim(), text = $("pt_text").value;
  if (title == "" || text.replace(/\s/g, "").length < 200) { $("pt_err").innerHTML = "Enter a title and a few paragraphs of text."; return; }
  addMaterial(title, $("pt_subject").value.trim(), text, 0);
  closeDialog(); showMsg("Study material saved."); showAdminTests();
}
function previewMaterial(id){
  var m = findMaterial(id);
  openDialog("<h3>" + esc(m.title) + "</h3><p class='small'>First part of the text:</p><p>" + esc(m.text.slice(0, 2000)) + (m.text.length > 2000 ? "..." : "") + "</p><button onclick='closeDialog()'>Close</button>");
}
function deleteMaterial(id){
  askConfirm("Delete this study material? Tests already made from it will stay.", "Delete", function(){
    data.materials = data.materials.filter(function(m){ return m.id != id; });
    saveData(); showAdminTests();
  });
}
function generateForm(id){
  var m = findMaterial(id);
  openDialog("<h3>Generate MCQs</h3><p class='small'>" + esc(m.title) + "</p>" +
    "<p>Test title<br><input id='g_title' value='" + esc(m.title) + " - Aptitude Test'></p>" +
    "<p>Number of questions<br><input type='number' id='g_n' min='3' max='40' value='10'></p>" +
    "<p>Time limit (minutes)<br><input type='number' id='g_time' min='1' max='180' value='15'></p><p id='g_err' class='fail'></p>" +
    "<button onclick=\"doGenerate('" + id + "')\">Generate</button> <button class='grey' onclick='closeDialog()'>Cancel</button>");
}
function doGenerate(id){
  var m = findMaterial(id);
  var n = Math.min(40, Math.max(3, parseInt($("g_n").value) || 10));
  var time = Math.min(180, Math.max(1, parseInt($("g_time").value) || 15));
  var qs = makeMCQs(m.text, n);
  if (qs.length == 0) { $("g_err").innerHTML = "Not enough full sentences were found to make questions."; return; }
  editTest = { isNew: true, id: null, title: $("g_title").value.trim() || m.title, time: time, materialId: m.id, published: false, questions: qs,
    note: qs.length < n ? "Only " + qs.length + " of " + n + " questions could be made. You can add more by hand." : "" };
  closeDialog(); showAdminTests(); window.scrollTo(0, 0);
}
function newQuestion(){ return { q: "", options: ["", "", "", ""], answer: 0 }; }
function newTest(){
  editTest = { isNew: true, id: null, title: "", time: 15, materialId: null, published: false, questions: [newQuestion()], note: "" };
  showAdminTests(); window.scrollTo(0, 0);
}
function openEditTest(id){
  editTest = JSON.parse(JSON.stringify(findTest(id)));
  editTest.isNew = false; editTest.note = "";
  showAdminTests(); window.scrollTo(0, 0);
}
function togglePublish(id){
  var t = findTest(id);
  t.published = !t.published;
  saveData(); showMsg(t.published ? "Test published." : "Test unpublished."); showAdminTests();
}
function deleteTest(id){
  askConfirm("Delete this test and all its attempts?", "Delete", function(){
    data.tests = data.tests.filter(function(t){ return t.id != id; });
    data.attempts = data.attempts.filter(function(a){ return a.testId != id; });
    saveData(); showAdminTests();
  });
}
function testResults(id){
  var t = findTest(id);
  var list = data.attempts.filter(function(a){ return a.testId == id; });
  var h = "<h3>" + esc(t.title) + "</h3>";
  if (list.length == 0) h += "<p>Nobody has attempted this test yet.</p>";
  else {
    h += "<div class='tablebox'><table><tr><th>Student</th><th>Score</th><th>%</th><th>Date</th></tr>";
    list.forEach(function(a){
      var s = findStudent(a.studentId);
      h += "<tr><td>" + esc(s ? s.name : "Removed student") + "</td><td>" + a.score + "/" + a.total + "</td><td>" + r1(a.score / a.total * 100) + "%</td><td>" + fmtDateTime(a.date) + "</td></tr>";
    });
    h += "</table></div>";
  }
  openDialog(h + "<p><button onclick='closeDialog()'>Close</button></p>");
}
// screen where admin checks / edits the questions
function showTestEditor(){
  var e = editTest;
  var h = "<div class='box'><h3>" + (e.isNew ? "Review and Create Test" : "Edit Test") + "</h3>" +
    "<p class='small'>Check every question. Select the correct answer with the round button. Generated questions may need small corrections.</p>";
  if (e.note) h += "<p><b>" + esc(e.note) + "</b></p>";
  h += "<p>Test title<br><input value='" + esc(e.title) + "' oninput='editTest.title=this.value'></p>" +
    "<p>Time limit (minutes)<br><input type='number' min='1' style='max-width:120px' value='" + e.time + "' oninput='editTest.time=Number(this.value)'></p>" +
    "<p><label><input type='checkbox'" + (e.published ? " checked" : "") + " onchange='editTest.published=this.checked'> Publish (students can attempt this test)</label></p></div>";
  e.questions.forEach(function(q, i){
    h += "<div class='box'><b>Question " + (i + 1) + "</b> <button class='red' onclick='deleteQuestion(" + i + ")'>Delete</button><br>" +
      "<textarea rows='3' oninput='editTest.questions[" + i + "].q=this.value'>" + esc(q.q) + "</textarea>";
    for (var j = 0; j < 4; j++) {
      h += "<p><input type='radio' name='ans" + i + "'" + (q.answer == j ? " checked" : "") + " onchange='editTest.questions[" + i + "].answer=" + j + "'> " +
        "<input placeholder='Option " + "ABCD".charAt(j) + "' value='" + esc(q.options[j]) + "' oninput='editTest.questions[" + i + "].options[" + j + "]=this.value'></p>";
    }
    h += "</div>";
  });
  h += "<div class='box'><button onclick='addQuestion()'>+ Add Question</button> <button onclick='saveTest()'>Save Test</button> <button class='grey' onclick='cancelEdit()'>Cancel</button></div>";
  $("content").innerHTML = h;
}
function addQuestion(){ editTest.questions.push(newQuestion()); showAdminTests(); window.scrollTo(0, document.body.scrollHeight); }
function deleteQuestion(i){ editTest.questions.splice(i, 1); showAdminTests(); }
function cancelEdit(){ editTest = null; showAdminTests(); window.scrollTo(0, 0); }
function saveTest(){
  var e = editTest;
  if (e.title.trim() == "") { showMsg("Please enter the test title."); return; }
  if (e.questions.length == 0) { showMsg("Add at least one question."); return; }
  for (var i = 0; i < e.questions.length; i++) {
    var q = e.questions[i];
    if (q.q.trim() == "") { showMsg("Question " + (i + 1) + " has no text."); return; }
    var seen = {};
    for (var j = 0; j < 4; j++) {
      var o = q.options[j].trim().toLowerCase();
      if (o == "") { showMsg("Question " + (i + 1) + " needs all four options."); return; }
      if (seen[o]) { showMsg("Question " + (i + 1) + " has repeated options."); return; }
      seen[o] = true;
    }
  }
  var rec = { id: e.id || newId(), title: e.title.trim(), time: e.time || 15, materialId: e.materialId, published: !!e.published,
    questions: e.questions.map(function(q){ return { q: q.q.trim(), options: q.options.map(function(o){ return o.trim(); }), answer: q.answer }; }) };
  if (e.isNew) data.tests.push(rec);
  else data.tests = data.tests.map(function(t){ return t.id == rec.id ? rec : t; });
  saveData(); editTest = null; showMsg("Test saved."); showAdminTests(); window.scrollTo(0, 0);
}
