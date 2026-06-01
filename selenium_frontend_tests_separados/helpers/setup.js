const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const BASE_URL = (process.env.BASE_URL || "http://127.0.0.1:5500/Sistema_de_Controlo_Ambiental/frontend/html/").replace(/\/?$/, "/");
const HEADLESS = String(process.env.HEADLESS || "false").toLowerCase() === "true";

function url(page) {
  return BASE_URL + page;
}

function logOk(msg) {
  console.log(`✅ ${msg}`);
}

function logStep(msg) {
  console.log(`\n🧪 ${msg}`);
}

async function buildDriver() {
  const options = new chrome.Options();
  options.excludeSwitches("enable-logging");
  options.addArguments("--log-level=3");
  options.addArguments("--silent");
  options.addArguments("--window-size=1366,900");
  if (HEADLESS) options.addArguments("--headless=new");

  return new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();
}

async function setFakeSession(driver, role = "User") {
  await driver.get(url("login.html"));
  await driver.executeScript(
    `localStorage.setItem("token", "token-falso-para-teste-frontend");
     localStorage.setItem("user", JSON.stringify({ name: "Sheldon Teste", email: "teste@sca.pt", role: arguments[0], admin: arguments[0] === "Admin" }));`,
    role
  );
}

async function exists(driver, locator, timeout = 5000) {
  try {
    await driver.wait(until.elementLocated(locator), timeout);
    return true;
  } catch {
    return false;
  }
}

async function clickIfExists(driver, locator, timeout = 3000) {
  if (await exists(driver, locator, timeout)) {
    const el = await driver.findElement(locator);
    await driver.wait(until.elementIsVisible(el), timeout).catch(() => {});
    await el.click();
    return true;
  }
  return false;
}

module.exports = {
  By,
  until,
  BASE_URL,
  url,
  logOk,
  logStep,
  buildDriver,
  setFakeSession,
  exists,
  clickIfExists,
};
