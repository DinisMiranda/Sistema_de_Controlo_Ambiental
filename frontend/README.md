# SCA Frontend

Web interface for the Environmental Control System (React + Vite + TypeScript).

## Scripts

- `npm run dev` – development server (http://localhost:5173)
- `npm run build` – production build
- `npm run preview` – preview production build
- `npm run lint` – ESLint

## Environment variables

- `VITE_API_URL` – API base URL (e.g. `http://localhost:3001`). In development, Vite proxies requests to `/api`, so you can leave this empty or use the same origin.

## Structure

- `src/pages/` – pages (Dashboard, Sensores, Atuadores)
- `src/components/` – reusable components (Layout)
- The frontend calls the API at `/api/*` (proxied to the backend in dev).
