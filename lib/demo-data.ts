import type { DayPlan, Place, ShoppingItem, TimelineItem, TripProfile } from "./domain";

export const initialTrip: TripProfile = {
  id: "trip-kyushu-2026",
  name: "九州秋日之旅",
  destination: "九州 · 福冈",
  startDate: "2026-10-19",
  endDate: "2026-10-23",
  pace: "normal",
  interests: ["历史文化", "城市散步", "当地美食", "购物"],
};

export const initialPlaces: Place[] = [
  { id: "kushida", name: "栉田神社", localName: "櫛田神社", kind: "sight", area: "博多", priority: "must", duration: 45, emoji: "⛩️", latitude: 33.5932, longitude: 130.4106, address: "福冈县福冈市博多区博多站前1-41", mapUrl: "https://www.google.com/maps/search/?api=1&query=33.5932,130.4106" },
  { id: "canal", name: "博多运河城", localName: "キャナルシティ博多", kind: "shopping", area: "博多", priority: "want", duration: 120, emoji: "🛍️", latitude: 33.5896, longitude: 130.4107, address: "福冈县福冈市博多区住吉1-2", mapUrl: "https://www.google.com/maps/search/?api=1&query=33.5896,130.4107" },
  { id: "shinshin", name: "博多らーめん ShinShin", kind: "food", area: "天神", priority: "must", duration: 60, cuisine: "博多拉面", meal: "午餐", mustTry: "煮蛋博多拉面", reservation: "无需预约", note: "高峰期可能排队", emoji: "🍜", latitude: 33.5904, longitude: 130.3986, address: "福冈县福冈市中央区天神3-7-16", mapUrl: "https://www.google.com/maps/search/?api=1&query=33.5904,130.3986" },
  { id: "motsu", name: "もつ鍋 楽天地", kind: "food", area: "天神", priority: "must", duration: 90, cuisine: "牛肠锅", meal: "晚餐", mustTry: "牛肠锅套餐", reservation: "已预约", note: "19:00，保留预约确认邮件", emoji: "🍲", latitude: 33.5915, longitude: 130.4001, address: "福冈县福冈市中央区天神2-4-23", mapUrl: "https://www.google.com/maps/search/?api=1&query=33.5915,130.4001" },
  { id: "rec", name: "REC COFFEE", kind: "cafe", area: "药院", priority: "want", duration: 45, cuisine: "咖啡甜点", meal: "咖啡", mustTry: "手冲咖啡", reservation: "无需预约", emoji: "☕", latitude: 33.583, longitude: 130.409, address: "福冈县福冈市中央区药院2-5-14", mapUrl: "https://www.google.com/maps/search/?api=1&query=33.583,130.409" },
  { id: "ohori", name: "大濠公园", localName: "大濠公園", kind: "sight", area: "福冈", priority: "want", duration: 75, emoji: "🌿", latitude: 33.586, longitude: 130.38, address: "福冈县福冈市中央区大濠公园1-2", mapUrl: "https://www.google.com/maps/search/?api=1&query=33.586,130.38" },
];

export const todayTimeline: TimelineItem[] = [
  { time: "09:30", placeId: "kushida", transitAfter: "步行 8 分钟" },
  { time: "11:30", placeId: "shinshin", transitAfter: "地铁 12 分钟" },
  { time: "13:20", placeId: "canal", transitAfter: "地铁 16 分钟" },
  { time: "19:00", placeId: "motsu" },
];

export const initialShopping: ShoppingItem[] = [
  { id: "shop-yamaya", name: "明太子伴手礼", category: "food", storeName: "福太郎 本店", area: "博多", estimatedPrice: 1500, currency: "JPY", purchased: false, dayId: "day-1", time: "15:30", note: "冷藏保存，返程前再买" },
  { id: "shop-canal", name: "卡通周边", category: "other", storeName: "博多运河城", area: "博多", estimatedPrice: 2500, currency: "JPY", purchased: false, dayId: "day-1" },
  { id: "shop-tenjin", name: "药妆补货", category: "cosmetics", storeName: "天神地下街", area: "天神", estimatedPrice: 4000, currency: "JPY", purchased: false, dayId: "day-5" },
];

export const initialDayPlans: DayPlan[] = [
  { id: "day-1", date: "2026-10-19", title: "福冈 · 博多与天神", startTime: "09:00", endTime: "20:30", pace: "normal", stops: [
    { placeId: "kushida", time: "09:30" }, { placeId: "shinshin", time: "11:30" }, { placeId: "canal", time: "13:20" }, { placeId: "motsu", time: "19:00" },
  ] },
  { id: "day-2", date: "2026-10-20", title: "太宰府一日", startTime: "08:30", endTime: "20:00", pace: "relaxed", stops: [] },
  { id: "day-3", date: "2026-10-21", title: "由布院与温泉", startTime: "08:30", endTime: "20:00", pace: "normal", stops: [] },
  { id: "day-4", date: "2026-10-22", title: "门司港散步", startTime: "09:00", endTime: "20:00", pace: "relaxed", stops: [] },
  { id: "day-5", date: "2026-10-23", title: "福冈自由活动", startTime: "09:00", endTime: "18:00", pace: "normal", stops: [] },
];
