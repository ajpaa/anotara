// public/js/host.js

// ==========================================
// 1. BYPASS LOGIC & SESSION INITIALIZATION
// ==========================================
let CURRENT_HOST_ID = null;

const loggedInUserSession = localStorage.getItem('user');
let parsedSessionData = loggedInUserSession ? JSON.parse(loggedInUserSession) : null;

// DEVELOPMENT BYPASS CHECK: If no profile exists, inject a mock fallback identity instantly
if (!parsedSessionData || parsedSessionData.role !== 'host') {
    console.warn("⚠️ No active host session found. Injecting a temporary Mock Profile for seamless feature testing.");
    
    const mockUserSession = {
        _id: "65f1a2b3c4d5e6f7a8b9c001",
        username: "DevHostTester",
        role: "host",
        hostProfileId: "65f1a2b3c4d5e6f7a8b9c002" // Target fallback Host identifier
    };
    
    localStorage.setItem('user', JSON.stringify(mockUserSession));
    parsedSessionData = mockUserSession;
}

// Lock down our host identification variable
CURRENT_HOST_ID = parsedSessionData.hostProfileId;

// Initialize features on document ready
document.addEventListener("DOMContentLoaded", () => {
    // Fetch and draw properties
    fetchHostListings();

    // Bind event handler explicitly to the form wrapper
    const formElement = document.getElementById("listing-form");
    if (formElement) {
        formElement.addEventListener("submit", handleFormSubmit);
    }
});

