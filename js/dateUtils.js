// Date helpers. All Date objects here are local-time, midnight, day-precision
// (never used for time-of-day math), which keeps date-key round-trips safe
// regardless of the phone's timezone.

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseDateKey(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

function todayDateKey() {
  return formatDateKey(new Date());
}

function prevDateKey(dateKey) {
  return formatDateKey(addDays(parseDateKey(dateKey), -1));
}

function nextDateKey(dateKey) {
  return formatDateKey(addDays(parseDateKey(dateKey), 1));
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.round((date - start) / 86400000) + 1;
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysLeftInYear(date) {
  const totalDays = isLeapYear(date.getFullYear()) ? 366 : 365;
  return totalDays - getDayOfYear(date);
}

// Monday of the week containing `date`.
function getMonday(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

// ISO 8601 week number: Monday-start weeks, week 1 is the week containing
// the year's first Thursday (equivalently, the week containing Jan 4).
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const weekNo = 1 + Math.round((d - firstThursday) / (7 * 86400000));
  return { year: d.getUTCFullYear(), week: weekNo };
}

function getWeekKey(date) {
  const { year, week } = getISOWeek(date);
  return `${year}-W${pad2(week)}`;
}

function todayWeekKey() {
  return getWeekKey(new Date());
}

// Monday of the given ISO weekKey ("YYYY-Www").
function weekKeyToMonday(weekKey) {
  const [yearStr, weekStr] = weekKey.split("-W");
  const year = Number(yearStr);
  const week = Number(weekStr);
  const jan4Monday = getMonday(new Date(year, 0, 4));
  return addDays(jan4Monday, (week - 1) * 7);
}

function getWeekBounds(weekKey) {
  const start = weekKeyToMonday(weekKey);
  return { startDate: formatDateKey(start), endDate: formatDateKey(addDays(start, 6)) };
}

function prevWeekKey(weekKey) {
  return getWeekKey(addDays(weekKeyToMonday(weekKey), -7));
}

function nextWeekKey(weekKey) {
  return getWeekKey(addDays(weekKeyToMonday(weekKey), 7));
}

// "mon".."sun" for a date, matching DAY_ORDER in config.js.
function dayShortKey(date) {
  return DAY_ORDER[(date.getDay() + 6) % 7];
}

function monthKeyForDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

function formatDisplayDate(date) {
  return date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}
