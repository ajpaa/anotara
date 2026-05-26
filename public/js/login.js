async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/login", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });

    if (res.ok) {
        const data = await res.json();
        localStorage.setItem("userRole", data.role); 
        window.location.href = "/";

    } else {
        alert("Invalid login");
    }
}
