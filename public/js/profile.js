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
    const guestId = userData._id; 

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
    
        console.log("Checking Booking Status:", booking.status, "Host Data:", booking.listingId?.hostId);

    const title = booking.listingId ? booking.listingId.name : 'Accommodation';
    const price = booking.listingId ? booking.listingId.price : 'N/A';
    const image = booking.listingId ? booking.listingId.image : 'https://placehold.co/600x400?text=Listing+Preview';
    const hostContact = booking.listingId?.contact || "No contact provided";
    
    const checkInDate = new Date(booking.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const checkOutDate = new Date(booking.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
 // 2. Bold/Caps/Color Status Logic
    const status = booking.status ? booking.status.toLowerCase() : 'pending';
    const statusColor = status === 'approved' ? '#35a373' : status === 'rejected' ? '#e66e72' : '#d48d3b';

    bookingsHTML += `
    <div class="booking-card">
        <img src="${image}" alt="${title}" style="width: 100%; height: 200px; object-fit: cover;">
        
        <div class="booking-details" style="padding: 20px;">
            <h3 style="margin-bottom: 10px;">${title}</h3>
            
            <p><i class="fa-solid fa-calendar-days"></i> <strong>Duration:</strong> ${checkInDate} to ${checkOutDate}</p>
            <p><i class="fa-solid fa-money-bill"></i> <strong>Rate:</strong> ₱${Number(price).toLocaleString()}/night</p>
            <p><i class="fa-solid fa-tag"></i> <strong>Status:</strong> 
                <span style="font-weight: 800; color: ${statusColor}; text-transform: uppercase;">
                    ${booking.status}
                </span>
            </p>
            
            ${status === 'approved' ? `
                <div class="booking-details" style="margin-top: 15px; padding: 15px; border: 1px solid #eee; border-radius: 8px; background: #f9f9f9;">
                    <p style="margin: 0 0 5px 0; font-size: 0.9rem; font-weight: 600; color: #333;">
                        <i class="fa-solid fa-phone"></i> Host Contact Number:
                    </p>
                    <input type="text" value="${hostContact}" readonly 
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-weight: bold; background: #fff;">
                </div>
            ` : `
                <p style="margin-top: 10px; font-size: 0.85rem; color: #999; font-style: italic;">
                    Contact details will appear here once approved.
                </p>
            `}
        </div>
    </div>
    `;
});

    guestBookings.innerHTML = bookingsHTML;
}

loadLoggedGuestBookings();
