document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("login-form");

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    console.log("username ", username);
    console.log("password ", password);
    const data = {
      username: username,
      password: password,
    };

    fetch("http://localhost:7000/login", {
      method: "POST", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
        alert("Login successful!");
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Login failed!");
      });
  });
});
