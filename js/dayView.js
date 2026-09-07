const dayView = (() => {
  let renderToken = 0;

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  function habitScoreText(habits) {
    const done = HABITS.filter((h) => habits[h.key]).length;
    const pct = Math.round((done / HABITS.length) * 100);
    return `${done}/${HABITS.length} = ${pct}%`;
  }

  async function render(container, dateKey) {
    const myToken = ++renderToken;
    container.innerHTML = '<p class="loading">Loading&hellip;</p>';

    const record = await getDayOrDefault(dateKey);
    const monthKey = monthKeyForDate(parseDateKey(dateKey));
    const [vision, yearGoal, monthGoal, weekRecord] = await Promise.all([
      getSetting("vision"),
      getSetting("yearGoal"),
      getSetting(`monthGoal:${monthKey}`),
      getWeekOrDefault(record.weekKey),
    ]);

    if (myToken !== renderToken) return; // a newer render started; drop this one

    container.innerHTML = `
      <section class="card summary-card">
        <div class="summary-row"><span class="summary-label">5 Year Vision</span><span class="summary-value">${escapeHtml(vision) || "&mdash;"}</span></div>
        <div class="summary-row"><span class="summary-label">Big Goal &middot; Year</span><span class="summary-value">${escapeHtml(yearGoal) || "&mdash;"}</span></div>
        <div class="summary-row"><span class="summary-label">Big Goal &middot; Month</span><span class="summary-value">${escapeHtml(monthGoal) || "&mdash;"}</span></div>
        <p class="quote">${escapeHtml(quoteForDate(dateKey))}</p>
      </section>

      <section class="card">
        <div class="habits-header">
          <h2>Daily Success Habits</h2>
          <span id="habit-score" class="score">${habitScoreText(record.habits)}</span>
        </div>
        <div id="habits-grid" class="habits-grid">
          ${HABITS.map(
            (h) => `
            <label class="habit-item">
              <input type="checkbox" data-habit="${h.key}" ${record.habits[h.key] ? "checked" : ""} />
              <span>${h.label}</span>
            </label>`
          ).join("")}
        </div>
      </section>

      <section class="card two-col">
        <div>
          <label class="field-label">Big Goal &middot; Week <a href="#/week/${record.weekKey}" class="link-hint">(edit in Week)</a></label>
          <p class="readonly-field">${escapeHtml(weekRecord.weekGoal) || "&mdash;"}</p>
        </div>
        <div>
          <label class="field-label" for="today-goal">Big Goal &middot; Today</label>
          <input id="today-goal" type="text" value="${escapeAttr(record.todayGoal)}" />
        </div>
      </section>

      <section class="card">
        <h2>Schedule</h2>
        <div id="schedule-rows" class="schedule-rows">
          ${record.schedule
            .map(
              (row, i) => `
            <div class="schedule-row">
              <span class="hour">${row.hour}</span>
              <input type="text" class="schedule-text" data-idx="${i}" value="${escapeAttr(row.text)}" />
              <input type="checkbox" class="schedule-done" data-idx="${i}" ${row.done ? "checked" : ""} />
            </div>`
            )
            .join("")}
        </div>
      </section>

      <section class="card">
        <h2>Today&rsquo;s List</h2>
        <div id="task-rows" class="task-rows"></div>
        <button id="add-task" class="add-btn" type="button">+ Add task</button>
      </section>

      <section class="card">
        <h2>Notes</h2>
        <textarea id="day-notes" rows="4">${escapeHtml(record.notes)}</textarea>
      </section>
    `;

    // --- habits ---
    container.querySelectorAll("[data-habit]").forEach((cb) => {
      cb.addEventListener("change", () => {
        record.habits[cb.dataset.habit] = cb.checked;
        container.querySelector("#habit-score").textContent = habitScoreText(record.habits);
        putDay(record);
      });
    });

    // --- today goal ---
    const todayGoalEl = container.querySelector("#today-goal");
    const saveTodayGoal = debounce((v) => {
      record.todayGoal = v;
      putDay(record);
    }, 400);
    todayGoalEl.addEventListener("input", () => saveTodayGoal(todayGoalEl.value));

    // --- schedule ---
    const saveSchedule = debounce(() => putDay(record), 400);
    container.querySelectorAll(".schedule-text").forEach((input) => {
      input.addEventListener("input", () => {
        record.schedule[Number(input.dataset.idx)].text = input.value;
        saveSchedule();
      });
    });
    container.querySelectorAll(".schedule-done").forEach((cb) => {
      cb.addEventListener("change", () => {
        record.schedule[Number(cb.dataset.idx)].done = cb.checked;
        putDay(record);
      });
    });

    // --- today's list ---
    const taskRows = container.querySelector("#task-rows");

    function renderTasks() {
      taskRows.innerHTML = record.todaysList
        .map(
          (task, i) => `
        <div class="task-row" data-idx="${i}">
          <input type="checkbox" class="task-done" ${task.done ? "checked" : ""} />
          <input type="text" class="task-text" value="${escapeAttr(task.text)}" placeholder="Task" />
          <select class="task-priority">
            <option value="">&ndash;</option>
            ${PRIORITY_LEVELS.map((p) => `<option value="${p}" ${task.priority === p ? "selected" : ""}>${p}</option>`).join("")}
          </select>
          <button type="button" class="task-delete" aria-label="Delete task">&times;</button>
        </div>`
        )
        .join("");

      taskRows.querySelectorAll(".task-row").forEach((row) => {
        const idx = Number(row.dataset.idx);
        const doneEl = row.querySelector(".task-done");
        const textEl = row.querySelector(".task-text");
        const priorityEl = row.querySelector(".task-priority");
        const deleteEl = row.querySelector(".task-delete");

        doneEl.addEventListener("change", () => {
          record.todaysList[idx].done = doneEl.checked;
          putDay(record);
        });
        const saveText = debounce((v) => {
          record.todaysList[idx].text = v;
          putDay(record);
        }, 400);
        textEl.addEventListener("input", () => saveText(textEl.value));
        priorityEl.addEventListener("change", () => {
          record.todaysList[idx].priority = priorityEl.value;
          putDay(record);
        });
        deleteEl.addEventListener("click", () => {
          record.todaysList.splice(idx, 1);
          putDay(record);
          renderTasks();
        });
      });
    }

    renderTasks();

    container.querySelector("#add-task").addEventListener("click", () => {
      record.todaysList.push({ text: "", priority: "", done: false });
      putDay(record);
      renderTasks();
      const inputs = taskRows.querySelectorAll(".task-text");
      inputs[inputs.length - 1].focus();
    });

    // --- notes ---
    const notesEl = container.querySelector("#day-notes");
    const saveNotes = debounce((v) => {
      record.notes = v;
      putDay(record);
    }, 400);
    notesEl.addEventListener("input", () => saveNotes(notesEl.value));
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }
  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, "&quot;");
  }

  return { render };
})();
