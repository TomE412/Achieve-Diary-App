// Thin hash router. Owns the shared header (nav buttons, prev/next, title)
// and delegates the actual screen content to the view modules, which render
// into #view-root and wire their own events.

const viewRoot = document.getElementById("view-root");
const subNavTitle = document.getElementById("sub-nav-title");
const subNav = document.getElementById("sub-nav");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const navButtons = document.querySelectorAll(".nav-btn");

function parseHash() {
  const hash = location.hash.replace(/^#\/?/, "");
  const [view, param] = hash.split("/");
  if (view === "week" && param) return { view: "week", param };
  if (view === "settings") return { view: "settings", param: null };
  if (view === "day" && param) return { view: "day", param };
  return { view: "day", param: todayDateKey() };
}

function setActiveNav(view) {
  navButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
}

function renderRoute() {
  const { view, param } = parseHash();
  setActiveNav(view);

  if (view === "day") {
    subNav.hidden = false;
    const date = parseDateKey(param);
    subNavTitle.textContent = `${formatDisplayDate(date)} · Day ${getDayOfYear(date)}`;
    prevBtn.onclick = () => (location.hash = `#/day/${prevDateKey(param)}`);
    nextBtn.onclick = () => (location.hash = `#/day/${nextDateKey(param)}`);
    dayView.render(viewRoot, param);
  } else if (view === "week") {
    subNav.hidden = false;
    const { startDate, endDate } = getWeekBounds(param);
    const weekNum = param.split("-W")[1];
    subNavTitle.textContent = `Week ${weekNum} · ${formatDisplayDate(parseDateKey(startDate))} – ${formatDisplayDate(parseDateKey(endDate))}`;
    prevBtn.onclick = () => (location.hash = `#/week/${prevWeekKey(param)}`);
    nextBtn.onclick = () => (location.hash = `#/week/${nextWeekKey(param)}`);
    weekView.render(viewRoot, param);
  } else if (view === "settings") {
    subNav.hidden = true;
    settingsView.render(viewRoot);
  }
}

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view;
    if (view === "day") location.hash = `#/day/${todayDateKey()}`;
    else if (view === "week") location.hash = `#/week/${todayWeekKey()}`;
    else if (view === "settings") location.hash = "#/settings";
  });
});

window.addEventListener("hashchange", renderRoute);
