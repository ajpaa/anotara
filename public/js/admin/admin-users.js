let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
let perPage = 12;
let currentSort = "newest";

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

  loadUsers();

  document.getElementById("filter-search").addEventListener("input", () => {
    currentPage = 1;
    filterUsers();
  });

  document.getElementById("per-page").addEventListener("change", (e) => {
    const val = e.target.value;
    perPage = val === "all" ? "all" : Number(val);
    currentPage = 1;
    renderPage();
  });

  document
    .querySelectorAll('#role-dropdown input[type="checkbox"]')
    .forEach((cb) => {
      cb.addEventListener("change", () => {
        currentPage = 1;
        updateRoleDisplay();
        filterUsers();
      });
    });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".listings-filter-item")) {
      document.getElementById("role-dropdown").classList.remove("open");
      document.getElementById("sort-dropdown").classList.remove("open");
    }
  });
});

async function loadUsers() {
  const countP = document.getElementById("user-count");
  countP.innerText = "Loading users...";
  try {
    const res = await fetch("/api/users");
    allUsers = await res.json();
    filteredUsers = [...allUsers];
    applySort("newest", false);
    renderPage();
  } catch (err) {
    document.getElementById("users-tbody").innerHTML =
      '<tr><td colspan="3" class="table-empty">Error loading users.</td></tr>';
  }
}

function getSelectedRoles() {
  return [
    ...document.querySelectorAll(
      '#role-dropdown input[type="checkbox"]:checked',
    ),
  ].map((cb) => cb.value);
}

function updateRoleDisplay() {
  const selected = getSelectedRoles();
  const display = document.getElementById("role-display");
  display.innerText =
    selected.length === 0 ? "All Roles" : `${selected.length} roles selected`;
}

function filterUsers() {
  const search = document.getElementById("filter-search").value.toLowerCase();
  const selectedRoles = getSelectedRoles();

  filteredUsers = allUsers.filter((u) => {
    const matchSearch = u.username.toLowerCase().includes(search);
    const matchRole =
      selectedRoles.length === 0 || selectedRoles.includes(u.role);
    return matchSearch && matchRole;
  });

  applySort(currentSort, false);
  currentPage = 1;
  renderPage();
}

function applySort(order, shouldRender = true) {
  currentSort = order;

  filteredUsers.sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);

    return order === "newest" ? dateB - dateA : dateA - dateB;
  });

  document.getElementById("sort-display").innerText =
    order === "newest" ? "Newest First" : "Oldest First";
  document.getElementById("sort-dropdown").classList.remove("open");

  if (shouldRender) {
    currentPage = 1;
    renderPage();
  }
}

function renderPage() {
  const total = filteredUsers.length;
  const tbody = document.getElementById("users-tbody");

  let pageItems;
  let start = 0;
  let end = total;

  if (perPage === "all") {
    pageItems = filteredUsers;
  } else {
    start = (currentPage - 1) * perPage;
    end = Math.min(start + perPage, total);
    pageItems = filteredUsers.slice(start, end);
  }

  document.getElementById("user-count").innerText =
    `${total} user${total !== 1 ? "s" : ""} found`;
  document.getElementById("bookings-count-label").innerText =
    perPage === "all"
      ? `Showing all ${total} users`
      : `Showing ${total === 0 ? 0 : start + 1}–${end} of ${total} users`;

  if (pageItems.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="3" class="table-empty">No users found.</td></tr>';
    document.getElementById("pagination").innerHTML = "";
    return;
  }

  const roleStyles = {
    guest: { bg: "#e6f3f3", color: "#008486" },
    host: { bg: "#222", color: "#fff" },
    admin: { bg: "#fef4e8", color: "#b18d5b" },
  };

  tbody.innerHTML = pageItems
    .map((u) => {
      const displayName =
        u.role === "admin"
          ? `<span style="font-weight: 700;">${u.username}</span>`
          : `<a href="../profile.html?id=${u._id}" style="font-weight: 700;">${u.username}</a>`;

      const joinDate = u.createdAt
        ? new Date(u.createdAt).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "N/A";
      const style = roleStyles[u.role] || roleStyles.guest;

      return `<tr>
        <td>${displayName}</td>
        <td><span style="background: ${style.bg}; color: ${style.color}; padding: 4px 12px; border-radius: 10px; font-size: 0.78rem; font-weight: 700; text-transform: capitalize;">${u.role}</span></td>
        <td>${joinDate}</td>
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

  let html = `<button class="page-btn" onclick="goToPage(1)" ${currentPage === 1 ? "disabled" : ""}><i class="fa-solid fa-angles-left"></i></button>`;
  html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}><i class="fa-solid fa-angle-left"></i></button>`;

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  if (startPage > 1) html += `<span class="page-dots">...</span>`;
  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn ${i === currentPage ? "active-page" : ""}" onclick="goToPage(${i})">${i}</button>`;
  }
  if (endPage < totalPages) html += `<span class="page-dots">...</span>`;

  html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""}><i class="fa-solid fa-angle-right"></i></button>`;
  html += `<button class="page-btn" onclick="goToPage(${totalPages})" ${currentPage === totalPages ? "disabled" : ""}><i class="fa-solid fa-angles-right"></i></button>`;
  paginationBar.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  renderPage();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleRoleDropdown() {
  document.getElementById("role-dropdown").classList.toggle("open");
}
function toggleSortDropdown() {
  document.getElementById("sort-dropdown").classList.toggle("open");
}
function changePerPage(val) {
  perPage = val === "all" ? "all" : Number(val);
  currentPage = 1;
  renderPage();
}