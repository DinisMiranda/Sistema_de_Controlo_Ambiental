const assert = require("assert");
const { By, BASE_URL, url, logOk, logStep, buildDriver, setFakeSession, exists } = require("../helpers/setup");

async function testSistemaPage() {
  logStep("Teste — sistema.html");
  console.log("Base URL:", BASE_URL);

  const driver = await buildDriver();

  try {
    await setFakeSession(driver, "User");
    await driver.get(url("sistema.html"));

    assert(await exists(driver, By.css(".system-title")), "O título Sistema não apareceu.");
    assert(await exists(driver, By.id("system-name")), "Campo Nome do sistema não apareceu.");
    assert(await exists(driver, By.id("system-location")), "Campo Localização não apareceu.");
    assert(await exists(driver, By.id("system-timezone")), "Campo Fuso horário não apareceu.");
    assert(await exists(driver, By.id("global-mode")), "Campo Modo global não apareceu.");
    assert(await exists(driver, By.id("toggle-notifications")), "Toggle Notificações não apareceu.");
    assert(await exists(driver, By.id("temp-min")), "Range Temperatura mínima não apareceu.");
    assert(await exists(driver, By.id("btn-save-system")), "Botão Guardar alterações não apareceu.");

    const name = await driver.findElement(By.id("system-name"));

    await name.clear();
    await name.sendKeys("Sistema SCA Teste");

    const toggleCard = await driver.findElement(By.css("label.toggle-card"));
    await toggleCard.click();

    await driver.findElement(By.id("btn-save-system")).click();

    logOk("sistema.html tem configurações, toggles, ranges e botão guardar.");
  } finally {
    await driver.quit();
  }
}

testSistemaPage().catch((err) => {
  console.error("❌ Teste sistema.html falhou:", err.message);
  process.exit(1);
});
