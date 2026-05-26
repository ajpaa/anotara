let listingToDelete = null;

function logout() {
  localStorage.removeItem("user");
  window.location.href = "../index.html";
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

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || user.role !== "admin") {
    window.location.href = "../index.html";
    return;
  }

  document.getElementById("admin-title").innerText = "Admin Dashboard";
  document.getElementById("admin-subtitle").innerText =
    "Welcome back, " + user.username + "!";

  loadDashboard();
});

async function loadDashboard() {
  const content = document.getElementById("admin-content");
  content.innerHTML = "<p>Loading system summary...</p>";

  try {
    const [listingsRes, bookingsRes, usersRes] = await Promise.all([
      fetch("/api/listings"),
      fetch("/api/bookings"),
      fetch("/api/users"),
    ]);

    const listings = await listingsRes.json();
    const bookings = await bookingsRes.json();
    const users = await usersRes.json();

    const hosts = users.filter((u) => u.role === "host");
    const guests = users.filter((u) => u.role === "guest");

    content.innerHTML = `
            <div class="stats-row">
                ${statCard(listings.length, "Listings", "#008486")}
                ${statCard(bookings.length, "Bookings", "#b18d5b")}
                ${statCard(hosts.length, "Hosts", "#222222")}
                ${statCard(guests.length, "Guests", "#4a4a4a")}
            </div>

            <div class="admin-section">
                <div class="section-header">
                    <h3>Latest Listings</h3>
                    <a href="admin-listings.html" class="view-more-teal">Manage All Listings</a>
                </div>
                <div class="listings-grid">
                    ${listings.slice(0, 3).map(listingCard).join("")}
                </div>
            </div>

            <div class="admin-bottom-grid">

                <div class="admin-section">
                    <div class="section-header">
                        <h3>Recent Bookings</h3>
                        <a href="admin-bookings.html" class="view-more-teal">Manage All Bookings</a>
                    </div>
                    <div id="bookings-list">
                        ${bookings.slice(0, 5).map(bookingRow).join("")}
                    </div>
                </div>

                <div class="admin-section">
                    <div class="section-header">
                        <h3>Newest Users</h3>
                        <a href="admin-users.html" class="view-more-teal">Manage All Users</a>
                    </div>
                    <div id="users-list">
                        ${users.slice(-7).reverse().map(userRow).join("")}
                    </div>
                </div>

            </div>
        `;
  } catch (err) {
    console.error("Dashboard Error:", err);
    content.innerHTML =
      "<p>Error loading data. Check the console for details.</p>";
  }
}

function statCard(count, label, color) {
  return `
        <div class="stat-card" style="background: ${color};">
            <h2>${count}</h2>
            <p>${label}</p>
        </div>
    `;
}

function listingCard(l) {
  return `
        <div class="listing-card">
            <img src="${l.image || "https://placehold.co/300x200?text=No+Image"}" alt="${l.name}">
            <div class="card-info" style="padding: 15px;">
                <h3>${l.name}</h3>
                <p class="loc">
                    <i class="fa-solid fa-location-dot"></i> ${l.location || l.locationID || "No location"} &nbsp;•&nbsp; ${l.type || "Unknown type"}
                </p>
                <p class="desc-text" style="color: #666; font-size: 0.85rem; margin-top: 8px;">
    ${l.description || "No description."}
</p>
<div class="price-row">
    <span class="price">₱<strong>${l.price}</strong> / night</span>
</div>
                <div class="listing-footer-host">
                    <a href="../listing-details.html?id=${l._id}" class="btn-details">
                        <i class="fa-solid fa-eye"></i> See More
                    </a>
                    <button class="btn-delete-listing" onclick="openDeleteModal('${l._id}')">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

function bookingRow(b) {
  const statusColors = {
    approved: { bg: "#e6f4ea", color: "#2e7d32" },
    rejected: { bg: "#fdecea", color: "#c62828" },
    pending: { bg: "#fff8e1", color: "#f57f17" },
  };

  const status = b.status || "pending";
  const style = statusColors[status] || statusColors.pending;

  const checkIn = b.startDate
    ? new Date(b.startDate).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";
  const checkOut = b.endDate
    ? new Date(b.endDate).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  const guestName = b.guestName || "Unknown Guest";
  const listingName =
    b.listing?.name || b.listingId?.name || "Unknown Property";

  return `
        <div style="padding: 12px 0; border-bottom: 1px solid #eee;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <span style="font-weight: 700;">${guestName}</span>
                <span style="background: ${style.bg}; color: ${style.color}; padding: 3px 10px; border-radius: 10px; font-size: 0.78rem; font-weight: 700; text-transform: capitalize;">
                    ${status}
                </span>
            </div>
            <div style="font-size: 0.85rem; color: #555;">
                <i class="fa-solid fa-house" style="color: #008486; margin-right: 4px;"></i> ${listingName}
            </div>
            <div style="font-size: 0.8rem; color: #888; margin-top: 4px;">
                <i class="fa-regular fa-calendar"></i> ${checkIn} → ${checkOut}
            </div>
        </div>
    `;
}

function userRow(u) {
  const roleStyles = {
    guest: { bg: "#e6f3f3", color: "#008486" },
    host: { bg: "#222", color: "#fff" },
    admin: { bg: "#fef4e8", color: "#b18d5b" },
  };

  const style = roleStyles[u.role] || roleStyles.guest;
  const joinDate = u.createdAt
    ? new Date(u.createdAt).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown date";

  return `
        <div style="padding: 12px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-weight: 700;">${u.username}</div>
                <div style="font-size: 0.8rem; color: #888; margin-top: 3px;">
                    <i class="fa-regular fa-calendar"></i> Joined ${joinDate}
                </div>
            </div>
            <span style="background: ${style.bg}; color: ${style.color}; padding: 4px 12px; border-radius: 10px; font-size: 0.78rem; font-weight: 700; text-transform: capitalize;">
                ${u.role}
            </span>
        </div>
    `;
}

function openDeleteModal(listingId) {
  listingToDelete = listingId;
  document.getElementById("deleteModal").classList.add("modal-active");
}

function closeDeleteModal() {
  listingToDelete = null;
  document.getElementById("deleteModal").classList.remove("modal-active");
}

document
  .getElementById("confirmDeleteBtn")
  .addEventListener("click", async () => {
    if (!listingToDelete) return;

    try {
      const res = await fetch("/api/listings/" + listingToDelete, {
        method: "DELETE",
      });

      if (res.ok) {
        closeDeleteModal();
        loadDashboard();
      } else {
        alert("Failed to delete. Please try again.");
      }
    } catch (err) {
      alert("Server error. Could not delete listing.");
    }
  });

  // Add this inside your DOMContentLoaded or at the bottom of your JS file
window.addEventListener("resize", () => {
  const menu = document.getElementById("mobile-menu");
  const icon = document.getElementById("hamburger-icon");

  // If screen width is wider than 768px (the mobile breakpoint)
  if (window.innerWidth > 768) {
    // Force close the menu
    menu.classList.remove("menu-open");
    
    // Reset icon back to bars
    if (icon) {
      icon.classList.remove("fa-xmark");
      icon.classList.add("fa-bars");
    }
  }
});