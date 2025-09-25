import uuid
from unittest import TestCase

from db_utils.core import execute_statements, ResultType
from model.fish import get_fishes_from_db
from model.crosses import insert_possible_crosses
from utils.data import get_generation_id


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

    def test_get_generation_id(self):
        assert get_generation_id(2025, 1, 'M') == '210012'
        assert get_generation_id(2025, 2, 'F') == '210021'
        assert get_generation_id(2026, 2, 'F') == '220021'
        assert get_generation_id(2027, 2, 'F') == '230021'

        assert get_generation_id(2028, 2, 'F') == '240021'

        assert get_generation_id(2029, 2, 'F') == '250021'

        assert get_generation_id(2030, 2, 'F') == '260021'

        assert get_generation_id(2031, 2, 'F') == '270021'

        assert get_generation_id(2032, 2, 'F') == '280021'

        assert get_generation_id(2033, 2, 'F') == '290021'

        assert get_generation_id(2034, 1, 'M') == '310012'
        assert get_generation_id(2042, 1, 'M') == '390012'
        assert get_generation_id(2043, 1, 'M') == '410012'
        assert get_generation_id(2051, 1, 'M') == '490012'
        assert get_generation_id(2052, 1, 'M') == '510012'
        assert get_generation_id(2060, 1, 'M') == '590012'
        assert get_generation_id(2061, 1, 'M') == '610012'
