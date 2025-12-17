"use client";

import React, { useEffect, useMemo, useState } from "react";

/* ===================== TYPES ===================== */

type Meal = {
  name: string;
  type: string; // kept for display only (not filtered)
  origin: string; // shown as “Cuisine”
  diet: string;
  prep: string;
  time: "Busy" | "Free";
  protein: string;
  groceries: string[];
};

type FilterKey = "origin" | "diet" | "prep" | "time" | "protein" | "favorites";

/* ===================== DEFAULT MEALS ===================== */
/* Cuisines represented: Italian, Mexican, American, Chinese, Indian, Thai, Greek, Mediterranean */

const DEFAULT_MEALS: Meal[] = [
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
    name: "Quick Chinese Stir-Fry",
    type: "Skillet",
    origin: "Chinese",
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
    name: "Thai Peanut Noodle Bowls",
    type: "Noodles",
    origin: "Thai",
    diet: "Dairy-Free",
    prep: "30 min",
    time: "Free",
    protein: "Medium",
    groceries: ["noodles", "peanut butter", "soy sauce", "lime"],
  },
  {
    name: "Greek Chicken Pitas",
    type: "Handheld",
    origin: "Greek",
    diet: "None",
    prep: "30 min",
    time: "Free",
    protein: "High",
    groceries: ["pitas", "chicken", "tzatziki", "cucumber"],
  },
  {
    name: "Mediterranean Shakshuka",
    type: "One-Pan",
    origin: "Mediterranean",
    diet: "Vegetarian",
    prep: "30 min",
    time: "Free",
    protein: "Medium",
    groceries: ["eggs", "tomatoes", "peppers"],
  },
];

/* ===================== CONSTANTS ===================== */

const STORAGE_KEY = "dinner-game-state";
const INTRO_KEY = "dinner-intro-seen";

const FILTER_META: Record<FilterKey, { label: string; icon: string; hint?: string }> = {
  origin: { label: "Cuisine", icon: "🌎" },
  diet: { label: "Diet", icon: "🥗" },
  prep: { label: "Prep Time", icon: "⏱️" },
  time: { label: "Energy", icon: "⚡", hint: "Busy vs Free" },
  protein: { label: "Protein", icon: "💪" },
  favorites: { label: "Favorites", icon: "⭐", hint: "Favorites only" },
};

/* ===================== UI HELPERS ===================== */

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-6 py-5">
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}

function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "danger" | "outline";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const base =
    "rounded-2xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]";
  const styles =
    variant === "primary"
      ? "bg-black text-white hover:bg-zinc-800"
      : variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-500"
      : "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

function FilterSelect({
  label,
  icon,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  icon: string;
  hint?: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex items-baseline gap-2">
        <div className="text-sm font-extrabold tracking-[0.04em] text-zinc-900">
          <span className="mr-2">{icon}</span>
          {label}
          {hint ? " —" : ""}
        </div>
        {hint ? <div className="text-xs text-zinc-500">{hint}</div> : null}
      </div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-2">
      <div className="text-sm font-extrabold tracking-[0.04em] text-zinc-900">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
      />
    </div>
  );
}

