class DBConnectionError(Exception):
    pass


class SharedStateManagerError(Exception):
    pass


class AmphitriteEnvironmentError(Exception):
    pass


class BadFishDataDuplicateTag(Exception):
    def __init__(self, tag,):
        self.message = f"Duplicate tag of value: {tag} found"
        super().__init__(self.message)


class BadFishDataTagFormatWrong(Exception):
    def __init__(self, tag,):
        self.message = f"Incorrectly format tag: {tag} found"
        super().__init__(self.message)