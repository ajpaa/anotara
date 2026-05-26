// ==========================================
// 1. BYPASS LOGIC & SESSION INITIALIZATION
// ==========================================
let CURRENT_HOST_ID = null;

const loggedInUserSession = localStorage.getItem('user');
let parsedSessionData = loggedInUserSession ? JSON.parse(loggedInUserSession) : null;

if (!parsedSessionData || parsedSessionData.role !== 'host') {
    console.warn("⚠️ No active host session found. Injecting a temporary Mock Profile for seamless feature testing.");
    const mockUserSession = {
        _id: "65f1a2b3c4d5e6f7a8b9c001",
        username: "DevHostTester",
        role: "host",
        hostProfileId: "65f1a2b3c4d5e6f7a8b9c002"
    };
    localStorage.setItem('user', JSON.stringify(mockUserSession));
    parsedSessionData = mockUserSession;
}

CURRENT_HOST_ID = parsedSessionData.hostProfileId;

// Expose routing interfaces explicitly to global context windows
window.setupEditForm = setupEditForm;
window.deleteListing = deleteListing;
window.toggleForm = toggleForm;
window.handleCancel = handleCancel;
window.closeStatusModal = closeStatusModal;
window.closeConfirmModal = closeConfirmModal;

// Initialize components on document complete
document.addEventListener("DOMContentLoaded", () => {
    fetchHostListings();

    const formElement = document.getElementById("listing-form");
    if (formElement) {
        formElement.addEventListener("submit", handleFormSubmit);
    }
});

// ==========================================
// 1B. CUSTOM NON-BLOCKING MODAL UTILITIES
// ==========================================
function showStatusModal(title, message) {
    document.getElementById("status-modal-title").innerText = title;
    document.getElementById("status-modal-message").innerText = message;
    document.getElementById("status-modal").classList.add("modal-active");
}

function closeStatusModal() {
    document.getElementById("status-modal").classList.remove("modal-active");
}

function showConfirmModal(message) {
    return new Promise((resolve) => {
        const confirmModal = document.getElementById("confirm-modal");
        const yesBtn = document.getElementById("confirm-modal-yes");

        document.getElementById("confirm-modal-message").innerText = message;
        confirmModal.classList.add("modal-active");

        const handleYes = () => {
            cleanup();
            resolve(true);
        };

        const cleanup = () => {
            yesBtn.removeEventListener("click", handleYes);
            closeConfirmModal();
        };

        yesBtn.addEventListener("click", handleYes);
    });
}

function closeConfirmModal() {
    document.getElementById("confirm-modal").classList.remove("modal-active");
}

