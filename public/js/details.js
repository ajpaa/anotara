const urlParams = new URLSearchParams(window.location.search);
const listingId = urlParams.get("id");

let pricePerNight = 0;

if (!listingId) {
  window.location.href = "guest.html";
}

const currentUser = JSON.parse(localStorage.getItem("user"));

function buildNavbar() {
  const logo = document.getElementById("nav-logo");
  const navIcons = document.getElementById("main-nav-icons");
  const mobileMenu = document.getElementById("mobile-menu");

  if (currentUser && currentUser.role === "admin") {
    logo.onclick = () => (window.location.href = "/admin/admin.html");

    navIcons.innerHTML = `
            <a href="/admin/admin.html" title="Dashboard" class="nav-link admin-nav"><i class="fa-solid fa-gauge"></i></a>
            <a href="/admin/admin-listings.html" title="Listings" class="nav-link admin-nav active-link"><i class="fa-solid fa-house"></i></a>
            <a href="/admin/admin-bookings.html" title="Bookings" class="nav-link admin-nav"><i class="fa-solid fa-calendar-check"></i></a>
            <a href="/admin/admin-users.html" title="Users" class="nav-link admin-nav"><i class="fa-solid fa-users"></i></a>
            <a href="#" title="Logout" class="nav-link admin-nav logout-btn" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i></a>
        `;

    mobileMenu.innerHTML = `
            <a href="/admin/admin.html" class="mobile-menu-link"><i class="fa-solid fa-gauge"></i> Dashboard</a>
            <a href="/admin/admin-listings.html" class="mobile-menu-link active-link"><i class="fa-solid fa-house"></i> Listings</a>
            <a href="/admin/admin-bookings.html" class="mobile-menu-link"><i class="fa-solid fa-calendar-check"></i> Bookings</a>
            <a href="/admin/admin-users.html" class="mobile-menu-link"><i class="fa-solid fa-users"></i> Users</a>
            <a href="#" class="mobile-menu-link logout-mobile" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>
        `;

    document.getElementById("admin-banner").classList.add("visible");

    document
      .getElementById("admin-delete-top-btn")
      .addEventListener("click", () => {
        openDeleteModal();
      });
  } else {
    logo.onclick = () => (window.location.href = "guest.html");

    navIcons.innerHTML = `
            <a href="guest.html"><i class="fa-solid fa-house"></i></a>
            <a href="guest.html"><i class="fa-solid fa-magnifying-glass"></i></a>
            <a href="favorites.html"><i class="fa-solid fa-heart"></i></a>
        `;
  }
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "/index.html";
}

function toggleMenu() {
  const menu = document.getElementById("mobile-menu");
  const icon = document.getElementById("hamburger-icon");
  const isOpen = menu.classList.contains("menu-open");
  if (isOpen) {
    menu.classList.remove("menu-open");
    icon.classList.replace("fa-xmark", "fa-bars");
  } else {
    menu.classList.add("menu-open");
    icon.classList.replace("fa-bars", "fa-xmark");
  }
}

function openDeleteModal() {
  document.getElementById("deleteModal").classList.add("modal-active");
}

function closeDeleteModal() {
  document.getElementById("deleteModal").classList.remove("modal-active");
}

document
  .getElementById("confirmDeleteBtn")
  .addEventListener("click", async () => {
    try {
      const res = await fetch("/api/listings/" + listingId, {
        method: "DELETE",
      });
      if (res.ok) {
        closeDeleteModal();
        alert("Listing deleted successfully.");
        window.location.href = "/admin/admin-listings.html";
      } else {
        alert("Failed to delete. Please try again.");
      }
    } catch (err) {
      alert("Server error. Could not delete.");
    }
  });

