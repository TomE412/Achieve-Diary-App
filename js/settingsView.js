const settingsView = (() => {
  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  function render(container) {
    const monthKey = monthKeyForDate(new Date());
    const monthLabel = parseDateKey(`${monthKey}-01`).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });

    container.innerHTML = `
      <section class="card">
        <h1>Settings</h1>
        <p class="hint">These carry forward onto every Day and Week page, so you only set them once.</p>

        <label class="field-label" for="set-vision">5 Year Vision</label>
        <textarea id="set-vision" rows="2"></textarea>

        <label class="field-label" for="set-year-goal">1 Big Goal for the Year</label>
        <textarea id="set-year-goal" rows="2"></textarea>

        <label class="field-label" for="set-month-goal">1 Big Goal for ${monthLabel}</label>
        <textarea id="set-month-goal" rows="2"></textarea>

        <p class="saved-hint" id="saved-hint" hidden>Saved</p>
      </section>
    `;

    const visionEl = container.querySelector("#set-vision");
    const yearGoalEl = container.querySelector("#set-year-goal");
    const monthGoalEl = container.querySelector("#set-month-goal");
    const savedHint = container.querySelector("#saved-hint");

    Promise.all([getSetting("vision"), getSetting("yearGoal"), getSetting(`monthGoal:${monthKey}`)]).then(
      ([vision, yearGoal, monthGoal]) => {
        visionEl.value = vision;
        yearGoalEl.value = yearGoal;
        monthGoalEl.value = monthGoal;
      }
    );

    function flashSaved() {
      savedHint.hidden = false;
      clearTimeout(flashSaved._t);
      flashSaved._t = setTimeout(() => (savedHint.hidden = true), 1200);
    }

    const saveVision = debounce((v) => setSetting("vision", v).then(flashSaved), 400);
    const saveYearGoal = debounce((v) => setSetting("yearGoal", v).then(flashSaved), 400);
    const saveMonthGoal = debounce((v) => setSetting(`monthGoal:${monthKey}`, v).then(flashSaved), 400);

    visionEl.addEventListener("input", () => saveVision(visionEl.value));
    yearGoalEl.addEventListener("input", () => saveYearGoal(yearGoalEl.value));
    monthGoalEl.addEventListener("input", () => saveMonthGoal(monthGoalEl.value));
  }

  return { render };
})();
