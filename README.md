# amphitrite

x-selection software

## Building
### Requirements
Docker
Node.js v 22.17 or later
### To build everything
From root amphitrite directory:

python build.py build-all

## Running (as in production)
docker-compose -f docker-compose-prod.yaml up

To login point browser to: http://localhost:80/ or http://127.0.0.1:80/

## Running locally (dev mode)
Start Postgres only (same configuration as production)
docker-compose -f docker-compose-postgres.yaml up -d 

### Server from amphitrite/amphitrite
Run from amphitrite/amphitrite dir as this is the directory the app is run from when in the docker container.
sh src/app/boot.sh dev

To hit server endpoints: http://127.0.0.1:5001/
For example:
http://127.0.0.1:5001/getPerson

### Client from amphitrite/client
yarn start

To login point browser to: http://localhost:3000/

Note: Using yarn start uses the react dev server client/src/setupProxy.js fixes the URLs to remove the /amphitrite that the amphitrite server does note expect as part of the URL string 

### Debugging client from intellij
(1) Create a run/debug configuration of the JavaScript Debug type
(2) Specify http://localhost:3000 as URL
