#!/usr/bin/env python3
import configs.gunicorn_conf_common as Config

########################################
# Common Configurations
########################################
bind = Config.bind
timeout = Config.timeout
preload_app = True

########################################
# Custom Configurations for Instance
########################################
workers = 2
threads = 2
user = 'amphitrite'
group = 'amphitrite'

########################################
# Server event hooks
########################################
on_starting = Config.on_starting
