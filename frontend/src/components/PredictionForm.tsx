import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { predictPrice } from "../api/predictionClient";
import type { PredictionRequest } from "../types/prediction";

const FURNISHING_OPTIONS = ["Furnished", "Semi-Furnished", "Unfurnished"] as const;
const TRANSACTION_OPTIONS = ["New Property", "Resale"] as const;
const OWNERSHIP_OPTIONS = ["Freehold", "Leasehold", "Co-operative Society", "Power of Attorney"];
const FACING_OPTIONS = ["East", "West", "North", "South", "North-East", "North-West", "South-East", "South-West"];

export default function PredictionForm() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<PredictionRequest>({
    location: "",
    carpet_area_sqft: 0,
    floor_num: 0,
    bathroom: 1,
    balcony: 0,
    furnishing: "Semi-Furnished",
    transaction: "Resale",
    ownership: OWNERSHIP_OPTIONS[0],
    facing: FACING_OPTIONS[0],
  });

  useEffect(() => {
    fetch("/locations.json")
      .then((res) => res.json())
      .then((data: string[]) => {
        setLocations(data);
        if (data.length > 0) {
          setForm((prev) => ({ ...prev, location: data[0] }));
        }
      })
      .catch(() => setError("Could not load the locations list."));
  }, []);

  function updateField<K extends keyof PredictionRequest>(key: K, value: PredictionRequest[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string | null {
    if (!form.location) return "Please select a location.";
    if (!form.carpet_area_sqft || form.carpet_area_sqft <= 0) return "Carpet area must be greater than 0.";
    if (form.bathroom < 0) return "Bathrooms cannot be negative.";
    if (form.balcony < 0) return "Balconies cannot be negative.";
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await predictPrice(form);
      navigate("/result", { state: { predictedPrice: result.predicted_price } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="prediction-form">
      <label>
        Location
        <select value={form.location} onChange={(e) => updateField("location", e.target.value)}>
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </label>

      <label>
        Carpet area (sqft)
        <input
          type="number"
          min={1}
          value={form.carpet_area_sqft}
          onChange={(e) => updateField("carpet_area_sqft", Number(e.target.value))}
        />
      </label>

      <label>
        Floor
        <input
          type="number"
          value={form.floor_num}
          onChange={(e) => updateField("floor_num", Number(e.target.value))}
        />
      </label>

      <label>
        Bathrooms
        <input
          type="number"
          min={0}
          value={form.bathroom}
          onChange={(e) => updateField("bathroom", Number(e.target.value))}
        />
      </label>

      <label>
        Balconies
        <input
          type="number"
          min={0}
          value={form.balcony}
          onChange={(e) => updateField("balcony", Number(e.target.value))}
        />
      </label>

      <label>
        Furnishing
        <select value={form.furnishing} onChange={(e) => updateField("furnishing", e.target.value as PredictionRequest["furnishing"])}>
          {FURNISHING_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>

      <label>
        Transaction
        <select value={form.transaction} onChange={(e) => updateField("transaction", e.target.value as PredictionRequest["transaction"])}>
          {TRANSACTION_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>

      <label>
        Ownership
        <select value={form.ownership} onChange={(e) => updateField("ownership", e.target.value)}>
          {OWNERSHIP_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>

      <label>
        Facing
        <select value={form.facing} onChange={(e) => updateField("facing", e.target.value)}>
          {FACING_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Predicting..." : "Predict price"}
      </button>
    </form>
  );
}
