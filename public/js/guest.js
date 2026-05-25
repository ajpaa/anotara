const listingsGrid = document.getElementById('listings-grid');
const bookingModal = document.getElementById('bookingModal');

// 1. Fetch and Display Listings
async function fetchListings() {
    const res = await fetch('/api/listings');
    const listings = await res.json();
    
// Inside your fetchListings function in js/guest.js
listingsGrid.innerHTML = listings.map(item => `
    <div class="listing-card" onclick="location.href='listing-details.html?id=${item._id}'">
        <img src="${item.image}" alt="${item.title}">
        <div class="card-info">
            <h3>${item.title}</h3>
            <p class="loc">${item.location}</p>
            <p class="price"><strong>$${item.price}</strong> / night</p>
        </div>
    </div>
`).join('');
}

// 2. Open/Close Booking Form
function openBooking(id) {
    document.getElementById('listingId').value = id;
    bookingModal.style.display = 'flex';
}

function closeModal() {
    bookingModal.style.display = 'none';
}

// 3. Handle Booking Submission
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const bookingData = {
        listingId: document.getElementById('listingId').value,
        name: document.getElementById('guestName').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        status: 'Pending' // Default status
    };

    const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
    });

    if (res.ok) {
        alert("Booking submitted! Waiting for host approval.");
        closeModal();
    }
});

// 4. Favorites Logic
function addToFavorites(id) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    if (!favorites.includes(id)) {
        favorites.push(id);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        alert("Added to Favorites!");
    }
}

fetchListings();

// Sample Data to reflect your UI requirements
const sampleListing = {
    _id: "65f1234567890abcdef12345", // Mock ID
    title: "House Of Orglodi Vill By Mogul Khan",
    location: "3891 Ranchview Dr. Richardson, California 62639",
    price: 20.00,
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
    description: "Experience the ultimate comfort in our Deluxe King Room, designed to cater to all your needs with luxury and convenience."
};

async function displayListings() {
    const listingsGrid = document.getElementById('listings-grid');
    
    // In a real app, this comes from: const res = await fetch('/api/listings');
    // For now, let's use the sample to see the function:
    const listings = [sampleListing]; 

    listingsGrid.innerHTML = listings.map(item => `
        <div class="listing-card" onclick="goToDetails('${item._id}')">
            <img src="${item.image}" alt="${item.title}">
            <div class="card-info">
                <h3>${item.title}</h3>
                <p class="loc">${item.location}</p>
                <div class="price-row">
                    <p class="price"><strong>$${item.price.toFixed(2)}</strong> / night</p>
                    <button class="fav-btn" onclick="event.stopPropagation(); addToFavorites('${item._id}')">
                        <i class="fa-regular fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function goToDetails(id) {
    // This redirects and passes the ID to the next page
    window.location.href = `listing-details.html?id=${id}`;
}

displayListings();