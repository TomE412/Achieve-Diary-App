// IndexedDB wrapper. No other file touches the raw IndexedDB API directly.
// All functions return Promises. Nothing here is written to the DB until the
// user actually edits something (see getDayOrDefault/getWeekOrDefault) so
// browsing prev/next never creates empty records.

const DB_NAME = "achieveDiaryDB";
const DB_VERSION = 1;

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("days")) {
        db.createObjectStore("days", { keyPath: "date" });
      }
      if (!db.objectStoreNames.contains("weeks")) {
        db.createObjectStore("weeks", { keyPath: "weekKey" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function dbGet(storeName, key) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const req = tx.objectStore(storeName).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      })
  );
}

function dbPut(storeName, value) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        tx.objectStore(storeName).put(value);
        tx.oncomplete = () => resolve(value);
        tx.onerror = () => reject(tx.error);
      })
  );
}

// ---- settings ----

function getSetting(id) {
  return dbGet("settings", id).then((row) => (row ? row.value : ""));
}

function setSetting(id, value) {
  return dbPut("settings", { id, value });
}

// ---- days ----

function getDay(dateKey) {
  return dbGet("days", dateKey);
}

function putDay(record) {
  return dbPut("days", record);
}

function defaultDayRecord(dateKey) {
  const date = parseDateKey(dateKey);
  const habits = {};
  HABITS.forEach((h) => (habits[h.key] = false));
  const schedule = [];
  for (let h = SCHEDULE_START_HOUR; h <= SCHEDULE_END_HOUR; h++) {
    schedule.push({ hour: `${pad2(h)}:00`, text: "", done: false });
  }
  return {
    date: dateKey,
    weekKey: getWeekKey(date),
    habits,
    todayGoal: "",
    schedule,
    todaysList: [],
    notes: "",
  };
}

function getDayOrDefault(dateKey) {
  return getDay(dateKey).then((row) => row || defaultDayRecord(dateKey));
}

// ---- weeks ----

function getWeek(weekKey) {
  return dbGet("weeks", weekKey);
}

function putWeek(record) {
  return dbPut("weeks", record);
}

function defaultWeekRecord(weekKey) {
  const { startDate, endDate } = getWeekBounds(weekKey);
  const grid = {};
  DAY_ORDER.forEach((d) => {
    grid[d] = { morning: "", afternoon: "", evening: "" };
  });
  return {
    weekKey,
    startDate,
    endDate,
    weekGoal: "",
    goals: [],
    grid,
    affirmations: "",
    habitsForWeek: "",
    peopleToConnect: "",
  };
}

function getWeekOrDefault(weekKey) {
  return getWeek(weekKey).then((row) => row || defaultWeekRecord(weekKey));
}
