# Ridge Runner

Hill-climb rally game with a React/Vite client and Java Spring Boot API. Race results are stored in a local H2 database and shown on the run board.

## Requirements

- Java 25 or later
- Node.js 20 or later

## Run locally

From the project root, start the frontend:

```powershell
npm install
npm run dev
```

In a second terminal, start the API:

```powershell
Set-Location backend
.\mvnw.cmd spring-boot:run
```

Open the Vite URL printed in the first terminal. The frontend proxies `/api` requests to the Java server on port 8080. The H2 database is created under `backend/data`.

## API

- `GET /api/leaderboard` returns the personal best and top five runs.
- `POST /api/runs` saves a run with its distance, coins, and finish reason.

Run backend tests from the project root with `backend\mvnw.cmd test`.