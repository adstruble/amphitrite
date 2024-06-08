import os

from amphi_logging.logger import get_logger

logger = get_logger()


def get_integer_env_variable(env_var_name: str, default_value: int) -> int:
    """
    Fetch environment variable and check it is a valid integer. Catches the case where the environment variable
    is set to ''
    :param env_var_name: name of the environment variable
    :param default_value: default
    :return: the environment variable as an integer or the default
    """
    env_var = os.getenv(env_var_name, None)
    if env_var:
        try:
            return int(env_var)
        except ValueError:
            logger.getLogger('amphi_utils').warning(
                f"Environment variable {env_var_name} is not a valid integer: {env_var}. "
                f"Defaulting to {default_value}")
            return default_value
    return default_value
