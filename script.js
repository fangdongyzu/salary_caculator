(function () {
    let entries = JSON.parse(localStorage.getItem("salaryEntries")) || {};

    for (let date in entries) {
        if (!entries[date] || typeof entries[date].salary !== 'number') {
            delete entries[date];
        }
    }
    localStorage.setItem("salaryEntries", JSON.stringify(entries));

    const entryList = document.getElementById("entryList");
    const totalSalaryDisplay = document.getElementById("totalSalary");
    const dateInput = document.getElementById("date");
    const headcountInput = document.getElementById("headcount");

    window.onload = () => {
        const today = new Date().toISOString().split("T")[0];
        dateInput.value = today;
        updateDisplay();
    };

    function calculateDailySalary(x) {
        return (x <= 360 ? x * 45 : 360 * 45 + (x - 360) * 50) + 2000;
    }

    function formatDateDisplay(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString("zh-Hant-TW", {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    function updateDisplay() {
        entryList.innerHTML = "";
        let total = 0;
        const sortedDates = Object.keys(entries).sort();

        sortedDates.forEach(date => {
            const data = entries[date];
            if (!data || typeof data.salary !== 'number') return;

            const salary = data.salary;
            total += salary;

            const li = document.createElement("li");
            li.innerHTML = `
                <span class="entry-text">
                    ${formatDateDisplay(date)}｜人頭數：${data.count} → 薪資：$${salary.toLocaleString("zh-Hant-TW")}
                </span>
                <span class="entry-actions">
                    <button onclick="editEntry('${date}')" class="edit-btn">編輯</button>
                    <button onclick="deleteEntry('${date}')" class="delete-btn">刪除</button>
                </span>`;
            entryList.appendChild(li);
        });

        totalSalaryDisplay.textContent = "總薪資: $" + total.toLocaleString("zh-Hant-TW");
    }

    window.addOrUpdateEntry = function () {
        const date = dateInput.value;
        const count = parseInt(headcountInput.value);

        if (!date || isNaN(count)) {
            alert("請輸入正確的日期和人頭數");
            return;
        }

        const salary = calculateDailySalary(count);
        entries[date] = { count, salary };
        localStorage.setItem("salaryEntries", JSON.stringify(entries));
        updateDisplay();
        headcountInput.value = '';
    };

    window.editEntry = function (date) {
        const entry = entries[date];
        dateInput.value = date;
        headcountInput.value = entry.count;
    };

    window.deleteEntry = function (date) {
        if (confirm(`確定要刪除 ${formatDateDisplay(date)} 的紀錄嗎？`)) {
            delete entries[date];
            localStorage.setItem("salaryEntries", JSON.stringify(entries));
            updateDisplay();
        }
    };

    window.clearAllEntries = function () {
        if (confirm("確定要清除全部紀錄？")) {
            entries = {};
            localStorage.removeItem("salaryEntries");
            updateDisplay();
        }
    };

    window.exportToCSV = function () {
        let csv = "日期,人頭數,薪資\n";
        const sortedDates = Object.keys(entries).sort();
        sortedDates.forEach(date => {
            const { count, salary } = entries[date];
            csv += `${formatDateDisplay(date)},${count},${salary}\n`;
        });
    
        // 👉 加上 BOM（Byte Order Mark）
        const BOM = "\uFEFF";
        const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "薪資紀錄.csv";
        a.click();
        URL.revokeObjectURL(url);
    };
    

    headcountInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            window.addOrUpdateEntry();
        }
    });
})();
