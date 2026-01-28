import { useEffect, useState } from "react";
import { apiFetch } from "../api";

type Course = {
  id: number;
  title?: string;
  name?: string;
};

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    apiFetch<Course[]>("/api/courses").then(setCourses).catch(console.error);
  }, []);

  return (
    <div className="card">
      <h2>Courses</h2>
      <ul>
        {courses.map(c => (
          <li key={c.id}>{c.title || c.name}</li>
        ))}
      </ul>
    </div>
  );
}
