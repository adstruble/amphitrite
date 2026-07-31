import os

from species_config import delta_smelt, lfs
from species_config.base import SpeciesConfig

AMPHI_SPECIES_ENV = 'AMPHI_SPECIES'
DEFAULT_SPECIES = 'delta_smelt'

_CONFIGS = {
    'delta_smelt': delta_smelt.CONFIG,
    'lfs': lfs.CONFIG,
}


def get_species_config() -> SpeciesConfig:
    """Return the config for the deployment's species, selected by the AMPHI_SPECIES env var.

    Defaults to delta smelt so existing deployments are unaffected. Raises on an unknown value
    rather than silently falling back, so a misconfigured deployment fails loudly at startup.
    """
    species = os.getenv(AMPHI_SPECIES_ENV, DEFAULT_SPECIES)
    try:
        return _CONFIGS[species]
    except KeyError:
        raise ValueError(
            f"Unknown {AMPHI_SPECIES_ENV}={species!r}. Known species: {sorted(_CONFIGS)}")
