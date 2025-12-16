"use client";

import React, { useEffect, useMemo, useState } from "react";

type Meal = {
  name: string;
  type: string;
  origin: string;
  diet: string;
  prep: string;
  time: "Busy" | "Free";
  protein: string;
  groceries: string[];
};

const meals: Meal[] = [
  {
    name: "Spaghetti Bolognese",
    type: "Pasta",
    origin: "Italian",
    diet: "None",
    prep: "30 min",
    time: "Busy",
    protein: "Medium",
    groceries: ["pasta", "ground beef", "tomato sauce"],
  },
  {
    name: "Veggie Stir-Fry",
    type: "Skillet",
    origin: "Asian",
    diet: "Vegetarian",
    prep: "15 min",
    time: "Busy",
    protein: "Low",
    groceries: ["mixed veggies", "soy sauce", "rice"],
  },
  {
    name: "Butter Chicken",
    type: "Curry",
    origin: "Indian",
    diet: "None",
    prep: "30 min",
    time: "Free",
    protein: "High",
    groceries: ["chicken", "curry paste", "cream"],
  },
  {
    name: "Turkey Tacos",
    type: "Handheld",
    origin: "Mexican",
    diet: "Dairy-Free",
    prep: "15 min",
    time: "Busy",
    protein: "High",
    groceries: ["tortillas", "ground turkey", "lettuce"],
  },
  {
    name: "Grilled Burgers",
    type: "Grill",
    origin: "American",
    diet: "None",
    prep: "Weekend",
    time: "Free",
    protein: "High",
    groceries: ["buns", "burger patties", "cheese"],
  },
  {
    name: "Sushi Bowls",
    type: "Rice Bowl",
    origin: "Japanese",
    diet: "Dairy-Free",
    prep: "30 min",
    time: "Free",
    protein: "Medium",
    groceries: ["rice", "fish", "avocado"],
  },
  {
    name: "Shakshuka",
    type: "One-Pan",
    origin: "Middle Eastern",
    diet: "Vegetarian",
    prep: "30 min",
    time: "Free",
    protein: "Medium",
    groceries: ["eggs", "tomatoes", "peppers"],
  },
];

const STORAGE_KEY = "dinner-game-state";
const INTRO_KEY = "dinner-intro-seen";

type FilterKey = "type" | "origin" | "diet" | "prep" | "time" | "protein";

const FILTER_META: Record<
  FilterKey,
  { label: string; icon: string; hint?: string }
> = {
  type: { label: "Type", icon: "🍳" },
  origin: { label: "Origin", icon: "🌎" },
  diet: { label: "Diet", icon: "🥗" },
  prep: { label: "Prep Time", icon: "⏱️" },
  time: { label: "Energy", icon: "⚡", hint: "Busy vs Free" },
  protein: { label: "Protein", icon: "💪" },
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border bg-white px-3 py-1 text-sm text-zinc-900">
      {children}
    </span>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="border-b px-5 py-4">
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "danger" | "outline";
  className?: string;
}) {
  const base =
    "rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-black text-white"
      : variant === "danger"
      ? "bg-red-600 text-white"
      : "border bg-white text-zinc-900";
  return (
    <button
      className={`${base} ${styles} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function FilterSelect({
  label,
  icon,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  icon: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline gap-2">
        <label className="text-sm font-bold tracking-wide text-zinc-900">
          <span className="mr-2">{icon}</span>
          {label}
          {hint ? " —" : ""}
        </label>
        {hint && (
          <span className="text-xs text-zinc-500 ml-1">{hint}</span>
        )}
      </div>
      <select
        className="w-full rounded-xl border bg-white px-4 py-3 text-base text-black"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [filters, setFilters] = useState<Record<FilterKey, string>>({
    type: "All",
    origin: "All",
    diet: "All",
    prep: "All",
    time: "All",
    protein: "All",
  });
  const [picked, setPicked] = useState<Meal | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    setMounted(true);
    setShowIntro(!localStorage.getItem(INTRO_KEY));
  }, []);

  useEffect(() => {
    const day = new Date().getDay();
    setFilters((f) => ({ ...f, time: day === 0 || day === 6 ? "Free" : "Busy" }));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setHistory(parsed.history || []);
      setPoints(parsed.points || 0);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ history, points }));
  }, [history, points]);

  const filteredMeals = useMemo(
    () =>
      meals.filter(
        (m) =>
          !history.includes(m.name) &&
          (Object.entries(filters) as [FilterKey, string][]).every(
            ([k, v]) => v === "All" || (m as any)[k] === v
          )
      ),
    [filters, history]
  );

  const options = (key: FilterKey) => [
    "All",
    ...Array.from(new Set(meals.map((m) => (m as any)[key]))),
  ];

  const letsEat = () => {
    if (!filteredMeals.length) return;
    setPicked(
      filteredMeals[Math.floor(Math.random() * filteredMeals.length)]
    );
  };

  if (!mounted) return null;

  if (showIntro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Button
          onClick={() => {
            localStorage.setItem(INTRO_KEY, "true");
            setShowIntro(false);
          }}
          className="px-8 py-4 text-lg"
        >
          Let’s Go
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto p-6 grid gap-10">
        <header className="text-center grid gap-3">
          <h1 className="text-3xl font-bold">🎮 Dinner Decision Game</h1>
          <div className="flex justify-center gap-2">
            <Pill>🏆 Points: {points}</Pill>
            <Pill>🔒 Locked out: {history.length}</Pill>
          </div>
        </header>

        <Panel title="Set the rules">
          <div className="grid gap-8">
            {(["type", "origin", "diet", "protein", "prep", "time"] as FilterKey[]).map(
              (key) => (
                <FilterSelect
                  key={key}
                  {...FILTER_META[key]}
                  value={filters[key]}
                  options={options(key)}
                  onChange={(v) =>
                    setFilters((f) => ({ ...f, [key]: v }))
                  }
                />
              )
            )}
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <Button onClick={letsEat} className="px-8 py-4 text-lg">
              🍽️ Let’s Eat
            </Button>
          </div>
        </Panel>

        {picked && (
          <Panel title="Tonight’s Winner">
            <div className="text-center grid gap-3">
              <h3 className="text-xl font-bold">{picked.name}</h3>
              <p className="text-sm">{picked.groceries.join(", ")}</p>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
