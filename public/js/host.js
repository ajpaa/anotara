// ==========================================
// 1. AUTH LOGIC & DASHBOARD PROTECTION
// ==========================================
const loggedInUserSession = localStorage.getItem('user');
let parsedSessionData = loggedInUserSession ? JSON.parse(loggedInUserSession) : null;

if (!parsedSessionData || parsedSessionData.role !== 'host') {
    console.warn("⚠️ No host session detected. Provisioning dev profile staging parameters matching Atlas mock entries.");
    parsedSessionData = {
        _id: "65f1a2b3c4d5e6f7a8b9c001",
        username: "DevHostTester",
        role: "host",
        hostProfileId: "65f1a2b3c4d5e6f7a8b9c002" 
    };
    localStorage.setItem('user', JSON.stringify(parsedSessionData));
}

const CURRENT_HOST_ID = parsedSessionData.hostProfileId;

window.updateBookingStatus = updateBookingStatus;
window.closeStatusModal = closeStatusModal;
window.closeConfirmModal = closeConfirmModal;

document.addEventListener("DOMContentLoaded", () => {
    fetchIncomingRequests();
});

// ==========================================
// 2. FETCH INCOMING BOOKINGS (WITH DATES INSTALLED)
// ==========================================
async function fetchIncomingRequests() {
    const container = document.getElementById("bookings-container");
    if (!container) return;
    
    container.innerHTML = `<p class="empty-msg" style="grid-column: 1/-1; text-align: center; color: #666;">Loading pending reservations...</p>`;

    try {
        const response = await fetch(`/api/bookings/host/${CURRENT_HOST_ID}`);
        if (!response.ok) throw new Error("Failed to load booking information.");

        const bookings = await response.json();
        console.log("INCOMING BOOKING DATA IN BROWSER:", bookings);
        
        container.innerHTML = ""; 

        if (bookings.length === 0) {
            container.innerHTML = `<p class="empty-msg" style="grid-column: 1/-1; text-align: center; color: #888; font-weight: 600; padding: 40px 0;">No pending booking requests at the moment.</p>`;
            return;
        }

        bookings.forEach(booking => {
            const card = document.createElement("div");
            card.className = "listing-card"; 
            
            const isApproved = booking.status === 'approved';
            const isRejected = booking.status === 'rejected';
            const statusColor = isApproved ? '#008486' : isRejected ? '#ff5a5f' : '#d48d3b';

            const details = booking.listingDetails;
            
            let listingName = "Unknown Accommodation Title";
            let displayPrice = "0";
            let listingImg = 'https://placehold.co/600x400?text=Listing+Preview';

            if (details) {
                listingName = details.name || listingName;
                displayPrice = details.price ? Number(details.price).toLocaleString() : "0";
                if (details.image) listingImg = details.image;
            } else if (booking.rawListingId) {
                listingName = `Listing ID Ref: ${booking.rawListingId}`;
            }

            const guestIdentifier = booking.guestName || 'Anonymous Guest';

            // 🎯 DATE FORMATTING: Convert UTC timestamps to localized date strings
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            const formattedStart = booking.startDate ? new Date(booking.startDate).toLocaleDateString(undefined, options) : 'N/A';
            const formattedEnd = booking.endDate ? new Date(booking.endDate).toLocaleDateString(undefined, options) : 'N/A';

            card.innerHTML = `
                <img src="${listingImg}" alt="${listingName}" style="width: 100%; height: 200px; object-fit: cover;">
                <div class="card-info" style="padding: 20px; display: flex; flex-direction: column; gap: 8px;">
                    <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #222;">${listingName}</h3>
                    
                    <p style="margin: 0; font-size: 0.9rem; color: #555;">
                        <i class="fa-solid fa-money-bill" style="color: #666; margin-right: 5px;"></i> 
                        <strong>Price Rate:</strong> ₱${displayPrice} / night
                    </p>

                    <p style="margin: 0; font-size: 0.9rem; color: #555;">
                        <i class="fa-solid fa-user-circle" style="color: #666; margin-right: 5px;"></i> 
                        <strong>Guest:</strong> ${guestIdentifier}
                    </p>

                    <p style="margin: 0; font-size: 0.9rem; color: #555;">
                        <i class="fa-solid fa-calendar-days" style="color: #666; margin-right: 5px;"></i> 
                        <strong>Timeline:</strong> ${formattedStart} — ${formattedEnd}
                    </p>
                    
                    <p style="margin: 0; font-size: 0.9rem; color: #555;">
                        <i class="fa-solid fa-clock-rotate-left" style="color: #666; margin-right: 5px;"></i> 
                        <strong>Status:</strong> <span style="font-weight: 700; color: ${statusColor}; text-transform: uppercase;">${booking.status}</span>
                    </p>
                    
                    ${booking.status === 'pending' ? `
                        <div class="booking-actions" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                            <button class="btn-approve" onclick="updateBookingStatus('${booking._id}', 'approved')" style="padding: 10px; background: #008486; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;">
                                <i class="fa-solid fa-circle-check"></i> Approve
                            </button>
                            <button class="btn-reject" onclick="updateBookingStatus('${booking._id}', 'rejected')" style="padding: 10px; background: #ff5a5f; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;">
                                <i class="fa-solid fa-circle-xmark"></i> Reject
                            </button>
                        </div>
                    ` : `
                        <div style="margin-top: 12px; padding: 8px; background: #f5f5f5; border-radius: 6px; text-align: center; font-size: 0.85rem; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.5px;">
                            Reservation Processed
                        </div>
                    `}
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error("Critical Host Booking Read Failure:", err);
        container.innerHTML = `<p class="empty-msg" style="grid-column: 1/-1; text-align: center; color: #ff5a5f; font-weight: 600;">Unable to load bookings. Please check your connection and try again.</p>`;
    }
}

// ==========================================
// 3. UPDATE ACTION TRANSACTION HANDLING (PUT)
// ==========================================
async function updateBookingStatus(bookingId, decision) {
    const actionText = decision === 'approved' ? 'approve' : 'reject';
    const messagePrompt = `Are you sure you want to ${actionText} this booking request?`;
    
    const decisionConfirmed = await showConfirmModal(messagePrompt);
    if (!decisionConfirmed) return;

    try {
        const response = await fetch(`/api/bookings/${bookingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: decision })
        });

        if (!response.ok) {
            const errorPayload = await response.json();
            throw new Error(errorPayload.error || "The server could not process this update.");
        }

        showStatusModal("Success", `The booking request has been successfully ${decision}!`);
        fetchIncomingRequests(); 
    } catch (err) {
        console.error("Booking transactional update failed:", err);
        showStatusModal("Error", err.message);
    }
}

// ==========================================
// 4. SYSTEM POPUP MODAL CONTROL LOGIC
// ==========================================
function showStatusModal(title, message) {
    const modal = document.getElementById("status-modal");
    if (!modal) {
        alert(`${title}: ${message}`);
        return;
    }
    document.getElementById("status-modal-title").innerText = title;
    document.getElementById("status-modal-message").innerText = message;
    modal.classList.add("modal-active");
}

function closeStatusModal() {
    const modal = document.getElementById("status-modal");
    if (modal) modal.classList.remove("modal-active");
}

function showConfirmModal(message) {
    return new Promise((resolve) => {
        const confirmModal = document.getElementById("confirm-modal");
        const yesBtn = document.getElementById("confirm-modal-yes");
        
        if (!confirmModal || !yesBtn) {
            return resolve(confirm(message));
        }

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
    const confirmModal = document.getElementById("confirm-modal");
    if (confirmModal) confirmModal.classList.remove("modal-active");
}