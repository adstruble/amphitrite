class Fish:
    sex = 'f'
    box = -1,
    spawn_year = 0
    alive = False
    fish_family = None
    id = -1


def insert_fish(fish):
    insert_fishes([fish])


def insert_fishes(fishes):
    insert_records("fish", "")