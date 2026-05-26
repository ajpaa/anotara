// ==========================================
// 1. APPLICATION CONTROLLER
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    renderDashboardGrid();

    // Listeners for Teal UI Elements
    document.getElementById('filter-location')?.addEventListener('change', renderDashboardGrid);
    document.getElementById('search-circle')?.addEventListener('click', renderDashboardGrid);
    document.getElementById('sortby-price')?.addEventListener('change', renderDashboardGrid);
    
    // 🎯 UPDATED: standard 'change' listener for the dropdown
    document.getElementById('filter-type')?.addEventListener('change', renderDashboardGrid);
});

// ==========================================
// 2. SEARCH, FILTER, AVAILABILITY CHECKER
// ==========================================
async function renderDashboardGrid() {
    const listingsContainer = document.getElementById("listings-grid");
    if (!listingsContainer) return;

    const locationElement = document.getElementById('filter-location');
    const checkInInput = document.getElementById('checkinDate');
    const checkOutInput = document.getElementById('checkoutDate');
    const priceSort = document.getElementById('sortby-price'); 
    const inputName = document.getElementById('name');
    const typeElement = document.getElementById('filter-type');

    // Extract Values
    const locationValue = locationElement ? locationElement.value : ""; 
    const startDate = checkInInput ? checkInInput.value : "";
    const endDate = checkOutInput ? checkOutInput.value : "";
    const sortValue = priceSort ? priceSort.value : ""; 
    const searchName = inputName ? inputName.value : "";

    // 🎯 UPDATED: Logic for Single Dropdown
    const selectedType = typeElement ? typeElement.value : "";

    const params = new URLSearchParams();

    // Location Filter
    if (locationValue && locationValue !== "") {
        params.append('locationID', locationValue);
    }

    // Availability checking
    if (startDate && endDate) {
        if (new Date(startDate) >= new Date(endDate)) {
            alert("Check-Out date must be after the Check-In date.");
            return;
        }
        params.append('start', startDate);
        params.append('end', endDate);
    }

    // Sort, Search, and Type
    if (sortValue) params.append('sort', sortValue);
    if (searchName) params.append('search', searchName);
    
    // 🎯 UPDATED: Append single type if selected
    if (selectedType && selectedType !== "") {
        params.append('type', selectedType);
    }

    try {
        listingsContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2rem; color: #008080;"></i>
                <p style="color: #008080; margin-top: 10px;">Updating vacation stays...</p>
            </div>`;

        // 🛠️ FIXED: Changed single quotes to backticks so ${params.toString()} works
        const res = await fetch(`/api/listings?${params.toString()}`);
        if (!res.ok) throw new Error("Database cluster did not respond.");
        
        const listings = await res.json();
        listingsContainer.innerHTML = ""; 

        if (listings.length === 0) {
            // 🛠️ FIXED: Wrapped the HTML paragraph inside backticks
            listingsContainer.innerHTML = `<p class="empty-msg">No properties match your current search.</p>`;
            return;
        }

        const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

        listings.forEach(listing => {
            const isFavorited = favorites.includes(listing._id);
            const displayTitle = listing.name || "Untitled Accommodation";
            const displayLoc   = listing.locationID || "Not Specified";
            const displayPrice = listing.price ? Number(listing.price).toLocaleString() : "0";
            
            // 🛠️ FIXED: Changed string assignment to use backticks for template literal interpolation
            const detailUrl    = `/listing-details?id=${listing._id}`;

            // Image Fallback
            let displayImg = listing.images?.[0] || listing.image || 'https://placehold.co/600x400?text=No+Image';

            const card = document.createElement("div");
            card.className = "listing-card"; 

            card.innerHTML = `
                <div class="card-image-wrapper" style="position: relative; overflow: hidden; border-radius: 15px 15px 0 0;">
                    <img src="${displayImg}" alt="${displayTitle}" style="transition: transform 0.3s ease;">
                    <button class="heart-btn" onclick="toggleFavorite(event, '${listing._id}')" 
                        style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); backdrop-filter: blur(5px); border-radius: 50%; width: 35px; height: 35px; border: none; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center;">
                        <i class="${isFavorited ? 'fa-solid' : 'fa-regular'} fa-heart" 
                           style="color: ${isFavorited ? '#008080' : 'white'}; font-size: 1.2rem;"></i>
                    </button>
                </div>
                <div class="card-info" style="padding: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h3 style="margin: 0; font-size: 1.1rem; color: #333;">${displayTitle}</h3>
                        <span style="color: #f39c12; font-size: 0.85rem;"><i class="fa-solid fa-star"></i> New</span>
                    </div>
                    <p style="color: #666; font-size: 0.85rem; margin: 8px 0;">
                        <i class="fa-solid fa-location-dot" style="color: #008080;"></i> ${displayLoc} • ${listing.type || 'Stay'}
                    </p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; border-top: 1px solid #f0f0f0; padding-top: 10px;">
                        <span class="price" style="font-size: 1rem; color: #333;"><strong>₱${displayPrice}</strong> / night</span>
                        <button class="btn-view-details" onclick="window.location.href='${detailUrl}'" 
                                style="background: #008080; color: white; border: none; width: 35px; height: 35px; border-radius: 8px; cursor: pointer;">
                            <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            `;
            listingsContainer.appendChild(card);
        });

    } catch (err) {
        console.error("Master Rendering Pipeline Error:", err);
        // 🛠️ FIXED: Wrapped the catch error HTML inside backticks
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
        icon.style.color = '#008080'; // Teal
    }
    localStorage.setItem("favorites", JSON.stringify(favorites));
}