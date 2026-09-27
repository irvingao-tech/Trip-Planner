"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CalendarDays, ChevronRight, CircleEllipsis, Compass, Map, MapPin, Pencil, Plus, Search, Sparkles, Trash2, Utensils, X } from "lucide-react";
import { initialDayPlans, initialPlaces, initialTrip } from "@/lib/demo-data";
import type { AppSection, DayPlan, Place, TripProfile } from "@/lib/domain";
import { candidateToPlace, searchInternetPlaces, type InternetPlaceCandidate } from "@/lib/place-search";

const nav: Array<{ id: AppSection; label: string; icon: typeof Compass }> = [
  { id: "today", label: "今日", icon: Compass },
  { id: "plan", label: "行程", icon: CalendarDays },
  { id: "map", label: "地图", icon: Map },
  { id: "places", label: "地点", icon: MapPin },
  { id: "more", label: "更多", icon: CircleEllipsis },
];

const storageKey = "japan-trip-demo-places-v1";
const plansStorageKey = "japan-trip-demo-plans-v1";
const tripStorageKey = "japan-trip-demo-profile-v1";

function addMinutes(time: string, minutes: number) {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

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

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) queueMicrotask(() => setPlaces(JSON.parse(saved) as Place[]));
    const savedPlans = window.localStorage.getItem(plansStorageKey);
    if (savedPlans) queueMicrotask(() => setPlans(JSON.parse(savedPlans) as DayPlan[]));
    const savedTrip = window.localStorage.getItem(tripStorageKey);
    if (savedTrip) queueMicrotask(() => setTrip(JSON.parse(savedTrip) as TripProfile));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(places));
  }, [places]);

  useEffect(() => {
    window.localStorage.setItem(plansStorageKey, JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    window.localStorage.setItem(tripStorageKey, JSON.stringify(trip));
  }, [trip]);

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
    setTrip(profile);
    setPlaces([]);
    setPlans(buildDayPlans(profile));
    setShowTripWizard(false);
    setSection("plan");
  }

  function savePlan(next: DayPlan) {
    setPlans((current) => current.map((day) => day.id === next.id ? next : day));
    setEditingDayId(null);
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
          <div><p className="eyebrow">{trip.destination.toUpperCase()} · JAPAN</p><h1>{section === "today" ? `今天，${trip.destination}` : section === "places" ? "我的地点" : section === "plan" ? `${plans.length}日行程` : section === "map" ? "旅程地图" : "旅行工具"}</h1></div>
          <button className="avatar" aria-label="个人设置">FG</button>
        </header>

        {section === "today" && <Today places={places} plan={plans[0]} onDining={() => { setSection("places"); setDiningOnly(true); }} onOpenMap={() => setSection("map")} onPlan={() => setSection("plan")} />}
        {section === "plan" && <Plan trip={trip} places={places} plans={plans} onEdit={setEditingDayId} onAutoFill={autoFillPlans} onNew={() => setShowTripWizard(true)} />}
        {section === "map" && <MapView places={places} />}
        {section === "places" && <Places places={filteredPlaces} diningOnly={diningOnly} setDiningOnly={setDiningOnly} query={query} setQuery={setQuery} onAdd={() => setShowAdd(true)} onAddPlace={() => setShowAddPlace(true)} onAddToPlan={(placeId) => { const targetId=plans[0]?.id; if(!targetId)return; setPlans((current) => current.map((day, index) => index === 0 && !day.stops.some((stop) => stop.placeId === placeId) ? { ...day, stops: [...day.stops, { placeId, time: addMinutes(day.startTime, day.stops.length * 110) }] } : day)); setSection("plan"); setEditingDayId(targetId); }} />}
        {section === "more" && <More />}
      </main>

      <nav className="bottom-nav" aria-label="主导航">{nav.map((item) => <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)}><item.icon size={21}/><span>{item.label}</span></button>)}</nav>
      {showAdd && <DiningDialog onClose={() => setShowAdd(false)} onSubmit={addDining} />}
      {showAddPlace && <PlaceDialog onClose={() => setShowAddPlace(false)} onSubmit={addPlace} />}
      {showTripWizard && <TripWizard current={trip} onClose={() => setShowTripWizard(false)} onCreate={createTrip} />}
      {editingDayId && <DayEditor day={plans.find((day) => day.id === editingDayId)!} places={places} onCreatePlace={(place) => setPlaces((current) => [...current, place])} onClose={() => setEditingDayId(null)} onSave={savePlan} />}
    </div>
  );
}

