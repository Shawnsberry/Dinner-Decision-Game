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

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border bg-white px-3 py-1 text-sm">
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
        <h2 className="text-lg font-semibold">{title}</h2>
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
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "danger" | "outline" | "ghost";
  type?: "button" | "submit";
}) {
  const base =
    "rounded-2xl px-4 py-2 text-sm font-semibold transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-black text-white hover:bg-zinc-800"
      : variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-500"
      : variant === "outline"
      ? "border bg-white hover:bg-zinc-50"
      : "hover:bg-zinc-50";
  return (
    <button
      type={type}
      className={`${base} ${styles}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border bg-white shadow-sm">
        <div className="p-8 text-center grid gap-4">
          <div className="text-4xl">🍽️</div>
          <h1 className="text-3xl font-bold">Dinner, Decided</h1>
          <p className="text-zinc-600">
            This little game exists so you don’t have to decide what to cook
            every night.
          </p>
          <p className="text-sm text-zinc-500">
            Pick an energy level, hit the button, and let the app be the bad guy.
          </p>
          <div className="pt-2">
            <Button onClick={onStart}>Let’s Go</Button>
          </div>
          <p className="text-xs text-zinc-400">(Shows once per device.)</p>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  const [filters, setFilters] = useState({
    type: "All",
    origin: "All",
    diet: "All",
    prep: "All",
    time: "All",
    protein: "All",
  });

  const [picked, setPicked] = useState<Meal | null>(null);
  const [vetoes, setVetoes] = useState({ you: 1, partner: 1 });
  const [history, setHistory] = useState<string[]>([]);
  const [points, setPoints] = useState(0);

  // Mount + decide intro (prevents hydration mismatch)
  useEffect(() => {
    setMounted(true);
    setShowIntro(!localStorage.getItem(INTRO_KEY));
  }, []);

  // Auto-suggest Busy vs Free based on weekday/weekend
  useEffect(() => {
    const day = new Date().getDay(); // 0 Sun ... 6 Sat
    setFilters((f) => ({
      ...f,
      time: day === 0 || day === 6 ? "Free" : "Busy",
    }));
  }, []);

  // Load persisted state
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.history)) setHistory(parsed.history);
      if (typeof parsed.points === "number") setPoints(parsed.points);
    } catch {
      // ignore bad storage
    }
  }, []);

  // Persist history + points
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ history, points }));
  }, [history, points]);

  const filteredMeals = useMemo(() => {
    return meals.filter((m) => {
      const match = Object.entries(filters).every(([k, v]) => {
        // @ts-expect-error dynamic key
        return v === "All" || m[k] === v;
      });
      return match && !history.includes(m.name);
    });
  }, [filters, history]);

  const options = (key: keyof typeof filters) => {
    const vals = Array.from(new Set(meals.map((m) => (m as any)[key])));
    return ["All", ...vals];
  };

  const randomPick = () => {
    if (filteredMeals.length === 0) return;
    const choice =
      filteredMeals[Math.floor(Math.random() * filteredMeals.length)];
    setPicked(choice);
  };

  const panicPick = () => {
    // Panic = Busy mode + no vetoes + immediate pick
    setFilters((f) => ({ ...f, time: "Busy" }));
    setVetoes({ you: 0, partner: 0 });

    const busyMeals = meals.filter(
      (m) => m.time === "Busy" && !history.includes(m.name)
    );
    if (busyMeals.length === 0) return;

    const choice = busyMeals[Math.floor(Math.random() * busyMeals.length)];
    setPicked(choice);
  };

  const veto = (who: "you" | "partner") => {
    if (vetoes[who] <= 0) return;
    setVetoes((v) => ({ ...v, [who]: v[who] - 1 }));
    setPicked(null);
  };

  const acceptMeal = () => {
    if (!picked) return;
    setHistory((h) => [...h, picked.name]);

    if (!["Italian", "American"].includes(picked.origin)) {
      setPoints((p) => p + 10);
    }

    setPicked(null);
    setVetoes({ you: 1, partner: 1 });
  };

  const resetWeek = () => setHistory([]);

  if (!mounted) {
    return <div className="min-h-screen bg-zinc-50" />;
  }

  if (showIntro) {
    return (
      <IntroScreen
        onStart={() => {
          localStorage.setItem(INTRO_KEY, "true");
          setShowIntro(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto p-6 grid gap-6">
        <header className="text-center grid gap-2">
          <h1 className="text-3xl font-bold">🎮 Dinner Decision Game</h1>
          <p className="text-zinc-600">
            Weekdays default to Busy. Weekends default to Free. Panic button
            included.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Pill>🏆 Points: {points}</Pill>
            <Pill>🔒 Locked out: {history.length}</Pill>
            <Pill>⚡ Mode: {filters.time}</Pill>
          </div>
        </header>

        <Panel title="Set the rules">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(Object.keys(filters) as Array<keyof typeof filters>).map((key) => (
              <div key={key} className="grid gap-1">
                <label className="text-sm font-semibold capitalize">{key}</label>
                <select
                  className="w-full rounded-xl border bg-white px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                  value={filters[key]}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, [key]: e.target.value }))
                  }
                >
                  {options(key).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-4 justify-center border-t pt-6">
            <Button onClick={randomPick} disabled={filteredMeals.length === 0}>
              🎯 Click to Eat
            </Button>
            <Button onClick={panicPick} variant="danger">
              🚨 I’m Exhausted
            </Button>r
            <Button onClick={resetWeek} variant="outline">
              🔄 Reset Weekly Lockout
            </Button>
          </div>

          <p className="mt-3 text-sm text-zinc-600">
            Remaining options:{" "}
            <span className="font-semibold">{filteredMeals.length}</span>
          </p>
        </Panel>

        {picked ? (
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="p-6 text-center grid gap-3">
              <div className="text-3xl">🍽️</div>
              <h2 className="text-2xl font-semibold">Tonight’s Winner</h2>
              <div className="text-xl font-bold">{picked.name}</div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <Pill>{picked.type}</Pill>
                <Pill>{picked.origin}</Pill>
                <Pill>{picked.prep}</Pill>
                <Pill>{picked.time}</Pill>
                <Pill>{picked.protein} protein</Pill>
              </div>

              <div className="text-sm text-zinc-700">
                <span className="font-semibold">🛒 Grocery mini-list:</span>{" "}
                {picked.groceries.join(", ")}
              </div>

              <div className="mt-2 flex flex-wrap justify-center gap-3">
                <Button
                  variant="outline"
                  disabled={vetoes.you === 0}
                  onClick={() => veto("you")}
                >
                  🙅 You Veto ({vetoes.you})
                </Button>
                <Button
                  variant="outline"
                  disabled={vetoes.partner === 0}
                  onClick={() => veto("partner")}
                >
                  🙅 Partner Veto ({vetoes.partner})
                </Button>
                <Button onClick={acceptMeal}>✅ Accept</Button>
              </div>

              {vetoes.you === 0 && vetoes.partner === 0 ? (
                <p className="text-xs text-zinc-500">
                  Panic mode: vetoes disabled. The game is the boss tonight.
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <Panel title="How to play">
            <ul className="text-sm text-zinc-700 grid gap-2 list-disc pl-5">
              <li>Pick an energy level (Busy/Free) and any filters you want.</li>
              <li>
                Hit <b>Click to eat</b> and let fate choose.
              </li>
              <li>Each person gets 1 veto… unless panic button was used 😄</li>
            </ul>
          </Panel>
        )}
      </div>
    </div>
  );
}
