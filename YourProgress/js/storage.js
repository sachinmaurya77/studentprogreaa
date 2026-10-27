/* ---------------------------------------------------------------
   load and save data
   --------------------------------------------------------------- */
function loadData(){
  var s = null;
  try { s = localStorage.getItem(KEY); } catch (e) {}
  if (s) {
    try { data = JSON.parse(s); } catch (e) { data = null; }
  }
  if (!data || !data.settings) {
    data = {
      settings: { thMax: 30, intMax: 20, thMin: 12, intMin: 8, adminUser: "admin", adminPass: "admin123" },
      students: [], materials: [], tests: [sampleTest()], attempts: [], attendance: [], marks: []
    };
    saveData();
  }
}
function saveData(){
  try { localStorage.setItem(KEY, JSON.stringify(data)); }
  catch (e) { showMsg("Could not save data. Browser storage is full or blocked."); }
}

function sampleTest(){
  function q(text, opts, ans){ return { q: text, options: opts, answer: ans }; }
  return {
    id: newId(), title: "General Aptitude Test (Sample)", time: 20, materialId: null, published: true,
    questions: [
      q("A train travels 120 km in 2 hours. What is its speed in km/h?", ["40", "50", "60", "80"], 2),
      q("What is 15% of 240?", ["24", "30", "36", "40"], 2),
      q("Find the next number: 2, 6, 12, 20, 30, ?", ["36", "40", "42", "48"], 2),
      q("An item bought for Rs 400 is sold for Rs 500. What is the profit percentage?", ["20%", "25%", "30%", "15%"], 1),
      q("What is the average of 10, 20, 30, 40 and 50?", ["25", "30", "35", "40"], 1),
      q("Pointing to a photo, Ravi says, 'He is the son of my father's only son.' Who is in the photo?", ["Ravi's brother", "Ravi's son", "Ravi's father", "Ravi's nephew"], 1),
      q("Which one is the odd one out?", ["Apple", "Banana", "Carrot", "Mango"], 2),
      q("Choose the word closest in meaning to 'abundant'.", ["Scarce", "Plentiful", "Rare", "Limited"], 1),
      q("Choose the word opposite in meaning to 'expand'.", ["Contract", "Grow", "Extend", "Stretch"], 0),
      q("Which sentence is grammatically correct?", ["She don't like tea.", "She doesn't like tea.", "She not like tea.", "She didn't liking tea."], 1),
      q("8 men can finish a job in 12 days. How many days will 6 men need?", ["14", "16", "18", "20"], 1),
      q("Find the missing number: 3, 9, 27, 81, ?", ["162", "216", "243", "324"], 2),
      q("If CODE is written as DPEF, how is BAD written in the same code?", ["CBE", "CAE", "DBE", "BCE"], 0),
      q("What is the simple interest on Rs 1000 at 10% per year for 2 years?", ["Rs 100", "Rs 150", "Rs 200", "Rs 250"], 2),
      q("Which of these numbers is divisible by 9?", ["1234", "5238", "7312", "4561"], 1)
    ]
  };
}
