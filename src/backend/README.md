# ASTEROIDsim

## Setup
1. Install (docker)[https://www.docker.com/get-started/]
2. Copy .env.example file and rename it to .env
3. Change .env variables to your liking
4. Run setup script:
```bash
docker compose build
```
5. Run backend database migrations:
```bash
docker compose run backend python manage.py migrate
```

## Usage
To start all needed services run command:
```bash
  docker compose up
```

To clean up docker you can run:
```bash
  docker compose down
```


## Development
### Backend
After changing backend models run: **(!IMPORTANT!)**
```bash
docker compose run backend python manage.py makemigrations
docker compose run backend python manage.py migrate
```
