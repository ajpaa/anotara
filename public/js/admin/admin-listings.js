let allListings = [];
let filteredListings = [];
let currentPage = 1;
let perPage = 10;
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

  loadListings();

  document.getElementById("search-input").addEventListener("input", () => {
    currentPage = 1;
    filterListings();
    showNameSuggestions();
  });
  document.getElementById("filter-type").addEventListener("change", () => {
    currentPage = 1;
    filterListings();
  });
  document.getElementById("filter-location").addEventListener("input", () => {
    currentPage = 1;
    filterListings();
    showLocationSuggestions();
  });
  document.getElementById("filter-sort").addEventListener("change", () => {
    currentPage = 1;
    filterListings();
  });
  document.getElementById("per-page").addEventListener("change", () => {
    const val = document.getElementById("per-page").value;
    perPage = val === "all" ? "all" : Number(val);
    currentPage = 1;
    renderPage();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#filter-location")) {
      document.getElementById("location-suggestions").innerHTML = "";
    }
    if (!e.target.closest("#search-input")) {
      document.getElementById("name-suggestions").innerHTML = "";
    }
  });
});

async function loadListings() {
  try {
    const res = await fetch("/api/listings");
    allListings = await res.json();
    filteredListings = [...allListings];
    renderPage();
  } catch (err) {
    document.getElementById("listings-grid").innerHTML =
      '<p class="empty-msg">Error loading listings.</p>';
  }
}

function filterListings() {
  const search = document.getElementById("search-input").value.toLowerCase();
  const type = document.getElementById("filter-type").value;
  const location = document
    .getElementById("filter-location")
    .value.toLowerCase();
  const sort = document.getElementById("filter-sort").value;

  filteredListings = allListings.filter((l) => {
    const matchName = l.name.toLowerCase().includes(search);
    const matchType = type === "" || l.type === type;
    const matchLocation =
      location === "" ||
      (l.location || l.locationID || "").toLowerCase().includes(location);
    return matchName && matchType && matchLocation;
  });

  if (sort === "price_asc") filteredListings.sort((a, b) => a.price - b.price);
  if (sort === "price_desc") filteredListings.sort((a, b) => b.price - a.price);

  renderPage();
}

function showNameSuggestions() {
  const input = document.getElementById("search-input").value.toLowerCase();
  const suggestionsBox = document.getElementById("name-suggestions");

  if (!input) {
    suggestionsBox.innerHTML = "";
    return;
  }

  const matches = allListings
    .map((l) => l.name)
    .filter((name) => name.toLowerCase().includes(input));

  const unique = [...new Set(matches)];

  if (unique.length === 0) {
    suggestionsBox.innerHTML = "";
    return;
  }

  suggestionsBox.innerHTML = unique
    .map(
      (name) => `
        <div class="suggestion-item" onclick="selectName('${name.replace(/'/g, "\\'")}')">
            <i class="fa-solid fa-magnifying-glass"></i> ${name}
        </div>
    `,
    )
    .join("");
}

function selectName(name) {
  document.getElementById("search-input").value = name;
  document.getElementById("name-suggestions").innerHTML = "";
  currentPage = 1;
  filterListings();
}

function showLocationSuggestions() {
  const input = document.getElementById("filter-location").value.toLowerCase();
  const suggestionsBox = document.getElementById("location-suggestions");

  if (!input) {
    suggestionsBox.innerHTML = "";
    return;
  }

  const uniqueLocations = [
    ...new Set(
      allListings.map((l) => l.location || l.locationID || "").filter(Boolean),
    ),
  ];

  const matches = uniqueLocations.filter((loc) =>
    loc.toLowerCase().includes(input),
  );

  if (matches.length === 0) {
    suggestionsBox.innerHTML = "";
    return;
  }

  suggestionsBox.innerHTML = matches
    .map(
      (loc) => `
        <div class="suggestion-item" onclick="selectLocation('${loc}')">
            <i class="fa-solid fa-location-dot"></i> ${loc}
        </div>
    `,
    )
    .join("");
}

function selectLocation(loc) {
  document.getElementById("filter-location").value = loc;
  document.getElementById("location-suggestions").innerHTML = "";
  currentPage = 1;
  filterListings();
}

function renderPage() {
  const grid = document.getElementById("listings-grid");
  const total = filteredListings.length;

  let pageListings;
  let start = 0;
  let end = total;

  if (perPage === "all") {
    pageListings = filteredListings;
  } else {
    start = (currentPage - 1) * perPage;
    end = Math.min(start + perPage, total);
    pageListings = filteredListings.slice(start, end);
  }

  const countLabel = document.getElementById("listings-count-label");
  if (perPage === "all") {
    countLabel.innerText = `Showing all ${total} listing${total !== 1 ? "s" : ""}`;
  } else {
    countLabel.innerText = `Showing ${total === 0 ? 0 : start + 1}–${end} of ${total} listing${total !== 1 ? "s" : ""}`;
  }

  document.getElementById("listings-count").innerText =
    `${total} listing${total !== 1 ? "s" : ""} found`;

  if (pageListings.length === 0) {
    grid.innerHTML = '<p class="empty-msg">No listings found.</p>';
    document.getElementById("pagination").innerHTML = "";
    return;
  }

  grid.innerHTML = pageListings
    .map(
      (l) => `
        <div class="listing-card admin-listing-card" id="card-${l._id}">
            <img src="${l.image || "https://placehold.co/300x200?text=No+Image"}" alt="${l.name}">
            <div class="card-info">
                <h3 class="card-name">${l.name}</h3>
                <p class="loc">
                    <i class="fa-solid fa-location-dot"></i>
                    ${l.location || l.locationID || "No location"} &nbsp;•&nbsp; ${l.type || "Unknown type"}
                </p>
                <p class="desc-text">${l.description || "No description."}</p>
                <div class="price-row">
                    <span class="price">₱<strong>${Number(l.price).toLocaleString()}</strong> / night</span>
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
    `,
    )
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
  const total = filteredListings.length;
  const totalPages = Math.ceil(total / perPage);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderPage();
  window.scrollTo({ top: 0, behavior: "smooth" });
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
        allListings = allListings.filter((l) => l._id !== listingToDelete);
        filteredListings = filteredListings.filter(
          (l) => l._id !== listingToDelete,
        );

        const totalPages =
          perPage === "all" ? 1 : Math.ceil(filteredListings.length / perPage);
        if (currentPage > totalPages) currentPage = totalPages || 1;

        closeDeleteModal();
        renderPage();
      } else {
        alert("Failed to delete. Please try again.");
      }
    } catch (err) {
      alert("Server error. Could not delete listing.");
    }
  });
