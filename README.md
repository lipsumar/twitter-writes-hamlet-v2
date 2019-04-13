
## Setup

### 1. Database

Optionally, regenerate the seed files (seed files are in the repo already):

```bash
npm run build
npm run generate-seed
```

Launch database:

```bash
docker-compose up -d mongo
```

Seed database:

```bash
docker-compose up mongo-seed
```

Database is now running in detached mode, all data and indexes are loaded.


### 2. Server

```bash
docker-compose up -d app
```

### Dev setup

```bash
docker-compose up --build app-dev
```