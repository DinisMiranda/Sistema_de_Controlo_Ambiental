const { spawnSync } = require("child_process");

const tests = [
  "tests/login.test.js",
  "tests/dashboard.test.js",
  "tests/departamento.test.js",
  "tests/relatorio.test.js",
  "tests/sistema.test.js",
  "tests/admin.test.js",
];

let passed = 0;

for (const test of tests) {
  console.log(`\n==============================`);
  console.log(`A executar: ${test}`);
  console.log(`==============================`);

  const result = spawnSync("node", [test], { stdio: "inherit", shell: true });

  if (result.status !== 0) {
    console.error(`\n❌ Parou porque falhou: ${test}`);
    process.exit(result.status || 1);
  }

  passed++;
}

console.log(`\n🎉 Todos os testes passaram: ${passed}/${tests.length}`);
