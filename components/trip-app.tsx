"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowDown, ArrowUp, BookOpen, CalendarDays, Car, Check, ChevronDown, ChevronRight, Circle, CircleEllipsis, Compass, Download, Footprints, GripVertical, MapPin, Minus, Navigation, Pencil, Plus, Search, ShoppingBag, SkipForward, Sparkles, TrainFront, Trash2, Utensils, X } from "lucide-react";
import { initialDayPlans, initialPlaces, initialShopping, initialTrip } from "@/lib/demo-data";
import seedJson from "@/data/seed.json";
import type { AppSection, DayActivity, DayPlan, Place, PlannedStop, ShoppingItem, StopStatus, TravelMode, TripProfile } from "@/lib/domain";
import { buildGoogleMapsDirUrl, buildPlaceEmbedUrl, buildRouteEmbedUrl, fetchDayRoute, modeLabel, type DayRoute, type RoutePoint } from "@/lib/directions";
import { addMinutes, moveStop, recalcStopTimes, stopLimitForPace, stopStatus, suggestStopOrder } from "@/lib/itinerary";
import { candidateToPlace, searchInternetPlaces, type InternetPlaceCandidate } from "@/lib/place-search";
import { matchParentPlaceId, mergeTimeline, shoppingForDay, shoppingTotals, stopCardKey, type TimelineEntry } from "@/lib/shopping";

const nav: Array<{ id: AppSection; label: string; icon: typeof Compass }> = [
  { id: "today", label: "今日", icon: Compass },
  { id: "map", label: "路书", icon: BookOpen },
  { id: "places", label: "地点", icon: MapPin },
  { id: "more", label: "更多", icon: CircleEllipsis },
];

const storageKey = "japan-trip-demo-places-v1";
const plansStorageKey = "japan-trip-demo-plans-v1";
const tripStorageKey = "japan-trip-demo-profile-v1";
const shoppingStorageKey = "japan-trip-demo-shopping-v1";

const usersStorageKey = "japan-trip-users-v1";
const activeUserStorageKey = "japan-trip-active-user-v1";
const userDataKey = (id: string) => `japan-trip-data-v1::${id}`;

type UserProfile = { id: string; name: string; createdAt: string };
type TripData = { places: Place[]; plans: DayPlan[]; trip: TripProfile; shopping: ShoppingItem[] };

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function initialTripData(): TripData {
  return cloneTripData(seedJson as unknown as TripData);
}

function cloneTripData(data: TripData): TripData {
  return JSON.parse(JSON.stringify(data)) as TripData;
}

type Todo = { key: string; refId: string; kind: "stop" | "shopping" | "food" | "checkin"; label: string; done: boolean; meta?: string };

function buildDayPlans(profile: TripProfile): DayPlan[] {
  const start = new Date(`${profile.startDate}T00:00:00Z`);
  const end = new Date(`${profile.endDate}T00:00:00Z`);
  const days = Math.max(1, Math.min(30, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1));
  const interests = profile.interests.length ? profile.interests : ["自由探索"];
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start.getTime() + index * 86400000).toISOString().slice(0, 10);
    const focus = interests[index % interests.length];
    return { id: crypto.randomUUID(), date, title: index === 0 ? `${profile.destination} · 初见` : index === days - 1 ? `${profile.destination} · 自由活动` : `${focus}主题日`, startTime: profile.pace === "relaxed" ? "09:30" : "08:30", endTime: profile.pace === "intensive" ? "21:00" : "19:30", pace: profile.pace, stops: [] };
  });
}

