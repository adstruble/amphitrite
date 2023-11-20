import os
from unittest import TestCase
from unittest.mock import patch

from importer.import_crosses import determine_parents_for_backup_tanks, count_sibling_groups


class Test(TestCase):
    def test_determine_parents_for_backup_tanks(self):
        class MockTempDir:
            name = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'resources/import')

        results = determine_parents_for_backup_tanks(MockTempDir(), 'crosses_job_id')
        self.assertEqual(1, len(results))

    def test_count_num_sibling_groups(self):
        class MockTempDir:
            name = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'resources/import')

        results = count_sibling_groups(MockTempDir(), 'crosses_job_id')
        self.assertEqual(1, len(results))