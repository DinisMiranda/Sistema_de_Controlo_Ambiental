const assert = require("assert");
const { By, BASE_URL, url, logOk, logStep, buildDriver, setFakeSession, exists } = require("../helpers/setup");

async function testAdminPage() {
  logStep("Teste — admin.html");
  console.log("Base URL:", BASE_URL);

  const driver = await buildDriver();

  try {
    await setFakeSession(driver, "Admin");
    await driver.get(url("admin.html"));

    assert(await exists(driver, By.xpath("//h1[contains(., 'Admin Dashboard')]")), "O Admin Dashboard não apareceu.");
    assert(await exists(driver, By.id("users-table")), "Tabela de utilizadores não apareceu.");

    for (const tab of ["users", "homes", "sensors-actuators", "parameters", "types", "history"]) {
      const btn = await driver.findElement(By.css(`.tab-btn[data-tab='${tab}']`));
      await btn.click();
      await driver.sleep(200);
      const content = await driver.findElement(By.id(`tab-${tab}`));
      const display = await content.getCssValue("display");
      assert(display !== "none", `A tab ${tab} não ficou visível.`);
    }

    await driver.findElement(By.css(".tab-btn[data-tab='users']")).click();
    await driver.findElement(By.id("add-user")).click();
    assert(await exists(driver, By.id("user-modal")), "O modal de adicionar utilizador não apareceu.");

    logOk("admin.html tem tabs principais e abre modal de utilizador.");
  } finally {
    await driver.quit();
  }
}

testAdminPage().catch((err) => {
  console.error("❌ Teste admin.html falhou:", err.message);
  process.exit(1);
});
