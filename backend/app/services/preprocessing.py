import json

import pandas as pd

from app.core.config import settings
from app.schemas.prediction import PredictionRequest

_allowed_locations: set[str] | None = None


def _get_allowed_locations() -> set[str]:
    global _allowed_locations
    if _allowed_locations is None:
        try:
            with open(settings.LOCATIONS_PATH) as f:
                _allowed_locations = set(json.load(f))
        except FileNotFoundError:
            _allowed_locations = set()
    return _allowed_locations


def request_to_dataframe(payload: PredictionRequest) -> pd.DataFrame:
    """Build a one-row DataFrame with exactly the column names used in training.

    Unknown locations are mapped to 'other', matching the notebook's grouping logic.
    The fitted Pipeline (imputer + scaler + one-hot encoder) handles the rest.
    """
    location = payload.location if payload.location in _get_allowed_locations() else "other"

    row = {
        "carpet_area_sqft": payload.carpet_area_sqft,
        "floor_num": payload.floor_num,
        "bathroom": payload.bathroom,
        "balcony": payload.balcony,
        "location_grouped": location,
        "Furnishing": payload.furnishing,
        "Transaction": payload.transaction,
        "Ownership": payload.ownership,
        "facing": payload.facing,
    }
    return pd.DataFrame([row])
