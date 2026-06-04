const assert = require("assert");
const { By, BASE_URL, url, logOk, logStep, buildDriver, setFakeSession, exists } = require("../helpers/setup");

async function testDashboardPage() {
  logStep("Teste — dashboard.html");
  console.log("Base URL:", BASE_URL);

  const driver = await buildDriver();

  try {
    await setFakeSession(driver, "User");
    await driver.get(url("dashboard.html"));

    assert(await exists(driver, By.css(".header-title")), "O título do dashboard não apareceu.");
    const heading = await driver.findElement(By.css(".header-title")).getText();
    assert(heading.includes("Dashboard"), "O título não contém Dashboard.");

    assert(await exists(driver, By.id("room-select")), "O seletor de sala não apareceu.");
    assert(await exists(driver, By.id("btn-temp")), "O botão Ver Temperatura não apareceu.");
    assert(await exists(driver, By.id("btn-humidity")), "O botão Ver Humidade não apareceu.");
    assert(await exists(driver, By.id("btn-light")), "O botão Ver Iluminação não apareceu.");
    assert(await exists(driver, By.id("toggle-mode")), "O botão Alterar modo não apareceu.");

    const modeBefore = await driver.findElement(By.id("control-mode")).getText();
    await driver.findElement(By.id("toggle-mode")).click();
    await driver.sleep(300);
    const modeAfter = await driver.findElement(By.id("control-mode")).getText();
    assert.notStrictEqual(modeBefore, modeAfter, "O botão Alterar modo não mudou o modo.");

    logOk("dashboard.html carrega elementos principais e alterna modo Automático/Manual.");
  } finally {
    await driver.quit();
  }
}

testDashboardPage().catch((err) => {
  console.error("❌ Teste dashboard.html falhou:", err.message);
  process.exit(1);
});