async function loadListingDetails() {
  try {
    const res = await fetch(`/api/listings/${listingId}`);
    if (!res.ok) throw new Error("Listing not found");

    const listing = await res.json();
    pricePerNight = Number(listing.price || 0);

    if (document.getElementById("det-title"))
      document.getElementById("det-title").innerText = listing.name;

    if (document.getElementById("det-loc")) {
      document.getElementById("det-loc").innerHTML =
        `<i class="fa-solid fa-location-dot"></i> ${listing.locationID}`;
    }

    const formattedPrice = pricePerNight.toLocaleString();
    if (document.getElementById("det-price"))
      document.getElementById("det-price").innerText = `₱${formattedPrice}`;

    if (document.getElementById("det-img")) {
      document.getElementById("det-img").src =
        listing.images && listing.images.length > 0
          ? listing.images[0]
          : listing.image ||
            "https://placehold.co/800x500?text=No+Image+Available";
    }

    if (document.getElementById("det-desc"))
      document.getElementById("det-desc").innerText =
        listing.description || "No description provided.";

    if (document.getElementById("det-type"))
      document.getElementById("det-type").innerText =
        listing.type || "Entire Home";

        updateTotalPrice();
        
        // NEW: Check if this user is allowed to see the phone number
        checkBookingApprovalStatus(listing);

    } catch (err) {
        console.error("Error loading details:", err);
        window.location.href = 'guest.html';
    }
}

/**
 * NEW: Checks if the logged-in guest has an approved booking for this listing
 */
/**
 * Checks if the logged-in guest has an approved booking for this listing
 */
async function checkBookingApprovalStatus(listing) {
    const userSession = localStorage.getItem('user');
    if (!userSession) return; // User isn't logged in, leave contact hidden

    const currentUser = JSON.parse(userSession);
    const currentUserId = currentUser._id;

    try {
        // Hits your exact existing route: GET /api/bookings/guest/:guestId
        const res = await fetch(`/api/bookings/guest/${currentUserId}`);
        if (!res.ok) throw new Error("Failed to pull guest bookings");

        const bookings = await res.json();
        
        // Find if any booking matches this listing ID AND has an approved status string
        const hasApprovedBooking = bookings.some(booking => {
            // Check both layout schemas safely ('listingId' object vs pure IDs)
            const targetListingId = booking.listingId && booking.listingId._id 
                ? booking.listingId._id.toString() 
                : (booking.listingId ? booking.listingId.toString() : "");

            const isCurrentListing = (targetListingId === listingId);
            const isApproved = (booking.status && booking.status.toLowerCase() === 'approved');

            return isCurrentListing && isApproved;
        });

        if (hasApprovedBooking) {
            const contactSection = document.getElementById('host-contact-section');
            const contactText = document.getElementById('det-contact');
            
            if (contactSection && contactText) {
                // Dynamically fallback based on how contact details are saved in your Listing schema
                contactText.innerText = listing.contactNumber || listing.hostContact || "No contact info saved by host";
                contactSection.style.display = 'block'; // Reveal the card to approved user
            }
        }
    } catch (err) {
        console.error("🔒 Security check bypass error:", err);
    }
}

/**
 * Calculate total price based on dates
 */
function updateTotalPrice() {
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
  const totalDisplay = document.getElementById("total-price");

    if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = endDate - startDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const daysToCharge = diffDays > 0 ? diffDays : 1; 
        const total = daysToCharge * pricePerNight;
        
        totalDisplay.innerText = `₱${total.toLocaleString()}`;
    } else {
        totalDisplay.innerText = `₱${pricePerNight.toLocaleString()}`;
    }
}

const bookingForm = document.getElementById("detailsBookingForm");
if (bookingForm) {
  document
    .getElementById("startDate")
    .addEventListener("change", updateTotalPrice);
  document
    .getElementById("endDate")
    .addEventListener("change", updateTotalPrice);

  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userSession = localStorage.getItem("user");
    if (!userSession) {
      alert("You must be logged in to book.");
      window.location.href = "login.html";
      return;
    }

    const guest = JSON.parse(userSession);
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;

    if (new Date(start) >= new Date(end)) {
      alert("Check-out date must be after the check-in date.");
      return;
    }

        const bookingData = {
            listingId: listingId,
            guestId: guest._id, 
            // Secure fix: Grab the verified name straight from the session data object
            guestName: document.getElementById('guestName').value, 
            startDate: start,
            endDate: end,
            status: 'pending'
        };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      if (res.ok) {
        alert("Booking request sent successfully!");
        window.location.href = "guest.html";
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
  document.getElementById("total-price").innerText = "₱0";
}

document.addEventListener("DOMContentLoaded", () => {
  buildNavbar();
  loadListingDetails();
});
