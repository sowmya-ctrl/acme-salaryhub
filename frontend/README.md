# ACME SalaryHub: frontend

React 19 + Vite + Material UI. See the [project README](../README.md) for setup, and [docs/architecture.md](../docs/architecture.md) for how the pieces fit together.

```bash
npm install
npm run dev     # http://localhost:5173, proxies /api to the backend on :8000
npm test        # Vitest + React Testing Library
npm run lint    # oxlint
npm run build   # production build into dist/ (served by the backend in Docker)
```

Layout of `src/`: `auth/` (login state, route guard), `layout/` (sidebar and top bar), `pages/`, `components/`, `services/` (API client, authenticated downloads), `utils/`, `theme.js`.
