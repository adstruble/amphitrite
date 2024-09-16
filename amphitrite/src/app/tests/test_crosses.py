from model.crosses import add_completed_cross, determine_and_insert_possible_crosses
from model.family import remove_family_by_tags


def test_remove_family_by_tags():
    add_completed_cross('amphiadmin', 'YD01', 'YA87', .0427)
    removed_cnt = remove_family_by_tags('amphiadmin', 'YD01', 'YA87')
    assert removed_cnt == 1


def test_determine_and_insert_crosses_for_females():
    determine_and_insert_possible_crosses('amphiadmin', {'YD65', 'YD01'})
