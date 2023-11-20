import os
from unittest import TestCase

from db_utils.core import execute_statements, ResultType
from importer.import_master import import_master_data


class Test(TestCase):
    def test_import_masterdata(self):
        class MockTempDir:
            name = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'resources/import')

        results = import_master_data(MockTempDir(), 'amphiadmin', '220929', 'masterdata_220929.csv')
        self.assertEqual(1, len(results))
        self.assertTrue('success' in results.keys())

        self.assertEqual(3583, execute_statements("SELECT COUNT(*) FROM fish", 'amphiadmin').get_single_result())

        self.assertEqual(268725, execute_statements(
            "SELECT count(DISTINCT id) FROM gene WHERE fish = ANY (SELECT id FROM fish)",
            'amphiadmin').get_single_result())
        gene_count = execute_statements(
            "SELECT DISTINCT(count(*)) FROM gene JOIN fish ON gene.fish = fish.id GROUP BY fish;",
            'amphiadmin').row_results
        self.assertEqual(len(gene_count), 1)
        self.assertEqual(75, gene_count[0][0])

        self.assertEqual(291, execute_statements("SELECT COUNT(*) FROM family", "amphiadmin").get_single_result())

        birth_years = execute_statements(
            'select distinct sibling_birth_year from family order by sibling_birth_year DESC',
            'amphiadmin').row_results

        self.assertEqual(2023, birth_years[0][0])
        self.assertEqual(2022, birth_years[1][0])
