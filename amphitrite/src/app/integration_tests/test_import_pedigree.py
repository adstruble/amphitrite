import os

from importer.import_pedigree import maybe_import_pedigree

RESOURCES = os.path.join(os.path.dirname(__file__), '..', 'tests', 'resources', 'import')


def test_pedigree_already_seeded_is_skipped():
    # The session seed fixture already imported the pedigree; maybe_import_pedigree must detect the
    # existing data and no-op (return False) rather than re-importing.
    assert maybe_import_pedigree() is False


def test_import_pedigree1_skipped_when_seeded():
    assert maybe_import_pedigree(
        pedigree_file_path=os.path.join(RESOURCES, 'test_pedigree1.csv')) is False
