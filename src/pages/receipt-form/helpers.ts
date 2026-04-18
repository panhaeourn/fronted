import type { MonthlyCourseOption } from "./types";

export const MONTHLY_COURSE_OPTIONS: MonthlyCourseOption[] = [
  { title: "AI (Artificial Intelligence)", price: 25 },
  { title: "Internet & E-mail", price: 10 },
  { title: "Make Money Online (MMO)", price: 116 },
  { title: "Microsoft Word", price: 20 },
  { title: "Microsoft Excel", price: 20 },
  { title: "Microsoft PowerPoint", price: 15 },
  { title: "Advance Word", price: 25 },
  { title: "Advance Excel", price: 40 },
  { title: "W+E+P+Internet", price: 45.5 },
  { title: "MS Access Level I", price: 35 },
  { title: "MS Access Level II", price: 40 },
  { title: "MS Access Level I, II", price: 60 },
  { title: "Adobe Photoshop CC I", price: 35 },
  { title: "Adobe Photoshop Level II", price: 40 },
  { title: "Adobe Photoshop 1+2", price: 60 },
  { title: "CorelDRAW x22", price: 40 },
  { title: "Adobe Illustrator CC", price: 40 },
  { title: "Adobe Flash CC", price: 40 },
  { title: "Adobe InDesign CC", price: 40 },
  { title: "AutoCAD 2D", price: 50 },
  { title: "AutoCAD 2D for Mechanical", price: 70 },
  { title: "AutoCAD 2D for Construction & Architecture", price: 70 },
  { title: "AutoCAD 2D for Jewelry", price: 70 },
  { title: "AutoCAD 3D for Jewelry", price: 100 },
  { title: "AutoCAD 3D for Mechanical", price: 80 },
  { title: "SketchUp for Mechanical", price: 80 },
  { title: "SketchUp for Construction & Architecture", price: 80 },
  { title: "3D Render + Animation", price: 80 },
  { title: "3ds Max 2024", price: 70 },
  { title: "GIS Training", price: 60 },
  { title: "Microsoft Project", price: 70 },
  { title: "QuickBooks Premier", price: 45 },
  { title: "Peachtree Accounting", price: 60 },
  { title: "C Programming", price: 45 },
  { title: "C++ Programming", price: 45 },
  { title: "C# Programming", price: 70 },
  { title: "Python", price: 70 },
  { title: "Java Programming", price: 70 },
  { title: "Node.js", price: 70 },
  { title: "Laravel", price: 70 },
  { title: "HTML", price: 30 },
  { title: "CSS", price: 40 },
  { title: "PHP", price: 70 },
  { title: "jQuery or JavaScript", price: 50 },
  { title: "Bootstrap", price: 40 },
  { title: "SDL C + Advance GitHub", price: 30 },
  { title: "Spring Core + Spring Boot + PostgreSQL", price: 140 },
  { title: "SQL Server", price: 70 },
  { title: "MySQL", price: 40 },
  { title: "PostgreSQL", price: 30 },
  { title: "Tailwind CSS", price: 20 },
  { title: "ReactJS + TypeScript", price: 60 },
  { title: "NextJS + TypeScript", price: 60 },
  { title: "SST + S3", price: 30 },
  { title: "Git + GitHub", price: 20 },
  { title: "xpress + TypeScript + tsoa", price: 120 },
  { title: "AWS EC2 + Cognito", price: 35 },
  { title: "MongoDB", price: 50 },
  { title: "Docker", price: 30 },
  { title: "CI/CD", price: 15 },
  { title: "Adobe Flash", price: 40 },
  { title: "Sony Vegas", price: 40 },
  { title: "Cartoon Animation 2D", price: 99 },
  { title: "Adobe After Effects", price: 70 },
  { title: "Adobe Premiere", price: 70 },
  { title: "Particle Illusion", price: 20 },
  { title: "Cinema 4D", price: 70 },
  { title: "Daz3D Studio", price: 70 },
  { title: "FL Studio", price: 50 },
  { title: "Blender", price: 100 },
];

export function buildDefaultMonthlyPeriod() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function parseCreatedDate(value: string) {
  const parsed = value ? new Date(value) : new Date();
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  return new Date();
}

function lastDayOfMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function buildMonthlyRange(period: string, createdAt: string) {
  if (!period) return null;

  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return null;

  const createdDate = parseCreatedDate(createdAt);
  const anchorDay = createdDate.getDate();
  const monthIndex = month - 1;

  const startDay = Math.min(anchorDay, lastDayOfMonth(year, monthIndex));
  const start = new Date(year, monthIndex, startDay);

  const nextMonthYear = monthIndex === 11 ? year + 1 : year;
  const nextMonthIndex = (monthIndex + 1) % 12;
  const endDay = Math.min(anchorDay, lastDayOfMonth(nextMonthYear, nextMonthIndex));
  const end = new Date(nextMonthYear, nextMonthIndex, endDay);

  return { start, end };
}

export function formatMonthlyPeriod(value: string) {
  if (!value) return "-";
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
}

export function formatMonthlyPeriodWithDate(value: string, createdAt: string) {
  return `${formatMonthlyPeriod(value)} • ${formatMonthlyRangeLabel(value, createdAt)}`;
}

export function formatMonthlyRangeLabel(value: string, createdAt: string) {
  const range = buildMonthlyRange(value, createdAt);
  if (!range) return "-";

  return `${range.start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} - ${range.end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}
