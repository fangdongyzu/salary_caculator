function calculateSalary() {
    const x = parseInt(document.getElementById("headcount").value);
    let salary = 0;
    if (x <= 360) {
        salary = x * 45;
    } else {
        salary = 360 * 45 + (x - 360) * 50;
    }
    salary += 2000;
    const formattedSalary = salary.toLocaleString("zh-Hant-TW");
    document.getElementById("result").textContent = "薪資: $" + formattedSalary;
}

// Trigger calculation when Enter is pressed
document.getElementById("headcount").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        calculateSalary();
    }
});

// Clear input and result when input box is re-selected 
document.getElementById("headcount").addEventListener("focus", function() {
    this.value = '';
    document.getElementById("result").textContent = '';
});
