import os

from importer.import_pedigree import import_pedigree, PedigreeImportState


def test_import_whole_pedigree():

    import_pedigree()


def test_import_pedigree1():

    import_pedigree(pedigree_file_path=
                    os.path.join(os.path.abspath(os.path.dirname(__file__)), "resources",
                                 'import', 'test_pedigree1.csv'))

# TODO Add test that uses a common ancestor with f!= 0
