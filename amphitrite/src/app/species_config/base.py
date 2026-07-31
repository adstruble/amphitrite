from dataclasses import dataclass, field


@dataclass(frozen=True)
class SpeciesConfig:
    """Per-species deployment config.

    Deliberately small — holds only what the Fish Care slice needs today. Add fields
    here (and populate them in each species module) as later views require them, rather
    than scattering species-specific values through importers/models/views.
    """
    species_name: str
    # Fish Care
    fish_care_enabled: bool = False
    # Facility names recognized as sheet-name prefixes (e.g. 'Charlie 26', 'LFS Wet Lab 26 SYS 3').
    fish_care_facilities: list[str] = field(default_factory=list)
    # Raw sheet header (lower-cased, stripped) -> canonical fish_care column key.
    fish_care_header_aliases: dict[str, str] = field(default_factory=dict)
    # Name of the env var that holds this species' target Google Sheet ID.
    fish_care_sheet_id_env: str = ''

    def features(self) -> dict:
        """UI feature flags exposed (non-secret) via /common/config for frontend nav gating."""
        return {'fish_care': self.fish_care_enabled}
