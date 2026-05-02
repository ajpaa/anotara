async function loadListings() {
    const res = await fetch("/listings");
    const listings = await res.json();

    const container = document.getElementById("listingsContainer");

    container.innerHTML = "";

    listings.forEach(item => {
        const card = document.createElement("div");
        card.className = "col-md-4";

        card.innerHTML = `
            <div class="card shadow-sm">
                <img src="${item.image || 'https://via.placeholder.com/300'}" class="card-img-top">

                <div class="card-body">
                    <h5 class="card-title">${item.firstName} ${item.lastName}</h5>
                    <p class="card-text">📍 ${item.location}</p>
                    <p class="card-text">💰 ₹${item.price}</p>
                    <p class="card-text">📞 ${item.contact}</p>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

loadListings();