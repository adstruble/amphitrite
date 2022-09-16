#!/bin/bash

#flask db upgrade
#flask translate compile

exec gunicorn -b :5000 --access-logfile - --error-logfile - amphitrite:app
