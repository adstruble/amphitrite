from datetime import date

from model.fish import get_pedigree_tree


def test_get_pedigree_tree():
    pedigree_tree = get_pedigree_tree('amphiadmin', '9bd0baa4-4bdb-441e-a54a-25fb8d6b0edb', 0)

    assert pedigree_tree['tag'] == 'RA76'
    assert pedigree_tree['cross_date'] == date.fromisoformat('2024-01-30')
    assert pedigree_tree['name'] == '193442'
    assert len(pedigree_tree['children']) == 2
    assert pedigree_tree['sex'] == 'M'
    assert pedigree_tree['has_children']

    assert pedigree_tree['children'][0]['has_children']
    assert len(pedigree_tree['children'][0]['children']) == 0
    assert pedigree_tree['children'][1]['has_children']
    assert len(pedigree_tree['children'][1]['children']) == 0

    pedigree_tree = get_pedigree_tree('amphiadmin', '58eaf9f8-4520-43bd-90eb-9cd4a169007c', 0)

    assert pedigree_tree['tag'] == 'YA11'
    assert pedigree_tree['cross_date'] == date.fromisoformat('2024-01-30')
    assert pedigree_tree['name'] == '19xxx2'
    assert len(pedigree_tree['children']) == 2
    assert pedigree_tree['sex'] == 'M'
    assert pedigree_tree['has_children']