function Today({ places, plan, onDining, onOpenMap, onPlan }: { places: Place[]; plan?: DayPlan; onDining: () => void; onOpenMap: () => void; onPlan:()=>void }) {
  const items = plan?.stops.map((stop) => ({ ...stop, place: places.find((place) => place.id === stop.placeId) })).filter((item): item is typeof item & { place: Place } => Boolean(item.place)) ?? [];
  const next = items.find((item) => !item.visited);
  if (!plan || !next) return <section className="blank-guide"><span>🗺️</span><p className="eyebrow">START FROM ZERO</p><h2>开始制作你的旅行攻略</h2><p>当前还没有可执行的行程。先添加想去的地点与美食，再由系统半自动分配到每天。</p><div><button className="primary" onClick={onPlan}><Sparkles size={17}/>打开行程规划</button><button onClick={onDining}><Utensils size={17}/>添加美食</button></div></section>;
  return <div className="page-grid"><section className="content-column"><article className="next-card"><div className="next-art">{next.place.emoji}<span>下一站</span></div><div className="next-body"><p className="eyebrow">{next.time} · {next.place.area}</p><h2>{next.place.name}</h2><p>{next.place.note || `建议停留 ${next.place.duration} 分钟。可在行程页继续调整时间与顺序。`}</p><div className="actions"><button className="primary" onClick={onOpenMap}><MapPin size={17}/>打开地图</button><button>标记到访</button></div></div></article><div className="section-heading"><div><p className="eyebrow">{plan.date} · DAY 1</p><h2>{plan.title}</h2></div><button className="text-button" onClick={onPlan}>编辑行程</button></div><div className="timeline">{items.map((item,index)=><div key={item.placeId} className="timeline-group"><div className="timeline-item"><time>{item.time}</time><span className="dot">{index+1}</span><div className="timeline-card"><span className="place-emoji">{item.place.emoji}</span><div><strong>{item.place.name}</strong><p>{item.place.area} · 停留 {item.place.duration} 分钟</p>{item.place.kind==="food"&&<span className="food-note">{item.place.mustTry} · {item.place.reservation}</span>}</div><ChevronRight size={18}/></div></div>{index<items.length-1&&<div className="transit"><span></span>↳ 预留移动时间 30 分钟</div>}</div>)}</div></section><aside className="right-column"><button className="mini-map" onClick={onOpenMap}><div className="map-label"><MapPin size={16}/>在 Google Maps 查看 · {items.length}站</div>{items.slice(0,4).map((_,index)=><span key={index} className={`pin pin-${index+1}`}>{index+1}</span>)}<div className="route-line"></div></button><div className="dining-callout"><div className="callout-icon"><Utensils/></div><div><p className="eyebrow">FOOD NOTE</p><h3>管理用餐计划</h3><p>餐厅、预约与必吃菜</p></div><button onClick={onDining}><ChevronRight/></button></div></aside></div>;
}

