const assert = require("assert");
const { until } = require("selenium-webdriver");

const {
  By,
  BASE_URL,
  url,
  logOk,
  logStep,
  buildDriver,
  exists,
} = require("../helpers/setup");

async function testDepartamentosPage() {
  logStep("Teste — departamento.html");
  console.log("Base URL:", BASE_URL);

  const driver = await buildDriver();

  try {
    // 1. Abrir primeiro uma página do mesmo domínio
    await driver.get(url("login.html"));

    // 2. Criar sessão falsa para não ser redirecionado para login
    await driver.executeScript(`
      localStorage.setItem("token", "fake-token");
      localStorage.setItem("user", JSON.stringify({
        name: "User",
        role: "admin"
      }));
    `);

    // 3. Abrir a página que queremos testar
    await driver.get(url("departamento.html"));

    console.log("URL atual:", await driver.getCurrentUrl());
    console.log("Título atual:", await driver.getTitle());

    // 4. Esperar a página carregar
    await driver.wait(
      until.elementLocated(By.css(".page-title")),
      10000
    );

    await driver.wait(
      until.elementLocated(By.css(".filters-container")),
      10000
    );

    // 5. Validar título
    assert(
      await exists(driver, By.css(".page-title")),
      "O título Departamentos não apareceu."
    );

    const title = await driver.findElement(By.css(".page-title")).getText();

    assert(
      title.includes("Departamentos"),
      "O título não contém Departamentos."
    );

    // 6. Validar estatísticas principais
    assert(
      await exists(driver, By.id("total-rooms")),
      "Estatística total-rooms não apareceu."
    );

    assert(
      await exists(driver, By.id("rooms-ok")),
      "Estatística rooms-ok não apareceu."
    );

    assert(
      await exists(driver, By.id("rooms-warning")),
      "Estatística rooms-warning não apareceu."
    );

    assert(
      await exists(driver, By.id("rooms-alert")),
      "Estatística rooms-alert não apareceu."
    );

    // 7. Validar existência dos filtros
    const filters = await driver.findElements(By.css(".filter-btn"));

    assert(
      filters.length >= 4,
      "Devia haver pelo menos 4 filtros: Todos, Temperatura, Humidade e Iluminação."
    );

    // 8. Testar filtros um a um
    for (const filter of ["all", "temperature", "humidity", "light"]) {
      const selector = `.filter-btn[data-filter='${filter}']`;

      await driver.wait(
        until.elementLocated(By.css(selector)),
        10000
      );

      await driver.executeScript(`
        const btn = document.querySelector("${selector}");
        if (btn) {
          btn.scrollIntoView({ block: "center" });
          btn.click();
        }
      `);

      await driver.wait(async () => {
        const btnAtual = await driver.findElement(By.css(selector));
        const classes = await btnAtual.getAttribute("class");
        return classes.includes("active");
      }, 5000);

      const btnAtual = await driver.findElement(By.css(selector));
      const classes = await btnAtual.getAttribute("class");

      assert(
        classes.includes("active"),
        `O filtro ${filter} não ficou ativo.`
      );

      console.log(`✅ Filtro ${filter} ficou ativo.`);
    }

    logOk("departamento.html tem título, estatísticas e filtros funcionais.");
  } finally {
    await driver.quit();
  }
}

testDepartamentosPage().catch((err) => {
  console.error("❌ Teste departamento.html falhou:", err.message);
  process.exit(1);
});