import os
from unittest import TestCase

from model.fish import get_fishes_from_db


class Test(TestCase):

    def test_get_fishes_from_db(self):

        fish, fish_cnt = get_fishes_from_db('admin', {'offset': 0, 'limit': 20}, 'ORDER BY group_id ASC')
        print(fish)
        print(fish_cnt)

