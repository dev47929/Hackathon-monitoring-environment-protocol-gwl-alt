# Run Project

## Backend
```bash
cd backend
npm install
npx prisma db push
npm run dev
```
Starts on port 3000.

## Frontend
```bash
cd hackproof-ai
npm install
npm run dev
```
Starts on port 3000. Use `npx vite --port=5173` if backend is already on 3000.

## Docker
```bash
docker compose up --build
```
Backend on 3000, frontend on 80. Run `docker compose logs tunnel` for the public tunnel URL.
