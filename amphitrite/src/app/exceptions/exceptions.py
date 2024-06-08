from typing import List


class AmphitriteException(Exception):
    pass


class DBConnectionError(AmphitriteException):
    pass


class SharedStateManagerError(AmphitriteException):
    pass


class AmphitriteEnvironmentError(AmphitriteException):
    pass


class BadFishDataDuplicateTag(AmphitriteException):
    def __init__(self, tag,):
        self.message = f"Duplicate tag of value: {tag} found"
        super().__init__(self.message)


class BadFishDataTagFormatWrong(AmphitriteException):
    def __init__(self, tag,):
        self.message = f"Incorrectly format tag: {tag} found"
        super().__init__(self.message)


class UploadCrossesError(AmphitriteException):
    @classmethod
    def bad_csv_format(cls, cols_present: List):
        message = "Not a valid recommended crosses sheet. Must be in csv format containing columns labeled: " \
                  f"Date, Male, Female, MFG.*."
        required_cols = {'Date', 'Male', 'Female', 'MFG'}
        if len(cols_present) > len(required_cols):
            for col in required_cols:
                cols_present.remove(col)
            message += f"The following cols are present more than once: {cols_present}"

        else:
            missing_cols = required_cols - set(cols_present)
            if len(missing_cols) != len(required_cols):
                # If all columns are missing we'll assume it's not formatted correctly.
                message += f"The following cols are missing: {missing_cols}"
        return cls(message)

    def __init__(self, message):
        self.message = f"Error uploading recommended crosses sheet: {message}"
        super().__init__(self.message)


class WildTypeCrossedMultipleTimes(AmphitriteException):
    def __init__(self, parent):
        self.message = f"WT Fish {parent} being crossed multiple times must be handled in f calculation. Go write code"
        super().__init__(self.message)


class WildTypeCrossedWithRefugeInWild(AmphitriteException):
    def __init__(self, parent, parent2):
        self.message = f"WT Fish and refuge fish crossed in wild should be impossible? Parents: {parent} {parent2}"
        super().__init__(self.message)