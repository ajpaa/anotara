document.getElementById("listingForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
        hostId: document.getElementById("hostId").value,
        contact: document.getElementById("contact").value,
        location: document.getElementById("location").value,
        price: document.getElementById("price").value
    };

    const res = await fetch("/listings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
    });

    const data = await res.json();
    console.log("Saved:", data);

    // 🔥 redirect AFTER success
    window.location.href = "/browseListing";
});