function Places({ places, diningOnly, setDiningOnly, query, setQuery, onAdd, onAddPlace, onAddToPlan }: { places: Place[]; diningOnly: boolean; setDiningOnly:(v:boolean)=>void; query:string; setQuery:(v:string)=>void; onAdd:()=>void; onAddPlace:()=>void; onAddToPlan:(id:string)=>void }) {
  return <section className="places-page"><div className="toolbar"><div className="segmented"><button className={!diningOnly?"active":""} onClick={()=>setDiningOnly(false)}>全部地点</button><button className={diningOnly?"active":""} onClick={()=>setDiningOnly(true)}>美食</button></div><div className="toolbar-actions"><button onClick={onAddPlace}><Plus size={17}/>添加地点</button><button className="primary" onClick={onAdd}><Utensils size={17}/>添加美食</button></div></div><label className="search"><Search size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="搜索地点、区域或料理…"/></label><div className="place-grid">{places.map((place)=><article className="place-card" key={place.id}><div className="place-visual">{place.emoji}<span>{place.area}</span></div><div className="place-content"><div className="place-title"><div><h3>{place.name}</h3><p>{place.localName ?? place.cuisine ?? "旅行地点"}</p></div><button aria-label="更多">•••</button></div>{(place.kind==="food"||place.kind==="cafe")&&<div className="chips"><span>{place.meal}</span><span>{place.cuisine}</span><span className={place.reservation==="已预约"?"reserved":""}>{place.reservation}</span></div>}{place.mustTry&&<p className="must-try">必吃 · {place.mustTry}</p>}<div className="card-bottom"><span>{place.priority==="must"?"必去":"想去"} · {place.duration}分钟</span><button onClick={()=>onAddToPlan(place.id)}>加入行程</button></div></div></article>)}</div>{places.length===0&&<div className="blank-guide compact"><span>📌</span><h2>从收藏第一个地点开始</h2><p>添加景点、购物地点或美食，然后回到行程页进行智能分配。</p><div><button onClick={onAddPlace}>添加地点</button><button className="primary" onClick={onAdd}>添加美食</button></div></div>}</section>;
}

function Plan({ trip, places, plans, onEdit, onAutoFill, onNew }: { trip:TripProfile; places: Place[]; plans: DayPlan[]; onEdit:(id:string)=>void; onAutoFill:()=>void; onNew:()=>void }) { return <section className="simple-page"><div className="guide-summary"><div><p className="eyebrow">{trip.startDate} — {trip.endDate}</p><h2>{trip.name}</h2><p>{trip.destination} · {paceLabel(trip.pace)}节奏 · {trip.interests.join(" / ")}</p></div><button onClick={onNew}><Pencil size={15}/>新建攻略</button></div><div className="section-heading"><div><h2>每日计划</h2><p className="plan-hint">先智能填充，再逐日调整；已有手动安排不会被覆盖。</p></div><button className="primary" onClick={onAutoFill} disabled={places.length===0}><Sparkles size={17}/>智能填充空白日</button></div>{plans.map((day,i)=><button className="day-row" key={day.id} onClick={()=>onEdit(day.id)}><span>DAY {i+1}<b>{Number(day.date.slice(-2))}</b></span><div><h3>{day.title}</h3><p>{day.stops.length ? `${day.stops.length} 个地点 · ${day.startTime}–${day.endTime} · ${paceLabel(day.pace)}` : `尚未安排 · 点击添加地点（共收藏 ${places.length} 个）`}</p></div><ChevronRight/></button>)}{places.length===0&&<p className="inline-tip">还没有收藏地点。请先到“地点”中添加内容，再回来智能填充。</p>}</section>; }
function MapView({ places }: { places: Place[] }) {
  const [selectedId, setSelectedId] = useState(places[0]?.id ?? "");
  const selected = places.find((place) => place.id === selectedId) ?? places[0];
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const query = selected?.latitude != null && selected.longitude != null ? `${selected.latitude},${selected.longitude}` : selected ? `${selected.name}, ${selected.area}, Japan` : "Fukuoka, Japan";
  const embedUrl = apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}&language=zh-CN`
    : `https://maps.google.com/maps?output=embed&hl=zh-CN&q=${encodeURIComponent(query)}`;
  const externalUrl = selected?.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  return <section className="google-map-layout"><div className="map-place-list"><div className="map-list-head"><p className="eyebrow">GOOGLE MAPS</p><h2>旅程地点</h2><small>选择地点以在地图中查看</small></div>{places.map((place,index)=><button key={place.id} className={place.id===selected?.id?"selected":""} onClick={()=>setSelectedId(place.id)}><span>{index+1}</span><div><strong>{place.name}</strong><small>{place.area} · {place.duration} 分钟</small></div><ChevronRight size={16}/></button>)}</div><div className="google-map-frame"><iframe key={embedUrl} title={`Google Maps — ${selected?.name ?? "福冈"}`} src={embedUrl} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/><div className="map-detail"><div><p className="eyebrow">已选择</p><h3>{selected?.emoji} {selected?.name}</h3><p>{selected?.area} · 建议停留 {selected?.duration} 分钟</p></div><a href={externalUrl} target="_blank" rel="noreferrer">打开 Google Maps</a></div></div></section>;
}
function More() { return <section className="simple-page"><div className="more-grid"><button><span>🛍️</span><strong>购物清单</strong><small>2 项待购买</small></button><button><span>📝</span><strong>旅行笔记</strong><small>记录灵感与提醒</small></button><button><span>⚙️</span><strong>旅程设置</strong><small>日期、节奏与偏好</small></button><button><span>📲</span><strong>安装到主屏幕</strong><small>获得接近 App 的体验</small></button></div></section>; }

