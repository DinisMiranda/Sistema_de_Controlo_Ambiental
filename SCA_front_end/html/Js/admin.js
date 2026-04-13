const user = JSON.parse(localStorage.getItem("user"));
if (!user || user.email !== "admin@edificio.com") {
  location.href = "login.html";
}
