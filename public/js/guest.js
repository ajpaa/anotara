// ==========================================
// 1. APPLICATION CONTROLLER
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // matic load of listings
    renderDashboardGrid();

    // for filters
    document.getElementById('filter-location')?.addEventListener('change', renderDashboardGrid);
    document.getElementById('search-circle')?.addEventListener('click', renderDashboardGrid);
    document.getElementById('sortby-price')?.addEventListener('change', renderDashboardGrid);
    document.getElementById('filter-type')?.addEventListener('change', renderDashboardGrid);
});

// ==========================================
// 2. SEARCH, FILTER, AVAILABILITY CHECKER
// ==========================================
async function renderDashboardGrid() {
    const listingsContainer = document.getElementById("listings-grid");
    if (!listingsContainer) return;

    // location, date filters, sort, search property name
    const locationElement = document.getElementById('filter-location');
    const checkInInput = document.getElementById('checkinDate');
    const checkOutInput = document.getElementById('checkoutDate');
    const priceSort = document.getElementById('sortby-price'); 
    const inputName = document.getElementById('name');
    const typeElement = document.getElementById('filter-type');

    // extract values
    const locationValue = locationElement.options[locationElement.selectedIndex]?.text.trim();
    const startDate = checkInInput.value;
    const endDate = checkOutInput.value;
    const sortValue = priceSort.value; 
    const searchName = inputName.value;

    // extract selected types
    let selectedTypes = [];
    if (typeElement) {
        selectedTypes = Array.from(typeElement.selectedOptions).map(option => option.value.trim() || option.text.trim()).filter(val => val !== "")
    }

    // Build API query parameters
    const params = new URLSearchParams();

    // location filter || if location(ncr) -> all listings
    if (locationValue && locationValue !== "All Locations" && locationValue !== "Location (NCR)") {
        params.append('locationID', locationValue);
    }

    // availability checking
    if (startDate && endDate) {
        if (new Date(startDate) >= new Date(endDate)) {
            alert("Check-Out date must be after the Check-In date.");
            return;
        }
        params.append('start', startDate);
        params.append('end', endDate);
    }

    // sort by price
    if (sortValue) {
        params.append('sort', sortValue)
    }

    // search name
    if (searchName) {
        params.append('search', searchName)
    }

    // selected types
    selectedTypes.forEach(t => {
        params.append('type', t);
    });

    try {
        listingsContainer.innerHTML = "<p class='loading-msg'>Updating vacation stays...</p>";

        const res = await fetch(`/api/listings?${params.toString()}`);
        if (!res.ok) throw new Error("Database cluster did not respond cleanly.");
        
        const listings = await res.json();
        listingsContainer.innerHTML = ""; // Safe container reset

        if (listings.length === 0) {
            listingsContainer.innerHTML = `<p class="empty-msg">No properties match your current search.</p>`;
            return;
        }

        const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

        // track heart icon 
         listings.forEach(listing => {
            const isFavorited = favorites.includes(listing._id);
            
            const displayTitle = listing.name || "Untitled Accommodation";
            const displayLoc   = listing.locationID || "Not Specified";
            const displayPrice = listing.price ? Number(listing.price).toLocaleString() : "0";
            const shortDesc    = listing.description ? listing.description.split('.')[0] + '...' : "No description available.";
            const detailUrl    = `listing-details.html?id=${listing._id}`;

            // Image Lookup Fallback Chain
            let displayImg = 'https://placehold.co/600x400?text=No+Image';
            if (listing.images && listing.images.length > 0 && listing.images[0]) {
                displayImg = listing.images[0];
            } else if (listing.image) {
                displayImg = listing.image;
            }

            const card = document.createElement("div");
            card.className = "listing-card"; 

            card.innerHTML = `
                <div class="card-image-wrapper" style="position: relative;">
                    <img src="${displayImg}" alt="${displayTitle}" onerror="this.src='https://placehold.co/600x400?text=Image+Load+Error'">
                    <button class="heart-btn" onclick="toggleFavorite(event, '${listing._id}')" 
                        style="position: absolute; top: 15px; right: 15px; background: none; border: none; cursor: pointer; z-index: 10;">
                        <i class="${isFavorited ? 'fa-solid' : 'fa-regular'} fa-heart" 
                           style="color: ${isFavorited ? 'teal' : 'white'}; font-size: 1.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"></i>
                    </button>
                </div>
                <div class="card-info">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0;">${displayTitle}</h3>
                        <span class="rating"><i class="fa-solid fa-star"></i> New</span>
                    </div>
                    <p class="loc-text" style="color: #666; font-size: 0.9rem; margin: 5px 0;">
                        <i class="fa-solid fa-location-dot"></i> ${displayLoc} • ${listing.type || 'Stay'}
                    </p>
                    <p class="desc-text" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #444; font-size: 0.85rem;">
                        ${shortDesc}
                    </p>
                    <div class="card-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                        <span class="price"><strong>₱${displayPrice}</strong> / night</span>
                        <button class="btn-view-details" onclick="window.location.href='${detailUrl}'">
                            <i class="fa-solid fa-plus"></i>
                            <span>View Details</span>
                        </button>
                    </div>
                </div>
            `;
            listingsContainer.appendChild(card);
        });

    } catch (err) {
        console.error("Master Rendering Pipeline Error:", err);
        listingsContainer.innerHTML = `<p class="empty-msg">Error syncing data adjustments.</p>`;
    }
}

// ==========================================
// 3. FAVORITE STORAGE 
// ==========================================
function toggleFavorite(event, id) {
    event.stopPropagation(); 
    const icon = event.currentTarget.querySelector('i');
    let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

    if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
        icon.classList.replace('fa-solid', 'fa-regular');
        icon.style.color = 'white';
    } else {
        favorites.push(id);
        icon.classList.replace('fa-regular', 'fa-solid');
        icon.style.color = 'teal';
    }

    localStorage.setItem("favorites", JSON.stringify(favorites));
}
