from utils.data import get_generation_id


def test_get_generation_id():
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