// ==========================================
// 2. FETCH OWN LISTINGS FUNCTIONALITY
// ==========================================
async function fetchHostListings() {
    const gridContainer = document.getElementById("listings-grid");
    if (!gridContainer) return;
    
    gridContainer.innerHTML = `<p class="empty-msg">Loading your properties from Atlas...</p>`;

    try {
        // Pointing to your server host controller mount point
        const response = await fetch(`/api/host/listings/my-listings`);        if (!response.ok) throw new Error("Failed to fetch listings data");
        
        const listings = await response.json();
        gridContainer.innerHTML = ""; 

        if (listings.length === 0) {
            gridContainer.innerHTML = `<p class="empty-msg">You haven't posted any accommodations yet.</p>`;
            return;
        }

        listings.forEach(listing => {
            const card = document.createElement("div");
            card.className = "listing-card"; 
            
            // Safe character escapes for HTML attribute strings
            // Adjusted keys to match Mongoose schema specs (title, location.city, location.country)
            const displayTitle = listing.title || "Untitled Accomodation";
            const cityValue = listing.location?.city || "Not Specified";
            const countryValue = listing.location?.country || "";
            const displayLoc = `${cityValue}${countryValue ? ', ' + countryValue : ''}`;
            
            const escapedTitle = displayTitle.replace(/'/g, "\\'");
            const escapedCity = cityValue.replace(/'/g, "\\'");
            const escapedCountry = countryValue.replace(/'/g, "\\'");
            const escapedType = (listing.type || "Property").replace(/'/g, "\\'");
            const escapedDesc = (listing.description || "No description provided.").replace(/'/g, "\\'");

            card.innerHTML = `
                <img src="${listing.image || 'https://placehold.co/600x400?text=Property+Preview'}" alt="${displayTitle}">
                <div class="card-info">
                    <h3>${displayTitle}</h3>
                    <p class="loc"><i class="fa-solid fa-location-dot"></i> ${displayLoc} • ${listing.type || 'Property'}</p>
                    <p class="loc" style="margin-top: 5px; font-size: 0.8rem; height: 35px; overflow: hidden;">${listing.description || 'No description provided.'}</p>
                    
                    <div class="price-row" style="margin-top: 15px; border-top: 1px solid #f0f0f0; padding-top: 10px;">
                        <div class="price">
                            <strong>₱${Number(listing.pricePerNight || 0).toLocaleString()}</strong> / night
                        </div>
                    </div>

                    <div class="host-card-actions" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px;">
                        <button class="btn-approve" style="padding: 8px;" onclick="setupEditForm('${listing._id}', '${escapedTitle}', ${listing.pricePerNight || 0}, '${escapedCity}', '${escapedCountry}', '${escapedType}', '${escapedDesc}')">
                            <i class="fa-solid fa-pen-to-square"></i> Edit
                        </button>
                        <button class="btn-reject" style="padding: 8px; margin: 0;" onclick="deleteListing('${listing._id}')">
                            <i class="fa-solid fa-trash-can"></i> Delete
                        </button>
                    </div>
                </div>
            `;
            gridContainer.appendChild(card);
        });

    } catch (err) {
        console.error("Error loading listings:", err);
        gridContainer.innerHTML = `<p class="empty-msg" style="color: #ff5a5f;">Error displaying listings from server cluster.</p>`;
    }
}

// ==========================================
// 3. UI ELEMENT CONTROLS (TOGGLE & SETUP FORM)
// ==========================================
function toggleForm() {
    const formContainer = document.getElementById("listing-form-container");
    if (!formContainer) return;
    
    const isHidden = formContainer.style.display === "none" || formContainer.style.display === "";
    formContainer.style.display = isHidden ? "block" : "none";
    
    if (isHidden) {
        document.getElementById("listing-form").reset();
        document.getElementById("form-listing-id").value = "";
        document.getElementById("form-title").innerText = "Add an Accommodation";
    }
}

function setupEditForm(id, name, price, locationID, type, desc) {
    const formContainer = document.getElementById("listing-form-container");
    if (!formContainer) return;

    formContainer.style.display = "block"; 
    document.getElementById("form-title").innerText = "Modify Accommodation Specifics";
    
    document.getElementById("form-listing-id").value = id;
    document.getElementById("form-name").value = name; 
    
    // FIX: Force clean numerical assignment to prevent string pollution
    document.getElementById("form-price").value = Number(price); 
    
    document.getElementById("form-location").value = locationID; 
    document.getElementById("form-type").value = type;
    document.getElementById("form-desc").value = desc;

    formContainer.scrollIntoView({ behavior: 'smooth' });
}
// ==========================================
// 4. CREATE / EDIT SUBMISSION HANDLING
// ==========================================
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const mongoId = document.getElementById("form-listing-id").value;
    const isEditing = mongoId !== "";

    // CLEANUP FIX: Read string, strip everything except numbers/decimals
    const rawPriceValue = document.getElementById("form-price").value;
    const cleanPriceNumber = Number(String(rawPriceValue).replace(/[^0-9.]/g, ""));

    // If parsing somehow still results in NaN, fall back to 0 so the database doesn't crash
    const finalPrice = isNaN(cleanPriceNumber) ? 0 : cleanPriceNumber;

    const payload = {
        name: document.getElementById("form-name").value,
        price: finalPrice, // Valid numeric type sent to schema
        locationID: document.getElementById("form-location").value,
        type: document.getElementById("form-type").value,
        description: document.getElementById("form-desc").value,
        hostId: CURRENT_HOST_ID 
    };

    console.log("✈️ Sending payload to server:", payload);

    const url = isEditing ? `/api/host/listings/edit/${mongoId}` : `/api/host/listings/create`;
    const method = isEditing ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Network error transaction processing.");
        }

        alert(isEditing ? "Accommodation updated successfully!" : "New property listed successfully!");
        toggleForm();          
        fetchHostListings();   
    } catch (err) {
        console.error("Submission failed:", err);
        alert(`Error: ${err.message}`);
    }
}

// ==========================================
// 5. DELETE LISTING FUNCTIONALITY
// ==========================================
async function deleteListing(mongoId) {
    const confirmDelete = confirm("Are you sure you want to delete this listing permanently?");
    if (!confirmDelete) return;

    try {
            const response = await fetch(`/api/host/listings/delete/${mongoId}`, { method: "DELETE" });        if (response.ok) {
            alert("Listing successfully removed!");
            fetchHostListings(); 
        } else {
            const data = await response.json();
            alert(`Error: ${data.message}`);
        }
    } catch (err) {
        alert("Failed to reach server.");
    }
}