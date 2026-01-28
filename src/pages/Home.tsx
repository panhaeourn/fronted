export default function Home() {
  return (
    <div className="card">
      <h2>Welcome 👋</h2>
      <p>This is a Vite + React frontend deployed on DigitalOcean.</p>
      <p>Backend URL: <code>{import.meta.env.VITE_API_URL}</code></p>
    </div>
  );
}
