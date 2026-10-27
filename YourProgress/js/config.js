/* =====================================================================
   YourProgress - Online Aptitude Test & Student Performance Analysis
   All data is saved in the browser (localStorage).
   ===================================================================== */

var KEY = "yourprogress_simple_data";
var data;                    // all the data of the project
var user = null;             // logged in user: {role:"admin"} or {role:"student", id:"..."}
var page = "dashboard";      // current page
var charts = {};             // Chart.js objects
var selectedStudentId = null;
var editTest = null;         // test which admin is creating / editing
var exam = null;             // running exam
var examTimer = null;
var mk = null;               // marks entry
var att = null;              // attendance entry
var resTab = "student";
var classSem = 6;

var semLabels = ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6"];
