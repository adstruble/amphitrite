import logging
import logging.config
import logging.handlers
import os
from typing import Any, Dict, Optional

cli_logger_name = 'amphitrite.cli'

loglevel_file = '/amphitrite/logs/loglevel'

logging_configured = False


def get_logger(*suffix: str) -> logging.Logger:
    """Get a logger configured for this package.

    :param suffix: An optional "subclass" for the package logger. Uses the remaining args
        to this function to join the package: `<package_name>.<arg1>.<arg2>`
    """
    logger: logging.Logger = generate_logger('amphitrite', *suffix)
    return logger


def generate_logger(package_name: str, *suffix: str) -> logging.Logger:
    """
    Get a logger configured for a package.

    :param package_name: The package in which the module resides. If there is no package,
        this is just the name for the logger.
    :param suffix: An optional "subclass" for the package logger. Uses the remaining args
        to this function to join the package: `<package_name>.<arg1>.<arg2>`
    """
    global logging_configured
    if not logging_configured:
        logging.config.dictConfig(get_logging_config(_get_log_level()))
    logging_configured = True
    if suffix and len(suffix) > 0:
        full_suffix = '.'.join(suffix)
        return logging.getLogger(f'{package_name}.{full_suffix}')
    else:
        return logging.getLogger(package_name)


def reset_logging_cfg():
    global logging_configured
    logging_configured = False


def generate_cli_logger(*suffix: str) -> logging.Logger:
    """
    Get a logger configured for a cli. This should only be called in a CLI context

    :param suffix: An optional "subclass" for the logger. Uses the remaining args
        to this function to join the base name: `<logger_base_name>.<arg1>.<arg2>`
    """
    logging.config.dictConfig(get_logging_config(_get_log_level()))
    return generate_logger(cli_logger_name, *suffix)


def get_logging_config(loglevel: str = None) -> Dict[str, Any]:
    """
    Get a valid logging dict config
    """
    if not loglevel:
        loglevel = _get_log_level()

    return {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'default': {
                'format': '%(asctime)s [%(levelname)8s] %(name)s (%(filename)s:%(lineno)s): %(message)s'
            },
        },
        'handlers': {
            'amphitrite': get_trf(loglevel, 'amphitrite.app.log'),
            'gerror': get_trf(loglevel, 'server.error.log'),
            'gaccess': get_trf(loglevel, 'server.access.log'),
            'alllogsfile': get_trf(loglevel, 'amphitrite.log'),
            'cli': get_trf(loglevel, 'amphitrite.cli.log'),
            'console': {
                'class': 'logging.StreamHandler',
                'level': loglevel,
                'formatter': 'default',
                'stream': 'ext://sys.stdout'
            },
        },
        'loggers': {
            '': {
                'level': loglevel, 'handlers': ['console', 'alllogsfile']
            },
            'gunicorn.access': {
                'level': loglevel, 'handlers': ['gaccess']
            },
            'gunicorn.error': {
                'level': loglevel, 'handlers': ['gerror'],
            },
            'amphitrite': {
                'level': loglevel, 'handlers': ['amphitrites']
            },
            cli_logger_name: {
                'level': loglevel, 'handlers': ['cli']
            }
        }
    }


def get_trf(loglevel: str, filename: str) -> Dict[str, Any]:
    """
    Get a logging configuration for a `TimedRotatingFileHandler`. Default location
    if LOG_BASE_DIR environment variable is not specified is `/tmp`
    """
    tmp_dir = os.path.join(os.path.sep, 'tmp')

    return {
        'class': 'logging.handlers.TimedRotatingFileHandler',
        'level': loglevel,
        'formatter': 'default',
        'filename': os.path.join(
            os.getenv('LOG_BASE_DIR', tmp_dir), filename),
        'encoding': 'utf-8',
        'interval': 1,
        'when': 'h',
        'utc': True
    }


def _get_log_level() -> Optional[str]:
    """
    Get the loglevel configured for this environment. First look for a loglevel file. If the file
    is not found, look for a level in environment variables. Callers will have to handle the case
    that no log level configuration is found in either of those two locations.
    """
    try:
        with open(loglevel_file) as f:
            ll = f.read().strip()
    except OSError:
        ll = os.getenv('LOG_LEVEL', 'INFO')
    return ll
