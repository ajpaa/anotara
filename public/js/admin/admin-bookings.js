let allBookings = [];
let filteredBookings = [];
let currentPage = 1;
let perPage = 12;

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

  loadBookings();

  document.getElementById("filter-date-from").addEventListener("change", () => {
    currentPage = 1;
    filterBookings();
  });
  document.getElementById("filter-date-to").addEventListener("change", () => {
    currentPage = 1;
    filterBookings();
  });
  document.getElementById("filter-sort").addEventListener("change", () => {
    currentPage = 1;
    filterBookings();
  });
  document.getElementById("per-page").addEventListener("change", () => {
    const val = document.getElementById("per-page").value;
    perPage = val === "all" ? "all" : Number(val);
    currentPage = 1;
    renderPage();
  });

  document
    .querySelectorAll('#status-dropdown input[type="checkbox"]')
    .forEach((cb) => {
      cb.addEventListener("change", () => {
        currentPage = 1;
        updateStatusDisplay();
        filterBookings();
      });
    });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".listings-filter-item")) {
      document.getElementById("status-dropdown").classList.remove("open");
      document.getElementById("sort-dropdown").classList.remove("open");
    }
    if (!e.target.closest("#filter-location")) {
      document.getElementById("location-suggestions").innerHTML = "";
    }
  });
});

async function loadBookings() {
  try {
    const res = await fetch("/api/bookings");
    const data = await res.json();
    allBookings = Array.isArray(data) ? data : [];
    filteredBookings = [...allBookings];
    updateStatusCounts();
    renderPage();
  } catch (err) {
    document.getElementById("bookings-tbody").innerHTML =
      '<tr><td colspan="8" class="table-empty">Error loading bookings.</td></tr>';
  }
}

function getSelectedStatuses() {
  return [
    ...document.querySelectorAll(
      '#status-dropdown input[type="checkbox"]:checked',
    ),
  ].map((cb) => cb.value);
}

function toggleStatusDropdown() {
  document.getElementById("status-dropdown").classList.toggle("open");
}

function updateStatusDisplay() {
  const selected = getSelectedStatuses();
  const display = document.getElementById("status-display");
  if (selected.length === 0) {
    display.innerText = "All Statuses";
  } else if (selected.length === 1) {
    display.innerText =
      selected[0].charAt(0).toUpperCase() + selected[0].slice(1);
  } else {
    display.innerText = selected.length + " statuses selected";
  }
}

function filterBookings() {
  const dateFrom = document.getElementById("filter-date-from").value;
  const dateTo = document.getElementById("filter-date-to").value;
  const sort = document.getElementById("filter-sort").value;
  const selectedStatuses = getSelectedStatuses();

  // Get the location filter value
  const locFilter = document
    .getElementById("filter-location")
    .value.toLowerCase();

  filteredBookings = allBookings.filter((b) => {
    const matchStatus =
      selectedStatuses.length === 0 ||
      selectedStatuses.includes(b.status || "pending");

    const checkIn = b.startDate ? new Date(b.startDate) : null;
    const matchFrom = !dateFrom || (checkIn && checkIn >= new Date(dateFrom));
    const matchTo = !dateTo || (checkIn && checkIn <= new Date(dateTo));

    const listingLocation = (b.listingId?.locationID || "").toLowerCase();
    const matchLocation = listingLocation.includes(locFilter);

    return matchStatus && matchFrom && matchTo && matchLocation;
  });

  if (sort === "newest") {
    filteredBookings.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  } else {
    filteredBookings.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    );
  }

  currentPage = 1; // Reset to page 1 whenever filters change
  renderPage();
}

