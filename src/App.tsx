import { useState } from "react";
import Home from "./pages/Home.tsx";
import Login from "./pages/Login.tsx";
import Courses from "./pages/Courses.tsx";

type Page = "home" | "login" | "courses";

export default function App() {
  const [page, setPage] = useState<Page>("home");

  return (
    <>
      <nav>
        <a href="#" onClick={() => setPage("home")}>Home</a>
        <a href="#" onClick={() => setPage("login")}>Login</a>
        <a href="#" onClick={() => setPage("courses")}>Courses</a>
      </nav>

      <div className="container">
        {page === "home" && <Home />}
        {page === "login" && <Login />}
        {page === "courses" && <Courses />}
      </div>
    </>
  );
}
