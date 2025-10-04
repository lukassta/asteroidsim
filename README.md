# ASTEROIDsim

## Setup
1. Install (docker)[https://www.docker.com/get-started/]
2. Download and unzip population map dataset (250m 1.1GB)[https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/GHS_POP_GPW4_GLOBE_R2015A/GHS_POP_GPW42015_GLOBE_R2015A_54009_250/] (1km 155MB)[https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/GHS_POP_GPW4_GLOBE_R2015A/GHS_POP_GPW42015_GLOBE_R2015A_54009_1k/]
3. Put datasets in datasets directory
4. Copy .env.example file and rename it to .env
5. Change .env variables to your liking
6. Run setup script:
```bash
docker compose build
```
7. Run backend database migrations:
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
