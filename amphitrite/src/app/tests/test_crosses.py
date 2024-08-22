from cross_selection.crosses import remove_family_by_tags, add_completed_cross


def test_remove_family_by_tags():
    add_completed_cross('amphiadmin', 'YD01', 'YA87', .0427)
    removed_cnt = remove_family_by_tags('amphiadmin', 'YD01', 'YA87')
    assert removed_cnt == 1
