import { Link, useLocation, Navigate } from "react-router-dom";

function formatIndianPrice(price: number): string {
  if (price >= 1e7) return `₹ ${(price / 1e7).toFixed(2)} Cr`;
  if (price >= 1e5) return `₹ ${(price / 1e5).toFixed(2)} Lac`;
  return `₹ ${price.toLocaleString("en-IN")}`;
}

export default function ResultPage() {
  const location = useLocation();
  const predictedPrice = (location.state as { predictedPrice?: number } | null)?.predictedPrice;

  if (predictedPrice === undefined) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="page">
      <h1>Predicted price</h1>
      <p className="predicted-price">{formatIndianPrice(predictedPrice)}</p>
      <Link to="/">Predict another property</Link>
    </main>
  );
}
