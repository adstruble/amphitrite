import os
from db_utils.core import execute_statements, ResultType
from importer.import_master import import_master_data
from importer.import_pedigree import import_pedigree


def test_import_masterdata():
    class MockTempDir:
        name = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'resources/import')

    results = import_master_data(MockTempDir(), 'amphiadmin', '20220929', 'masterdata_20220929.csv')
    assert 1 == len(results)
    assert 'success' in results.keys()

    assert 3583 == execute_statements("SELECT COUNT(*) FROM fish", 'amphiadmin').get_single_result()

    assert 268725 == execute_statements(
        "SELECT count(DISTINCT id) FROM gene WHERE fish = ANY (SELECT id FROM fish)",
        'amphiadmin').get_single_result()
    gene_count = execute_statements(
        "SELECT DISTINCT(count(*)) FROM gene JOIN fish ON gene.fish = fish.id GROUP BY fish;",
        'amphiadmin').row_results
    assert len(gene_count) == 1
    assert 75 == gene_count[0][0]

    assert 291 == execute_statements("SELECT COUNT(*) FROM family", "amphiadmin").get_single_result()

    birth_years = execute_statements(
        'select distinct sibling_birth_year from family order by sibling_birth_year DESC',
        'amphiadmin').row_results

    assert 2023 == birth_years[0][0]
    assert 2022, birth_years[1][0]


