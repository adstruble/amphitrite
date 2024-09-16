from algorithms.f_calculation import rank_available_crosses_by_f
from model.fish import get_fish_available_for_crossing


def test_rank_available_crosses():
    crosses, crosses_cnt = rank_available_crosses_by_f('amphiadmin')
    for cross_idx, cross in enumerate(crosses):
        if cross_idx > 15:
            break
        print(f"f = {cross['f']}, p1 = {cross['p1_fam_id']}, p2 = {cross['p2_fam_id']}")