export function TripApp() {
  const [section, setSection] = useState<AppSection>("today");
  const [places, setPlaces] = useState<Place[]>(initialPlaces);
  const [diningOnly, setDiningOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [plans, setPlans] = useState<DayPlan[]>(initialDayPlans);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [trip, setTrip] = useState<TripProfile>(initialTrip);
  const [showTripWizard, setShowTripWizard] = useState(false);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [shopping, setShopping] = useState<ShoppingItem[]>(initialShopping);
  const [showAddShopping, setShowAddShopping] = useState(false);
  const [activeDayId, setActiveDayId] = useState(initialDayPlans[0]?.id ?? "");
  const [showTodayPlace, setShowTodayPlace] = useState(false);
  const [editingCard, setEditingCard] = useState<{ dayId: string; key: string } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeUserId, setActiveUserId] = useState("");
  const activePlan = plans.find((day) => day.id === activeDayId) ?? plans[0];

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    const storedUsers = readJson<UserProfile[]>(usersStorageKey);
    let loadedUsers: UserProfile[] = Array.isArray(storedUsers) ? storedUsers : [];
    if (loadedUsers.length === 0) {
      const id = crypto.randomUUID();
      const migrated: TripData = {
        places: readJson<Place[]>(storageKey) ?? initialPlaces,
        plans: readJson<DayPlan[]>(plansStorageKey) ?? initialDayPlans,
        trip: readJson<TripProfile>(tripStorageKey) ?? initialTrip,
        shopping: readJson<ShoppingItem[]>(shoppingStorageKey) ?? initialShopping,
      };
      loadedUsers = [{ id, name: "我的旅程", createdAt: new Date().toISOString() }];
      window.localStorage.setItem(userDataKey(id), JSON.stringify(migrated));
      window.localStorage.setItem(usersStorageKey, JSON.stringify(loadedUsers));
      window.localStorage.setItem(activeUserStorageKey, id);
    }
    const savedActive = window.localStorage.getItem(activeUserStorageKey);
    const activeId = loadedUsers.some((user) => user.id === savedActive) ? (savedActive as string) : loadedUsers[0].id;
    const data = readJson<TripData>(userDataKey(activeId)) ?? cloneTripData(initialTripData());
    queueMicrotask(() => {
      setUsers(loadedUsers);
      setActiveUserId(activeId);
      setPlaces(data.places);
      setPlans(data.plans);
      setTrip(data.trip);
      setShopping(data.shopping);
      setActiveDayId(data.plans[0]?.id ?? "");
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated || !activeUserId) return;
    window.localStorage.setItem(userDataKey(activeUserId), JSON.stringify({ places, plans, trip, shopping }));
  }, [places, plans, trip, shopping, hydrated, activeUserId]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(usersStorageKey, JSON.stringify(users));
  }, [users, hydrated]);

  useEffect(() => {
    if (!hydrated || !activeUserId) return;
    window.localStorage.setItem(activeUserStorageKey, activeUserId);
  }, [activeUserId, hydrated]);

  function persistActiveUser() {
    if (!activeUserId) return;
    window.localStorage.setItem(userDataKey(activeUserId), JSON.stringify({ places, plans, trip, shopping }));
  }

  function loadTripData(data: TripData) {
    setPlaces(data.places);
    setPlans(data.plans);
    setTrip(data.trip);
    setShopping(data.shopping);
    setActiveDayId(data.plans[0]?.id ?? "");
  }

  function switchUser(id: string) {
    if (!id || id === activeUserId) return;
    persistActiveUser();
    const data = readJson<TripData>(userDataKey(id)) ?? cloneTripData(initialTripData());
    setActiveUserId(id);
    loadTripData(data);
  }

  function createUser() {
    const name = window.prompt("新用户名称", "新用户");
    if (!name || !name.trim()) return;
    persistActiveUser();
    const id = crypto.randomUUID();
    const data = cloneTripData(initialTripData());
    window.localStorage.setItem(userDataKey(id), JSON.stringify(data));
    setUsers((current) => [...current, { id, name: name.trim(), createdAt: new Date().toISOString() }]);
    setActiveUserId(id);
    loadTripData(data);
  }

  function renameUser() {
    const current = users.find((user) => user.id === activeUserId);
    if (!current) return;
    const name = window.prompt("重命名用户", current.name);
    if (!name || !name.trim()) return;
    setUsers((list) => list.map((user) => user.id === activeUserId ? { ...user, name: name.trim() } : user));
  }

  function resetToSeed() {
    if (!window.confirm("用内置数据覆盖当前用户的数据？")) return;
    const data = cloneTripData(initialTripData());
    loadTripData(data);
    if (activeUserId) window.localStorage.setItem(userDataKey(activeUserId), JSON.stringify(data));
  }

  function removeUser() {
    if (users.length <= 1) return;
    const current = users.find((user) => user.id === activeUserId);
    if (!current || !window.confirm(`删除用户「${current.name}」及其全部数据？`)) return;
    window.localStorage.removeItem(userDataKey(activeUserId));
    const remaining = users.filter((user) => user.id !== activeUserId);
    const nextId = remaining[0].id;
    const data = readJson<TripData>(userDataKey(nextId)) ?? cloneTripData(initialTripData());
    setUsers(remaining);
    setActiveUserId(nextId);
    loadTripData(data);
  }

  const filteredPlaces = useMemo(() => places.filter((place) => {
    const food = place.kind === "food" || place.kind === "cafe";
    const matchesTab = !diningOnly || food;
    const haystack = `${place.name} ${place.localName ?? ""} ${place.area} ${place.cuisine ?? ""}`.toLowerCase();
    return matchesTab && haystack.includes(query.toLowerCase());
  }), [places, diningOnly, query]);

  function addDining(form: FormData) {
    const name = String(form.get("name") ?? "").trim();
    if (!name) return;
    const meal = String(form.get("meal")) as Place["meal"];
    const newPlace: Place = {
      id: crypto.randomUUID(), name, kind: "food", emoji: "🍽️", area: String(form.get("area") || "待确认"),
      priority: "want", duration: 75, cuisine: String(form.get("cuisine") || "日本料理"), meal,
      mustTry: String(form.get("mustTry") || ""), reservation: "计划预约",
    };
    setPlaces((current) => [...current, newPlace]);
    setShowAdd(false); setSection("places"); setDiningOnly(true);
  }

  function addPlace(place: Place) {
    setPlaces((current) => [...current, place]);
    setShowAddPlace(false);
  }

  function createTrip(profile: TripProfile) {
    const nextPlans = buildDayPlans(profile);
    setTrip(profile);
    setPlaces([]);
    setPlans(nextPlans);
    setActiveDayId(nextPlans[0]?.id ?? "");
    setShowTripWizard(false);
    setSection("today");
  }

  function quickAddStop(place: Place) {
    setPlaces((current) => current.some((item) => item.id === place.id) ? current : [...current, place]);
    setPlans((current) => current.map((day) => day.id === activeDayId ? { ...day, stops: day.stops.some((stop) => stop.placeId === place.id) ? day.stops : [...day.stops, { placeId: place.id, time: addMinutes(day.startTime, day.stops.length * 110) }] } : day));
    setShowTodayPlace(false);
  }

  function savePlan(next: DayPlan) {
    setPlans((current) => current.map((day) => day.id === next.id ? next : day));
    setEditingDayId(null);
  }

  function updateDayActivity(dayId: string, patch: Partial<DayActivity>) {
    setPlans((current) => current.map((day) => day.id === dayId ? { ...day, activity: { ...day.activity, ...patch } } : day));
  }

  function setStopStatus(dayId: string, placeId: string, status: StopStatus) {
    setPlans((current) => current.map((day) => day.id === dayId ? { ...day, stops: day.stops.map((stop) => stop.placeId === placeId ? { ...stop, status } : stop) } : day));
  }

  const placeLookup = (placeId: string) => places.find((place) => place.id === placeId);

  function setDayOrder(dayId: string, order: string[]) {
    setPlans((current) => current.map((day) => {
      if (day.id !== dayId) return day;
      const orderedStops = order
        .filter((key) => key.startsWith("stop:"))
        .map((key) => day.stops.find((stop) => `stop:${stop.placeId}` === key))
        .filter((stop): stop is PlannedStop => Boolean(stop));
      const leftover = day.stops.filter((stop) => !orderedStops.some((item) => item.placeId === stop.placeId));
      return { ...day, stops: recalcStopTimes([...orderedStops, ...leftover], day.startTime, placeLookup), order };
    }));
  }

  function deleteCard(dayId: string, key: string) {
    if (key.startsWith("stop:")) {
      const placeId = key.slice(5);
      setPlans((current) => current.map((day) => day.id === dayId ? { ...day, stops: day.stops.filter((stop) => stop.placeId !== placeId), order: day.order?.filter((item) => item !== key) } : day));
      setShopping((current) => current.map((item) => item.parentPlaceId === placeId ? { ...item, parentPlaceId: undefined } : item));
    } else {
      const id = key.slice(5);
      setShopping((current) => current.filter((item) => item.id !== id));
      setPlans((current) => current.map((day) => day.id === dayId ? { ...day, order: day.order?.filter((item) => item !== key) } : day));
    }
  }

  function moveCardToDay(fromDayId: string, key: string, toDayId: string) {
    if (fromDayId === toDayId) return;
    if (key.startsWith("stop:")) {
      const placeId = key.slice(5);
      setPlans((current) => {
        const source = current.find((day) => day.id === fromDayId);
        const stop = source?.stops.find((item) => item.placeId === placeId);
        if (!stop) return current;
        return current.map((day) => {
          if (day.id === fromDayId) return { ...day, stops: day.stops.filter((item) => item.placeId !== placeId), order: day.order?.filter((item) => item !== key) };
          if (day.id === toDayId && !day.stops.some((item) => item.placeId === placeId)) return { ...day, stops: recalcStopTimes([...day.stops, stop], day.startTime, placeLookup), order: [...(day.order ?? []), key] };
          return day;
        });
      });
      const placeName = placeLookup(placeId)?.name;
      const refs = placeName ? [{ id: placeId, name: placeName }] : [];
      setShopping((current) => current.map((item) => matchParentPlaceId(item, refs) === placeId ? { ...item, dayId: toDayId, parentPlaceId: placeId } : item));
    } else {
      const id = key.slice(5);
      setShopping((current) => current.map((item) => item.id === id ? { ...item, dayId: toDayId } : item));
      setPlans((current) => current.map((day) => {
        if (day.id === fromDayId) return { ...day, order: day.order?.filter((item) => item !== key) };
        if (day.id === toDayId) return { ...day, order: [...(day.order ?? []), key] };
        return day;
      }));
    }
  }

  function duplicateCard(key: string) {
    if (!key.startsWith("shop:")) return;
    const id = key.slice(5);
    setShopping((current) => {
      const item = current.find((entry) => entry.id === id);
      return item ? [...current, { ...item, id: crypto.randomUUID(), purchased: false, name: `${item.name} 副本` }] : current;
    });
  }

  function addShoppingCard(title: string, kind: "shopping" | "food" | "checkin" = "shopping") {
    const name = title.trim();
    if (!name) return;
    const id = crypto.randomUUID();
    setShopping((current) => [...current, { id, name, purchased: false, dayId: activeDayId, currency: "JPY", todoKind: kind }]);
    setPlans((current) => current.map((day) => day.id === activeDayId ? { ...day, order: [...(day.order ?? []), `shop:${id}`] } : day));
  }

  function updateShopping(id: string, patch: Partial<ShoppingItem>) {
    setShopping((current) => current.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, ...patch };
      if (patch.parentPlaceId) {
        const parentDay = plans.find((day) => day.stops.some((stop) => stop.placeId === patch.parentPlaceId));
        if (parentDay) next.dayId = parentDay.id;
      }
      return next;
    }));
  }

  function updateStop(dayId: string, placeId: string, patch: Partial<PlannedStop>) {
    setPlans((current) => current.map((day) => day.id === dayId ? { ...day, stops: day.stops.map((stop) => stop.placeId === placeId ? { ...stop, ...patch } : stop) } : day));
  }

  function addShopping(form: FormData) {
    const name = String(form.get("name") ?? "").trim();
    if (!name) return;
    const price = Number(form.get("estimatedPrice"));
    const parentPlaceId = String(form.get("parentPlaceId") || "") || undefined;
    const parentDayId = parentPlaceId ? plans.find((day) => day.stops.some((stop) => stop.placeId === parentPlaceId))?.id : undefined;
    setShopping((current) => [...current, {
      id: crypto.randomUUID(), name, purchased: false,
      category: (String(form.get("category") || "other") as ShoppingItem["category"]),
      storeName: String(form.get("storeName") || "") || undefined,
      area: String(form.get("area") || "") || undefined,
      dayId: parentDayId ?? (String(form.get("dayId") || "") || undefined),
      time: String(form.get("time") || "") || undefined,
      estimatedPrice: Number.isFinite(price) && price > 0 ? price : undefined,
      parentPlaceId,
      todoKind: ((): "shopping" | "food" | "checkin" => { const value = String(form.get("todoKind") || "shopping"); return value === "checkin" || value === "food" ? value : "shopping"; })(),
      currency: "JPY",
    }]);
    setShowAddShopping(false);
  }

  function togglePurchased(id: string) {
    setShopping((current) => current.map((item) => item.id === id ? { ...item, purchased: !item.purchased } : item));
  }

  function exportData() {
    const payload = { version: 1, exportedAt: new Date().toISOString(), places, plans, trip, shopping };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `japan-trip-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importData(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as { places?: Place[]; plans?: DayPlan[]; trip?: TripProfile; shopping?: ShoppingItem[] };
        if (Array.isArray(data.places)) setPlaces(data.places);
        if (Array.isArray(data.plans)) setPlans(data.plans);
        if (data.trip) setTrip(data.trip);
        if (Array.isArray(data.shopping)) setShopping(data.shopping);
        if (Array.isArray(data.plans) && data.plans[0]) setActiveDayId(data.plans[0].id);
      } catch {
        window.alert("导入失败：文件格式不正确");
      }
    };
    reader.readAsText(file);
  }

  function autoFillPlans() {
    const assigned = new Set(plans.flatMap((day) => day.stops.map((stop) => stop.placeId)));
    const candidates = [...places].filter((place) => !assigned.has(place.id)).sort((a, b) => {
      const score = { must: 0, want: 1, optional: 2 };
      return score[a.priority] - score[b.priority] || a.area.localeCompare(b.area);
    });
    setPlans((current) => current.map((day, index) => {
      if (day.stops.length > 0) return day;
      const selected = candidates.filter((_, candidateIndex) => candidateIndex % current.length === index).slice(0, day.pace === "relaxed" ? 3 : 5);
      return { ...day, stops: selected.map((place, stopIndex) => ({ placeId: place.id, time: addMinutes(day.startTime, stopIndex * 120) })) };
    }));
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">日</span><div><b>旅日手帖</b><small>Japan Trip Planner</small></div></div>
        <button className="trip-card" onClick={() => setShowTripWizard(true)}><small>当前攻略 · 点击新建</small><strong>{trip.name}</strong><span>{trip.startDate.replaceAll("-",".")} — {trip.endDate.replaceAll("-",".")} · {plans.length}天</span></button>
        <nav>{nav.map((item) => <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)}><item.icon size={19}/><span>{item.label}</span></button>)}</nav>
        <div className="sidebar-foot"><span>DEMO</span> 数据保存在此设备</div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><p className="eyebrow">{trip.destination.toUpperCase()} · JAPAN</p><h1>{section === "today" ? `今天，${trip.destination}` : section === "places" ? "我的地点" : section === "map" ? "旅程地图" : "旅行工具"}</h1></div>
          <button className="avatar" aria-label="个人设置">FG</button>
        </header>

        {section === "today" && <Today places={places} plan={activePlan} plans={plans} activeDayId={activePlan?.id ?? ""} shopping={shopping} onSelectDay={setActiveDayId} onEditDay={setEditingDayId} onQuickAddPlace={() => setShowTodayPlace(true)} onDining={() => { setSection("places"); setDiningOnly(true); }} onAddShopping={() => setShowAddShopping(true)} onSetStatus={(placeId, status) => { if (activePlan) setStopStatus(activePlan.id, placeId, status); }} onTogglePurchased={togglePurchased} onReorder={(order) => { if (activePlan) setDayOrder(activePlan.id, order); }} onMoveCardToDay={(key, toDayId) => { if (activePlan) moveCardToDay(activePlan.id, key, toDayId); }} onAddCard={addShoppingCard} onAddPlace={quickAddStop} onAutoFill={autoFillPlans} onOpenCard={(key) => { if (activePlan) setEditingCard({ dayId: activePlan.id, key }); }} />}
        {section === "map" && <PosterBoard trip={trip} plans={plans} activeDayId={activePlan?.id ?? ""} onSelectDay={setActiveDayId} places={places} onUpdateActivity={updateDayActivity} />}
        {section === "places" && <Places places={filteredPlaces} diningOnly={diningOnly} setDiningOnly={setDiningOnly} query={query} setQuery={setQuery} onAdd={() => setShowAdd(true)} onAddPlace={() => setShowAddPlace(true)} onAddToPlan={(placeId) => { const targetId=plans[0]?.id; if(!targetId)return; setPlans((current) => current.map((day, index) => index === 0 && !day.stops.some((stop) => stop.placeId === placeId) ? { ...day, stops: [...day.stops, { placeId, time: addMinutes(day.startTime, day.stops.length * 110) }] } : day)); setSection("today"); setEditingDayId(targetId); }} />}
        {section === "more" && <More users={users} activeUserId={activeUserId} onSwitchUser={switchUser} onNewUser={createUser} onRenameUser={renameUser} onDeleteUser={removeUser} onReset={resetToSeed} onExport={exportData} onImport={importData} />}
      </main>

      <nav className="bottom-nav" aria-label="主导航">{nav.map((item) => <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)}><item.icon size={21}/><span>{item.label}</span></button>)}</nav>
      {showAdd && <DiningDialog onClose={() => setShowAdd(false)} onSubmit={addDining} />}
      {showAddPlace && <PlaceDialog onClose={() => setShowAddPlace(false)} onSubmit={addPlace} />}
      {showTodayPlace && <PlaceDialog onClose={() => setShowTodayPlace(false)} onSubmit={quickAddStop} />}
      {showAddShopping && <ShoppingDialog plans={plans} defaultDayId={activeDayId} parentOptions={(activePlan?.stops ?? []).map((stop) => places.find((place) => place.id === stop.placeId)).filter((place): place is Place => Boolean(place)).map((place) => ({ id: place.id, name: place.name }))} onClose={() => setShowAddShopping(false)} onSubmit={addShopping} />}
      {showTripWizard && <TripWizard current={trip} onClose={() => setShowTripWizard(false)} onCreate={createTrip} />}
      {editingDayId && <DayEditor day={plans.find((day) => day.id === editingDayId)!} places={places} onCreatePlace={(place) => setPlaces((current) => [...current, place])} onClose={() => setEditingDayId(null)} onSave={savePlan} />}
      {editingCard && <CardEditor day={plans.find((day) => day.id === editingCard.dayId)!} plans={plans} places={places} shopping={shopping} cardKey={editingCard.key} onClose={() => setEditingCard(null)} onDelete={(key) => { deleteCard(editingCard.dayId, key); setEditingCard(null); }} onDuplicate={duplicateCard} onMoveToDay={(key, toDayId) => { moveCardToDay(editingCard.dayId, key, toDayId); setEditingCard(null); }} onUpdateShopping={updateShopping} onUpdateStop={(placeId, patch) => updateStop(editingCard.dayId, placeId, patch)} />}
    </div>
  );
}

function Today({ places, plan, plans, activeDayId, shopping, onSelectDay, onEditDay, onQuickAddPlace, onDining, onAddShopping, onSetStatus, onTogglePurchased, onReorder, onMoveCardToDay, onAddCard, onAddPlace, onAutoFill, onOpenCard }: { places: Place[]; plan?: DayPlan; plans: DayPlan[]; activeDayId: string; shopping: ShoppingItem[]; onSelectDay: (id: string) => void; onEditDay: (id: string) => void; onQuickAddPlace: () => void; onDining: () => void; onAddShopping: () => void; onSetStatus: (placeId: string, status: StopStatus) => void; onTogglePurchased: (id: string) => void; onReorder: (order: string[]) => void; onMoveCardToDay: (key: string, toDayId: string) => void; onAddCard: (title: string, kind: "shopping" | "food" | "checkin") => void; onAddPlace: (place: Place) => void; onAutoFill: () => void; onOpenCard: (key: string) => void }) {
  const dayShopping = useMemo(() => plan ? shoppingForDay(shopping, plan.id) : [], [shopping, plan]);
  const resolvePlace = useCallback((placeId: string) => places.find((place) => place.id === placeId), [places]);
  const entries = useMemo(() => plan ? mergeTimeline(plan.stops, dayShopping, resolvePlace, plan.order) : [], [plan, dayShopping, resolvePlace]);
  const stopEntries = entries.filter((entry): entry is Extract<TimelineEntry, { kind: "stop" }> => entry.kind === "stop" && Boolean(entry.place));
  const primaryEntries = useMemo(() => entries.filter((entry): entry is Extract<TimelineEntry, { kind: "stop" }> => entry.kind === "stop" && Boolean(entry.place) && entry.place!.kind !== "food" && entry.place!.kind !== "cafe"), [entries]);
  const todosByParent = useMemo(() => {
    const map = new globalThis.Map<string, Todo[]>();
    const primaryRefs = primaryEntries.map((candidate) => ({ id: candidate.place!.id, name: candidate.place!.name }));
    for (const entry of entries) {
      let parent = "";
      let todo: Todo | null = null;
      if (entry.kind === "stop" && entry.place && (entry.place.kind === "food" || entry.place.kind === "cafe")) {
        parent = entry.stop.parentPlaceId ?? "";
        todo = { key: entry.key, refId: entry.stop.placeId, kind: "stop", label: entry.place.name, done: stopStatus(entry.stop) === "visited", meta: entry.place.cuisine ?? entry.place.meal };
      } else if (entry.kind === "shopping") {
        parent = matchParentPlaceId(entry.item, primaryRefs) ?? "";
        todo = { key: entry.key, refId: entry.item.id, kind: entry.item.todoKind ?? "shopping", label: entry.item.name, done: entry.item.purchased, meta: entry.item.storeName ?? (entry.item.estimatedPrice ? `¥${entry.item.estimatedPrice}` : undefined) };
      }
      if (todo) { const list = map.get(parent) ?? []; list.push(todo); map.set(parent, list); }
    }
    return map;
  }, [entries, primaryEntries]);
  const todosFor = (placeId: string) => todosByParent.get(placeId) ?? [];
  const looseTodos = todosByParent.get("") ?? [];
  const [collapsedTodos, setCollapsedTodos] = useState<string[]>([]);
  const toggleTodos = (id: string) => setCollapsedTodos((ids) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]);
  const renderTodoBlock = (id: string, todos: Todo[]) => {
    if (todos.length === 0) return null;
    const collapsed = collapsedTodos.includes(id);
    const loose = id === "__loose";
    return <div className={`todo-block${loose ? " loose" : ""}`}><button type="button" className="todo-toggle" onClick={(event) => { event.stopPropagation(); toggleTodos(id); }}>{collapsed ? <ChevronRight size={13}/> : <ChevronDown size={13}/>}{loose ? "本日待办（未指定地点）" : "待办"} {todos.filter((todo) => todo.done).length}/{todos.length}</button>{!collapsed && <ul className="todo-list">{todos.map((todo) => <li key={todo.key} className={todo.done ? "done" : ""}><button type="button" className="todo-check" aria-label="切换完成" onClick={(event) => { event.stopPropagation(); if (todo.kind === "stop") onSetStatus(todo.refId, todo.done ? "planned" : "visited"); else onTogglePurchased(todo.refId); }}>{todo.done ? <Check size={12}/> : null}</button><button type="button" className="todo-text" onClick={(event) => { event.stopPropagation(); onOpenCard(todo.key); }}>{todo.label}</button>{todo.meta && <span className="todo-meta">{todo.meta}</span>}</li>)}</ul>}</div>;
  };
  const nextPlanned = primaryEntries.find((entry) => stopStatus(entry.stop) === "planned");
  const points = useMemo(() => {
    if (!plan) return [];
    return plan.stops
      .map((stop) => places.find((place) => place.id === stop.placeId))
      .filter((place): place is Place => Boolean(place && place.latitude != null && place.longitude != null))
      .map((place) => ({ label: place.name, latitude: place.latitude as number, longitude: place.longitude as number }));
  }, [plan, places]);
  const totals = useMemo(() => shoppingTotals(dayShopping), [dayShopping]);
  const entryId = useCallback((entry: TimelineEntry) => entry.key, []);
  const [mode, setMode] = useState<TravelMode>("walk");
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [mapMode, setMapMode] = useState<"place" | "route">("place");
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dropDayId, setDropDayId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardKind, setNewCardKind] = useState<"shopping" | "food" | "checkin">("shopping");
  const [mapQuery, setMapQuery] = useState("");
  const [mapResults, setMapResults] = useState<InternetPlaceCandidate[]>([]);
  const [mapSearchStatus, setMapSearchStatus] = useState<"idle" | "loading" | "error">("idle");
  const [activeLegIndex, setActiveLegIndex] = useState<number | null>(null);
  const [mapZoom, setMapZoom] = useState(15);
  const listRef = useRef<HTMLDivElement>(null);
  const [routeResult, setRouteResult] = useState<{ key: string; routes: Partial<Record<TravelMode, DayRoute>> } | null>(null);

  const checkedStops = useMemo(() => {
    if (!plan || checkedIds.length < 2) return [];
    return plan.stops
      .filter((stop) => checkedIds.includes(stopCardKey(stop.placeId)))
      .map((stop) => places.find((place) => place.id === stop.placeId))
      .filter((place): place is Place => Boolean(place && place.latitude != null && place.longitude != null))
      .map((place) => ({ label: place.name, latitude: place.latitude as number, longitude: place.longitude as number }));
  }, [plan, places, checkedIds]);
  const routePoints = checkedStops.length >= 2 ? checkedStops : points;
  const usesSelection = routePoints !== points;
  const routeKey = routePoints.length >= 2 ? routePoints.map((point) => `${point.latitude},${point.longitude}`).join(";") : "";

  useEffect(() => {
    if (!routeKey) return;
    const controller = new AbortController();
    const travelModes: TravelMode[] = ["walk", "transit", "drive"];
    Promise.all(travelModes.map(async (travelMode) => [travelMode, await fetchDayRoute(routePoints, travelMode, controller.signal)] as const))
      .then((entries) => { if (!controller.signal.aborted) setRouteResult({ key: routeKey, routes: Object.fromEntries(entries) as Partial<Record<TravelMode, DayRoute>> }); })
      .catch(() => { if (!controller.signal.aborted) setRouteResult({ key: routeKey, routes: {} }); });
    return () => controller.abort();
  }, [routeKey, routePoints]);

  const currentRoutes = routeResult && routeResult.key === routeKey ? routeResult.routes : null;
  const route = currentRoutes?.[mode] ?? null;
  const routeStatus: "idle" | "loading" | "ready" = !routeKey ? "idle" : !currentRoutes ? "loading" : "ready";
  const legIndex = activeLegIndex != null && route && activeLegIndex < route.legs.length ? activeLegIndex : null;

  if (!plan) return <section className="blank-guide"><span>🗺️</span><p className="eyebrow">START FROM ZERO</p><h2>开始制作你的旅行攻略</h2><p>先新建一个攻略框架，再添加想去的地点与美食。</p><div><button className="primary" onClick={onQuickAddPlace}><Plus size={17}/>添加地点</button><button onClick={onDining}><Utensils size={17}/>添加美食</button></div></section>;

  const defaultSelectionId = nextPlanned ? entryId(nextPlanned) : entries[0] ? entryId(entries[0]) : "";
  const activeSelectionId = selectedId || defaultSelectionId;
  const activeEntry = entries.find((entry) => entryId(entry) === activeSelectionId);
  const next = activeEntry?.kind === "stop" ? activeEntry : nextPlanned;
  const activePlace = activeEntry?.kind === "stop" ? activeEntry.place : undefined;
  const activeShopping = activeEntry?.kind === "shopping" ? activeEntry.item : undefined;
  const activeLabel = activePlace?.name ?? activeShopping?.name ?? "当天地点";
  const activePoint: RoutePoint = activePlace
    ? { label: activePlace.name, latitude: activePlace.latitude, longitude: activePlace.longitude }
    : activeShopping
      ? { label: [activeShopping.name, activeShopping.storeName, activeShopping.area].filter(Boolean).join(" ") }
      : routePoints[0] ?? { label: "Fukuoka, Japan" };
  const legPoints = legIndex != null && routePoints[legIndex] && routePoints[legIndex + 1] ? [routePoints[legIndex], routePoints[legIndex + 1]] : null;
  const mapUrl = legPoints ? buildRouteEmbedUrl(legPoints, mode, mapZoom) : mapMode === "route" ? buildRouteEmbedUrl(routePoints, mode, mapZoom) : buildPlaceEmbedUrl(activePoint, mapZoom);
  const externalUrl = buildGoogleMapsDirUrl(routePoints, mode);
  const externalPlaceUrl = activePlace?.mapUrl ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activePoint.label)}`;
  const selectEntry = (entry: TimelineEntry) => { setSelectedId(entryId(entry)); setMapMode("place"); };
  const toggleChecked = (entry: TimelineEntry) => { setCheckedIds((ids) => { const id = entryId(entry); return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]; }); setMapMode("route"); };
  function startCardDrag(event: ReactPointerEvent<HTMLButtonElement>, key: string) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragKey(key);
  }
  function cardDropIndex(clientY: number) {
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-card-row]") ?? []);
    if (rows.length === 0) return 0;
    const found = rows.findIndex((row) => { const rect = row.getBoundingClientRect(); return clientY < rect.top + rect.height / 2; });
    return found === -1 ? rows.length - 1 : found;
  }
  function dragCardOver(event: ReactPointerEvent<HTMLButtonElement>) {
    const element = document.elementFromPoint(event.clientX, event.clientY);
    const tab = element?.closest<HTMLElement>("[data-day-tab]");
    setDropDayId(tab?.dataset.dayTab ?? null);
    if (!dragKey) return;
    const keys = entries.map((entry) => entry.key);
    const from = keys.indexOf(dragKey);
    if (from === -1) return;
    const target = cardDropIndex(event.clientY);
    if (target === from) return;
    const next = keys.slice();
    next.splice(from, 1);
    next.splice(target, 0, dragKey);
    onReorder(next);
  }
  function endCardDrag() {
    if (dragKey && dropDayId) onMoveCardToDay(dragKey, dropDayId);
    setDragKey(null);
    setDropDayId(null);
  }
  function submitNewCard() {
    const title = newCardTitle.trim();
    if (!title) return;
    onAddCard(title, newCardKind);
    setNewCardTitle("");
  }
  async function searchMap() {
    const query = mapQuery.trim();
    if (!query || mapSearchStatus === "loading") return;
    setMapSearchStatus("loading");
    setMapResults([]);
    try {
      const results = await searchInternetPlaces(query);
      setMapResults(results);
      setMapSearchStatus(results.length ? "idle" : "error");
    } catch {
      setMapResults([]);
      setMapSearchStatus("error");
    }
  }
  function addSearchedPlace(candidate: InternetPlaceCandidate) {
    const place = candidateToPlace(candidate, candidate.name, 60);
    onAddPlace(place);
    setSelectedId(stopCardKey(place.id));
    setMapMode("place");
    setMapResults([]);
    setMapQuery("");
    setMapSearchStatus("idle");
  }
  const sourceLabel = route?.source === "google" ? "Google 实时" : route?.source === "osrm" ? "OpenStreetMap" : "本地估算";
  const modeTabs: Array<{ id: TravelMode; label: string; icon: typeof Footprints }> = [
    { id: "walk", label: "步行", icon: Footprints },
    { id: "transit", label: "公交", icon: TrainFront },
    { id: "drive", label: "驾车", icon: Car },
  ];

  return <div className="page-grid">
    <section className="content-column">
      {plans.length > 1 &&       <div className="date-strip">{plans.map((day, index) => <button key={day.id} data-day-tab={day.id} className={`${day.id === activeDayId ? "selected" : ""}${dropDayId === day.id ? " drop-target" : ""}`} onClick={() => onSelectDay(day.id)}><small>DAY {index + 1}</small><b>{Number(day.date.slice(-2))}</b></button>)}</div>}
      {next ? <article className="next-card"><div className="next-art">{next.place!.emoji}<span>下一站</span></div><div className="next-body"><p className="eyebrow">{next.time} · {next.place!.area}</p><h2>{next.place!.name}</h2><p>{next.place!.note || `建议停留 ${next.place!.duration} 分钟。可在下方直接调整。`}</p><div className="actions"><button className="primary" onClick={() => onSetStatus(next.stop.placeId, "visited")}><Check size={17}/>标记到访</button><button onClick={onQuickAddPlace}><Plus size={17}/>添加地点</button><button onClick={() => onSetStatus(next.stop.placeId, "skipped")}><SkipForward size={17}/>跳过</button></div></div></article> : entries.length > 0 ? <article className="next-card done-card"><div className="next-art">✅</div><div className="next-body"><p className="eyebrow">ALL DONE</p><h2>今天的行程已全部完成</h2><p>共 {stopEntries.length} 站，其中 {stopEntries.filter((entry) => stopStatus(entry.stop) === "visited").length} 站已到访。可继续调整或添加新的地点。</p><div className="actions"><button className="primary" onClick={() => onEditDay(plan.id)}><CalendarDays size={17}/>编辑这一天</button><button onClick={onQuickAddPlace}><Plus size={17}/>添加地点</button></div></div></article> : <article className="next-card empty-card"><div className="next-art">🧭</div><div className="next-body"><p className="eyebrow">FREE DAY</p><h2>这一天还没有安排</h2><p>添加想去的地点或美食，就会出现在下方时间线中，随时可以直接编辑。</p><div className="actions"><button className="primary" onClick={onQuickAddPlace}><Plus size={17}/>添加地点</button><button onClick={onAddShopping}><ShoppingBag size={17}/>添加购物</button></div></div></article>}
      <div className="section-heading"><div><p className="eyebrow">{plan.date} · 剩余 {stopEntries.filter((entry) => stopStatus(entry.stop) === "planned").length} 站</p><h2>{plan.title}</h2></div><button className="text-button" onClick={() => onEditDay(plan.id)}>编辑这一天</button></div>
      <div className="timeline" ref={listRef}>{primaryEntries.map((entry, index) => {
        const isActive = activeSelectionId === entryId(entry);
        return <div key={entry.key} className="timeline-group" data-card-row={entry.key}><div className={`timeline-item stop-${stopStatus(entry.stop)}${isActive ? " selected" : ""}${dragKey === entry.key ? " dragging" : ""}`}><time>{entry.time}</time><span className="dot">{stopStatus(entry.stop) === "visited" ? "✓" : index + 1}</span><div className={`timeline-card${isActive ? " selected" : ""}`} role="button" tabIndex={0} onClick={() => selectEntry(entry)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectEntry(entry); } }}><button type="button" className="drag-handle" aria-label="拖动排序" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => startCardDrag(event, entry.key)} onPointerMove={dragCardOver} onPointerUp={endCardDrag} onPointerCancel={endCardDrag}><GripVertical size={15}/></button><label className="route-check" onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={checkedIds.includes(entryId(entry))} onChange={() => toggleChecked(entry)} aria-label="加入线路"/></label><span className="place-emoji">{entry.place!.emoji}</span><div><strong>{entry.place!.name}</strong><p>{entry.place!.area} · 停留 {entry.place!.duration} 分钟</p>{entry.place!.kind === "food" && <span className="food-note">{entry.place!.mustTry} · {entry.place!.reservation}</span>}{stopStatus(entry.stop) !== "planned" && <span className={`status-tag ${stopStatus(entry.stop)}`}>{stopStatus(entry.stop) === "visited" ? "已到访" : "已跳过"}</span>}{renderTodoBlock(entry.place!.id, todosFor(entry.place!.id))}</div>{stopStatus(entry.stop) === "planned" ? <button className="timeline-status-button" aria-label="标记到访" onClick={(event) => { event.stopPropagation(); onSetStatus(entry.stop.placeId, "visited"); }}><Check size={16}/></button> : <button className="timeline-status-button" aria-label="恢复为未完成" onClick={(event) => { event.stopPropagation(); onSetStatus(entry.stop.placeId, "planned"); }}><Circle size={16}/></button>}<button className="card-edit-button" aria-label="编辑卡片" onClick={(event) => { event.stopPropagation(); onOpenCard(entry.key); }}><Pencil size={15}/></button></div></div>{index < primaryEntries.length - 1 && <div className="transit"><span></span>↳ 预留移动时间 30 分钟</div>}</div>;
      })}</div>
      {renderTodoBlock("__loose", looseTodos)}
      <form className="card-composer" onSubmit={(event) => { event.preventDefault(); submitNewCard(); }}><select value={newCardKind} onChange={(event) => setNewCardKind(event.target.value as "shopping" | "food" | "checkin")} aria-label="待办类型"><option value="shopping">购物</option><option value="food">美食</option><option value="checkin">打卡点</option></select><input value={newCardTitle} onChange={(event) => setNewCardTitle(event.target.value)} placeholder="+ 添加待办，回车创建" aria-label="添加待办"/><button type="submit" disabled={!newCardTitle.trim()}><Plus size={15}/>添加</button></form>
      <div className="list-actions"><button onClick={onAddShopping}><ShoppingBag size={16}/>添加购物</button><button onClick={onDining}><Utensils size={16}/>管理用餐</button><button onClick={onAutoFill} disabled={places.length === 0}><Sparkles size={16}/>智能填充空白日</button>{checkedIds.length > 0 && <button onClick={() => setCheckedIds([])}>清空选择（{checkedIds.length}）</button>}{totals.count > 0 && <span className="list-total">购物 {totals.purchased}/{totals.count} 已买 · 约 ¥{totals.estimated}</span>}</div>
    </section>
    <aside className="right-column">
      <div className="map-search-wrap">
        <form className="map-search" onSubmit={(event) => { event.preventDefault(); void searchMap(); }}><Search size={15}/><input value={mapQuery} onChange={(event) => setMapQuery(event.target.value)} placeholder="搜索地点，一键加为卡片"/><button type="submit" disabled={!mapQuery.trim() || mapSearchStatus === "loading"}>{mapSearchStatus === "loading" ? "查找中…" : "搜索"}</button></form>
        {mapResults.length > 0 && <div className="map-results">{mapResults.map((candidate) => <button key={candidate.id} type="button" onClick={() => addSearchedPlace(candidate)}><span className="candidate-emoji">{candidate.emoji}</span><span><strong>{candidate.name}</strong><small>{candidate.categoryLabel} · {candidate.area}</small></span><span className="candidate-add"><Plus size={13}/>添加卡片</span></button>)}</div>}
      </div>
      {mapMode === "place" && activeEntry && <div className="day-map-detail"><div><p className="eyebrow">{activeEntry.kind === "stop" ? "已选地点" : "已选购物"}</p><h3>{activeLabel}</h3><small>{activePlace?.address ?? [activeShopping?.storeName, activeShopping?.area].filter(Boolean).join(" · ") ?? ""}</small></div><a href={externalPlaceUrl} target="_blank" rel="noreferrer">打开 Google Maps</a></div>}
      <div className="day-map">
        <div className="day-map-label"><MapPin size={15}/>{legIndex != null && route ? `${route.legs[legIndex].fromLabel} → ${route.legs[legIndex].toLabel}` : mapMode === "route" ? (points.length > 1 ? `${points.length} 站路线` : "当天路线") : activeLabel}</div>
        <div className="map-toggle"><button className={mapMode === "place" ? "active" : ""} onClick={() => setMapMode("place")}><MapPin size={13}/>地点</button><button className={mapMode === "route" ? "active" : ""} onClick={() => setMapMode("route")}><Navigation size={13}/>整日路线</button></div>
        {mapUrl ? <iframe key={mapUrl} title={`Google Maps — ${plan.title}`} src={mapUrl} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/> : <div className="day-map-empty">当天还没有可显示的地点</div>}
        <div className="map-zoom"><button type="button" aria-label="放大" onClick={() => setMapZoom((zoom) => Math.min(21, zoom + 1))}><Plus size={16}/></button><button type="button" aria-label="缩小" onClick={() => setMapZoom((zoom) => Math.max(3, zoom - 1))}><Minus size={16}/></button></div>
      </div>
      <div className="route-panel">
        <div className="route-head">
          <div><p className="eyebrow">TRANSIT LEGS</p><h3>{modeLabel[mode]}路线{usesSelection ? ` · 已选 ${routePoints.length} 站` : " · 整日"}</h3></div>
          <div className="mode-tabs">{modeTabs.map((tab) => <button key={tab.id} className={mode === tab.id ? "active" : ""} onClick={() => setMode(tab.id)}><tab.icon size={14}/>{tab.label}{currentRoutes?.[tab.id] ? <em>{currentRoutes[tab.id]!.totalDurationMinutes}分</em> : null}</button>)}</div>
        </div>
        {routeStatus === "loading" && <p className="route-state">正在获取线路…</p>}
        {routeStatus !== "loading" && route && route.legs.length > 0 && <p className="route-state">{route.totalDurationMinutes} 分钟{route.totalDistanceMeters ? ` · ${formatDistance(route.totalDistanceMeters)}` : ""} · {sourceLabel}</p>}
        {routeStatus !== "loading" && (!route || route.legs.length === 0) && <p className="route-state">{points.length < 2 ? "需要至少两个带坐标的地点" : "暂无该模式线路，可在 Google Maps 查看"}</p>}
        <ol className="route-legs">{route?.legs.map((leg, index) => <li key={leg.id} className={`route-leg${legIndex === index ? " active" : ""}${leg.steps && leg.steps.length > 0 ? " has-plan" : ""}`} role="button" tabIndex={0} onClick={() => { setActiveLegIndex(legIndex === index ? null : index); setMapMode("route"); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActiveLegIndex(legIndex === index ? null : index); setMapMode("route"); } }}><div className="route-leg-head"><span className="route-index">{index + 1}</span><div><strong>{leg.fromLabel} → {leg.toLabel}</strong><small>{modeLabel[leg.mode]} · {leg.durationMinutes} 分钟{leg.distanceMeters ? ` · ${formatDistance(leg.distanceMeters)}` : ""}</small></div></div>{leg.steps && leg.steps.length > 0 && <div className="route-leg-plan"><ul className="route-steps">{leg.steps.map((step, stepIndex) => <li key={`${leg.id}-${stepIndex}`}><span className="step-icon">{leg.mode === "transit" && step.transitLine ? <TrainFront size={13}/> : leg.mode === "drive" ? <Car size={13}/> : <Footprints size={13}/>}</span><div><strong>{step.instruction}</strong><small>{[step.durationMinutes ? `${step.durationMinutes} 分钟` : null, step.distanceMeters ? formatDistance(step.distanceMeters) : null, step.departureTime && step.arrivalTime ? `${step.departureTime}–${step.arrivalTime}` : null, step.numStops ? `${step.numStops} 站` : null].filter(Boolean).join(" · ")}</small></div></li>)}</ul></div>}</li>)}</ol>
        {points.length > 1 && <a className="route-open" href={externalUrl} target="_blank" rel="noreferrer"><Navigation size={15}/>在 Google Maps 打开路线</a>}
        <p className="route-source">线路数据 {sourceLabel} · 仅供规划参考</p>
      </div>
    </aside>
  </div>;
}

