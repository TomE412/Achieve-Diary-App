// Structural constants for the diary. Edit here to change habits, schedule
// hours, priority levels, or quotes without touching view logic.

const HABITS = [
  { key: "wakeUpOnTime", label: "Wake Up on Time" },
  { key: "readStudy", label: "Read/Study" },
  { key: "exercise", label: "Exercise" },
  { key: "eatBreakfast", label: "Eat Breakfast" },
  { key: "planTheDay", label: "Plan the Day" },
  { key: "drinkWater", label: "Drink 2L Water" },
  { key: "successMindset", label: "Success Mindset" },
  { key: "healthyDiet", label: "Healthy Diet" },
  { key: "blockTime", label: "Block Time" },
  { key: "familyTime", label: "Family Time" },
  { key: "relaxTime", label: "Relax Time" },
  { key: "journal", label: "Journal" },
  { key: "bedOnTime", label: "Bed on Time" },
  { key: "happy", label: "HAPPY" },
];

const SCHEDULE_START_HOUR = 7;
const SCHEDULE_END_HOUR = 18;

const PRIORITY_LEVELS = ["A", "B", "C"];

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};
const DAY_BANDS = ["morning", "afternoon", "evening"];

const QUOTES = [
  "The only way to do great work is to love what you do. — Steve Jobs",
  "Believe while others are doubting. — William Arthur Ward",
  "Plan while others are playing. — William Arthur Ward",
  "Begin while others are procrastinating. — William Arthur Ward",
  "Persist while others are quitting. — William Arthur Ward",
  "Discipline is choosing between what you want now and what you want most.",
  "Small daily improvements lead to staggering long-term results.",
];

function quoteForDate(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return QUOTES[hash % QUOTES.length];
}
