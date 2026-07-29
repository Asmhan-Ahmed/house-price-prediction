from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    location: str
    carpet_area_sqft: float = Field(gt=0)
    floor_num: int
    bathroom: int = Field(ge=0)
    balcony: int = Field(ge=0)
    furnishing: str       # "Furnished" | "Semi-Furnished" | "Unfurnished"
    transaction: str      # "New Property" | "Resale"
    ownership: str
    facing: str


class PredictionResponse(BaseModel):
    predicted_price: float


class HealthResponse(BaseModel):
    status: str
