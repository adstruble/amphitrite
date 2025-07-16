import os
from unittest import TestCase

from importer.import_crosses import count_sibling_groups


class Test(TestCase):

    def test_count_num_sibling_groups(self):
        class MockTempDir:
            name = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'resources/import')

        results = count_sibling_groups(MockTempDir(), 'crosses_job_id')
        self.assertEqual(1, len(results))

    def test_import_crosses(self):