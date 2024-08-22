import os
import uuid
from unittest import TestCase

from db_utils.core import execute_statements, ResultType
from model.fish import get_fishes_from_db, insert_possible_crosses


class Test(TestCase):

    def test_get_fishes_from_db(self):

        fish, fish_cnt = get_fishes_from_db('admin', {'offset': 0, 'limit': 20}, 'ORDER BY group_id ASC')
        print(fish)
        print(fish_cnt)

    def test_insert_available_females(self):
        animal_uuid = uuid.uuid4()
        family_uuid = uuid.uuid4()
        execute_statements(
            [f"INSERT INTO family (id, group_id, cross_date) VALUES ('{family_uuid}', 1, '2099-01-01')",
             f"INSERT INTO animal (id, sex, family) VALUES ('{animal_uuid}', 'F', '{family_uuid}')",
             f"INSERT INTO refuge_tag (id, tag, animal) VALUES (gen_random_uuid(), 'AA11', '{animal_uuid}')"],
            'amphiadmin', result_type=ResultType.NoResult)
        insert_possible_crosses('admin', {'AA11'})

        assert execute_statements(f"SELECT count(*) from available_female WHERE female = '{animal_uuid}'",
            'amphiadmin', result_type=ResultType.RowResults).get_single_result() == 1
