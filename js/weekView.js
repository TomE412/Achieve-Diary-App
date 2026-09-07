const weekView = (() => {
  let renderToken = 0;

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  function scoreText(goals) {
    const set = goals.length;
    const achieved = goals.filter((g) => g.done).length;
    const pct = set === 0 ? 0 : Math.round((achieved / set) * 100);
    return { set, achieved, pct };
  }

  async function render(container, weekKey) {
    const myToken = ++renderToken;
    container.innerHTML = '<p class="loading">Loading&hellip;</p>';

    const record = await getWeekOrDefault(weekKey);
    const monthKey = monthKeyForDate(parseDateKey(record.startDate));
    const [vision, yearGoal, monthGoal] = await Promise.all([
      getSetting("vision"),
      getSetting("yearGoal"),
      getSetting(`monthGoal:${monthKey}`),
    ]);

    if (myToken !== renderToken) return;

    const startDate = parseDateKey(record.startDate);
    const dayDates = DAY_ORDER.map((_, i) => addDays(startDate, i));
    const score = scoreText(record.goals);

    container.innerHTML = `
      <section class="card summary-card">
        <div class="summary-row"><span class="summary-label">5 Year Vision</span><span class="summary-value">${escapeHtml(vision) || "&mdash;"}</span></div>
        <div class="summary-row"><span class="summary-label">Big Goal &middot; Year</span><span class="summary-value">${escapeHtml(yearGoal) || "&mdash;"}</span></div>
        <div class="summary-row"><span class="summary-label">Big Goal &middot; Month</span><span class="summary-value">${escapeHtml(monthGoal) || "&mdash;"}</span></div>
      </section>

      <section class="card">
        <label class="field-label" for="week-goal">Big Goal &middot; This Week</label>
        <input id="week-goal" type="text" value="${escapeAttr(record.weekGoal)}" />
      </section>

      <section class="card">
        <h2>Goals for the Week</h2>
        <div id="goal-rows" class="task-rows"></div>
        <button id="add-goal" class="add-btn" type="button">+ Add goal</button>
      </section>

      <section class="card">
        <h2>Week at a Glance</h2>
        <div class="table-scroll">
          <table class="week-grid">
            <thead>
              <tr>
                <th></th>
                ${DAY_ORDER.map((d, i) => `<th>${DAY_LABELS[d].slice(0, 3)}<br><span class="grid-date">${dayDates[i].getDate()}</span></th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${DAY_BANDS.map(
                (band) => `
                <tr>
                  <th class="band-label">${band[0].toUpperCase() + band.slice(1)}</th>
                  ${DAY_ORDER.map(
                    (d) => `<td><textarea class="grid-cell" data-day="${d}" data-band="${band}" rows="2">${escapeHtml(record.grid[d][band])}</textarea></td>`
                  ).join("")}
                </tr>`
              ).join("")}
            </tbody>
          </table>
        </div>
      </section>

      <section class="card">
        <label class="field-label" for="week-affirmations">Affirmations for the Week</label>
        <textarea id="week-affirmations" rows="3">${escapeHtml(record.affirmations)}</textarea>

        <label class="field-label" for="week-habits">Habits for the Week</label>
        <textarea id="week-habits" rows="2">${escapeHtml(record.habitsForWeek)}</textarea>

        <label class="field-label" for="week-people">People to Connect with This Week</label>
        <textarea id="week-people" rows="2">${escapeHtml(record.peopleToConnect)}</textarea>
      </section>

      <section class="card score-card">
        <h2>Weekly Goal Achievement</h2>
        <div class="score-row"><span># Goals Set</span><span id="score-set">${score.set}</span></div>
        <div class="score-row"><span># Goals Achieved</span><span id="score-achieved">${score.achieved}</span></div>
        <div class="score-row"><span>Score</span><span id="score-pct">${score.pct}%</span></div>
      </section>
    `;

    // --- week goal ---
    const weekGoalEl = container.querySelector("#week-goal");
    const saveWeekGoal = debounce((v) => {
      record.weekGoal = v;
      putWeek(record);
    }, 400);
    weekGoalEl.addEventListener("input", () => saveWeekGoal(weekGoalEl.value));

    // --- goals list ---
    const goalRows = container.querySelector("#goal-rows");

    function refreshScore() {
      const s = scoreText(record.goals);
      container.querySelector("#score-set").textContent = s.set;
      container.querySelector("#score-achieved").textContent = s.achieved;
      container.querySelector("#score-pct").textContent = `${s.pct}%`;
    }

    function renderGoals() {
      goalRows.innerHTML = record.goals
        .map(
          (goal, i) => `
        <div class="task-row" data-idx="${i}">
          <input type="checkbox" class="task-done" ${goal.done ? "checked" : ""} />
          <input type="text" class="task-text" value="${escapeAttr(goal.text)}" placeholder="Goal" />
          <select class="task-priority">
            <option value="">&ndash;</option>
            ${PRIORITY_LEVELS.map((p) => `<option value="${p}" ${goal.priority === p ? "selected" : ""}>${p}</option>`).join("")}
          </select>
          <button type="button" class="task-delete" aria-label="Delete goal">&times;</button>
        </div>`
        )
        .join("");

      goalRows.querySelectorAll(".task-row").forEach((row) => {
        const idx = Number(row.dataset.idx);
        const doneEl = row.querySelector(".task-done");
        const textEl = row.querySelector(".task-text");
        const priorityEl = row.querySelector(".task-priority");
        const deleteEl = row.querySelector(".task-delete");

        doneEl.addEventListener("change", () => {
          record.goals[idx].done = doneEl.checked;
          putWeek(record);
          refreshScore();
        });
        const saveText = debounce((v) => {
          record.goals[idx].text = v;
          putWeek(record);
        }, 400);
        textEl.addEventListener("input", () => saveText(textEl.value));
        priorityEl.addEventListener("change", () => {
          record.goals[idx].priority = priorityEl.value;
          putWeek(record);
        });
        deleteEl.addEventListener("click", () => {
          record.goals.splice(idx, 1);
          putWeek(record);
          renderGoals();
          refreshScore();
        });
      });
    }

    renderGoals();

    container.querySelector("#add-goal").addEventListener("click", () => {
      record.goals.push({ text: "", priority: "", done: false });
      putWeek(record);
      renderGoals();
      refreshScore();
      const inputs = goalRows.querySelectorAll(".task-text");
      inputs[inputs.length - 1].focus();
    });

    // --- grid ---
    const saveGrid = debounce(() => putWeek(record), 400);
    container.querySelectorAll(".grid-cell").forEach((cell) => {
      cell.addEventListener("input", () => {
        record.grid[cell.dataset.day][cell.dataset.band] = cell.value;
        saveGrid();
      });
    });

    // --- free text fields ---
    const affirmationsEl = container.querySelector("#week-affirmations");
    const habitsEl = container.querySelector("#week-habits");
    const peopleEl = container.querySelector("#week-people");
    const saveAffirmations = debounce((v) => {
      record.affirmations = v;
      putWeek(record);
    }, 400);
    const saveHabits = debounce((v) => {
      record.habitsForWeek = v;
      putWeek(record);
    }, 400);
    const savePeople = debounce((v) => {
      record.peopleToConnect = v;
      putWeek(record);
    }, 400);
    affirmationsEl.addEventListener("input", () => saveAffirmations(affirmationsEl.value));
    habitsEl.addEventListener("input", () => saveHabits(habitsEl.value));
    peopleEl.addEventListener("input", () => savePeople(peopleEl.value));
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }
  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, "&quot;");
  }

  return { render };
})();
