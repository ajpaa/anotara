// 1. Get listing ID from URL immediately
const urlParams = new URLSearchParams(window.location.search);
const listingId = urlParams.get('id');

// Global variable to store price for calculations
let pricePerNight = 0;

// Redirect if no ID is found
if (!listingId) {
    window.location.href = 'guest.html';
}

/**
 * Fetch and display listing data
 */
async function loadListingDetails() {
    try {
        const res = await fetch(`/api/listings/${listingId}`);
        if (!res.ok) throw new Error("Listing not found");
        
        const listing = await res.json();
        pricePerNight = Number(listing.price || 0);

        // Populate elements
        if(document.getElementById('det-title')) document.getElementById('det-title').innerText = listing.name;
        if(document.getElementById('det-loc')) {
            document.getElementById('det-loc').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${listing.locationID}`;
        }
        
        const formattedPrice = pricePerNight.toLocaleString();
        if(document.getElementById('det-price')) document.getElementById('det-price').innerText = `₱${formattedPrice}`;
        
        // Populate image, description, type
        if(document.getElementById('det-img')) {
            document.getElementById('det-img').src = (listing.images && listing.images.length > 0) 
                ? listing.images[0] 
                : (listing.image || 'https://placehold.co/800x500?text=No+Image+Available');
        }
        if(document.getElementById('det-desc')) document.getElementById('det-desc').innerText = listing.description || "No description provided.";
        if(document.getElementById('det-type')) document.getElementById('det-type').innerText = listing.type || "Entire Home";

        updateTotalPrice();
    } catch (err) {
        console.error("Error loading details:", err);
        window.location.href = 'guest.html';
    }
}

/**
 * Calculate total price based on dates
 */
/**
 * Calculate total price based on dates
 */
function updateTotalPrice() {
    const start = document.getElementById('startDate').value;
    const end = document.getElementById('endDate').value;
    const totalDisplay = document.getElementById('total-price');

    if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = endDate - startDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // If 0 or negative days, show nightly rate, otherwise show calculated total
        const daysToCharge = diffDays > 0 ? diffDays : 1; 
        const total = daysToCharge * pricePerNight;
        
        totalDisplay.innerText = `₱${total.toLocaleString()}`;
    } else {
        // Default to showing the price per night if no dates selected
        totalDisplay.innerText = `₱${pricePerNight.toLocaleString()}`;
    }
}

/**
 * Form Handling
 */
const bookingForm = document.getElementById('detailsBookingForm');
if (bookingForm) {
    document.getElementById('startDate').addEventListener('change', updateTotalPrice);
    document.getElementById('endDate').addEventListener('change', updateTotalPrice);

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userSession = localStorage.getItem('user');
        if (!userSession) {
            alert("You must be logged in to book.");
            window.location.href = 'login.html';
            return;
        }
        const guest = JSON.parse(userSession);

        const start = document.getElementById('startDate').value;
        const end = document.getElementById('endDate').value;
        
        if (new Date(start) >= new Date(end)) {
            alert("Check-out date must be after the check-in date.");
            return;
        }

        const bookingData = {
            listingId: listingId,
            guestId: guest._id,
            startDate: start,
            endDate: end,
            status: 'pending'
        };

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });

            if (res.ok) {
                alert("Booking request sent successfully!");
                window.location.href = 'guest.html';
            } else {
                const errData = await res.json();
                alert(`Booking failed: ${errData.message || "Try again."}`);
            }
        } catch (error) {
            alert("Connection error.");
        }
    });
}

function resetForm() {
    bookingForm.reset();
    document.getElementById('total-price').innerText = "₱0";
}

document.addEventListener("DOMContentLoaded", loadListingDetails);