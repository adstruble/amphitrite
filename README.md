# amphitrite

x-selection software

## Building
### Requirements
Docker
### To build everything
From root amphitrite directory:

python build.py build-all

## Running (as in production)
docker-compose -f docker-compose-prod.yaml up

To login point browser to: http://localhost:80/ or http://127.0.0.1:80/

## Running locally (dev mode)
Start Postgres only (same configuration as production)
docker-compose -f docker-compose-postgres.yaml up -d 

### Server from amphitrite/amphitrite/src/app
sh boot.sh dev

To hit server endpoints: http://127.0.0.1:5001/
For example:
http://127.0.0.1:5001/getPerson

### Client from amphitrite/client
yarn start

To login point browser to: http://localhost:3000/

Note: Using yarn start uses the react dev server client/src/setupProxy.js fixes the URLs to remove the /amphitrite that the amphitrite server does note expect as part of the URL string 

