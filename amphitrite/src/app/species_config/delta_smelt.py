from species_config.base import SpeciesConfig

# The original species. Fish Care is an LFS feature and is disabled here, so its nav item,
# route, and endpoints stay off in the delta smelt deployment.
CONFIG = SpeciesConfig(
    species_name='Delta Smelt',
    fish_care_enabled=False,
)
