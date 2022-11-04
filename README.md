# amphitrite

x-selection software

## Building
### To build everything
From root amphitrite directory:

python build.py build-all

## Running (as in production)
docker-compose -f docker-compose-prod.yaml up

To login point browser to: http://localhost:80/ or http://127.0.0.1:80/

## Running locally (dev mode)
### Server from amphitrite/amphitrite
flask run

To hit server endpoints: http://127.0.0.1:5000/amphitrite
For example:
http://127.0.0.1:5000/amphitrite/getPerson
### Client from amphitrite/client
yarn start

To login point browser to: http://localhost:3000/
