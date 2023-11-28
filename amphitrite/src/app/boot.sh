#!/bin/bash

SCRIPT_LOC="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_LOC" || exit
echo "Running from: $SCRIPT_LOC"
echo $(ls)

CONF="file:configs/gunicorn_conf_cluster.py"

if [ "$1" = "dev" ]; then
  echo "ENV: DEV"
  echo "Setting to use local conf file..."
  CONF="file:configs/gunicorn_conf_local.py"
  exec python ./start_manager.py &
else
  echo "ENV: CLUSTER"
  exec python /home/amphitrite/src/app/start_manager.py &
fi

exec gunicorn --access-logfile - --error-logfile - -c "$CONF" amphitrite:app
