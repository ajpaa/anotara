document.addEventListener("DOMContentLoaded", () => {
    // Only call the main function that fetches from your API
    fetchAllListings();
});

/**
 * 1. FETCH ALL LISTINGS FROM THE DATABASE
 */
async function fetchAllListings() {
    const gridContainer = document.getElementById("listings-grid");
    if (!gridContainer) return;

    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

    try {
        // Fetching real data from your MongoDB cluster
        const response = await fetch('/api/listings');
        const listings = await response.json();
        
        gridContainer.innerHTML = "";

        if (listings.length === 0) {
            gridContainer.innerHTML = `<p class="empty-msg">No vacation stays available right now.</p>`;
            return;
        }

        listings.forEach(listing => {
            const isFavorited = favorites.includes(listing._id);
            const card = document.createElement("div");
            card.className = "listing-card"; 

            // Mapping MongoDB keys (name, locationID, price)
            const displayTitle = listing.name || "Untitled Accommodation";
            const displayLoc = listing.locationID || "Not Specified";
            const displayPrice = Number(listing.price || 0).toLocaleString();
            
            // Image logic: Check images array first, then fallback to single image or placeholder
            const displayImg = (listing.images && listing.images.length > 0) 
                ? listing.images[0] 
                : (listing.image || 'https://placehold.co/600x400?text=No+Image');

            // Truncation logic: First sentence only
            const shortDesc = listing.description 
                ? listing.description.split('.')[0] + '...' 
                : "No description available.";

            const detailUrl = `listing-details.html?id=${listing._id}`;

            card.innerHTML = `
                <div class="card-image-wrapper" style="position: relative;">
                    <img src="${displayImg}" alt="${displayTitle}">
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
            gridContainer.appendChild(card);
        });
    } catch (err) {
        console.error("Fetch error:", err);
        gridContainer.innerHTML = `<p class="empty-msg">Error loading listings. Please check your server connection.</p>`;
    }
}

/**
 * 2. FAVORITE TOGGLE LOGIC
 */
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
        icon.style.color = 'teal'; // Teal on click as requested
    }

    localStorage.setItem("favorites", JSON.stringify(favorites));
}