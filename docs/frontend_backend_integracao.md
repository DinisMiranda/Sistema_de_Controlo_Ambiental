# Frontend — Ligação ao Backend

## Visão Geral

O frontend é composto por páginas HTML estáticas com JavaScript vanilla. A comunicação com o backend é feita exclusivamente via **fetch API**, enviando pedidos HTTP à REST API do backend (Node.js + Express) que corre em `http://localhost:3001` em desenvolvimento.

---

## Estrutura de Ficheiros

```
frontend/
└── html/
    ├── Js/
    │   ├── config.js               ← URL base da API
    │   ├── auth.js                 ← Login, sessão, token, fetchWithAuth
    │   ├── session.js              ← Gestão da sessão no localStorage
    │   ├── dashboard.js            ← Pedidos ao backend para o dashboard
    │   ├── departamento.js         ← Pedidos para listagem de departamentos (casas)
    │   ├── detalhe_departamento.js ← Sensores, leituras e atuadores por departamento
    │   ├── sistema.js              ← Vista geral do sistema
    │   ├── relatorio.js            ← Relatórios de consumo
    │   ├── sensors.js              ← Utilitário de sensores
    │   └── admin.js                ← Painel de administração
    ├── login.html
    ├── dashboard.html
    ├── departamento.html
    ├── detalhe_departamento.html
    ├── sistema.html
    ├── relatorio.html
    └── admin.html
```

---

## Configuração da URL da API

O ficheiro `Js/config.js` define o endereço base da API de forma dinâmica:

```js
window.CONFIG = {
  API_BASE:
    window.location.hostname === "localhost"
      ? "http://localhost:3001"
      : "https://your-production-api.com",
};
```

Todos os outros ficheiros JS acedem à URL através de `window.CONFIG.API_BASE`. Para alterar o endereço do backend em produção, basta editar este ficheiro.

---

## Autenticação e Sessão

A autenticação é gerida inteiramente em `Js/auth.js`.

### Fluxo de Login

1. O utilizador preenche o formulário em `login.html`
2. O `auth.js` envia um `POST /api/auth/login` com `{ email, password }`
3. O backend responde com `{ token, user }`
4. O token e os dados do utilizador são guardados no `localStorage`
5. O utilizador é redireccionado para `dashboard.html`

```js
// Exemplo simplificado do pedido de login
const response = await fetch(`${API_BASE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const data = await response.json();
localStorage.setItem("token", data.token);
localStorage.setItem("user", JSON.stringify(data.user));
```

### Token Bearer

Todos os pedidos autenticados usam a função `fetchWithAuth()`, que injeta automaticamente o token no header:

```js
headers.Authorization = `Bearer ${token}`;
```

Se o backend responder com `401`, a sessão é limpa e o utilizador é redireccionado para `login.html`.

### Verificação de Sessão

Cada página protegida chama `requireAuth()` no carregamento:

```js
// No início de cada página protegida
await requireAuth(); // redireciona para login.html se não autenticado
```

Internamente, `requireAuth()` faz um `GET /api/auth/me` para validar o token junto ao backend.

---

## Pedidos ao Backend por Página

### `dashboard.js`
- `GET /api/sensores` — lista sensores para mostrar no dashboard
- `GET /api/atuadores` — lista atuadores ativos
- `GET /api/consumption` — resumo de consumo (admin)

### `departamento.js`
- `GET /api/sensores` — lista sensores/departamentos disponíveis

### `detalhe_departamento.js`
- `GET /api/sensores/:id` — detalhe de um sensor
- `GET /api/sensors/:id/readings` — leituras de um sensor com filtros opcionais (`?start=`, `?end=`, `?minValue=`, `?maxValue=`)
- `GET /api/atuadores/:id` — detalhe de um atuador
- `GET /api/actuators/:id/actions` — histórico de ações de um atuador
- `POST /api/actuators/:id/actions` — registar nova ação

### `relatorio.js`
- `GET /api/sensors/:id/consumption` — consumo por sensor
- `GET /api/consumption` — consumo global (admin)

### `sistema.js`
- `GET /api/sensores` — visão geral de sensores
- `GET /api/atuadores` — visão geral de atuadores
- `GET /api/tipos` — tipos disponíveis no sistema

### `admin.js`
- CRUD completo de sensores, atuadores e tipos via endpoints `/api/sensores`, `/api/atuadores`, `/api/tipos` (requer token de admin)
- `GET/POST/PATCH/DELETE` conforme a operação

---

## Tratamento de Erros

Todos os pedidos verificam `response.ok` antes de processar os dados. Em caso de erro:
- **401** → sessão limpa + redirect para `login.html`
- **403** → mensagem de "sem permissão" na interface
- **404 / 500** → mensagem de erro visível ao utilizador

---

## Como Arrancar (Desenvolvimento)

### 1. Iniciar o backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env com os dados da BD
npm run dev
# Backend disponível em http://localhost:3001
```

### 2. Abrir o frontend

Servir a pasta `frontend/` com um servidor HTTP local (ex.: `python3 -m http.server 5173`) e abrir:

```
http://localhost:5173/html/login.html
```

> ⚠️ O frontend usa `window.location.hostname === "localhost"` para detetar o ambiente. Garantir que o backend está a correr na porta **3001** antes de abrir o frontend.

---

## Notas

- O frontend **não usa nenhuma framework** (sem React, Vue, etc.) — é HTML + CSS + JavaScript vanilla.
- Toda a comunicação é **assíncrona** via `async/await` e `fetch`.
- O token é armazenado em `localStorage` — não é seguro para produção. Em produção deve usar `httpOnly cookies`.
- O ficheiro `config.js` deve ser o **único lugar a alterar** para apontar para um backend diferente.
