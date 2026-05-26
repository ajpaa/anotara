document.addEventListener("DOMContentLoaded", () => {
    fetchFavoriteListings();
});

/**
 * Main function to load and render favorite listings
 */
async function fetchFavoriteListings() {
    const gridContainer = document.getElementById("listings-grid") || document.getElementById("favorites-grid");
    if (!gridContainer) return;

    // 1. Grab favorited IDs from localStorage
    const favIds = JSON.parse(localStorage.getItem("favorites") || "[]");

    if (favIds.length === 0) {
        gridContainer.innerHTML = `
            <div class="empty-msg-container" style="text-align: center; padding: 50px; grid-column: 1 / -1;">
                <p class="empty-msg">You haven't favorited any stays yet.</p>
                <a href="guest.html" class="btn-view-details" style="display: inline-flex; margin-top: 15px; text-decoration: none; justify-content: center;">
                    Explore Now
                </a>
            </div>`;
        return;
    }

    try {
        const response = await fetch('/api/listings');
        if (!response.ok) throw new Error("Failed to connect to server.");
        
        const allListings = await response.json();
        
        // 2. Filter to only show the ones saved in localStorage
        const favoriteListings = allListings.filter(listing => favIds.includes(listing._id));

        gridContainer.innerHTML = "";

        if (favoriteListings.length === 0) {
            gridContainer.innerHTML = `<p class="empty-msg">Favorites currently unavailable.</p>`;
            return;
        }

        favoriteListings.forEach(listing => {
            const card = document.createElement("div");
            card.className = "listing-card"; // The card itself has NO onclick event

            const displayTitle = listing.name || "Untitled Accommodation";
            const displayLoc = listing.locationID || "Not Specified";
            const displayPrice = Number(listing.price || 0).toLocaleString();
            const displayImg = (listing.images && listing.images.length > 0) 
                ? listing.images[0] 
                : (listing.image || 'https://placehold.co/600x400?text=No+Image');
            
            const shortDesc = listing.description 
                ? listing.description.split('.')[0] + '...' 
                : "No description available.";

            const detailUrl = `listing-details.html?id=${listing._id}`;

            card.innerHTML = `
                <div class="card-image-wrapper" style="position: relative; overflow: hidden; border-radius: 15px 15px 0 0;">
                    <img src="${displayImg}" alt="${displayTitle}" style="width: 100%; height: 200px; object-fit: cover;">
                    <button class="heart-btn" onclick="removeFavorite(event, '${listing._id}')" 
                        style="position: absolute; top: 15px; right: 15px; background: none; border: none; cursor: pointer; z-index: 10;">
                        <i class="fa-solid fa-heart" style="color: teal; font-size: 1.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"></i>
                    </button>
                </div>
                <div class="card-info" style="padding: 15px;">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; font-size: 1.1rem;">${displayTitle}</h3>
                    </div>
                    <p class="loc-text" style="color: #666; font-size: 0.85rem; margin: 5px 0;">
                        <i class="fa-solid fa-location-dot"></i> ${displayLoc} • ${listing.type || 'Stay'}
                    </p>
                    <p class="desc-text" style="font-size: 0.85rem; color: #444; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 15px;">
                        ${shortDesc}
                    </p>
                    
                    <div class="card-footer" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 12px;">
                        <span class="price" style="font-size: 0.95rem;"><strong>₱${displayPrice}</strong> / night</span>
                        
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
        console.error("Error:", err);
    }
}

/**
 * Function to remove favorites and update the UI instantly
 */
function removeFavorite(event, id) {
    // Critical: Stop the click from bubbling up to any other elements
    event.stopPropagation();
    
    let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    favorites = favorites.filter(favId => favId !== id);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    
    // Re-run the fetch function to remove the card from view immediately
    fetchFavoriteListings();
}