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

// DISPLAY GUEST DEETS
async function displayProfileGuest() {
    const res = await fetch('/api/guest/profile');
    const data = await res.json();
    const nameElement = document.getElementById("guest-name");
    nameElement.textContent = data.username;
}

displayProfileGuest();

async function loadLoggedGuestBookings() {
    const userString = localStorage.getItem('user');
    if (!userString) return;

    const userData = JSON.parse(userString);
            // 4. Extract the '_id' field sent by your backend route!
    const guestId = userData._id; 

        if (!guestId) {
            console.error("No valid _id found inside the user storage profile.");
            return;
        }

    const res = await fetch(`/api/bookings/guest/${guestId}`);
    const bookingsArray = await res.json();
    const guestBookings = document.getElementById('guest-bookings');
    guestBookings.innerHTML = '';

    if (bookingsArray.length === 0) {
    guestBookings.innerHTML = `<p class="no-bookings">You have no active reservations.</p>`;
    return;
    }

    let bookingsHTML = '';

    bookingsArray.forEach(booking => {
    // Fallbacks in case listingId population failed or data is missing
    const title = booking.listingId ? booking.listingId.name : 'Accommodation';
    const price = booking.listingId ? booking.listingId.price : 'N/A';
    
    // Format dates nicely (e.g., "Jan 12, 2026")
    const checkInDate = new Date(booking.startDate).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
    const checkOutDate = new Date(booking.endDate).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    // Append a template card structure for this specific reservation item
    bookingsHTML += `
        <div class="booking-card">
            <div class="booking-details">
                <h3>${title}</h3>
                <p>🗓️ <strong>Duration:</strong> ${checkInDate} to ${checkOutDate}</p>
                <p>💵 <strong>Rate:</strong> ₱${price}/night</p>
                <p>📌 <strong>Status:</strong> <span class="status-badge ${booking.status}">${booking.status}</span></p>
            </div>
        </div>
    `;
    });

    guestBookings.innerHTML = bookingsHTML;
} 

loadLoggedGuestBookings();
