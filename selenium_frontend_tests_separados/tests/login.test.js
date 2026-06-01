const assert = require("assert");
const { By, BASE_URL, url, logOk, logStep, buildDriver, exists } = require("../helpers/setup");

async function testLoginPage() {
  logStep("Teste — login.html");
  console.log("Base URL:", BASE_URL);

  const driver = await buildDriver();

  try {
    await driver.get(url("login.html"));

    assert(await exists(driver, By.id("login-form")), "O formulário de login não apareceu.");
    assert(await exists(driver, By.id("email")), "O input email não apareceu.");
    assert(await exists(driver, By.id("password")), "O input password não apareceu.");
    assert(await exists(driver, By.css("button[type='submit']")), "O botão Entrar não apareceu.");

    const title = await driver.getTitle();
    assert(title.includes("EcoControl") || title.includes("Login"), "O título da página de login está inesperado.");

    const emailRequired = await driver.findElement(By.id("email")).getAttribute("required");
    const passwordRequired = await driver.findElement(By.id("password")).getAttribute("required");
    assert(emailRequired !== null, "O campo email devia ser obrigatório.");
    assert(passwordRequired !== null, "O campo password devia ser obrigatório.");

    logOk("login.html tem formulário, email, password e botão Entrar.");
  } finally {
    await driver.quit();
  }
}

testLoginPage().catch((err) => {
  console.error("❌ Teste login.html falhou:", err.message);
  process.exit(1);
});
