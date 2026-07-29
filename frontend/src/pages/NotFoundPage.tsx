import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="page">
      <h1>404 — Page not found</h1>
      <Link to="/">Go back home</Link>
    </main>
  );
}
