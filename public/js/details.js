const urlParams = new URLSearchParams(window.location.search);
const listingId = urlParams.get("id");
let pricePerNight = 0;

if (!listingId) {
    window.location.href = "guest.html";
}

const currentUser = JSON.parse(localStorage.getItem("user"));

// ==========================================
// 1. NAVBAR & NAVIGATION
// ==========================================
function buildNavbar() {
    const logo = document.getElementById("nav-logo");
    const navIcons = document.getElementById("main-nav-icons");
    const mobileMenu = document.getElementById("mobile-menu");

    if (currentUser && currentUser.role === "admin") {
        logo.onclick = () => (window.location.href = "/admin/admin.html");
        navIcons.innerHTML = `
            <a href="/admin/admin.html" class="nav-link admin-nav"><i class="fa-solid fa-gauge"></i></a>
            <a href="/admin/admin-listings.html" class="nav-link admin-nav active-link"><i class="fa-solid fa-house"></i></a>
            <a href="#" class="nav-link admin-nav logout-btn" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i></a>
        `;
        document.getElementById("admin-banner").classList.add("visible");
        document.getElementById("admin-delete-top-btn").addEventListener("click", openDeleteModal);
    } else {
        logo.onclick = () => (window.location.href = "guest.html");
        navIcons.innerHTML = `
            <a href="guest.html"><i class="fa-solid fa-house"></i></a>
            <a href="guest.html"><i class="fa-solid fa-magnifying-glass"></i></a>
            <a href="favorites.html"><i class="fa-solid fa-heart"></i></a>
        `;
    }
}

// ==========================================
// 2. MODAL CONTROLS
// ==========================================
function openDeleteModal() {
    document.getElementById("deleteModal").classList.add("modal-active");
}
function closeDeleteModal() {
    document.getElementById("deleteModal").classList.remove("modal-active");
}
function showBookingModal() {
    document.getElementById("confirmBookingModal").classList.add("modal-active");
}
function closeBookingModal() {
    document.getElementById("confirmBookingModal").classList.remove("modal-active");
    window.location.href = "guest.html";
}

// ==========================================
// 3. LISTING & BOOKING LOGIC
// ==========================================
async function loadListingDetails() {
    try {
        const res = await fetch(`/api/listings/${listingId}`);
        if (!res.ok) throw new Error("Listing not found");

        const listing = await res.json();
        pricePerNight = Number(listing.price || 0);

        if (document.getElementById("det-title")) document.getElementById("det-title").innerText = listing.name;
        if (document.getElementById("det-loc")) document.getElementById("det-loc").innerHTML = `<i class="fa-solid fa-location-dot"></i> ${listing.locationID}`;
        if (document.getElementById("det-price")) document.getElementById("det-price").innerText = `₱${pricePerNight.toLocaleString()}`;
        if (document.getElementById("det-img")) document.getElementById("det-img").src = listing.images?.[0] || listing.image || "https://placehold.co/800x500?text=No+Image+Available";
        if (document.getElementById("det-desc")) document.getElementById("det-desc").innerText = listing.description || "No description provided.";
        if (document.getElementById("det-type")) document.getElementById("det-type").innerText = listing.type || "Entire Home";

        updateTotalPrice();
        checkBookingApprovalStatus(listing);
    } catch (err) {
        console.error("Error loading details:", err);
        window.location.href = 'guest.html';
    }
}

async function checkBookingApprovalStatus(listing) {
    if (!currentUser) return;
    try {
        const res = await fetch(`/api/bookings/guest/${currentUser._id}`);
        const bookings = await res.json();
        
        const hasApproved = bookings.some(b => {
            const bId = b.listingId?._id || b.listingId;
            return bId.toString() === listingId && b.status?.toLowerCase() === 'approved';
        });

        if (hasApproved) {
            const contactSection = document.getElementById('host-contact-section');
            const contactText = document.getElementById('det-contact');
            if (contactSection) {
                contactText.innerText = listing.contact || listing.hostContact || "No contact info saved";
                contactSection.style.display = 'block';
            }
        }
    } catch (err) { console.error("Security check error:", err); }
}

function updateTotalPrice() {
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;
    const totalDisplay = document.getElementById("total-price");
    if (start && end) {
        const diffDays = Math.max(1, Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)));
        totalDisplay.innerText = `₱${(diffDays * pricePerNight).toLocaleString()}`;
    }
}

// ==========================================
// 4. FORM SUBMISSION
// ==========================================
const bookingForm = document.getElementById("detailsBookingForm");
if (bookingForm) {
    document.getElementById("startDate").addEventListener("change", updateTotalPrice);
    document.getElementById("endDate").addEventListener("change", updateTotalPrice);

    bookingForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!currentUser) { alert("Please login to book."); return; }

        const start = document.getElementById("startDate").value;
        const end = document.getElementById("endDate").value;
        if (new Date(start) >= new Date(end)) { alert("Check-out must be after check-in."); return; }

        try {
            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    listingId,
                    guestId: currentUser._id,
                    guestName: document.getElementById('guestName').value,
                    startDate: start,
                    endDate: end,
                    status: 'pending'
                })
            });

            if (res.ok) showBookingModal();
            else alert("Booking failed. Please try again.");
        } catch (err) { alert("Connection error."); }
    });
}

function logout() { localStorage.removeItem("user"); window.location.href = "/index.html"; }
function resetForm() { bookingForm.reset(); document.getElementById("total-price").innerText = "₱0"; }

document.addEventListener("DOMContentLoaded", () => {
    buildNavbar();
    loadListingDetails();
});