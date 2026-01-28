import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    const url = `${import.meta.env.VITE_API_URL}/api/health`; // or /actuator/health
    fetch(url)
      .then(async (res) => {
        const text = await res.text();
        if (!res.ok) throw new Error(text || `${res.status} ${res.statusText}`);
        return text ? JSON.parse(text) : null;
      })
      .then(setData)
      .catch((e) => setErr(String(e.message ?? e)));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Home</h1>
      <p>Backend: {import.meta.env.VITE_API_URL}</p>

      {err && <pre style={{ color: "tomato" }}>{err}</pre>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      {!err && !data && <p>Loading...</p>}
    </div>
  );
}
