from importer.import_fish_care import build_preview, parse_sheet_name, parse_workbook, rows_from_tab
from species_config.lfs import CONFIG as LFS

# pH-flavored header (Charlie / LFS Wet Lab systems); trailing '' mimics a stray empty column.
PH_HEADER = ['Date', 'Tank ID', 'Carer', 'Temp', 'DO', 'Salinity', 'pH',
             'Ammonia', 'Nitrite', 'Nitrate', 'Morts', 'Notes', '']
# Turbidity-flavored header (SYS 2 style — uses Turbidity in place of pH).
TURB_HEADER = ['Date', 'Tank ID', 'Carer', 'Temp', 'DO', 'Salinity', 'Turbidity',
               'Ammonia', 'Nitrite', 'Nitrate', 'Morts', 'Notes']


def test_parse_sheet_name_variants():
    assert parse_sheet_name('Charlie 26', LFS) == {'facility': 'Charlie', 'system': None, 'sheet_year': 2026}
    assert parse_sheet_name('Echo 25', LFS) == {'facility': 'Echo', 'system': None, 'sheet_year': 2025}
    assert parse_sheet_name('LFS Wet Lab 26 SYS 3', LFS) == {
        'facility': 'LFS Wet Lab', 'system': 'SYS 3', 'sheet_year': 2026}


def test_parse_sheet_name_skips_unrecognized():
    assert parse_sheet_name('Equipment 26', LFS) is None
    assert parse_sheet_name('Equiptment 25', LFS) is None      # known typo in the real workbook
    assert parse_sheet_name('Bravo 26', LFS) is None           # unknown facility
    assert parse_sheet_name('Charlie', LFS) is None            # no year suffix


def test_ph_sheet_maps_ph_not_turbidity():
    meta = {'facility': 'Charlie', 'system': None, 'sheet_year': 2026}
    rows, flags = rows_from_tab(
        PH_HEADER,
        [['2026-01-09', '2A', '', '11.2', '5.36', '7.6', '0.0', '0.02', '6.0', '10.0', '0', 'Oxytet bath', '']],
        meta, LFS)
    assert flags == []
    row = rows[0]
    assert row['obs_date'] == '2026-01-09'
    assert row['tank_id'] == '2A'
    assert row['ph'] == '0.0'
    assert row['morts'] == 0
    assert 'turbidity' not in row  # not present in a pH sheet


def test_turbidity_sheet_maps_turbidity_not_ph():
    meta = {'facility': 'LFS Wet Lab', 'system': 'SYS 2', 'sheet_year': 2026}
    rows, flags = rows_from_tab(
        TURB_HEADER,
        [['2026-01-07', 'E4', 'JJ', '13.7', '10.09', '4.92', '3.69', '0.1', '0.0', '6.0', '0', '3 cells/day']],
        meta, LFS)
    assert flags == []
    row = rows[0]
    assert row['turbidity'] == '3.69'
    assert 'ph' not in row


def test_row_normalization_approximates_blanks_and_bad_morts():
    meta = {'facility': 'LFS Wet Lab', 'system': 'SYS 3', 'sheet_year': 2026}
    data = [
        # DO blank, Salinity approximate '~5' — preserved as text.
        ['2025-12-15', '3A', 'ZK', '11.3', '', '~5', '8.3', '', '', '', '1', 'fed all tanks', ''],
        # Non-integer morts -> flagged, value nulled, row still kept.
        ['2025-12-16', '3B', 'ZK', '11.4', '', '~5', '8.2', '', '', '', 'n/a', '', ''],
        # Fully blank row -> skipped.
        ['', '', '', '', '', '', '', '', '', '', '', '', ''],
    ]
    rows, flags = rows_from_tab(PH_HEADER, data, meta, LFS)
    assert len(rows) == 2
    assert rows[0]['salinity'] == '~5'
    assert rows[0]['dissolved_oxygen'] is None
    assert rows[0]['morts'] == 1
    assert rows[1]['morts'] is None
    assert any('non-integer morts' in f for f in flags)


def test_unmapped_column_is_flagged_not_stored():
    meta = {'facility': 'Charlie', 'system': None, 'sheet_year': 2026}
    rows, flags = rows_from_tab(
        ['Date', 'Tank ID', 'Mystery', 'Notes'],
        [['2026-01-01', '2A', 'xyz', 'hi']],
        meta, LFS)
    assert any('Mystery' in f for f in flags)
    assert rows[0]['tank_id'] == '2A'
    assert 'Mystery' not in rows[0]


def test_parse_workbook_separates_recognized_and_skipped():
    header = ['Date', 'Tank ID', 'Morts']
    sheets = {
        'Charlie 26': (header, [['2026-01-01', '2A', '1'], ['2026-01-02', '2B', '0']]),
        'Equipment 26': (['Date', 'Location', 'Item'], [['2026-01-01', 'x', 'y']]),
    }
    result = parse_workbook(sheets, LFS)
    assert result['skipped'] == ['Equipment 26']
    assert len(result['parsed']) == 1
    assert result['parsed'][0]['facility'] == 'Charlie'
    assert len(result['parsed'][0]['rows']) == 2

    preview = build_preview(result)
    assert preview['total_rows'] == 2
    assert preview['skipped'] == ['Equipment 26']
    assert preview['sheets'][0]['row_count'] == 2
