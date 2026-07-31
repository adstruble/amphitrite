import json

import pytest

from species_config import AMPHI_SPECIES_ENV, get_species_config


def test_defaults_to_delta_smelt(monkeypatch):
    monkeypatch.delenv(AMPHI_SPECIES_ENV, raising=False)
    config = get_species_config()
    assert config.species_name == 'Delta Smelt'
    assert config.fish_care_enabled is False


def test_lfs_selected(monkeypatch):
    monkeypatch.setenv(AMPHI_SPECIES_ENV, 'lfs')
    config = get_species_config()
    assert config.species_name == 'Longfin Smelt'
    assert config.fish_care_enabled is True
    assert 'Charlie' in config.fish_care_facilities


def test_unknown_species_raises(monkeypatch):
    monkeypatch.setenv(AMPHI_SPECIES_ENV, 'sturgeon')
    with pytest.raises(ValueError):
        get_species_config()


def test_features_flags(monkeypatch):
    monkeypatch.setenv(AMPHI_SPECIES_ENV, 'lfs')
    assert get_species_config().features() == {'fish_care': True}
    monkeypatch.setenv(AMPHI_SPECIES_ENV, 'delta_smelt')
    assert get_species_config().features() == {'fish_care': False}


def test_config_endpoint_shape_and_no_secrets(monkeypatch):
    monkeypatch.setenv(AMPHI_SPECIES_ENV, 'lfs')
    monkeypatch.setenv('AMPHI_FISH_CARE_SHEET_ID', 'SECRET_SHEET_ID_123')
    from amphitrite import app

    response = app.test_client().get('/common/config')
    assert response.status_code == 200
    payload = response.get_json()
    assert payload == {'species': 'Longfin Smelt', 'features': {'fish_care': True}}
    # The secret Sheet ID must never appear in the client-facing config.
    assert 'SECRET_SHEET_ID_123' not in json.dumps(payload)
