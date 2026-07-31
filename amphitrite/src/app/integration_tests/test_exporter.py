import os

from exporter.export import export_data_to_csv_file


def test_export_as_csv(tmp_path):
    query = """select cross_year, group_id, f as f, gen_id
    from family
    join animal on animal.family = family.id
    where gen_id > 2000 order by cross_year, gen_id"""

    out_path = str(tmp_path / 'f_values.csv')
    export_data_to_csv_file(query, ['cross_year', 'group_id', 'f', 'gen_id'], out_path, 'amphiadmin')

    assert os.path.exists(out_path)
    with open(out_path) as f:
        lines = f.read().splitlines()
    assert lines[0] == 'cross_year,group_id,f,gen_id'
    # Seeded data has fish with gen_id > 2000, so at least one data row is exported.
    assert len(lines) > 1
