// calendar - wala pang click feature 'to
const monthYear = document.querySelector(".month-year");
const dates = document.querySelector(".dates");
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let currentDate = new Date();

const updateCalendar = () => {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDay.getDate();

    let firstDayIndex = firstDay.getDay() - 1; 
    if (firstDayIndex < 0) firstDayIndex = 6; 


    const monthYearString = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    monthYear.textContent = monthYearString;

    let dateHTML = '';
    
    
    for (let i = 0; i < firstDayIndex; i++) {
        dateHTML += `<div class="date inactive"></div>`;
    }

    for (let i = 1; i <= totalDays; i++) {
        const date = new Date(currentYear, currentMonth, i);
        const activeClass = date.toDateString() === new Date().toDateString() ? 'active' : '';
        dateHTML += `<div class="date ${activeClass}">${i}</div>`;
    }
    
    dates.innerHTML = dateHTML;
}

prevBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();
});

nextBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();
});

updateCalendar();

async function displayProfileGuest() {
    const res = await fetch('/api/guest/profile');
    const data = await res.json();
    const nameElement = document.getElementById("guest-name");
    nameElement.textContent = data.username;
}

displayProfileGuest();