function paceLabel(pace: DayPlan["pace"]) {
  return pace === "relaxed" ? "轻松" : pace === "intensive" ? "充实" : "适中";
}

function DayEditor({ day, places, onCreatePlace, onClose, onSave }: { day: DayPlan; places: Place[]; onCreatePlace:(place:Place)=>void; onClose:()=>void; onSave:(day:DayPlan)=>void }) {
  const [draft, setDraft] = useState<DayPlan>(day);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const available = places.filter((place) => !draft.stops.some((stop) => stop.placeId === place.id));
  const getPlace = (id:string) => places.find((place) => place.id === id);

  function recalculate(stops: DayPlan["stops"], newlyCreated?: Place) {
    let nextTime = draft.startTime;
    return stops.map((stop) => {
      const place = stop.placeId === newlyCreated?.id ? newlyCreated : getPlace(stop.placeId);
      const fixedDinner = place?.reservation === "已预约" && place.meal === "晚餐";
      const scheduled = { ...stop, time: fixedDinner ? "19:00" : nextTime };
      if (!fixedDinner) nextTime = addMinutes(nextTime, (place?.duration ?? 60) + 30);
      return scheduled;
    });
  }

  function addStop(placeId:string) {
    if (!placeId) return;
    setDraft((current) => ({ ...current, stops: recalculate([...current.stops, { placeId, time: current.startTime }]) }));
  }

  function move(index:number, direction:-1|1) {
    const next = [...draft.stops]; const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setDraft((current) => ({ ...current, stops: recalculate(next) }));
  }

  function suggest() {
    const limit = draft.pace === "relaxed" ? 3 : draft.pace === "intensive" ? 6 : 4;
    const score = { must: 0, want: 1, optional: 2 };
    const source = draft.stops.length ? draft.stops.map((stop) => getPlace(stop.placeId)).filter((place): place is Place => Boolean(place)) : [...places].sort((a,b)=>score[a.priority]-score[b.priority]).slice(0,limit);
    const ordered = [...source].sort((a,b) => a.area.localeCompare(b.area) || score[a.priority]-score[b.priority] || Number(a.kind === "food")-Number(b.kind === "food"));
    setDraft((current) => ({ ...current, stops: recalculate(ordered.map((place) => ({ placeId: place.id, time: current.startTime }))) }));
  }

  function createAndAddPlace(place: Place) {
    onCreatePlace(place);
    setDraft((current) => ({ ...current, stops: recalculate([...current.stops, { placeId:place.id, time:current.startTime }], place) }));
    setShowQuickAdd(false);
  }

  return <div className="dialog-backdrop editor-backdrop" onMouseDown={onClose}><form className="dialog day-editor" onSubmit={(event)=>{event.preventDefault();onSave(draft);}} onMouseDown={(e)=>e.stopPropagation()}><div className="dialog-head"><div><p className="eyebrow">EDIT DAY · {day.date}</p><h2>编辑第 {Number(day.date.slice(-2))-18} 天</h2></div><button type="button" onClick={onClose} aria-label="关闭"><X/></button></div>
    <label>当天主题<input value={draft.title} onChange={(e)=>setDraft({...draft,title:e.target.value})} /></label>
    <div className="form-row three"><label>开始<input type="time" value={draft.startTime} onChange={(e)=>setDraft({...draft,startTime:e.target.value})}/></label><label>结束<input type="time" value={draft.endTime} onChange={(e)=>setDraft({...draft,endTime:e.target.value})}/></label><label>旅行节奏<select value={draft.pace} onChange={(e)=>setDraft({...draft,pace:e.target.value as DayPlan["pace"]})}><option value="relaxed">轻松</option><option value="normal">适中</option><option value="intensive">充实</option></select></label></div>
    <div className="editor-toolbar"><div><h3>当天地点</h3><p>预计时间会按停留时长和 30 分钟移动缓冲重新计算。</p></div><button type="button" className="suggest-button" onClick={suggest}><Sparkles size={15}/>生成排序建议</button></div>
    <div className="stop-list">{draft.stops.map((stop,index)=>{const place=getPlace(stop.placeId);if(!place)return null;return <div className="edit-stop" key={place.id}><time>{stop.time}</time><span>{place.emoji}</span><div><strong>{place.name}</strong><small>{place.area} · {place.duration}分钟{place.reservation==="已预约"?" · 已预约":""}</small></div><div className="stop-actions"><button type="button" onClick={()=>move(index,-1)} disabled={index===0} aria-label="上移"><ArrowUp size={15}/></button><button type="button" onClick={()=>move(index,1)} disabled={index===draft.stops.length-1} aria-label="下移"><ArrowDown size={15}/></button><button type="button" onClick={()=>setDraft({...draft,stops:draft.stops.filter((_,i)=>i!==index)})} aria-label="移除"><Trash2 size={15}/></button></div></div>})}{draft.stops.length===0&&<div className="editor-empty">这一天还没有地点。可从下方加入，或生成建议。</div>}</div>
    <div className="add-place-heading"><strong>添加地点</strong><span>收藏只是快捷方式，也可以直接创建新地点。</span></div>
    <div className="add-place-methods"><label>从收藏加入<select value="" onChange={(e)=>addStop(e.target.value)}><option value="">选择一个收藏地点…</option>{available.map((place)=><option key={place.id} value={place.id}>{place.emoji} {place.name} · {place.area}</option>)}</select></label><button type="button" className="direct-add-button" onClick={()=>setShowQuickAdd((value)=>!value)}><Plus size={16}/>{showQuickAdd?"收起新地点":"直接创建新地点"}</button></div>
    {showQuickAdd&&<OnlinePlaceCreator onCreate={createAndAddPlace} submitLabel="创建并加入当天"/>}
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

function OnlinePlaceCreator({ onCreate, submitLabel }: { onCreate:(place:Place)=>void; submitLabel:string }) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(60);
  const [candidates, setCandidates] = useState<InternetPlaceCandidate[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState<"idle"|"loading"|"ready"|"error">("idle");
  const [message, setMessage] = useState("输入名称后联网查找，日本境内的地址、区域、类型和地图位置会自动补全。");
  const selected = candidates.find((candidate) => candidate.id === selectedId);

  async function lookup() {
    const query = name.trim();
    if (!query || status === "loading") return;
    setStatus("loading"); setCandidates([]); setSelectedId(""); setMessage("正在从互联网查找真实地点…");
    try {
      const results = await searchInternetPlaces(query);
      setCandidates(results);
      setSelectedId(results[0]?.id ?? "");
      setStatus(results.length ? "ready" : "error");
      setMessage(results.length ? `找到 ${results.length} 个结果，请确认正确地点。` : "没有找到结果，请在名称中加入城市或区域后重试，例如“福冈机场”。");
    } catch {
      setStatus("error");
      setMessage("暂时无法连接地点服务，请检查网络后重试。");
    }
  }

  function create() {
    if (!selected || !name.trim()) return;
    onCreate(candidateToPlace(selected, name, duration));
  }

  return <div className="quick-place-form online-place-creator">
    <div className="online-input-row"><label>地点或餐厅名称<input value={name} onChange={(e)=>{setName(e.target.value);setCandidates([]);setSelectedId("");setStatus("idle");setMessage("输入名称后联网查找，日本境内的地址、区域、类型和地图位置会自动补全。");}} onKeyDown={(e)=>{if(e.key==="Enter"){e.preventDefault();void lookup();}}} placeholder="例如：福冈机场、浅草寺"/></label><button type="button" className="lookup-button" disabled={!name.trim()||status==="loading"} onClick={()=>void lookup()}><Search size={16}/>{status==="loading"?"查找中…":"联网查找"}</button></div>
    <label className="duration-field">停留分钟<input type="number" inputMode="numeric" min="15" max="600" step="15" value={duration} onChange={(e)=>setDuration(Math.max(15,Number(e.target.value)||15))}/></label>
    <p className={`lookup-message ${status}`}>{message}</p>
    {candidates.length>0&&<div className="place-candidates" role="radiogroup" aria-label="互联网地点搜索结果">{candidates.map((candidate)=><button type="button" role="radio" aria-checked={selectedId===candidate.id} className={selectedId===candidate.id?"selected":""} key={candidate.id} onClick={()=>setSelectedId(candidate.id)}><span className="candidate-emoji">{candidate.emoji}</span><span><strong>{candidate.name}</strong><small>{candidate.categoryLabel} · {candidate.area}</small><em>{candidate.address}</em></span></button>)}</div>}
    {selected&&<div className="internet-summary"><span>已自动获取</span><strong>{selected.categoryLabel} · {selected.area}</strong><small>{selected.openingHours?`营业时间：${selected.openingHours}`:"地址、坐标和 Google Maps 位置已获取"}</small></div>}
    <p className="osm-attribution">地点数据 © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></p>
    <button type="button" className="quick-create-button" disabled={!selected} onClick={create}><Plus size={16}/>{submitLabel}</button>
  </div>;
}

function PlaceDialog({ onClose, onSubmit }: { onClose:()=>void; onSubmit:(place:Place)=>void }) {
  return <div className="dialog-backdrop" onMouseDown={onClose}><div className="dialog" onMouseDown={(e)=>e.stopPropagation()}><div className="dialog-head"><div><p className="eyebrow">SEARCH ONLINE</p><h2>添加旅行地点</h2></div><button type="button" onClick={onClose} aria-label="关闭"><X/></button></div><p className="wizard-intro">只需输入地点名称和计划停留时间，其余资料将从互联网获取。</p><OnlinePlaceCreator onCreate={onSubmit} submitLabel="保存地点"/><div className="dialog-actions"><button type="button" onClick={onClose}>取消</button></div></div></div>;
}

function DiningDialog({ onClose, onSubmit }: { onClose:()=>void; onSubmit:(data:FormData)=>void }) { return <div className="dialog-backdrop" onMouseDown={onClose}><form className="dialog" action={onSubmit} onMouseDown={(e)=>e.stopPropagation()}><div className="dialog-head"><div><p className="eyebrow">NEW DINING PLACE</p><h2>添加美食</h2></div><button type="button" onClick={onClose} aria-label="关闭"><X/></button></div><label>餐厅名称<input name="name" required placeholder="例如：元祖博多明太重"/></label><div className="form-row"><label>区域<input name="area" placeholder="天神"/></label><label>用餐时段<select name="meal" defaultValue="午餐"><option>早餐</option><option>午餐</option><option>咖啡</option><option>晚餐</option></select></label></div><label>料理类型<input name="cuisine" placeholder="拉面、寿司、烧鸟…"/></label><label>必吃菜<input name="mustTry" placeholder="想点的招牌菜"/></label><div className="dialog-actions"><button type="button" onClick={onClose}>取消</button><button className="primary" type="submit">保存美食</button></div></form></div>; }
