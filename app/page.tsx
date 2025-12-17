"use client";

import React, { useEffect, useMemo, useState } from "react";

/* ===================== TYPES ===================== */

type Meal = {
  id: string;
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

type MealDraft = {
  name: string;
  cuisine: string; // maps to origin
  diet: string;
  prep: string;
  energy: "Busy" | "Free"; // maps to time
  protein: string;
  groceries: string; // comma separated
};

type DefaultEdits = Record<string, Omit<Meal, "id">>;

/* ===================== DEFAULT MEALS ===================== */

const DEFAULT_MEALS: Meal[] = [
  {
    id: "spaghetti-bolognese",
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
    id: "turkey-tacos",
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
    id: "grilled-burgers",
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
    id: "quick-chinese-stir-fry",
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
    id: "butter-chicken",
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
    id: "thai-peanut-noodle-bowls",
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
    id: "greek-chicken-pitas",
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
    id: "mediterranean-shakshuka",
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

/* ===================== HELPERS ===================== */

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

function normalizeName(s: string) {
  return s.trim().toLowerCase();
}

function draftFromMeal(m: Meal): MealDraft {
  return {
    name: m.name,
    cuisine: m.origin,
    diet: m.diet,
    prep: m.prep,
    energy: m.time,
    protein: m.protein,
    groceries: m.groceries.join(", "),
  };
}

function mealFromDraft(base: Meal, d: MealDraft): Omit<Meal, "id"> {
  const groceries = d.groceries
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  return {
    name: d.name.trim(),
    type: base.type, // keep existing type (still display only)
    origin: d.cuisine.trim(),
    diet: d.diet,
    prep: d.prep,
    time: d.energy,
    protein: d.protein,
    groceries: groceries.length ? groceries : ["(add groceries later)"],
  };
}

function matchesSearch(meal: Meal, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const hay = [
    meal.name,
    meal.origin,
    meal.diet,
    meal.prep,
    meal.time,
    meal.protein,
    meal.groceries.join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

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

  // Custom meals + default edits
  const [customMeals, setCustomMeals] = useState<Meal[]>([]);
  const [defaultEdits, setDefaultEdits] = useState<DefaultEdits>({});

  const defaultIds = useMemo(() => new Set(DEFAULT_MEALS.map((m) => m.id)), []);
  const isDefaultId = (id: string) => defaultIds.has(id);

  const effectiveDefaults = useMemo(() => {
    return DEFAULT_MEALS.map((m) => {
      const edit = defaultEdits[m.id];
      return edit ? ({ ...m, ...edit, id: m.id } as Meal) : m;
    });
  }, [defaultEdits]);

  const allMeals = useMemo(() => [...effectiveDefaults, ...customMeals], [effectiveDefaults, customMeals]);

  const [filters, setFilters] = useState<Record<FilterKey, string>>({
    origin: "All",
    diet: "All",
    prep: "All",
    time: "All",
    protein: "All",
    favorites: "All",
  });

  const [picked, setPicked] = useState<Meal | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]); // meal IDs
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Favorites panel (collapsed by default)
  const [favoritesOpen, setFavoritesOpen] = useState(false);

  // Meal editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MealDraft>({
    name: "",
    cuisine: "",
    diet: "None",
    prep: "30 min",
    energy: "Busy",
    protein: "Medium",
    groceries: "",
  });

  // Manage Meals search + quick pick
  const [mealSearch, setMealSearch] = useState("");
  const [quickPickId, setQuickPickId] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    setShowIntro(!localStorage.getItem(INTRO_KEY));
  }, []);

  useEffect(() => {
    const day = new Date().getDay();
    setFilters((f) => ({ ...f, time: day === 0 || day === 6 ? "Free" : "Busy" }));
  }, []);

  // Load persisted state (supports old favorites-by-name too)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);

      const loadedCustom: any[] = Array.isArray(parsed.customMeals) ? parsed.customMeals : [];
      const withIds: Meal[] = loadedCustom
        .map((m) => {
          if (!m || typeof m !== "object") return null;
          const id = typeof m.id === "string" ? m.id : makeId("custom");
          return {
            id,
            name: String(m.name ?? ""),
            type: String(m.type ?? "Custom"),
            origin: String(m.origin ?? m.cuisine ?? ""),
            diet: String(m.diet ?? "None"),
            prep: String(m.prep ?? "30 min"),
            time: (m.time === "Free" ? "Free" : "Busy") as "Busy" | "Free",
            protein: String(m.protein ?? "Medium"),
            groceries: Array.isArray(m.groceries) ? m.groceries.map(String) : ["(add groceries later)"],
          } satisfies Meal;
        })
        .filter(Boolean) as Meal[];

      setCustomMeals(withIds);

      const loadedEdits = parsed.defaultEdits && typeof parsed.defaultEdits === "object" ? parsed.defaultEdits : {};
      setDefaultEdits(loadedEdits as DefaultEdits);

      const loadedFavs: any[] = Array.isArray(parsed.favorites) ? parsed.favorites : [];
      const looksLikeIds = loadedFavs.some((x) => typeof x === "string" && x.includes("-"));
      if (looksLikeIds) {
        setFavorites(loadedFavs.filter((x) => typeof x === "string"));
      } else {
        const byName = new Map<string, string>();
        DEFAULT_MEALS.forEach((m) => byName.set(normalizeName(m.name), m.id));
        withIds.forEach((m) => byName.set(normalizeName(m.name), m.id));

        const migrated = loadedFavs
          .filter((x) => typeof x === "string")
          .map((name) => byName.get(normalizeName(name)))
          .filter(Boolean) as string[];

        setFavorites(Array.from(new Set(migrated)));
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ favorites, customMeals, defaultEdits }));
  }, [favorites, customMeals, defaultEdits]);

  const isFavorite = (mealId: string) => favorites.includes(mealId);

  const toggleFavorite = (mealId: string) => {
    setFavorites((f) => (f.includes(mealId) ? f.filter((x) => x !== mealId) : [...f, mealId]));
  };

  const options = (key: FilterKey) => {
    if (key === "favorites") return ["All", "Favorites Only"];
    return ["All", ...Array.from(new Set(allMeals.map((m) => (m as any)[key])))];
  };

  const filteredMeals = useMemo(() => {
    return allMeals.filter((m) => {
      if (filters.favorites === "Favorites Only" && !isFavorite(m.id)) return false;

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
      if (filters.favorites === "Favorites Only" && !isFavorite(m.id)) return false;
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
    const byId = new Map(allMeals.map((m) => [m.id, m]));
    return favorites.map((id) => byId.get(id)).filter(Boolean) as Meal[];
  }, [favorites, allMeals]);

  const pickSpecificMeal = (meal: Meal) => {
    setErrorMsg("");
    setPicked(meal);
  };

  const deleteCustomMeal = (id: string) => {
    setCustomMeals((ms) => ms.filter((m) => m.id !== id));
    setFavorites((f) => f.filter((x) => x !== id));
    if (picked?.id === id) setPicked(null);
    if (editingId === id) {
      setEditingId(null);
      setDraft({
        name: "",
        cuisine: "",
        diet: "None",
        prep: "30 min",
        energy: "Busy",
        protein: "Medium",
        groceries: "",
      });
    }
  };

  const startEdit = (meal: Meal) => {
    setErrorMsg("");
    setEditingId(meal.id);
    setDraft(draftFromMeal(meal));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({
      name: "",
      cuisine: "",
      diet: "None",
      prep: "30 min",
      energy: "Busy",
      protein: "Medium",
      groceries: "",
    });
  };

  const saveDraft = () => {
    setErrorMsg("");

    const name = draft.name.trim();
    const cuisine = draft.cuisine.trim();

    if (!name) return setErrorMsg("Meal name is required.");
    if (!cuisine) return setErrorMsg("Cuisine is required.");

    const currentId = editingId;
    const duplicate = allMeals.some((m) => {
      if (currentId && m.id === currentId) return false;
      return normalizeName(m.name) === normalizeName(name);
    });
    if (duplicate) return setErrorMsg("That meal name already exists. Try a slightly different name.");

    if (!editingId) {
      const id = makeId("custom");
      const groceriesArr = draft.groceries
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

      const meal: Meal = {
        id,
        name,
        type: "Custom",
        origin: cuisine,
        diet: draft.diet,
        prep: draft.prep,
        time: draft.energy,
        protein: draft.protein,
        groceries: groceriesArr.length ? groceriesArr : ["(add groceries later)"],
      };

      setCustomMeals((ms) => [...ms, meal]);
      cancelEdit();
      return;
    }

    const existing = allMeals.find((m) => m.id === editingId);
    if (!existing) return setErrorMsg("Could not find that meal to edit.");

    const updatedNoId = mealFromDraft(existing, draft);

    if (isDefaultId(editingId)) {
      setDefaultEdits((prev) => ({ ...prev, [editingId]: updatedNoId }));
    } else {
      setCustomMeals((prev) => prev.map((m) => (m.id === editingId ? { ...m, ...updatedNoId } : m)));
    }

    if (picked?.id === editingId) setPicked((p) => (p ? { ...p, ...updatedNoId } : p));

    cancelEdit();
  };

  const resetDefaultMeal = (id: string) => {
    setDefaultEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (picked?.id === id) {
      const original = DEFAULT_MEALS.find((m) => m.id === id);
      if (original) setPicked(original);
    }
    if (editingId === id) cancelEdit();
  };

  const manageMeals = useMemo(() => {
    // Keep defaults first, then customs; both searchable
    const list = [...effectiveDefaults, ...customMeals];
    return list.filter((m) => matchesSearch(m, mealSearch));
  }, [effectiveDefaults, customMeals, mealSearch]);

  const quickPickOptions = useMemo(() => {
    // dropdown options (filtered by the same search so it’s usable)
    return manageMeals.map((m) => ({ id: m.id, label: m.name }));
  }, [manageMeals]);

  useEffect(() => {
    // If current quickPickId disappears due to search filter, clear it
    if (quickPickId && !quickPickOptions.some((o) => o.id === quickPickId)) {
      setQuickPickId("");
    }
  }, [quickPickId, quickPickOptions]);

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

  const isEditing = Boolean(editingId);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto p-6 grid gap-12">
        <header className="text-center grid gap-3">
          <h1 className="text-3xl font-bold text-zinc-900">🎮 Dinner Decision Game</h1>
          <p className="text-zinc-700">Weekdays default to Busy. Weekends default to Free.</p>
          <p className="text-sm text-zinc-600">
            Favorites: <b>{favorites.length}</b> • Custom meals: <b>{customMeals.length}</b>
            {Object.keys(defaultEdits).length ? (
              <>
                {" "}
                • Edited defaults: <b>{Object.keys(defaultEdits).length}</b>
              </>
            ) : null}
          </p>
        </header>

        {/* Choose a Meal */}
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

        {/* Winner */}
        {picked && (
          <Panel title="Tonight’s Winner">
            <div className="text-center grid gap-3">
              <div className="text-[34px]">🍽️</div>

              <h3 className="text-2xl font-bold text-zinc-900">
                {picked.name} {isFavorite(picked.id) ? <span title="Favorite">⭐</span> : null}
              </h3>

              <p className="text-sm text-zinc-700">
                🌎 {picked.origin} • ⏱️ {picked.prep} • ⚡ {picked.time} • 💪 {picked.protein}
              </p>

              <p className="text-sm text-zinc-700">🛒 {picked.groceries.join(", ")}</p>

              <div className="flex justify-center gap-3 flex-wrap mt-3">
                <Button
                  variant={isFavorite(picked.id) ? "outline" : "primary"}
                  className="px-6 py-3 text-base"
                  onClick={() => toggleFavorite(picked.id)}
                >
                  {isFavorite(picked.id) ? "★ Unfavorite" : "☆ Favorite"}
                </Button>

                <Button variant="outline" className="px-6 py-3 text-base" onClick={letsEat}>
                  🔁 Spin Again
                </Button>

                <Button variant="outline" className="px-6 py-3 text-base" onClick={() => startEdit(picked)}>
                  ✏️ Edit This
                </Button>
              </div>
            </div>
          </Panel>
        )}

        {/* Meal Editor / Manager */}
        <Panel title={isEditing ? "✏️ Edit Meal" : "➕ Add a Meal (no coding needed)"}>
          <div className="max-w-[560px] mx-auto w-full">
            <div className="grid gap-5">
              <TextInput
                label="Meal Name"
                value={draft.name}
                onChange={(v) => setDraft((s) => ({ ...s, name: v }))}
                placeholder="e.g., Pad Thai, Chicken Parmesan, Taco Salad"
              />

              <TextInput
                label="Cuisine"
                value={draft.cuisine}
                onChange={(v) => setDraft((s) => ({ ...s, cuisine: v }))}
                placeholder="e.g., Italian, Mexican, Thai, Greek..."
              />

              <FilterSelect
                label="Diet"
                icon="🥗"
                value={draft.diet}
                options={["None", "Vegetarian", "Vegan", "Dairy-Free", "Gluten-Free", "Low-Carb"]}
                onChange={(v) => setDraft((s) => ({ ...s, diet: v }))}
              />

              <FilterSelect
                label="Prep Time"
                icon="⏱️"
                value={draft.prep}
                options={["15 min", "30 min", "45 min", "Weekend"]}
                onChange={(v) => setDraft((s) => ({ ...s, prep: v }))}
              />

              <FilterSelect
                label="Energy"
                icon="⚡"
                hint="Busy vs Free"
                value={draft.energy}
                options={["Busy", "Free"]}
                onChange={(v) => setDraft((s) => ({ ...s, energy: v as "Busy" | "Free" }))}
              />

              <FilterSelect
                label="Protein"
                icon="💪"
                value={draft.protein}
                options={["Low", "Medium", "High"]}
                onChange={(v) => setDraft((s) => ({ ...s, protein: v }))}
              />

              <TextInput
                label="Groceries (comma separated)"
                value={draft.groceries}
                onChange={(v) => setDraft((s) => ({ ...s, groceries: v }))}
                placeholder="e.g., chicken, rice, soy sauce, broccoli"
              />

              {errorMsg ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                  {errorMsg}
                </div>
              ) : null}

              <div className="flex gap-3 justify-center flex-wrap">
                <Button className="px-10 py-4 text-lg" onClick={saveDraft}>
                  {isEditing ? "💾 Save Changes" : "➕ Add Meal"}
                </Button>

                {isEditing ? (
                  <Button variant="outline" className="px-10 py-4 text-lg" onClick={cancelEdit}>
                    Cancel
                  </Button>
                ) : null}
              </div>

              {/* Manage Meals controls */}
              <div className="border-t border-zinc-200 pt-5 mt-2">
                <div className="font-extrabold text-zinc-900 mb-3">Manage Meals</div>

                <div className="grid gap-4">
                  <TextInput
                    label="Search meals"
                    value={mealSearch}
                    onChange={(v) => setMealSearch(v)}
                    placeholder="Search by name, cuisine, groceries…"
                  />

                  <div className="grid gap-2">
                    <div className="text-sm font-extrabold tracking-[0.04em] text-zinc-900">
                      Quick pick (optional)
                    </div>
                    <select
                      value={quickPickId}
                      onChange={(e) => setQuickPickId(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400"
                    >
                      <option value="">Select a meal…</option>
                      {quickPickOptions.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        className="px-5 py-3 text-base"
                        disabled={!quickPickId}
                        onClick={() => {
                          const m = allMeals.find((x) => x.id === quickPickId);
                          if (m) pickSpecificMeal(m);
                        }}
                      >
                        🎯 Pick
                      </Button>

                      <Button
                        variant="outline"
                        className="px-5 py-3 text-base"
                        disabled={!quickPickId}
                        onClick={() => {
                          const m = allMeals.find((x) => x.id === quickPickId);
                          if (m) startEdit(m);
                        }}
                      >
                        ✏️ Edit
                      </Button>

                      <Button
                        variant="outline"
                        className="px-5 py-3 text-base"
                        disabled={!quickPickId || !isDefaultId(quickPickId) || !defaultEdits[quickPickId]}
                        onClick={() => resetDefaultMeal(quickPickId)}
                      >
                        ♻️ Reset default
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500">
                    Tip: the dropdown is best for quick “pick/edit” when you already know the meal name. For lots of meals,
                    search is faster.
                  </p>
                </div>

                <div className="mt-5 grid gap-2">
                  {manageMeals.map((m) => {
                    const isDef = isDefaultId(m.id);
                    const isEdited = Boolean(defaultEdits[m.id]);
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3"
                      >
                        <div className="grid gap-1 min-w-0">
                          <div className="font-extrabold text-zinc-900 truncate">
                            {isDef ? "📌 " : "🧾 "}
                            {m.name}
                            {isDef ? (
  <span className="ml-2 text-xs font-semibold text-zinc-500">
    {isEdited ? "Default (edited)" : "Default"}
  </span>
) : null}

                          </div>
                          <div className="text-xs text-zinc-500">
                            {m.origin} • {m.prep} • {m.time} • {m.protein} protein
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Button variant="outline" className="px-4 py-2 text-sm" onClick={() => pickSpecificMeal(m)}>
                            🎯 Pick
                          </Button>
                          <Button variant="outline" className="px-4 py-2 text-sm" onClick={() => startEdit(m)}>
                            ✏️ Edit
                          </Button>

                          {isDef ? (
                            <Button
                              variant="outline"
                              className="px-4 py-2 text-sm"
                              disabled={!isEdited}
                              onClick={() => resetDefaultMeal(m.id)}
                            >
                              ♻️ Reset
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              className="px-4 py-2 text-sm"
                              onClick={() => deleteCustomMeal(m.id)}
                            >
                              🗑️ Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-zinc-500 mt-3">
                  Defaults can’t be deleted — but you can edit them, and use <b>Reset</b> to go back to the original.
                </p>
              </div>
            </div>
          </div>
        </Panel>

        {/* Favorites (collapsed by default) */}
        <Panel title="⭐ Favorites">
          <div className="flex items-center justify-between gap-3">
            <p className="text-zinc-700">
              You have <b>{favorites.length}</b> favorite{favorites.length === 1 ? "" : "s"}.
            </p>

            <Button variant="outline" className="px-5 py-3 text-base" onClick={() => setFavoritesOpen((o) => !o)}>
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
                      key={m.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
                    >
                      <div className="grid gap-1">
                        <div className="font-extrabold text-zinc-900">⭐ {m.name}</div>
                        <div className="text-xs text-zinc-500">
                          {m.origin} • {m.prep} • {m.time} • {m.protein} protein
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" className="px-5 py-3 text-base" onClick={() => pickSpecificMeal(m)}>
                          🎯 Pick This
                        </Button>
                        <Button variant="outline" className="px-5 py-3 text-base" onClick={() => toggleFavorite(m.id)}>
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
