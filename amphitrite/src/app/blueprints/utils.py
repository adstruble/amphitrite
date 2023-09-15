def validate_param(param, valid_values, default=None):
    """
    Checks if given param value is one of given valid_values. If so, it will return it. If not, returns the
    default, if default is not given, None is returned
    :param param: Param to check for validity
    :param valid_values: possible valid values
    :param default:
    :return: param is value is valid, otherwise default if it is given, otherwise None
    """
    if param in valid_values:
        return param

    return default
