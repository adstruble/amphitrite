import datetime
import uuid

from db_utils.core import execute_statements, ResultType
from model.family import remove_family_by_tags


def test_remove_family_by_tags():
    """remove_family_by_tags deletes the current-year family whose parents carry the given tags.

    Builds a self-contained current-year cross (remove_family_by_tags filters on
    cross_year = today's year, which the seed's 2024/2025 data doesn't satisfy), then removes it.
    """
    year = datetime.date.today().year
    parent_fam = uuid.uuid4()
    female = uuid.uuid4()
    male = uuid.uuid4()
    child_fam = uuid.uuid4()
    f_tag, m_tag = 'ZY01', 'ZY02'

    try:
        execute_statements([
            f"INSERT INTO family (id, group_id, cross_date) VALUES ('{parent_fam}', 9990, '2099-01-01')",
            f"INSERT INTO animal (id, sex, family) VALUES ('{female}', 'F', '{parent_fam}')",
            f"INSERT INTO animal (id, sex, family) VALUES ('{male}', 'M', '{parent_fam}')",
            f"INSERT INTO refuge_tag (id, tag, animal, year) "
            f"VALUES (gen_random_uuid(), '{f_tag}', '{female}', {year})",
            f"INSERT INTO refuge_tag (id, tag, animal, year) "
            f"VALUES (gen_random_uuid(), '{m_tag}', '{male}', {year})",
            # cross_year is GENERATED from cross_date, so a current-year cross_date yields the
            # current cross_year that remove_family_by_tags filters on.
            f"INSERT INTO family (id, group_id, cross_date, parent_1, parent_2) "
            f"VALUES ('{child_fam}', 9991, '{year}-01-15', '{female}', '{male}')",
        ], 'amphiadmin', ResultType.NoResult)

        assert remove_family_by_tags('amphiadmin', f_tag, m_tag) == 1
    finally:
        execute_statements([
            f"DELETE FROM family WHERE id IN ('{child_fam}', '{parent_fam}')",
            f"DELETE FROM refuge_tag WHERE animal IN ('{female}', '{male}')",
            f"DELETE FROM animal WHERE id IN ('{female}', '{male}')",
        ], 'amphiadmin', ResultType.NoResult)
