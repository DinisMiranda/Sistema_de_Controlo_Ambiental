const user = JSON.parse(localStorage.getItem("user"));
if (!user || user.email !== "admin@edificio.com" || user.password !== "admin123") {
  location.href = "login.html";
}
