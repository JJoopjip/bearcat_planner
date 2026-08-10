export const dkey = (d: Date = new Date()): string => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

export const startOfWeek = (d: Date = new Date()): Date => {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const addDays = (d: Date, n: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const weekDays = (base: Date = new Date()): string[] => {
  const s = startOfWeek(base);
  return Array.from({ length: 7 }, (_, i) => dkey(addDays(s, i)));
};

export const prettyDate = (d: Date = new Date()): string =>
  d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

export const uid = (): string => Math.random().toString(36).slice(2, 9);
