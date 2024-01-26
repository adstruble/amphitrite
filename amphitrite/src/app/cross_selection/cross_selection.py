class FVariables(object):
    i_x = None
    i_y = None
    f_ca = None

    def __init__(self, i_x, f_ca):
        self.i_x = i_x
        self.f_ca = f_ca


def select_males(female_id):
    f_vars = get_f_variables_for_female(female_id)


def get_f_variables_for_female(female_id):
    f_vars = []