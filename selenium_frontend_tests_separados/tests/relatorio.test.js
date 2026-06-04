const assert = require("assert");
const { By, BASE_URL, url, logOk, logStep, buildDriver, setFakeSession, exists, clickIfExists } = require("../helpers/setup");

async function testRelatorioPage() {
  logStep("Teste — relatorio.html");
  console.log("Base URL:", BASE_URL);

  const driver = await buildDriver();

  try {
    await setFakeSession(driver, "User");
    await driver.get(url("relatorio.html"));

    assert(await exists(driver, By.css(".reports-title")), "O título Relatórios não apareceu.");
    assert(await exists(driver, By.id("filter-room")), "Filtro Departamento não apareceu.");
    assert(await exists(driver, By.id("filter-type")), "Filtro Tipo não apareceu.");
    assert(await exists(driver, By.id("filter-period")), "Filtro Período não apareceu.");
    assert(await exists(driver, By.id("apply-filters")), "Botão Aplicar filtros não apareceu.");
    assert(await exists(driver, By.id("clear-filters")), "Botão Limpar não apareceu.");
    assert(await exists(driver, By.id("btn-export")), "Botão Exportar CSV não apareceu.");
    assert(await exists(driver, By.id("reports-table-body")), "Tabela de relatórios não apareceu.");

    await driver.findElement(By.id("filter-type")).sendKeys("Temperatura");
    await clickIfExists(driver, By.id("apply-filters"));
    await clickIfExists(driver, By.id("clear-filters"));

    logOk("relatorio.html tem filtros, tabela e ações principais.");
  } finally {
    await driver.quit();
  }
}

testRelatorioPage().catch((err) => {
  console.error("❌ Teste relatorio.html falhou:", err.message);
  process.exit(1);
});
