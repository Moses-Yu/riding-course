## Riding Course – Documentation

This folder contains the documentation for the Riding Course project. The app lets riders share and browse great riding routes by pasting a Naver Map route share link; the server parses and normalizes the link, and the community can add photos, comments, likes, and bookmarks.

### Contents
- [Development setup](./development.md)
- [Architecture](./architecture.md)
- [Backend and data model](./backend.md)
- [API reference](./api.md)
- [Client (Expo) guide](./client.md)
- [Deployment](./deployment.md)
- [Security notes](./security.md)

### Quickstart
1) Backend
- Create `.env` in `server/` (see development guide) and start MySQL (Docker one-liner provided)
- Install deps, run Alembic migrations, and start FastAPI with Uvicorn

2) Client
- From `client/`, run `npm install` then `npm run dev` to open Expo and test against your local API

See details in [development setup](./development.md).


