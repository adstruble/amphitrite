from utils.server_state import get_server_manager

try:
    get_server_manager()
except: # noqa
    exit(1)
