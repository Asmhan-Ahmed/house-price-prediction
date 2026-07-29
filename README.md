# House Price Prediction — End-to-End ML Web App

Predicts Indian residential property prices from listing details (area, location,
furnishing, bathrooms, etc.) using a scikit-learn regression model served through a
FastAPI backend and consumed by a React + TypeScript frontend.

## Overview

1. A Jupyter notebook cleans the raw Kaggle listings, engineers features, trains and
   compares several regression models, and exports the winning model as a single
   scikit-learn `Pipeline` (`house_price.pkl`).
2. A FastAPI backend loads that pipeline once at startup and exposes `POST /predict`.
3. A React frontend collects property details in a form and shows the predicted price.

## Architecture

```
┌──────────────────┐        POST /predict         ┌───────────────────┐        model.predict()      ┌────────────────────┐
│  React frontend  │ ───────────────────────────▶ │  FastAPI backend  │ ───────────────────────────▶ │ house_price.pkl     │
│  (Vite, :5173)   │ ◀─────────────────────────── │  (:8000)          │ ◀─────────────────────────── │ (sklearn Pipeline)   │
└──────────────────┘      { predicted_price }      └───────────────────┘        prediction            └────────────────────┘
                                                             ▲
                                                             │ trained & exported by
                                                             │
                                                   ┌────────────────────────┐
                                                   │ notebooks/house_price_ │
                                                   │ model.ipynb            │
                                                   └────────────────────────┘
```

## Tech stack

| Layer      | Technology                                                             |
|------------|-------------------------------------------------------------------------|
| Modeling   | Python, pandas, scikit-learn (ColumnTransformer + Pipeline), joblib      |
| Backend    | FastAPI, Pydantic v2, pydantic-settings, uvicorn                        |
| Frontend   | React 18, TypeScript, Vite, react-router-dom                            |
| Testing    | pytest + FastAPI `TestClient`                                            |

## Project structure

```
house-price-project/
├── notebooks/
│   ├── house_price_model.ipynb
│   └── data/house_prices.csv       # you add this (not committed, see below)
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app, CORS, model loaded at startup
│   │   ├── api/routes/prediction.py
│   │   ├── core/config.py
│   │   ├── schemas/prediction.py
│   │   └── services/{preprocessing.py, inference.py}
│   ├── models/house_price.pkl      # copied from the notebook
│   ├── tests/test_prediction.py
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── api/predictionClient.ts
│       ├── components/PredictionForm.tsx
│       ├── pages/{HomePage,ResultPage,NotFoundPage}.tsx
│       └── types/prediction.ts
└── README.md
```

## Dataset

**House Price** by Juhi Bhojani — <https://www.kaggle.com/datasets/juhibhojani/house-price>
(~187,000 Indian property listings).

Download it (do **not** commit the CSV — it's excluded via `.gitignore`):

```bash
pip install kaggle
# Kaggle → Settings → API → "Create New Token", save kaggle.json to ~/.kaggle/
kaggle datasets download -d juhibhojani/house-price -p notebooks/data --unzip
```

Or download manually from the link above and place `house_prices.csv` in `notebooks/data/`.

## Setup — Notebook

```bash
cd notebooks
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install jupyter pandas numpy scikit-learn matplotlib seaborn joblib
jupyter notebook house_price_model.ipynb
```

Run all cells top-to-bottom. This produces `house_price.pkl` and `locations.json` inside
`notebooks/`. Copy both into `backend/models/` (and `locations.json` into
`frontend/public/`) before running the backend/frontend.

## Setup — Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

API docs: <http://localhost:8000/docs>

### Environment variables (backend/.env)

| Variable         | Description                                  | Default                         |
|------------------|-----------------------------------------------|----------------------------------|
| `MODEL_PATH`     | Path to the exported pipeline                 | `models/house_price.pkl`        |
| `LOCATIONS_PATH` | Path to the allowed-locations JSON            | `models/locations.json`         |
| `CORS_ORIGINS`   | Allowed frontend origins (JSON list)          | `["http://localhost:5173"]`     |

## Setup — Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open <http://localhost:5173>.

### Environment variables (frontend/.env)

| Variable              | Description                | Default                 |
|-----------------------|-----------------------------|--------------------------|
| `VITE_API_BASE_URL`   | Backend base URL            | `http://localhost:8000` |

## API reference

### `GET /health`

```bash
curl http://localhost:8000/health
# {"status": "ok"}
```

### `POST /predict`

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
        "location": "mumbai",
        "carpet_area_sqft": 1200,
        "floor_num": 3,
        "bathroom": 2,
        "balcony": 1,
        "furnishing": "Semi-Furnished",
        "transaction": "Resale",
        "ownership": "Freehold",
        "facing": "East"
      }'
# {"predicted_price": 41500148.63}
```

> `location` must be one of the values in `frontend/public/locations.json` (51 real cities
> from the dataset, lowercase, e.g. `"mumbai"`, `"bangalore"`, `"pune"`) — anything else is
> mapped to `"other"` automatically.

## Model metrics

Trained on the real Kaggle dataset (187,531 raw listings -> 174,471 after cleaning /
outlier removal, 80/20 train-test split). These are the actual test-set results from
`notebooks/house_price_model.ipynb`:

| Model              | MAE (INR)   | RMSE (INR)  | R²    |
|---------------------|-------------|-------------|-------|
| LinearRegression     | 4,532,608   | 8,383,121   | 0.624 |
| **RandomForest**     | **1,100,189** | **5,279,000** | **0.851** |
| GradientBoosting     | 2,984,954   | 6,478,526   | 0.775 |

5-fold cross-validation (RandomForest, 20k-row subsample): R² = 0.91, 0.87, 0.87, 0.84, 0.92
(mean ≈ **0.88**).

**Winning model: RandomForest** (`n_estimators=150, max_depth=20`) — it roughly quarters the
linear model's MAE and lifts R² from 0.62 to 0.85, since price depends on non-linear
interactions between area, location, and furnishing that a linear model can't capture.
`backend/models/house_price.pkl` ships with this real trained pipeline (joblib-compressed to
~40 MB, under GitHub's soft file-size limits) — no placeholder data is used.

## Screenshots

> Add screenshots of the running app here (home form + result page) before submitting.

## Running tests

```bash
cd backend
PYTHONPATH=. pytest tests/ -v
```

## Publishing to GitHub

```bash
git init
git add .
git commit -m "House price prediction: notebook, FastAPI backend, React frontend"
git remote add origin https://github.com/<your-username>/house-price-app.git
git branch -M main
git push -u origin main
```

Make sure the repository is **public** and accessible before submitting the link on the
submission form.
