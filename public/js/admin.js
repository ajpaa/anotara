document.addEventListener("DOMContentLoaded", loadDashboard);

async function loadDashboard() {
  const content = document.getElementById("admin-content");
  document.getElementById("admin-title").innerText = "System Command Center";

  content.innerHTML = `<p>Loading system summary...</p>`;

  try {
    const [listingsRes, bookingsRes, usersRes] = await Promise.all([
      fetch("/api/listings"),
      fetch("/api/bookings"),
      fetch("/api/users"),
    ]);

    const listings = await listingsRes.json();
    const bookings = await bookingsRes.json();
    const users = await usersRes.json();

    // Calculate counts
    const hosts = users.filter((u) => u.role === "host");
    const guests = users.filter((u) => u.role === "guest");

    content.innerHTML = `
            <div class="stats-row" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px;">
                ${createStatCard(listings.length, "Listings", "#008486")}
                ${createStatCard(bookings.length, "Bookings", "#b18d5b")}
                ${createStatCard(hosts.length, "Hosts", "#222222")}
                ${createStatCard(guests.length, "Guests", "#4a4a4a")}
            </div>

            <div class="admin-section" style="padding: 20px; border: 1px solid #e0e0e0; border-radius: 16px; margin-bottom: 40px; background: #fdfdfd;">
                <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3>Latest Listings</h3>
                    <button onclick="showSection('listings')" class="view-more-teal">View All Listings</button>
                </div>
                <div class="listings-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                    ${listings
                      .slice(0, 3)
                      .map(
                        (l) => `
    <div class="listing-card">
        <img src="${l.image || "https://via.placeholder.com/300"}" alt="${l.name}">
        <div class="card-info" style="padding: 15px;">
            <h4 style="margin: 0 0 5px 0;">${l.name}</h4>
            <p style="margin: 0; font-size: 0.9rem; color: #666;">
                <i class="fa-solid fa-location-dot"></i> ${l.locationID || "Not Specified"} • ${l.type || "Entire home"}
            </p>
            <p style="margin: 10px 0; font-size: 0.85rem; color: #444; height: 3em; overflow: hidden;">
                ${l.description || "No description available."}
            </p>
            <p style="margin: 0; font-weight: 600;">₱${l.price} / night</p>
        </div>
    </div>
`,
                      )
                      .join("")}
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="admin-section" style="padding: 20px; border: 1px solid #e0e0e0; border-radius: 16px; background: #fdfdfd;">
                    <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3>Recent Bookings</h3>
                        <button onclick="showSection('bookings')" class="view-more-teal">View All</button>
                    </div>
                    ${bookings
                      .slice(0, 5)
                      .map(
                        (b) => `
                        <div style="padding: 10px; border-bottom: 1px solid #eee;">
                            <strong>${b.guestName || "Guest"}</strong> → ${b.listing?.name || "Property"}
                        </div>
                    `,
                      )
                      .join("")}
                </div>
                <div class="admin-section" style="padding: 20px; border: 1px solid #e0e0e0; border-radius: 16px; background: #fdfdfd;">
                    <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3>Newest Users</h3>
                        <button onclick="showSection('users')" class="view-more-teal">View All</button>
                    </div>
                    ${users
                      .slice(-5)
                      .map(
                        (u) => `
                        <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                            <span><strong>${u.username}</strong></span>
                            <span style="text-transform: capitalize; color: #666;">${u.role}</span>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `;
  } catch (err) {
    console.error("Dashboard Error:", err);
    content.innerHTML = `<p>Error loading data. Check the console for details.</p>`;
  }
}

function createStatCard(count, label, color) {
  return `<div style="background:${color}; color:white; padding:20px; border-radius:15px; text-align:center;">
                <h2>${count}</h2><p>${label}</p>
            </div>`;
}
