// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD06zkrG-9k-u-0HaxyAwM-5cIKq6t0zDg",
  authDomain: "salary-c8a11.firebaseapp.com",
  databaseURL: "https://salary-c8a11-default-rtdb.firebaseio.com",
  projectId: "salary-c8a11",
  storageBucket: "salary-c8a11.appspot.com",
  messagingSenderId: "859097557221",
  appId: "1:859097557221:web:3e20f2c317cff448e3cc0c",
  measurementId: "G-0F791FF30T"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM
const entryList = document.getElementById("entryList");
const totalSalaryDisplay = document.getElementById("totalSalary");
const dateInput = document.getElementById("date");
const headcountInput = document.getElementById("headcount");
const addBtn = document.getElementById("addBtn");
const clearBtn = document.getElementById("clearBtn");
const exportBtn = document.getElementById("exportBtn");
const summaryDiv = document.getElementById("monthlySummary");

let entries = {};
let editingDate = null;

function checkPassword() {
  const pwd = prompt("請輸入密碼");
  return pwd === "168";
}

function calculateAllSalaries(entriesByMonth) {
  const dailySalaries = {};
  let total = 0;
  let cumulative = 0;
  const sortedDates = Object.keys(entriesByMonth).sort();

  sortedDates.forEach(date => {
    const count = entriesByMonth[date].count;
    let salary = 0;
    if (cumulative + count <= 360) {
      salary = count * 45;
    } else if (cumulative >= 360) {
      salary = count * 50;
    } else {
      const within = 360 - cumulative;
      const beyond = count - within;
      salary = within * 45 + beyond * 50;
    }
    cumulative += count;
    dailySalaries[date] = salary;
    total += salary;
  });

  return { dailySalaries, total: total + 2000 };
}

function formatDateDisplay(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-Hant-TW", {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function updateDisplay() {  entryList.innerHTML = "";

  const monthly = {};
  for (const date in entries) {
    const [year, month] = date.split("-");
    const key = `${year}-${month}`;
    if (!monthly[key]) monthly[key] = {};
    monthly[key][date] = entries[date];
  }

  Object.keys(monthly).sort().reverse().forEach((monthKey) => {
    const { dailySalaries, total } = calculateAllSalaries(monthly[monthKey]);
    let monthHeadcount = 0;
    for (const date in monthly[monthKey]) {
      monthHeadcount += monthly[monthKey][date].count;
    }

    const monthGroup = document.createElement("div");
    monthGroup.className = "month-group";

    const [year, month] = monthKey.split("-");
    const monthHeader = document.createElement("div");
    monthHeader.className = "month-header";
monthHeader.innerHTML = `
  <div>
    <div class="month-title">${year}年${month}月</div>
    <div>${monthHeadcount} 人｜$${total.toLocaleString("zh-Hant-TW")}</div>
  </div>
  <button class="toggle-btn">展開</button>
`;

    const monthBody = document.createElement("div");
    monthBody.className = "month-body";
    monthBody.style.display = "none"; // 預設收合

    Object.keys(dailySalaries).sort().reverse().forEach(date => {
      const salary = dailySalaries[date];
      const count = entries[date].count;

      const item = document.createElement("div");
      item.className = "entry-item";
      item.innerHTML = `
        <span>${formatDateDisplay(date)}｜人頭數：${count} → 薪資：$${salary.toLocaleString("zh-Hant-TW")}</span>
        <span class="entry-actions">
          <button class="edit-btn" data-date="${date}">編輯</button>
          <button class="delete-btn" data-date="${date}">刪除</button>
        </span>
      `;
      monthBody.appendChild(item);
    });

    monthHeader.querySelector(".toggle-btn").addEventListener("click", () => {
      const isVisible = monthBody.style.display !== "none";
      monthBody.style.display = isVisible ? "none" : "block";
      monthHeader.querySelector(".toggle-btn").textContent = isVisible ? "展開" : "收合";
    });

    monthGroup.appendChild(monthHeader);
    monthGroup.appendChild(monthBody);
    entryList.appendChild(monthGroup);
  });
}


function loadEntriesFromFirebase() {
  const allEntriesRef = ref(db, 'entries');
  onValue(allEntriesRef, (snapshot) => {
    entries = snapshot.val() || {};
    updateDisplay();
  });
}

function saveEntryToFirebase(date, count) {
  const entryRef = ref(db, 'entries/' + date);
  set(entryRef, { count });
}

function deleteEntryFromFirebase(date) {
  const entryRef = ref(db, 'entries/' + date);
  set(entryRef, null);
}

function addOrUpdateEntry() {
  const date = dateInput.value;
  const count = parseInt(headcountInput.value);

  if (!date || isNaN(count)) {
    alert("請輸入正確的日期和人頭數");
    return;
  }

  if (!editingDate && entries[date]) {
    alert("此日期已有紀錄，請使用下方的「編輯」或「刪除」按鈕修改資料");
    return;
  }

  entries[date] = { count };
  saveEntryToFirebase(date, count);
  updateDisplay();
  headcountInput.value = '';
  editingDate = null;
}

function deleteEntry(date) {
  if (!checkPassword()) return;
  if (confirm(`確定要刪除 ${formatDateDisplay(date)} 的紀錄嗎？`)) {
    delete entries[date];
    deleteEntryFromFirebase(date);
    updateDisplay();
  }
}

function exportToCSV() {
  let csv = "日期,人頭數,薪資\n";
  const monthly = {};

  for (const date in entries) {
    const [year, month] = date.split("-");
    const key = `${year}-${month}`;
    if (!monthly[key]) monthly[key] = {};
    monthly[key][date] = entries[date];
  }

  Object.keys(monthly).sort().forEach(monthKey => {
    const { dailySalaries } = calculateAllSalaries(monthly[monthKey]);
    Object.keys(dailySalaries).sort().forEach(date => {
      const count = entries[date].count;
      const salary = dailySalaries[date];
      csv += `${formatDateDisplay(date)},${count},${salary}\n`;
    });
  });

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "薪資紀錄.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function clearAllEntries() {
  if (!checkPassword()) return;
  if (confirm("確定要清除全部紀錄？")) {
    entries = {};
    set(ref(db, 'entries'), null);
    updateDisplay();
  }
}

// Events
addBtn.addEventListener("click", addOrUpdateEntry);
clearBtn.addEventListener("click", clearAllEntries);
exportBtn.addEventListener("click", exportToCSV);

headcountInput.addEventListener("keydown", e => {
  if (e.key === "Enter") addOrUpdateEntry();
});

entryList.addEventListener("click", e => {
  const target = e.target;
  if (!target || !(target instanceof Element)) return;

  const editBtn = target.closest(".edit-btn");
  const deleteBtn = target.closest(".delete-btn");

  if (editBtn) {
    if (!checkPassword()) return;
    const date = editBtn.getAttribute("data-date");
    const entry = entries[date];
    dateInput.value = date;
    headcountInput.value = entry.count;
    editingDate = date;
  }

  if (deleteBtn) {
    const date = deleteBtn.getAttribute("data-date");
    deleteEntry(date);
  }
});

// Initialize
dateInput.value = new Date().toISOString().split("T")[0];
loadEntriesFromFirebase();
