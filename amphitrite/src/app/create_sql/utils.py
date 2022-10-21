def get_version_from_migration_filename(filename):
    return filename.split('V')[1].split('.')[:-1]