function renderPage() {
  const total = filteredBookings.length;
  let pageBookings = [];
  let start = 0;
  let end = total;

  if (perPage === "all") {
    pageBookings = filteredBookings;
  } else {
    start = (currentPage - 1) * perPage;
    end = Math.min(start + perPage, total);
    pageBookings = filteredBookings.slice(start, end);
  }

  const tbody = document.getElementById("bookings-tbody");

  if (pageBookings.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="table-empty">No bookings found.</td></tr>';
    document.getElementById("pagination").innerHTML = "";
    return;
  }

  const countLabel = document.getElementById("bookings-count-label");
  if (countLabel) {
    if (total === 0) {
      countLabel.innerText = "Showing 0 bookings";
    } else {
      const displayStart = perPage === "all" ? 1 : start + 1;
      const displayEnd = perPage === "all" ? total : end;
      countLabel.innerText = `Showing ${displayStart}–${displayEnd} of ${total} bookings`;
    }
  }

  tbody.innerHTML = pageBookings
    .map((b) => {
      const hasListing = b.listingId !== null;
      // These are the correct paths
      const guestLink = `../profile.html?id=${b.guestId?._id || ""}`;
      const listingLink = hasListing
        ? `../listing-details.html?id=${b.listingId._id}`
        : "#";
      const hostLink =
        hasListing && b.listingId.host
          ? `../profile.html?id=${b.listingId.host._id}`
          : "#";

      const guestName = b.guestId?.username || b.guestName || "Unknown Guest";
      const listingName = hasListing ? b.listingId.name : "Unknown Listing";
      const hostName =
        hasListing && b.listingId.host
          ? b.listingId.host.hostName
          : "Unknown Host";
      const location = hasListing ? b.listingId.locationID || "N/A" : "N/A";

      const statusColors = {
        approved: { bg: "#e6f4ea", color: "#2e7d32" },
        rejected: { bg: "#fdecea", color: "#c62828" },
        pending: { bg: "#fff8e1", color: "#f57f17" },
      };
      const status = b.status || "pending";
      const style = statusColors[status] || statusColors.pending;

      const dateOpts = { month: "short", day: "numeric", year: "numeric" };
      const checkIn = b.startDate
        ? new Date(b.startDate).toLocaleDateString("en-PH", dateOpts)
        : "N/A";
      const checkOut = b.endDate
        ? new Date(b.endDate).toLocaleDateString("en-PH", dateOpts)
        : "N/A";
      const dateBooked = b.createdAt
        ? new Date(b.createdAt).toLocaleDateString("en-PH", dateOpts)
        : "N/A";

      return `<tr>
          <td><a href="${guestLink}">${guestName}</a></td>
          <td><a href="${listingLink}">${listingName}</a></td>
          <td>${location}</td>
          <td><a href="${hostLink}">${hostName}</a></td>
          <td>${checkIn}</td>
          <td>${checkOut}</td>
          <td>${dateBooked}</td>
          <td>
              <span style="background: ${style.bg}; color: ${style.color}; padding: 4px 12px; border-radius: 10px; font-size: 0.78rem; font-weight: 700; text-transform: capitalize; white-space: nowrap;">
                  ${status}
              </span>
          </td>
      </tr>`;
    })
    .join("");

  renderPagination(total);
}

function renderPagination(total) {
  const paginationBar = document.getElementById("pagination");

  if (perPage === "all" || total === 0) {
    paginationBar.innerHTML = "";
    return;
  }

  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) {
    paginationBar.innerHTML = "";
    return;
  }

  let buttonsHTML = "";

  buttonsHTML += `<button class="page-btn" onclick="goToPage(1)" ${currentPage === 1 ? "disabled" : ""}>
        <i class="fa-solid fa-angles-left"></i>
    </button>`;
  buttonsHTML += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}>
        <i class="fa-solid fa-angle-left"></i>
    </button>`;

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) buttonsHTML += `<span class="page-dots">...</span>`;
  for (let i = startPage; i <= endPage; i++) {
    buttonsHTML += `<button class="page-btn ${i === currentPage ? "active-page" : ""}" onclick="goToPage(${i})">${i}</button>`;
  }
  if (endPage < totalPages) buttonsHTML += `<span class="page-dots">...</span>`;

  buttonsHTML += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""}>
        <i class="fa-solid fa-angle-right"></i>
    </button>`;
  buttonsHTML += `<button class="page-btn" onclick="goToPage(${totalPages})" ${currentPage === totalPages ? "disabled" : ""}>
        <i class="fa-solid fa-angles-right"></i>
    </button>`;

  paginationBar.innerHTML = buttonsHTML;
}

function goToPage(page) {
  const totalPages = Math.ceil(filteredBookings.length / perPage);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderPage();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleSortDropdown() {
  document.getElementById("sort-dropdown").classList.toggle("open");
}

function applySort(value) {
  document.getElementById("sort-display").innerText =
    value === "newest" ? "Newest First" : "Oldest First";
  document.getElementById("sort-dropdown").classList.remove("open");
  document.getElementById("filter-sort").value = value;
  currentPage = 1;
  filterBookings();
}

function updateStatusCounts() {
  const counts = { pending: 0, approved: 0, rejected: 0 };
  allBookings.forEach((b) => {
    const status = b.status || "pending";
    if (counts.hasOwnProperty(status)) counts[status]++;
  });
  document.getElementById("count-pending").innerText = counts.pending;
  document.getElementById("count-approved").innerText = counts.approved;
  document.getElementById("count-rejected").innerText = counts.rejected;
}

function handleLocationInput() {
  const input = document.getElementById("filter-location").value.toLowerCase();
  const suggestionsBox = document.getElementById("location-suggestions");

  if (!input) {
    suggestionsBox.innerHTML = "";
    filterBookings();
    return;
  }

  // Get unique locations from the bookings
  const uniqueLocations = [
    ...new Set(allBookings.map((b) => b.listingId?.locationID).filter(Boolean)),
  ];
  const matches = uniqueLocations.filter((loc) =>
    loc.toLowerCase().includes(input),
  );

  suggestionsBox.innerHTML = matches
    .map(
      (loc) => `
      <div class="suggestion-item" onclick="selectLocation('${loc.replace(/'/g, "\\'")}')">
          <i class="fa-solid fa-location-dot"></i> ${loc}
      </div>
    `,
    )
    .join("");

  filterBookings();
}

function selectLocation(loc) {
  document.getElementById("filter-location").value = loc;
  document.getElementById("location-suggestions").innerHTML = "";
  currentPage = 1;
  filterBookings();
}