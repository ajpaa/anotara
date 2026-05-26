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

// --- UPDATE TAILORED FOR YOUR MONGOOSE SCHEMA ---

// DISPLAY HOST DEETS
async function displayProfileHost() {
    const userString = localStorage.getItem('user');
    if (!userString) return;
    
    const userData = JSON.parse(userString);

    // Pass the user role in headers so the backend allows exclusive access
    const res = await fetch('/api/host/profile', {
        headers: {
            'X-User-Role': userData.role
        }
    }); 
    
    if (!res.ok) {
        console.error("Access Denied or Server Error");
        return;
    }

    const data = await res.json();
    const nameElement = document.getElementById("host-name"); 
    if (nameElement) {
        // Fallback to username if hostName isn't filled out directly in the collection
        nameElement.textContent = data.hostName || data.username;
    }
}

displayProfileHost();

// LOAD BOOKINGS MANAGED BY THIS HOST
async function loadLoggedHostBookings() {
    const userString = localStorage.getItem('user');
    if (!userString) return;

    const userData = JSON.parse(userString);
    const hostId = userData._id; 

    if (!hostId) {
        console.error("No valid _id found inside the user storage profile.");
        return;
    }

    const res = await fetch(`/api/bookings/host/${hostId}`, {
        headers: {
            'X-User-Role': userData.role // Passing role to secure endpoint
        }
    }); 
    
    if (!res.ok) return;

    const bookingsArray = await res.json();
    const hostBookings = document.getElementById('host-bookings');
    if (!hostBookings) return;
    
    hostBookings.innerHTML = '';

    if (bookingsArray.length === 0) {
        hostBookings.innerHTML = `<p class="no-bookings">No reservations booked for your properties yet.</p>`;
        return;
    }

    let bookingsHTML = '';

    bookingsArray.forEach(booking => {
        const title = booking.listingId ? booking.listingId.name : 'Accommodation';
        const price = booking.listingId ? booking.listingId.price : 'N/A';
        
        // Safe check if your backend populated the User collection inside guestId
        const guestName = booking.guestId && booking.guestId.username ? booking.guestId.username : 'Guest User';
        
        const checkInDate = new Date(booking.startDate).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
        const checkOutDate = new Date(booking.endDate).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });

        bookingsHTML += `
            <div class="booking-card">
                <div class="booking-details">
                    <h3>${title}</h3>
                    <p>👤 <strong>Guest:</strong> ${guestName}</p>
                    <p>🗓️ <strong>Duration:</strong> ${checkInDate} to ${checkOutDate}</p>
                    <p>💵 <strong>Earnings:</strong> ₱${price}/night</p>
                    <p>📌 <strong>Status:</strong> <span class="status-badge ${booking.status}">${booking.status}</span></p>
                </div>
            </div>
        `;
    });

    hostBookings.innerHTML = bookingsHTML;
} 

loadLoggedHostBookings();