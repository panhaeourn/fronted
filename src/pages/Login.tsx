import { useState } from "react";
import { apiFetch } from "../api";

export default function Login() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("test123");
  const [msg, setMsg] = useState("");

  async function login() {
    setMsg("");
    try {
      const res = await apiFetch<{ token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("jwt", res.token);
      setMsg("Login success ✅ Token saved");
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  return (
    <div className="card">
      <h2>Login</h2>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={login}>Login</button>
      {msg && <p>{msg}</p>}
    </div>
  );
}