/* ===================== PAGE ===================== */

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  // Custom meals (added via UI)
  const [customMeals, setCustomMeals] = useState<Meal[]>([]);
  const allMeals = useMemo(() => [...DEFAULT_MEALS, ...customMeals], [customMeals]);

  const [filters, setFilters] = useState<Record<FilterKey, string>>({
    origin: "All",
    diet: "All",
    prep: "All",
    time: "All",
    protein: "All",
    favorites: "All",
  });

  const [picked, setPicked] = useState<Meal | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Favorites panel (collapsed by default)
  const [favoritesOpen, setFavoritesOpen] = useState(false);

  // Add Meal form state
  const [newMeal, setNewMeal] = useState({
    name: "",
    cuisine: "",
    diet: "None",
    prep: "30 min",
    energy: "Busy" as "Busy" | "Free",
    protein: "Medium",
    groceries: "",
  });

  useEffect(() => {
    setMounted(true);
    setShowIntro(!localStorage.getItem(INTRO_KEY));
  }, []);

  // Default energy based on weekday/weekend
  useEffect(() => {
    const day = new Date().getDay();
    setFilters((f) => ({ ...f, time: day === 0 || day === 6 ? "Free" : "Busy" }));
  }, []);

  // Load persisted state
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setFavorites(Array.isArray(parsed.favorites) ? parsed.favorites : []);
      setCustomMeals(Array.isArray(parsed.customMeals) ? parsed.customMeals : []);
    } catch {
      // ignore bad storage
    }
  }, []);

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ favorites, customMeals }));
  }, [favorites, customMeals]);

  const isFavorite = (mealName: string) => favorites.includes(mealName);

  const toggleFavorite = (mealName: string) => {
    setFavorites((f) => (f.includes(mealName) ? f.filter((x) => x !== mealName) : [...f, mealName]));
  };

  const options = (key: FilterKey) => {
    if (key === "favorites") return ["All", "Favorites Only"];
    return ["All", ...Array.from(new Set(allMeals.map((m) => (m as any)[key])))];
  };

  const filteredMeals = useMemo(() => {
    return allMeals.filter((m) => {
      if (filters.favorites === "Favorites Only" && !isFavorite(m.name)) {
        return false;
      }

      return (Object.entries(filters) as [FilterKey, string][]).every(([k, v]) => {
        if (k === "favorites") return true;
        return v === "All" || (m as any)[k] === v;
      });
    });
  }, [allMeals, filters, favorites]);

  const letsEat = () => {
    setErrorMsg("");
    if (!filteredMeals.length) {
      setPicked(null);
      setErrorMsg("No meals match those filters. Try loosening one dropdown.");
      return;
    }
    setPicked(filteredMeals[Math.floor(Math.random() * filteredMeals.length)]);
  };

  const panicPick = () => {
    setErrorMsg("");
    const busyMeals = allMeals.filter((m) => {
      if (m.time !== "Busy") return false;
      if (filters.favorites === "Favorites Only" && !isFavorite(m.name)) return false;
      return true;
    });
    if (!busyMeals.length) {
      setPicked(null);
      setErrorMsg("No Busy meals available for that category.");
      return;
    }
    setPicked(busyMeals[Math.floor(Math.random() * busyMeals.length)]);
  };

  const favoriteMeals: Meal[] = useMemo(() => {
    const byName = new Map(allMeals.map((m) => [m.name, m]));
    return favorites.map((name) => byName.get(name)).filter(Boolean) as Meal[];
  }, [favorites, allMeals]);

  const pickSpecificMeal = (meal: Meal) => {
    setErrorMsg("");
    setPicked(meal);
  };

  const deleteCustomMeal = (name: string) => {
    setCustomMeals((ms) => ms.filter((m) => m.name !== name));
    setFavorites((f) => f.filter((x) => x !== name));
    if (picked?.name === name) setPicked(null);
  };

  const normalizeName = (s: string) => s.trim().toLowerCase();

  const addMeal = () => {
    setErrorMsg("");

    const name = newMeal.name.trim();
    const cuisine = newMeal.cuisine.trim();

    if (!name) return setErrorMsg("Meal name is required.");
    if (!cuisine) return setErrorMsg("Cuisine is required.");

    const existsInDefaults = DEFAULT_MEALS.some((m) => normalizeName(m.name) === normalizeName(name));
    const existsInCustom = customMeals.some((m) => normalizeName(m.name) === normalizeName(name));

    if (existsInDefaults || existsInCustom) {
      return setErrorMsg("That meal name already exists. Try a slightly different name.");
    }

    const groceries = newMeal.groceries
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    const meal: Meal = {
      name,
      type: "Custom", // simple label (not filtered)
      origin: cuisine,
      diet: newMeal.diet,
      prep: newMeal.prep,
      time: newMeal.energy,
      protein: newMeal.protein,
      groceries: groceries.length ? groceries : ["(add groceries later)"],
    };

    setCustomMeals((ms) => [...ms, meal]);

    // reset form
    setNewMeal({
      name: "",
      cuisine: "",
      diet: "None",
      prep: "30 min",
      energy: "Busy",
      protein: "Medium",
      groceries: "",
    });

    // Helpful: open favorites panel if they add+favorite later (doesn't force open)
  };

  if (!mounted) return null;

  if (showIntro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
        <div className="max-w-md w-full rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="p-8 text-center grid gap-4">
            <div className="text-4xl">🍽️</div>
            <h1 className="text-3xl font-bold text-zinc-900">Dinner, Decided</h1>
            <p className="text-zinc-700">
              Pick your vibe, tap the big button, and let the app be the bad guy.
            </p>
            <Button
              className="px-12 py-6 text-xl"
              onClick={() => {
                localStorage.setItem(INTRO_KEY, "true");
                setShowIntro(false);
              }}
            >
              Let’s Go
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto p-6 grid gap-12">
        <header className="text-center grid gap-3">
          <h1 className="text-3xl font-bold text-zinc-900">🎮 Dinner Decision Game</h1>
          <p className="text-zinc-700">Weekdays default to Busy. Weekends default to Free.</p>
          <p className="text-sm text-zinc-600">
            Favorites: <b>{favorites.length}</b> • Custom meals: <b>{customMeals.length}</b>
          </p>
        </header>

        {/* Choose a Meal (renamed from Set the rules) */}
        <Panel title="Choose a Meal">
          <div className="max-w-[560px] mx-auto w-full">
            <div className="grid gap-7">
              {(Object.keys(filters) as FilterKey[]).map((key) => (
                <FilterSelect
                  key={key}
                  {...FILTER_META[key]}
                  value={filters[key]}
                  options={options(key)}
                  onChange={(v) => setFilters((f) => ({ ...f, [key]: v }))}
                />
              ))}
            </div>
          </div>

          <div className="mt-16 border-t border-zinc-200 pt-14" />

          <div className="flex flex-col items-center justify-center gap-10 mt-10">
            <Button onClick={letsEat} className="px-14 py-7 text-xl">
              🍽️ Let’s Eat
            </Button>

            <Button onClick={panicPick} variant="danger" className="px-14 py-7 text-xl">
              🚨 I’m Exhausted
            </Button>
          </div>

          <p className="mt-8 text-center text-sm text-zinc-700">
            Matching options: <b>{filteredMeals.length}</b>
          </p>
        </Panel>

        {/* Picked meal panel */}
        {picked && (
          <Panel title="Tonight’s Winner">
            <div className="text-center grid gap-3">
              <div className="text-[34px]">🍽️</div>

              <h3 className="text-2xl font-bold text-zinc-900">
                {picked.name} {isFavorite(picked.name) ? <span title="Favorite">⭐</span> : null}
              </h3>

              <p className="text-sm text-zinc-700">
                🌎 {picked.origin} • ⏱️ {picked.prep} • ⚡ {picked.time} • 💪 {picked.protein}
              </p>

              <p className="text-sm text-zinc-700">🛒 {picked.groceries.join(", ")}</p>

              <div className="flex justify-center gap-3 flex-wrap mt-3">
                <Button
                  variant={isFavorite(picked.name) ? "outline" : "primary"}
                  className="px-6 py-3 text-base"
                  onClick={() => toggleFavorite(picked.name)}
                >
                  {isFavorite(picked.name) ? "★ Unfavorite" : "☆ Favorite"}
                </Button>

                <Button variant="outline" className="px-6 py-3 text-base" onClick={letsEat}>
                  🔁 Spin Again
                </Button>
              </div>
            </div>
          </Panel>
        )}

        {/* ➕ Add / Manage Meals Panel */}
        <Panel title="➕ Add a Meal (no coding needed)">
          <div className="max-w-[560px] mx-auto w-full">
            <div className="grid gap-5">
              <TextInput
                label="Meal Name"
                value={newMeal.name}
                onChange={(v) => setNewMeal((s) => ({ ...s, name: v }))}
                placeholder="e.g., Pad Thai, Chicken Parmesan, Taco Salad"
              />

              <TextInput
                label="Cuisine"
                value={newMeal.cuisine}
                onChange={(v) => setNewMeal((s) => ({ ...s, cuisine: v }))}
                placeholder="e.g., Italian, Mexican, Thai, Greek..."
              />

              <FilterSelect
                label="Diet"
                icon="🥗"
                value={newMeal.diet}
                options={["None", "Vegetarian", "Vegan", "Dairy-Free", "Gluten-Free", "Low-Carb"]}
                onChange={(v) => setNewMeal((s) => ({ ...s, diet: v }))}
              />

              <FilterSelect
                label="Prep Time"
                icon="⏱️"
                value={newMeal.prep}
                options={["15 min", "30 min", "45 min", "Weekend"]}
                onChange={(v) => setNewMeal((s) => ({ ...s, prep: v }))}
              />

              <FilterSelect
                label="Energy"
                icon="⚡"
                hint="Busy vs Free"
                value={newMeal.energy}
                options={["Busy", "Free"]}
                onChange={(v) => setNewMeal((s) => ({ ...s, energy: v as "Busy" | "Free" }))}
              />

              <FilterSelect
                label="Protein"
                icon="💪"
                value={newMeal.protein}
                options={["Low", "Medium", "High"]}
                onChange={(v) => setNewMeal((s) => ({ ...s, protein: v }))}
              />

              <TextInput
                label="Groceries (comma separated)"
                value={newMeal.groceries}
                onChange={(v) => setNewMeal((s) => ({ ...s, groceries: v }))}
                placeholder="e.g., chicken, rice, soy sauce, broccoli"
              />

              {errorMsg ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                  {errorMsg}
                </div>
              ) : null}

              <div className="flex gap-3 justify-center flex-wrap">
                <Button className="px-10 py-4 text-lg" onClick={addMeal}>
                  ➕ Add Meal
                </Button>
              </div>

              <div className="border-t border-zinc-200 pt-5 mt-2">
                <div className="font-extrabold text-zinc-900 mb-3">Custom Meals</div>

                {customMeals.length === 0 ? (
                  <p className="text-sm text-zinc-700">
                    No custom meals yet. Add one above and it will appear in the app immediately.
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {customMeals.map((m) => (
                      <div
                        key={m.name}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3"
                      >
                        <div className="grid gap-1">
                          <div className="font-extrabold text-zinc-900">🧾 {m.name}</div>
                          <div className="text-xs text-zinc-500">
                            {m.origin} • {m.prep} • {m.time} • {m.protein} protein
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            className="px-5 py-3 text-base"
                            onClick={() => pickSpecificMeal(m)}
                          >
                            🎯 Pick
                          </Button>
                          <Button
                            variant="outline"
                            className="px-5 py-3 text-base"
                            onClick={() => deleteCustomMeal(m.name)}
                          >
                            🗑️ Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-zinc-500 mt-3">
                  Tip: New cuisines you type will automatically show up in the Cuisine dropdown.
                </p>
              </div>
            </div>
          </div>
        </Panel>

        {/* ⭐ Favorites List Panel (collapsed by default) */}
        <Panel title="⭐ Favorites">
          <div className="flex items-center justify-between gap-3">
            <p className="text-zinc-700">
              You have <b>{favorites.length}</b> favorite{favorites.length === 1 ? "" : "s"}.
            </p>

            <Button
              variant="outline"
              className="px-5 py-3 text-base"
              onClick={() => setFavoritesOpen((o) => !o)}
            >
              {favoritesOpen ? "Hide" : "Show"}
            </Button>
          </div>

          {favoritesOpen ? (
            <div className="mt-5">
              {favoriteMeals.length === 0 ? (
                <p className="text-zinc-700">
                  No favorites yet. Pick a meal, hit <b>☆ Favorite</b>, and it’ll show up here.
                </p>
              ) : (
                <div className="grid gap-3">
                  {favoriteMeals.map((m) => (
                    <div
                      key={m.name}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
                    >
                      <div className="grid gap-1">
                        <div className="font-extrabold text-zinc-900">⭐ {m.name}</div>
                        <div className="text-xs text-zinc-500">
                          {m.origin} • {m.prep} • {m.time} • {m.protein} protein
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          className="px-5 py-3 text-base"
                          onClick={() => pickSpecificMeal(m)}
                        >
                          🎯 Pick This
                        </Button>
                        <Button
                          variant="outline"
                          className="px-5 py-3 text-base"
                          onClick={() => toggleFavorite(m.name)}
                        >
                          🗑️ Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
