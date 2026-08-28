import os
from datetime import date
from unittest.mock import patch

from db_utils.core import execute_statements, ResultType
from importer.import_master import import_master_data
from model.fish import get_fishes_from_db, get_pedigree_tree
from utils.server_state import JobState


def test_get_fishes_from_db():
    fish, fish_cnt = get_fishes_from_db('amphiadmin', {'offset': 0, 'limit': 20}, 'ORDER BY group_id ASC')
    assert isinstance(fish, list)
    assert fish_cnt > 0
    assert len(fish) > 0


def test_get_pedigree_tree():
    start_id = execute_statements(["SELECT a.id FROM animal a "
                                   "JOIN refuge_tag rt ON rt.animal = a.id AND tag = 'RA76' and year = 2025"],
                                  'amphiadmin', ResultType.RowResults).get_single_result()

    pedigree_tree = get_pedigree_tree('amphiadmin', start_id, 0)

    assert pedigree_tree['tag'] == 'RA76'
    assert pedigree_tree['cross_date'] == date.fromisoformat('2024-01-30')
    assert pedigree_tree['name'] == '19xxx2'
    assert len(pedigree_tree['children']) == 2
    assert pedigree_tree['sex'] == 'M'
    assert pedigree_tree['has_children']

    assert pedigree_tree['children'][0]['has_children']
    assert len(pedigree_tree['children'][0]['children']) == 0
    assert pedigree_tree['children'][1]['has_children']
    assert len(pedigree_tree['children'][1]['children']) == 0

    start_id = execute_statements(["SELECT a.id FROM animal a "
                                   "JOIN refuge_tag rt ON rt.animal = a.id AND tag = 'YA11' and year = 2025"],
                                  'amphiadmin', ResultType.RowResults).get_single_result()
    pedigree_tree = get_pedigree_tree('amphiadmin', start_id, 0)

    assert pedigree_tree['tag'] == 'YA11'
    assert pedigree_tree['cross_date'] == date.fromisoformat('2024-01-30')
    assert pedigree_tree['name'] == '19xxx2'
    assert len(pedigree_tree['children']) == 2
    assert pedigree_tree['sex'] == 'M'
    assert pedigree_tree['has_children']


def test_update_genotype_on_import():
    with patch('importer.import_master.complete_job') as mock_complete_job:
        import_master_data(os.path.join(os.path.dirname(__file__), 'resources', 'master_sheets'),
                           'amphiadmin', 'update_genotype.csv', 2025, True)
    # import_master swallows failures, so assert the job actually COMPLETED rather than trusting
    # end-state values — a broken update previously passed silently by leaving the data unchanged.
    mock_complete_job.assert_called_once()
    assert mock_complete_job.call_args[0][1] == JobState.Complete.name, \
        f"genotype-update import did not complete: {mock_complete_job.call_args}"

    # Scope to the imported year and require exactly one row (tag is reused across years, and the
    # query previously had no year filter / ORDER BY, so results[0] was non-deterministic).
    results = execute_statements("SELECT genotype, sex, box, family.group_id as gid "
                                 "FROM animal JOIN refuge_tag on refuge_tag.animal = animal.id "
                                 "JOIN family ON animal.family = family.id "
                                 "WHERE tag = 'RA73' AND refuge_tag.year = 2025 ORDER BY tag",
                                 "amphiadmin", ResultType.RowResults).get_as_list_of_dicts()
    assert len(results) == 1
    assert results[0]['genotype'] == '221112111211111211121222220000121222121222121112121112221211221122121212221222121211111211121212121212121222122212120022001222111211221112221222122211' # noqa
    assert results[0]['sex'] == 'F'
    assert results[0]['box'] == 20
    assert results[0]['gid'] == 4

    assert execute_statements("select genotype from animal join refuge_tag on refuge_tag.animal = animal.id "
                              "where tag = 'RA45' and refuge_tag.year = 2025",
                              "amphiadmin", ResultType.RowResults).get_single_result() == '212222121111111200221200110012121211112222111212121100221212121111121222112222122212001111121212122211121111121222110012122222111212121112121212122212' # noqa

    assert execute_statements("select genotype from animal join refuge_tag on refuge_tag.animal = animal.id "
                              "where tag = 'RA48' and refuge_tag.year = 2025",
                              "amphiadmin", ResultType.RowResults).get_single_result() == '121222111111221100111200110012121211122222121212221112221211121211112222111222122212001211122212112222121111121222120012122222111222122212122212122212' # noqa
