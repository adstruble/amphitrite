from species_config.base import SpeciesConfig

# Sheet header (lower-cased, stripped) -> canonical fish_care column key.
# Tolerates the header variations seen across LFS systems (pH vs Turbidity, Tank ID vs Tank).
FISH_CARE_HEADER_ALIASES = {
    'date': 'obs_date',
    'tank id': 'tank_id',
    'tank': 'tank_id',
    'carer': 'carer',
    'temp': 'temp',
    'do': 'dissolved_oxygen',
    'salinity': 'salinity',
    'ph': 'ph',
    'turbidity': 'turbidity',
    'ammonia': 'ammonia',
    'nitrite': 'nitrite',
    'nitrate': 'nitrate',
    'morts': 'morts',
    'notes': 'notes',
}

CONFIG = SpeciesConfig(
    species_name='Longfin Smelt',
    fish_care_enabled=True,
    fish_care_facilities=['Charlie', 'Echo', 'LFS Wet Lab'],
    fish_care_header_aliases=FISH_CARE_HEADER_ALIASES,
    fish_care_sheet_id_env='AMPHI_FISH_CARE_SHEET_ID',
)