function Places({ places, diningOnly, setDiningOnly, query, setQuery, onAdd, onAddPlace, onAddToPlan }: { places: Place[]; diningOnly: boolean; setDiningOnly:(v:boolean)=>void; query:string; setQuery:(v:string)=>void; onAdd:()=>void; onAddPlace:()=>void; onAddToPlan:(id:string)=>void }) {
  return <section className="places-page"><div className="toolbar"><div className="segmented"><button className={!diningOnly?"active":""} onClick={()=>setDiningOnly(false)}>全部地点</button><button className={diningOnly?"active":""} onClick={()=>setDiningOnly(true)}>美食</button></div><div className="toolbar-actions"><button onClick={onAddPlace}><Plus size={17}/>添加地点</button><button className="primary" onClick={onAdd}><Utensils size={17}/>添加美食</button></div></div><label className="search"><Search size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="搜索地点、区域或料理…"/></label><div className="place-grid">{places.map((place)=><article className="place-card" key={place.id}><div className="place-visual">{place.emoji}<span>{place.area}</span></div><div className="place-content"><div className="place-title"><div><h3>{place.name}</h3><p>{place.localName ?? place.cuisine ?? "旅行地点"}</p></div><button aria-label="更多">•••</button></div>{(place.kind==="food"||place.kind==="cafe")&&<div className="chips"><span>{place.meal}</span><span>{place.cuisine}</span><span className={place.reservation==="已预约"?"reserved":""}>{place.reservation}</span></div>}{place.mustTry&&<p className="must-try">必吃 · {place.mustTry}</p>}<div className="card-bottom"><span>{place.priority==="must"?"必去":"想去"} · {place.duration}分钟</span><button onClick={()=>onAddToPlan(place.id)}>加入行程</button></div></div></article>)}</div>{places.length===0&&<div className="blank-guide compact"><span>📌</span><h2>从收藏第一个地点开始</h2><p>添加景点、购物地点或美食，然后回到行程页进行智能分配。</p><div><button onClick={onAddPlace}>添加地点</button><button className="primary" onClick={onAdd}>添加美食</button></div></div>}</section>;
}

