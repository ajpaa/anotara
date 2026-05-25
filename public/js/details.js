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
 * Fetch and display listing data from the host's database
 */
async function loadListingDetails() {
    try {
        const res = await fetch(`/api/listings/${listingId}`);
        if (!res.ok) throw new Error("Listing not found");
        
        const listing = await res.json();
        pricePerNight = Number(listing.price || 0);

        // Populate header and meta info
        if(document.getElementById('det-title')) document.getElementById('det-title').innerText = listing.name;
        if(document.getElementById('det-loc')) {
            document.getElementById('det-loc').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${listing.locationID}`;
        }
        
        // Populate Pricing
        const formattedPrice = pricePerNight.toLocaleString();
        if(document.getElementById('det-price')) document.getElementById('det-price').innerText = `₱${formattedPrice}`;
        updateTotalPrice(); // Initial total price display
        
        // Handle Images (Primary from array or fallback)
        if(document.getElementById('det-img')) {
            document.getElementById('det-img').src = (listing.images && listing.images.length > 0) 
                ? listing.images[0] 
                : (listing.image || 'https://placehold.co/800x500?text=No+Image+Available');
        }
        
        // Description and Type
        if(document.getElementById('det-desc')) {
            document.getElementById('det-desc').innerText = listing.description || "No description provided by the host.";
        }
        if(document.getElementById('det-type')) {
            document.getElementById('det-type').innerText = listing.type || "Entire Home";
        }

    } catch (err) {
        console.error("Error loading details:", err);
        alert("Could not load property details. Returning to search.");
        window.location.href = 'guest.html';
    }
}

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
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
            const total = diffDays * pricePerNight;
            totalDisplay.innerText = `₱${total.toLocaleString()}`;
            return;
        }
    }
    // Fallback if dates are invalid or not selected
    totalDisplay.innerText = `₱${pricePerNight.toLocaleString()}`;
}

/**
 * Handle Booking Form Submission
 */
const bookingForm = document.getElementById('detailsBookingForm');
if (bookingForm) {
    // Add listeners to date inputs to update total price live
    document.getElementById('startDate').addEventListener('change', updateTotalPrice);
    document.getElementById('endDate').addEventListener('change', updateTotalPrice);

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const bookingData = {
            listingId: listingId,
            guestName: document.getElementById('guestName').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            totalPrice: document.getElementById('total-price').innerText,
            status: 'Pending'
        };

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });

            if (res.ok) {
                alert(`Success! Your booking request for "${document.getElementById('det-title').innerText}" has been sent to the host.`);
                window.location.href = 'guest.html';
            } else {
                alert("Failed to send booking request. Please check your dates and try again.");
            }
        } catch (error) {
            console.error("Booking error:", error);
        }
    });
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", loadListingDetails);