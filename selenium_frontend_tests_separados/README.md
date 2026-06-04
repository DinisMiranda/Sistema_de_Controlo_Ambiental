# Testes Selenium Frontend — Separados

Estes testes estão separados por página para ser mais fácil correr, corrigir e apresentar ao professor.

## Estrutura

```text
selenium_frontend_tests_separados/
├── helpers/
│   └── setup.js
├── tests/
│   ├── login.test.js
│   ├── dashboard.test.js
│   ├── departamento.test.js
│   ├── relatorio.test.js
│   ├── sistema.test.js
│   └── admin.test.js
├── run-all-tests.js
├── package.json
└── README.md
```

## Instalar dependências

Dentro da pasta dos testes:

```powershell
npm install
```

## Abrir o frontend

Antes dos testes, abre o projeto com Live Server.

O link esperado por defeito é:

```text
http://127.0.0.1:5500/Sistema_de_Controlo_Ambiental/frontend/html/
```

Se o teu Live Server estiver diferente, define a BASE_URL.

Exemplo:

```powershell
$env:BASE_URL="http://127.0.0.1:5500/frontend/html/"
```

## Correr todos os testes

```powershell
npm test
```

## Correr um teste de cada vez

```powershell
npm run test:login
npm run test:dashboard
npm run test:departamento
npm run test:relatorio
npm run test:sistema
npm run test:admin
```

Também podes correr diretamente:

```powershell
node tests/login.test.js
node tests/dashboard.test.js
node tests/departamento.test.js
node tests/relatorio.test.js
node tests/sistema.test.js
node tests/admin.test.js
```

## Modo sem abrir janela do Chrome

```powershell
$env:HEADLESS="true"
npm test
```

## Observação

Os testes usam uma sessão falsa no `localStorage` para abrir páginas protegidas do frontend sem depender do backend. Isto é normal para testes focados apenas no frontend.