function PosterBoard({ trip, plans, activeDayId, onSelectDay, places, onUpdateActivity }: { trip: TripProfile; plans: DayPlan[]; activeDayId: string; onSelectDay: (id: string) => void; places: Place[]; onUpdateActivity: (dayId: string, patch: Partial<DayActivity>) => void }) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const day = plans.find((item) => item.id === activeDayId) ?? plans[0];
  const dayIndex = day ? plans.findIndex((item) => item.id === day.id) + 1 : 1;
  const stops = (day?.stops ?? []).map((stop) => ({ stop, place: places.find((place) => place.id === stop.placeId) })).filter((entry): entry is { stop: PlannedStop; place: Place } => Boolean(entry.place));
  const activity = day?.activity ?? {};

  async function exportPng() {
    if (!posterRef.current || busy) return;
    setBusy(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(posterRef.current, { pixelRatio: 2, backgroundColor: "#f4efe6" });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `route-book-${day?.date ?? "day"}.png`;
      link.click();
    } catch {
      window.alert("导出失败，请重试");
    } finally {
      setBusy(false);
    }
  }

  if (!day) return <section className="blank-guide"><span>📖</span><h2>还没有可生成的路书</h2><p>先在今日页添加地点与安排行程。</p></section>;

  return <section className="poster-page">
    <div className="poster-toolbar">
      <div className="date-strip">{plans.map((item, index) => <button key={item.id} data-day-tab={item.id} className={item.id === day.id ? "selected" : ""} onClick={() => onSelectDay(item.id)}><small>DAY {index + 1}</small><b>{Number(item.date.slice(-2))}</b></button>)}</div>
      <button className="primary" onClick={() => void exportPng()} disabled={busy}><Download size={16}/>{busy ? "导出中…" : "导出图片"}</button>
    </div>
    <div className="poster" ref={posterRef}>
      <div className="poster-head"><p className="poster-eyebrow">{trip.name}</p><h1>{day.title}</h1><p className="poster-date">{day.date} · DAY {dayIndex} · {trip.destination}</p></div>
      <div className="poster-route">{stops.map((entry, index) => <div className="poster-node" key={entry.place.id}><span className="poster-index">{index + 1}</span><div className="poster-card"><span className="poster-emoji">{entry.place.emoji}</span><div><strong>{entry.place.name}</strong><small>{entry.stop.time} · {entry.place.area} · 停留 {entry.place.duration} 分钟</small></div></div></div>)}{stops.length === 0 && <p className="poster-empty">这一天还没有安排地点</p>}</div>
      <div className="poster-stats"><div><small>步数</small><strong>{activity.steps ? activity.steps.toLocaleString() : "—"}</strong></div><div><small>距离</small><strong>{activity.distanceKm ? `${activity.distanceKm} km` : "—"}</strong></div><div><small>消耗</small><strong>{activity.calories ? `${activity.calories} kcal` : "—"}</strong></div></div>
      <p className="poster-foot">旅日手帖 · 路书 · 线路仅供参考</p>
    </div>
    <div className="poster-inputs">
      <label>步数<input type="number" min="0" value={activity.steps ?? ""} onChange={(event) => onUpdateActivity(day.id, { steps: event.target.value ? Number(event.target.value) : undefined })}/></label>
      <label>距离（km）<input type="number" min="0" step="0.1" value={activity.distanceKm ?? ""} onChange={(event) => onUpdateActivity(day.id, { distanceKm: event.target.value ? Number(event.target.value) : undefined })}/></label>
      <label>消耗（kcal）<input type="number" min="0" value={activity.calories ?? ""} onChange={(event) => onUpdateActivity(day.id, { calories: event.target.value ? Number(event.target.value) : undefined })}/></label>
    </div>
  </section>;
}
function More({ users, activeUserId, onSwitchUser, onNewUser, onRenameUser, onDeleteUser, onReset, onExport, onImport }: { users: UserProfile[]; activeUserId: string; onSwitchUser: (id: string) => void; onNewUser: () => void; onRenameUser: () => void; onDeleteUser: () => void; onReset: () => void; onExport: () => void; onImport: (file: File) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  return <section className="simple-page">
    <div className="user-panel"><div><p className="eyebrow">当前用户</p><h2>{users.find((user) => user.id === activeUserId)?.name ?? "未命名"}</h2><small>数据按用户分开保存；同一用户在同一浏览器保持一致。</small></div><div className="user-row"><select value={activeUserId} onChange={(event) => onSwitchUser(event.target.value)} aria-label="切换用户">{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select><button onClick={onNewUser}><Plus size={14}/>新建用户</button><button onClick={onRenameUser}><Pencil size={14}/>重命名</button><button onClick={onReset}><Sparkles size={14}/>重置为内置数据</button><button onClick={onDeleteUser} disabled={users.length <= 1}><Trash2 size={14}/>删除</button></div></div>
    <div className="more-grid"><button onClick={onExport}><span>📤</span><strong>导出数据</strong><small>备份为 JSON 文件</small></button><button onClick={() => fileRef.current?.click()}><span>📥</span><strong>导入数据</strong><small>从备份文件恢复</small></button><input ref={fileRef} type="file" accept="application/json" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport(file); event.target.value = ""; }} /><button><span>🛍️</span><strong>购物清单</strong><small>2 项待购买</small></button><button><span>📝</span><strong>旅行笔记</strong><small>记录灵感与提醒</small></button><button><span>⚙️</span><strong>旅程设置</strong><small>日期、节奏与偏好</small></button><button><span>📲</span><strong>安装到主屏幕</strong><small>获得接近 App 的体验</small></button></div>
  </section>;
}

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} 公里` : `${Math.round(meters)} 米`;
}

function DayEditor({ day, places, onCreatePlace, onClose, onSave }: { day: DayPlan; places: Place[]; onCreatePlace:(place:Place)=>void; onClose:()=>void; onSave:(day:DayPlan)=>void }) {
  const [draft, setDraft] = useState<DayPlan>(day);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const available = places.filter((place) => !draft.stops.some((stop) => stop.placeId === place.id));
  const getPlace = useCallback((id:string) => places.find((place) => place.id === id), [places]);
  const recalculate = useCallback((stops: DayPlan["stops"], newlyCreated?: Place) => recalcStopTimes(stops, draft.startTime, getPlace, newlyCreated), [draft.startTime, getPlace]);

  function addStop(placeId:string) {
    if (!placeId) return;
    setDraft((current) => ({ ...current, stops: recalculate([...current.stops, { placeId, time: current.startTime }]) }));
  }

  function move(index:number, direction:-1|1) {
    setDraft((current) => ({ ...current, stops: recalculate(moveStop(current.stops, index, index + direction)) }));
  }

  function cycleStatus(index:number) {
    const order: StopStatus[] = ["planned", "visited", "skipped"];
    setDraft((current) => ({ ...current, stops: current.stops.map((stop, i) => i === index ? { ...stop, status: order[(order.indexOf(stopStatus(stop)) + 1) % order.length] } : stop) }));
  }

  function suggest() {
    const ordered = suggestStopOrder(places, draft.stops, stopLimitForPace(draft.pace));
    setDraft((current) => ({ ...current, stops: recalculate(ordered.map((stop) => ({ ...stop, time: current.startTime }))) }));
  }

  function createAndAddPlace(place: Place) {
    onCreatePlace(place);
    setDraft((current) => ({ ...current, stops: recalculate([...current.stops, { placeId:place.id, time:current.startTime }], place) }));
    setShowQuickAdd(false);
  }

  function reorderTo(target: number) {
    if (dragIndex === null || target === dragIndex) return;
    setDragIndex(target);
    setDraft((current) => ({ ...current, stops: recalculate(moveStop(current.stops, dragIndex, target)) }));
  }

  function dropIndexAt(clientY: number) {
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-stop-index]") ?? []);
    if (rows.length === 0) return 0;
    const found = rows.findIndex((row) => { const rect = row.getBoundingClientRect(); return clientY < rect.top + rect.height / 2; });
    return found === -1 ? rows.length - 1 : found;
  }

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>, index: number) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragIndex(index);
  }

  function dragOver(event: ReactPointerEvent<HTMLButtonElement>) {
    if (dragIndex === null) return;
    reorderTo(dropIndexAt(event.clientY));
  }

  function endDrag() {
    setDragIndex(null);
  }

  return <div className="dialog-backdrop editor-backdrop" onMouseDown={onClose}><form className="dialog day-editor" onSubmit={(event)=>{event.preventDefault();onSave(draft);}} onMouseDown={(e)=>e.stopPropagation()}><div className="dialog-head"><div><p className="eyebrow">EDIT DAY · {day.date}</p><h2>编辑第 {Number(day.date.slice(-2))-18} 天</h2></div><button type="button" onClick={onClose} aria-label="关闭"><X/></button></div>
    <label>当天主题<input value={draft.title} onChange={(e)=>setDraft({...draft,title:e.target.value})} /></label>
    <div className="form-row three"><label>开始<input type="time" value={draft.startTime} onChange={(e)=>setDraft({...draft,startTime:e.target.value})}/></label><label>结束<input type="time" value={draft.endTime} onChange={(e)=>setDraft({...draft,endTime:e.target.value})}/></label><label>旅行节奏<select value={draft.pace} onChange={(e)=>setDraft({...draft,pace:e.target.value as DayPlan["pace"]})}><option value="relaxed">轻松</option><option value="normal">适中</option><option value="intensive">充实</option></select></label></div>
    <div className="editor-toolbar"><div><h3>当天地点</h3><p>预计时间会按停留时长和 30 分钟移动缓冲重新计算。</p></div><button type="button" className="suggest-button" onClick={suggest}><Sparkles size={15}/>生成排序建议</button></div>
    <div className={`stop-list${dragIndex !== null ? " dragging" : ""}`} ref={listRef}>{draft.stops.map((stop,index)=>{const place=getPlace(stop.placeId);if(!place)return null;const status=stopStatus(stop);return <div className={`edit-stop stop-${status}${dragIndex===index?" dragging":""}`} key={place.id} data-stop-index={index}><button type="button" className="drag-handle" aria-label="拖动排序" onPointerDown={(event)=>startDrag(event,index)} onPointerMove={dragOver} onPointerUp={endDrag} onPointerCancel={endDrag}><GripVertical size={15}/></button><time>{stop.time}</time><span>{place.emoji}</span><div><strong>{place.name}</strong><small>{place.area} · {place.duration}分钟{place.reservation==="已预约"?" · 已预约":""}</small></div><div className="stop-actions"><button type="button" className="status-button" onClick={()=>cycleStatus(index)} aria-label="切换完成状态">{status==="visited"?<Check size={15}/>:status==="skipped"?<SkipForward size={15}/>:<Circle size={15}/>}</button><button type="button" onClick={()=>move(index,-1)} disabled={index===0} aria-label="上移"><ArrowUp size={15}/></button><button type="button" onClick={()=>move(index,1)} disabled={index===draft.stops.length-1} aria-label="下移"><ArrowDown size={15}/></button><button type="button" onClick={()=>setDraft({...draft,stops:draft.stops.filter((_,i)=>i!==index)})} aria-label="移除"><Trash2 size={15}/></button></div></div>})}{draft.stops.length===0&&<div className="editor-empty">这一天还没有地点。可从下方加入，或生成建议。</div>}</div>
    <div className="add-place-heading"><strong>添加地点</strong><span>收藏只是快捷方式，也可以直接创建新地点。</span></div>
    <div className="add-place-methods"><label>从收藏加入<select value="" onChange={(e)=>addStop(e.target.value)}><option value="">选择一个收藏地点…</option>{available.map((place)=><option key={place.id} value={place.id}>{place.emoji} {place.name} · {place.area}</option>)}</select></label><button type="button" className="direct-add-button" onClick={()=>setShowQuickAdd((value)=>!value)}><Plus size={16}/>{showQuickAdd?"收起新地点":"直接创建新地点"}</button></div>
    {showQuickAdd&&<OnlinePlaceCreator onCreate={createAndAddPlace}/>}
    <div className="dialog-actions"><button type="button" onClick={onClose}>取消</button><button className="primary" type="submit">保存当天行程</button></div>
  </form></div>;
}

function TripWizard({ current, onClose, onCreate }: { current:TripProfile; onClose:()=>void; onCreate:(trip:TripProfile)=>void }) {
  const [error, setError] = useState("");
  function submit(form:FormData) {
    const startDate = String(form.get("startDate"));
    const endDate = String(form.get("endDate"));
    if (!startDate || !endDate || endDate < startDate) { setError("结束日期不能早于开始日期"); return; }
    onCreate({ id:crypto.randomUUID(), name:String(form.get("name") || "我的日本之旅"), destination:String(form.get("destination") || "日本"), startDate, endDate, pace:String(form.get("pace")) as TripProfile["pace"], interests:form.getAll("interests").map(String) });
  }
  return <div className="dialog-backdrop" onMouseDown={onClose}><form className="dialog trip-wizard" action={submit} onMouseDown={(e)=>e.stopPropagation()}><div className="dialog-head"><div><p className="eyebrow">NEW TRAVEL GUIDE</p><h2>从零创建旅行攻略</h2></div><button type="button" onClick={onClose} aria-label="关闭"><X/></button></div><p className="wizard-intro">先生成每天的攻略框架，之后再添加地点、美食并逐日编辑。创建后会替换当前设备上的“{current.name}”。</p><label>攻略名称<input name="name" required defaultValue="我的日本之旅" placeholder="例如：东京樱花七日游"/></label><label>主要目的地<input name="destination" required placeholder="例如：东京、箱根"/></label><div className="form-row"><label>开始日期<input name="startDate" type="date" required defaultValue={current.startDate}/></label><label>结束日期<input name="endDate" type="date" required defaultValue={current.endDate}/></label></div><label>旅行节奏<select name="pace" defaultValue="normal"><option value="relaxed">轻松 · 每天约 3 个地点</option><option value="normal">适中 · 每天约 4 个地点</option><option value="intensive">充实 · 每天约 5–6 个地点</option></select></label><fieldset><legend>旅行兴趣（可多选）</legend><div className="interest-grid">{["历史文化","城市散步","自然风景","当地美食","购物","温泉","摄影","亲子"].map((item)=><label key={item}><input type="checkbox" name="interests" value={item} defaultChecked={["历史文化","当地美食"].includes(item)}/><span>{item}</span></label>)}</div></fieldset>{error&&<p className="form-error">{error}</p>}<div className="dialog-actions"><button type="button" onClick={onClose}>取消</button><button className="primary" type="submit"><Sparkles size={16}/>生成攻略框架</button></div></form></div>;
}

function OnlinePlaceCreator({ onCreate }: { onCreate:(place:Place)=>void }) {
  const [name, setName] = useState("");
  const [candidates, setCandidates] = useState<InternetPlaceCandidate[]>([]);
  const [status, setStatus] = useState<"idle"|"loading"|"ready"|"error">("idle");
  const [message, setMessage] = useState("输入名称后联网查找，点击结果即可直接添加（默认停留 60 分钟）。");

  async function lookup() {
    const query = name.trim();
    if (!query || status === "loading") return;
    setStatus("loading"); setCandidates([]); setMessage("正在从互联网查找真实地点…");
    try {
      const results = await searchInternetPlaces(query);
      setCandidates(results);
      setStatus(results.length ? "ready" : "error");
      setMessage(results.length ? `找到 ${results.length} 个结果，点击任意一个即可添加。` : "没有找到结果，请在名称中加入城市或区域后重试，例如“福冈机场”。");
    } catch {
      setStatus("error");
      setMessage("暂时无法连接地点服务，请检查网络后重试。");
    }
  }

  return <div className="quick-place-form online-place-creator">
    <div className="online-input-row"><label>地点或餐厅名称<input value={name} onChange={(e)=>{setName(e.target.value);setCandidates([]);setStatus("idle");setMessage("输入名称后联网查找，点击结果即可直接添加（默认停留 60 分钟）。");}} onKeyDown={(e)=>{if(e.key==="Enter"){e.preventDefault();void lookup();}}} placeholder="例如：福冈机场、浅草寺"/></label><button type="button" className="lookup-button" disabled={!name.trim()||status==="loading"} onClick={()=>void lookup()}><Search size={16}/>{status==="loading"?"查找中…":"联网查找"}</button></div>
    <p className={`lookup-message ${status}`}>{message}</p>
    {candidates.length>0&&<div className="place-candidates" role="list" aria-label="互联网地点搜索结果">{candidates.map((candidate)=><button type="button" key={candidate.id} onClick={()=>onCreate(candidateToPlace(candidate, candidate.name, 60))}><span className="candidate-emoji">{candidate.emoji}</span><span><strong>{candidate.name}</strong><small>{candidate.categoryLabel} · {candidate.area}</small><em>{candidate.address}</em></span><span className="candidate-add"><Plus size={14}/>添加</span></button>)}</div>}
    <p className="osm-attribution">地点数据 © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></p>
  </div>;
}

function PlaceDialog({ onClose, onSubmit }: { onClose:()=>void; onSubmit:(place:Place)=>void }) {
  return <div className="dialog-backdrop" onMouseDown={onClose}><div className="dialog" onMouseDown={(e)=>e.stopPropagation()}><div className="dialog-head"><div><p className="eyebrow">SEARCH ONLINE</p><h2>添加旅行地点</h2></div><button type="button" onClick={onClose} aria-label="关闭"><X/></button></div><p className="wizard-intro">输入名称后联网查找，点击结果即可直接添加。</p><OnlinePlaceCreator onCreate={onSubmit}/><div className="dialog-actions"><button type="button" onClick={onClose}>取消</button></div></div></div>;
}

function DiningDialog({ onClose, onSubmit }: { onClose:()=>void; onSubmit:(data:FormData)=>void }) { return <div className="dialog-backdrop" onMouseDown={onClose}><form className="dialog" action={onSubmit} onMouseDown={(e)=>e.stopPropagation()}><div className="dialog-head"><div><p className="eyebrow">NEW DINING PLACE</p><h2>添加美食</h2></div><button type="button" onClick={onClose} aria-label="关闭"><X/></button></div><label>餐厅名称<input name="name" required placeholder="例如：元祖博多明太重"/></label><div className="form-row"><label>区域<input name="area" placeholder="天神"/></label><label>用餐时段<select name="meal" defaultValue="午餐"><option>早餐</option><option>午餐</option><option>咖啡</option><option>晚餐</option></select></label></div><label>料理类型<input name="cuisine" placeholder="拉面、寿司、烧鸟…"/></label><label>必吃菜<input name="mustTry" placeholder="想点的招牌菜"/></label><div className="dialog-actions"><button type="button" onClick={onClose}>取消</button><button className="primary" type="submit">保存美食</button></div></form></div>; }

function ShoppingDialog({ plans, defaultDayId, parentOptions, onClose, onSubmit }: { plans: DayPlan[]; defaultDayId?: string; parentOptions?: Array<{ id: string; name: string }>; onClose:()=>void; onSubmit:(data:FormData)=>void }) { return <div className="dialog-backdrop" onMouseDown={onClose}><form className="dialog" action={onSubmit} onMouseDown={(e)=>e.stopPropagation()}><div className="dialog-head"><div><p className="eyebrow">NEW SHOPPING ITEM</p><h2>添加购物</h2></div><button type="button" onClick={onClose} aria-label="关闭"><X/></button></div><label>类型<select name="todoKind" defaultValue="shopping"><option value="shopping">购物</option><option value="food">美食</option><option value="checkin">打卡点</option></select></label><label>名称<input name="name" required placeholder="例如：明太子伴手礼"/></label><div className="form-row"><label>分类<select name="category" defaultValue="other"><option value="souvenir">纪念品</option><option value="food">食品</option><option value="clothing">服饰</option><option value="electronics">电器</option><option value="cosmetics">药妆</option><option value="other">其他</option></select></label><label>预计价格（日元）<input name="estimatedPrice" type="number" inputMode="numeric" min="0" step="100" placeholder="1500"/></label></div><div className="form-row"><label>店铺<input name="storeName" placeholder="福太郎 本店"/></label><label>区域<input name="area" placeholder="博多"/></label></div><label>所属地点<select name="parentPlaceId" defaultValue=""><option value="">不指定（归入待办）</option>{(parentOptions ?? []).map((option)=><option key={option.id} value={option.id}>{option.name}</option>)}</select></label><div className="form-row"><label>安排到哪天<select name="dayId" defaultValue={defaultDayId ?? ""}><option value="">未安排</option>{plans.map((day, index)=><option key={day.id} value={day.id}>DAY {index+1} · {day.date}</option>)}</select></label><label>时间<input name="time" type="time"/></label></div><label>备注<input name="note" placeholder="冷藏保存，返程前再买"/></label><div className="dialog-actions"><button type="button" onClick={onClose}>取消</button><button className="primary" type="submit">保存物品</button></div></form></div>; }

function CardEditor({ day, plans, places, shopping, cardKey, onClose, onDelete, onDuplicate, onMoveToDay, onUpdateShopping, onUpdateStop }: { day: DayPlan; plans: DayPlan[]; places: Place[]; shopping: ShoppingItem[]; cardKey: string; onClose:()=>void; onDelete:(key:string)=>void; onDuplicate:(key:string)=>void; onMoveToDay:(key:string,toDayId:string)=>void; onUpdateShopping:(id:string,patch:Partial<ShoppingItem>)=>void; onUpdateStop:(placeId:string,patch:Partial<PlannedStop>)=>void }) {
  const isStop = cardKey.startsWith("stop:");
  const placeId = isStop ? cardKey.slice(5) : "";
  const stop = day.stops.find((item) => item.placeId === placeId);
  const place = places.find((item) => item.id === placeId);
  const item = shopping.find((entry) => entry.id === cardKey.slice(5));
  const otherDays = plans.filter((entry) => entry.id !== day.id);
  const parentChoices = day.stops.map((entry) => places.find((candidate) => candidate.id === entry.placeId)).filter((candidate): candidate is Place => Boolean(candidate) && candidate!.id !== placeId && candidate!.kind !== "food" && candidate!.kind !== "cafe").map((candidate) => ({ id: candidate.id, name: candidate.name }));
  return <div className="dialog-backdrop" onMouseDown={onClose}><div className="dialog card-editor" onMouseDown={(event)=>event.stopPropagation()}><div className="dialog-head"><div><p className="eyebrow">CARD · {day.date}</p><h2>{isStop ? place?.name ?? "地点" : item?.name ?? "购物卡片"}</h2></div><button type="button" onClick={onClose} aria-label="关闭"><X/></button></div>
    {isStop ? (stop ? <><div className="form-row"><label>到达时间<input type="time" value={stop.time} onChange={(event)=>onUpdateStop(placeId,{ time: event.target.value })}/></label><label>状态<select value={stopStatus(stop)} onChange={(event)=>onUpdateStop(placeId,{ status: event.target.value as StopStatus })}><option value="planned">未完成</option><option value="visited">已到访</option><option value="skipped">已跳过</option></select></label></div>{place&&<p className="card-meta">{place.area} · 停留 {place.duration} 分钟{place.reservation?` · ${place.reservation}`:""}</p>}</> : <p className="card-meta">该地点已不在这一天。</p>)
    : (item ? <><label>类型<select value={item.todoKind ?? "shopping"} onChange={(event)=>onUpdateShopping(item.id,{ todoKind: ((): "shopping" | "food" | "checkin" => { const value = event.target.value; return value === "checkin" || value === "food" ? value : "shopping"; })() })}><option value="shopping">购物</option><option value="food">美食</option><option value="checkin">打卡点</option></select></label><label>名称<input value={item.name} onChange={(event)=>onUpdateShopping(item.id,{ name: event.target.value })}/></label><div className="form-row"><label>时间<input type="time" value={item.time ?? ""} onChange={(event)=>onUpdateShopping(item.id,{ time: event.target.value || undefined })}/></label><label>预计价格（日元）<input type="number" inputMode="numeric" min="0" step="100" value={item.estimatedPrice ?? ""} onChange={(event)=>onUpdateShopping(item.id,{ estimatedPrice: event.target.value ? Number(event.target.value) : undefined })}/></label></div><label>备注<input value={item.note ?? ""} onChange={(event)=>onUpdateShopping(item.id,{ note: event.target.value || undefined })}/></label></> : <p className="card-meta">该卡片已不存在。</p>)}
    <label>所属地点<select value={isStop ? (stop?.parentPlaceId ?? "") : (item?.parentPlaceId ?? "")} onChange={(event)=>{ const value = event.target.value || undefined; if (isStop) onUpdateStop(placeId, { parentPlaceId: value }); else if (item) onUpdateShopping(item.id, { parentPlaceId: value }); }}><option value="">不指定（归入待办）</option>{parentChoices.map((choice)=><option key={choice.id} value={choice.id}>{choice.name}</option>)}</select></label>
    {otherDays.length > 0 && <label>移到其他天<select value="" onChange={(event)=>{ if (event.target.value) onMoveToDay(cardKey, event.target.value); }}><option value="">选择目标日期…</option>{otherDays.map((entry)=><option key={entry.id} value={entry.id}>DAY {plans.findIndex((plan)=>plan.id===entry.id)+1} · {entry.title}</option>)}</select></label>}
    <div className="dialog-actions card-editor-actions">{!isStop&&<button type="button" onClick={()=>onDuplicate(cardKey)}>复制</button>}<button type="button" className="danger" onClick={()=>onDelete(cardKey)}><Trash2 size={15}/>删除</button><button type="button" className="primary" onClick={onClose}>完成</button></div>
  </div></div>;
}
