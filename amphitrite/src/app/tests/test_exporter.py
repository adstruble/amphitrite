from exporter.export import export_data_to_csv_file


def test_export_as_csv():
    query = """select cross_year, group_id, f as f, gen_id  
    from family 
    join animal on animal.family = family.id 
    where gen_id > 2000 order by cross_year, gen_id"""

    exported_csv_path = "/Users/annes/nereid51/f_values.csv"

    export_data_to_csv_file(query,
                            ['cross_year', 'group_id', 'f', 'gen_id'],
                            exported_csv_path,
                            'amphiadmin')
