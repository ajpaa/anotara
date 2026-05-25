// Get listing ID from URL
const urlParams = new URLSearchParams(window.location.search);
const listingId = urlParams.get('id');

async function loadDetails() {
    const res = await fetch(`/api/listings/${listingId}`);
    const item = await res.json();

    document.getElementById('det-title').innerText = item.title;
    document.getElementById('det-loc').innerText = item.location;
    document.getElementById('det-price').innerText = item.price;
    document.getElementById('total-price').innerText = item.price; // Simplified
    document.getElementById('det-img').src = item.image;
    document.getElementById('det-desc').innerText = item.description || "No description provided.";
}

document.getElementById('detailsBookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const bookingData = {
        listingId: listingId,
        name: document.getElementById('guestName').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        status: 'Pending'
    };

    const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
    });

    if (res.ok) {
        alert("Success! Booking request sent.");
        window.location.href = 'guest.html';
    }
});

loadDetails();