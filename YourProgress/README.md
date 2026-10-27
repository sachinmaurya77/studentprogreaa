# YourProgress - Student Performance Analysis System

Online Aptitude Test & Student Performance Analysis (HTML + CSS + JavaScript).
Data is saved in the browser (localStorage), so no server or database setup is needed.

## How to run (VS Code)
1. Unzip, then File > Open Folder and choose the `YourProgress` folder.
2. Install the **Live Server** extension (Ritwick Dey).
3. Right-click `index.html` > **Open with Live Server**.
   (Double-clicking `index.html` also works.)
4. Internet is needed once for Chart.js and pdf.js (loaded from cdnjs).

Default admin login: **admin / admin123** (change it in Settings).

## Folder structure
```
YourProgress/
|-- index.html            page layout + links to every file below
|-- css/
|   `-- style.css         all styles (light and dark mode)
`-- js/                   load order matters - same order as in index.html
    |-- config.js         storage key, global variables
    |-- helpers.js        small helper functions, message and dialog boxes
    |-- storage.js        loadData / saveData (localStorage), sample test
    |-- records.js        find student / test / material
    |-- calculations.js   grade points, SGPI, CGPA, attendance %
    |-- charts.js         Chart.js helpers
    |-- auth.js           login, menu, page switching (showPage)
    |-- dashboard.js      admin and student home pages
    |-- students.js       MODULE 1 - student management
    |-- pdf-mcq.js        MODULE 2 - PDF upload, MCQ generation, test editor
    |-- aptitude-test.js  MODULE 3 - student aptitude test and result
    |-- attendance.js     MODULE 4 - attendance
    |-- marks.js          MODULE 5 - semester marks entry
    |-- results.js        MODULE 6 - result and CGPA analysis
    |-- graphs.js         MODULE 7 - performance graphs (Sem 1 to 6)
    |-- settings.js       settings, reset, sample data
    `-- main.js           START - loadData() and showLogin()
```

## How the files are connected
`index.html` loads the CSS, then the two libraries, then each JS file in the order
above. Every file shares the same global scope, so a function written in one
file (for example `showPage()` in `auth.js`) can be called from any other file.
`main.js` is loaded last because it starts the app.
