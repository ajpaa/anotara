async function loadFavorites() {
    const favGrid = document.getElementById('favorites-grid');
    const favIds = JSON.parse(localStorage.getItem('favorites')) || [];

    // Fetch all listings to filter them
    const res = await fetch('/api/listings');
    const allListings = await res.json();
    
    const favorites = allListings.filter(item => favIds.includes(item._id));

    if (favorites.length === 0) {
        favGrid.innerHTML = `<p class="empty-msg">You haven't saved any listings yet.</p>`;
        return;
    }

    favGrid.innerHTML = favorites.map(item => `
        <div class="fav-card" onclick="location.href='listing-details.html?id=${item._id}'">
            <div class="fav-img-wrapper">
                <span class="time-tag">8 days ago</span>
                <img src="${item.image}" alt="Stay">
                <i class="fa-solid fa-heart heart-icon-fixed"></i>
            </div>
            <div class="fav-info">
                <div class="fav-top-row">
                    <h3>${item.title}</h3>
                    <span class="price">$${item.price.toLocaleString()}</span>
                </div>
                <span class="fav-loc"><i class="fa-solid fa-location-dot"></i> ${item.location}</span>
                <div class="fav-specs">
                    <span><i class="fa-solid fa-bed"></i> 08</span>
                    <span><i class="fa-solid fa-bath"></i> 04</span>
                    <span><i class="fa-solid fa-maximize"></i> 410m²</span>
                </div>
            </div>
        </div>
    `).join('');
}

loadFavorites();