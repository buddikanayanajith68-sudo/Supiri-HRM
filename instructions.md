# Employee Management & Attendance System

මෙය IT hardware අලෙවි කරන ආයතනයක් සඳහා විශේෂයෙන් නිර්මාණය කරන ලද සරල සහ කාර්යක්ෂම සේවක කළමනාකරණ පද්ධතියකි. දැනට පවතින අත්පොත (Manual Log) වෙනුවට ඩිජිටල් ක්‍රමයකට පැමිණීම මෙහි ප්‍රධාන අරමුණයි.

## 📌 පද්ධතියේ ප්‍රධාන අරමුණු (Project Goals)
* සේවකයින්ගේ පැමිණීම (Attendance) ලකුණු කිරීමේ ක්‍රියාවලිය සරල කිරීම.
* සේවක විස්තර (Employee Profiles) ක්‍රමවත්ව ගබඩා කිරීම.
* මාසිකව හෝ දිනපතා වාර්තා (Reports) පහසුවෙන් ලබා ගැනීම.
* කිසිදු අමතර වියදමකින් තොරව (Serverless) Browser එක තුළම දත්ත පවත්වාගෙන යාම.

## 🛠 භාවිතා කරන තාක්ෂණයන් (Tech Stack)
මෙම පද්ධතිය ගොඩනැගීම සඳහා පහත සඳහන් මෘදුකාංග මෙවලම් භාවිතා කර ඇත:

* **HTML5:** වෙබ් අඩවියේ මූලික සැකැස්ම සඳහා.
* **Tailwind CSS:** අලංකාර සහ Responsive නිමාවක් ලබා ගැනීමට (Modern UI).
* **Vanilla JavaScript:** පද්ධතියේ logic සහ ක්‍රියාකාරීත්වය පවත්වා ගැනීමට.
* **Dexie.js:** Browser එකේ IndexedDB භාවිතා කරමින් ආරක්ෂිතව දත්ත ගබඩා කිරීමට (Offline-first database storage).

## 🚀 ප්‍රධාන විශේෂාංග (Key Features)
1.  **Dashboard:** වර්තමාන දිනයේ පැමිණ සිටින සේවකයින් සංඛ්‍යාව සහ සාරාංශය.
2.  **Attendance Tracker:** සේවකයින්ට ඇතුළුවීමේ වේලාව (Clock-in) සහ පිටවීමේ වේලාව (Clock-out) සටහන් කිරීමේ හැකියාව.
3.  **Employee Directory:** සේවකයින් 20 දෙනාගේම පෞද්ගලික විස්තර, දුරකථන අංක සහ ඡායාරූප ඇතුළත් කිරීමේ පහසුකම.
4.  **History & Reports:** පසුගිය දිනවල පැමිණීම් වාර්තා බැලීමේ සහ සොයා බැලීමේ (Filter) හැකියාව.

## 📂 ව්‍යාපෘතියේ ව්‍යුහය (Project Structure)
```text
/ems-project
│
├── index.html          # Main Dashboard & Attendance UI
├── employees.html      # Employee Management Page
├── /css
│   └── style.css       # Custom styles (if any)
├── /js
│   ├── app.js          # Core logic & Dexie setup
│   └── database.js     # DB Schema and CRUD operations
└── README.md           # Project documentation