// ==========================================
// 2. FETCH OWN LISTINGS FUNCTIONALITY
// ==========================================
async function fetchHostListings() {
    const gridContainer = document.getElementById("listings-grid");
    if (!gridContainer) return;
    
    gridContainer.innerHTML = `<p class="empty-msg">Loading your properties from Atlas...</p>`;

    try {
        const response = await fetch(`/api/host/my-listings?hostProfileId=${CURRENT_HOST_ID}`);        
        if (!response.ok) throw new Error("Failed to fetch listings data");
        
        const listings = await response.json();
        gridContainer.innerHTML = ""; 

        if (listings.length === 0) {
            gridContainer.innerHTML = `<p class="empty-msg">You haven't posted any accommodations yet.</p>`;
            return;
        }

        listings.forEach(listing => {
            const card = document.createElement("div");
            card.className = "listing-card"; 
            
            const escapedName = (listing.name || "Untitled").replace(/'/g, "\\'");
            const escapedLoc = (listing.locationID || "Not Specified").replace(/'/g, "\\'");
            const escapedType = (listing.type || "Property").replace(/'/g, "\\'");
            const escapedDesc = (listing.description || "").replace(/'/g, "\\'").replace(/\n/g, " ");
            const escapedContact = (listing.contact || "").replace(/'/g, "\\'"); // Escaped contact variable

            const currentImg = (listing.images && listing.images.length > 0) ? listing.images[0] : (listing.image || '');
            const escapedImg = currentImg.replace(/'/g, "\\'");

            const displayPrice = Number(listing.price || 0).toLocaleString();
            const displayImg = currentImg || 'https://placehold.co/600x400?text=Property+Preview';

            card.innerHTML = `
                <img src="${displayImg}" alt="${listing.name}">
                <div class="card-info">
                    <h3>${listing.name}</h3>
                    <p class="loc"><i class="fa-solid fa-location-dot"></i> ${listing.locationID} • ${listing.type || 'Property'}</p>
                    <p class="loc" style="margin-top: 5px; font-size: 0.8rem; height: 35px; overflow: hidden;">${listing.description || 'No description provided.'}</p>
                    
                    <div class="price-row" style="margin-top: 15px; border-top: 1px solid #f0f0f0; padding-top: 10px;">
                        <div class="price">
                            <strong>₱${displayPrice}</strong> / night
                        </div>
                    </div>

                    <div class="host-card-actions" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px;">
                        <button class="btn-approve" style="padding: 8px;" 
                            onclick="setupEditForm('${listing._id}', '${escapedName}', ${listing.price || 0}, '${escapedLoc}', '${escapedImg}', '${escapedType}', '${escapedDesc}', '${escapedContact}')">
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
        document.getElementById("form-location").selectedIndex = 0; 
        document.getElementById("form-title").innerText = "Add a Listing";
        document.querySelector(".teal-submit-btn").innerText = "Save Listing Entry";
    }
}

async function handleCancel() {
    const nameField = document.getElementById("form-name").value;
    const descField = document.getElementById("form-desc").value;
    
    if (nameField || descField) {
        const confirmCancel = await showConfirmModal("Are you sure you want to discard your changes?");
        if (!confirmCancel) return;
    }
    
    const formContainer = document.getElementById("listing-form-container");
    if (formContainer) {
        formContainer.style.display = "none";
        document.getElementById("listing-form").reset();
        document.getElementById("form-listing-id").value = "";
        document.getElementById("form-location").selectedIndex = 0; 
        document.getElementById("form-title").innerText = "Add an Accommodation";
        document.querySelector(".teal-submit-btn").innerText = "Save Real Estate Data Entry";
    }
}

function setupEditForm(id, name, price, locationID, image, type, desc, contact) {
    const formContainer = document.getElementById("listing-form-container");
    if (!formContainer) return;

    formContainer.style.display = "block"; 
    document.getElementById("form-title").innerText = "Modify Listing Specifics";
    document.querySelector(".teal-submit-btn").innerText = "Update Listing Entry";
    
    document.getElementById("form-listing-id").value = id;
    document.getElementById("form-name").value = name; 
    document.getElementById("form-price").value = Number(price); 
    document.getElementById("form-location").value = locationID; 
    document.getElementById("form-image").value = image; 
    document.getElementById("form-type").value = type;
    document.getElementById("form-desc").value = desc;
    
    // Autofills the target input on edit mode trigger
    const contactInput = document.getElementById("form-contact");
    if (contactInput) contactInput.value = contact || "";

    formContainer.scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// 4. CREATE / EDIT SUBMISSION HANDLING
// ==========================================
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const mongoId = document.getElementById("form-listing-id").value;
    const isEditing = mongoId !== "";

    const rawPriceValue = document.getElementById("form-price").value;
    const cleanPriceNumber = Number(String(rawPriceValue).replace(/[^0-9.]/g, ""));
    const finalPrice = isNaN(cleanPriceNumber) ? 0 : cleanPriceNumber;

    const payload = {
        name: document.getElementById("form-name").value,
        price: finalPrice, 
        locationID: document.getElementById("form-location").value,
        type: document.getElementById("form-type").value,
        image: document.getElementById("form-image").value, 
        description: document.getElementById("form-desc").value,
        contact: document.getElementById("form-contact").value, // Captured value sent to database
        host: CURRENT_HOST_ID 
    };

    console.log(`✈️ ${isEditing ? 'Updating' : 'Creating'} payload:`, payload);

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

        showStatusModal(
            "Success", 
            isEditing ? "Listing details updated safely!" : "New listing added to profile!"
        );
        toggleForm();          
        fetchHostListings();   
    } catch (err) {
        console.error("Submission failed:", err);
        showStatusModal("Transaction Failure", err.message);
    }
}

// ==========================================
// 5. DELETE LISTING FUNCTIONALITY
// ==========================================
async function deleteListing(mongoId) {
    const confirmDelete = await showConfirmModal("Are you sure you want to delete this listing permanently?");
    if (!confirmDelete) return;

    try {
        const response = await fetch(`/api/host/listings/delete/${mongoId}`, { method: "DELETE" });
        if (response.ok) {
            showStatusModal("Removed", "Listing entry deleted successfully.");
            fetchHostListings(); 
        } else {
            const data = await response.json();
            showStatusModal("Failure", `Error encountered: ${data.message}`);
        }
    } catch (err) {
        console.error("Delete failed:", err);
        showStatusModal("Connection Failure", "Failed to reach server stack clustering.");
    }
}