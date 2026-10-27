/* ---------------------------------------------------------------
   small helper functions
   --------------------------------------------------------------- */
function $(id){ return document.getElementById(id); }
function esc(t){
  return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function r1(n){ return (Math.round(n * 10) / 10).toFixed(1); }
function r2(n){ return (Math.round(n * 100) / 100).toFixed(2); }
function two(n){ return n < 10 ? "0" + n : "" + n; }
function newId(){ return "id" + Date.now() + Math.floor(Math.random() * 100000); }
function today(){
  var d = new Date();
  return d.getFullYear() + "-" + two(d.getMonth() + 1) + "-" + two(d.getDate());
}
function fmtDate(d){
  var p = String(d).split("-");
  return p.length == 3 ? p[2] + "-" + p[1] + "-" + p[0] : d;
}
function fmtDateTime(iso){
  var d = new Date(iso);
  return fmtDate(iso.slice(0, 10)) + " " + two(d.getHours()) + ":" + two(d.getMinutes());
}
function average(arr){
  if (arr.length == 0) return null;
  var s = 0;
  for (var i = 0; i < arr.length; i++) s += arr[i];
  return s / arr.length;
}
function pct(v){ return v == null ? "-" : r1(v) + "%"; }
function shuffle(arr){
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

var msgTimer;
function showMsg(text){
  var m = $("msg");
  m.innerHTML = esc(text);
  m.style.display = "block";
  clearTimeout(msgTimer);
  msgTimer = setTimeout(function(){ m.style.display = "none"; }, 3500);
}
function openDialog(html){
  $("dialogBox").innerHTML = html;
  $("dialogWrap").style.display = "flex";
}
function closeDialog(){
  $("dialogWrap").style.display = "none";
  $("dialogBox").innerHTML = "";
}
var confirmAction = null;
function askConfirm(text, yesText, fn){
  confirmAction = fn;
  openDialog("<h3>Please confirm</h3><p>" + esc(text) + "</p>" +
    "<button class='red' onclick='confirmYes()'>" + esc(yesText) + "</button> <button class='grey' onclick='closeDialog()'>Cancel</button>");
}
function confirmYes(){
  var f = confirmAction;
  closeDialog();
  if (f) f();
}
