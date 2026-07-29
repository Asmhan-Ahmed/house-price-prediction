import PredictionForm from "../components/PredictionForm";

export default function HomePage() {
  return (
    <main className="page">
      <h1>House Price Prediction</h1>
      <p>Enter the property details below to get an estimated price.</p>
      <PredictionForm />
    </main>
  );
}
