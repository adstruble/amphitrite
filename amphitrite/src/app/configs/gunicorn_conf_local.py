#!/usr/bin/env python3
import configs.gunicorn_conf_common as Config

########################################
# Common Configurations
########################################
bind = Config.bind


########################################
# Custom Configurations for Instance
########################################
workers = 2
threads = 2
reload = True

########################################
# Server event hooks
########################################
on_starting = Config.on_starting
