// ============================================
// CLUTCH — FULL APPLICATION
// ============================================

const EMOJIS = [
    "⚡",
    "🔥",
    "🧠",
    "🎯",
    "💎",
    "🦊",
    "🐉",
    "👾",
    "🚀",
    "⚔️",
    "🎮",
    "🌟",
];
const CATEGORIES = [
    {
        id: "general",
        label: "General",
        icon: "📋",
        color: "#9E9E9E",
    },
    {
        id: "homework",
        label: "Homework",
        icon: "✏️",
        color: "#2196F3",
    },
    {
        id: "exam",
        label: "Exam Prep",
        icon: "🧠",
        color: "#9C27B0",
    },
    {
        id: "project",
        label: "Project",
        icon: "🔨",
        color: "#FF9800",
    },
    {
        id: "reading",
        label: "Reading",
        icon: "📖",
        color: "#4CAF50",
    },
    {
        id: "fitness",
        label: "Fitness",
        icon: "🏃",
        color: "#F44336",
    },
    {
        id: "creative",
        label: "Creative",
        icon: "🎨",
        color: "#E91E63",
    },
    { id: "chores", label: "Chores", icon: "🏠", color: "#FFEB3B" },
];
const MODES = [
    { id: "private", label: "Private", icon: "🔒" },
    { id: "friends", label: "Friends", icon: "👥" },
    { id: "global", label: "Global", icon: "🌐" },
];
const TIME_OPTIONS = [
    { l: "15m", v: 15 },
    { l: "30m", v: 30 },
    { l: "1h", v: 60 },
    { l: "2h", v: 120 },
    { l: "3h", v: 180 },
    { l: "5h", v: 300 },
];

// ============================================
// STATE
// ============================================
let state = {
    onboarded: false,
    profile: {
        name: "Player",
        emoji: "⚡",
        totalPoints: 0,
        tasksCompleted: 0,
        streak: 0,
        bestStreak: 0,
        level: 1,
    },
    tasks: [],
    groups: [],
    currentTab: "tasks",
    calMonth: new Date().getMonth(),
    calYear: new Date().getFullYear(),
    calSelectedDate: new Date(),
    competeSection: "leaderboard",
    taskFilter: "active",
};

function save() {
    localStorage.setItem("clutch_state", JSON.stringify(state));
}
function load() {
    const d = localStorage.getItem("clutch_state");
    if (d) {
        try {
            state = JSON.parse(d);
        } catch (e) {}
    }
}

// ============================================
// UTILITY
// ============================================
function diffColor(d) {
    if (d <= 3) return "var(--easy)";
    if (d <= 6) return "var(--medium)";
    if (d <= 8) return "var(--hard)";
    return "var(--extreme)";
}
function diffLabel(d) {
    if (d <= 3) return "Easy";
    if (d <= 6) return "Medium";
    if (d <= 8) return "Hard";
    return "Extreme";
}
function calcPoints(d, timeMins, deadline, created) {
    const base = d * 10;
    const timeBonus = Math.max(1, 6 - Math.floor(timeMins / 60)) * 5;
    const hrs = (deadline - created) / 3600000;
    const urgency = hrs < 24 ? 20 : hrs < 72 ? 10 : 0;
    return base + timeBonus + urgency;
}
function calcLevel(pts) {
    let lv = 1,
        th = 150,
        p = pts;
    while (p >= th) {
        p -= th;
        lv++;
        th = lv * 150;
    }
    return lv;
}
function levelProgress(pts) {
    let lv = 1,
        th = 150,
        p = pts;
    while (p >= th) {
        p -= th;
        lv++;
        th = lv * 150;
    }
    return p / th;
}
function levelTitle(lv) {
    if (lv <= 5) return "Rookie";
    if (lv <= 10) return "Grinder";
    if (lv <= 20) return "Warrior";
    if (lv <= 35) return "Elite";
    if (lv <= 50) return "Legend";
    return "Mythic";
}
function timeUntil(deadline) {
    const diff = deadline - Date.now();
    if (diff < 0) return "Overdue";
    const h = Math.floor(diff / 3600000);
    if (h < 24) return h + "h left";
    return Math.floor(h / 24) + "d left";
}
function fmtDate(d) {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
    });
}
function fmtTime(d) {
    return new Date(d).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
}
function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}
function isSameDay(a, b) {
    return startOfDay(a) === startOfDay(b);
}

// ============================================
// AI SERVICE (Claude API + local fallback)
// ============================================
const CLAUDE_API_KEY = ""; // PUT YOUR KEY HERE
const CLAUDE_ENDPOINT = "https://api.anthropic.com/v1/messages";

async function aiRateDifficulty(title, desc, timeMins, category) {
    if (!CLAUDE_API_KEY) return localDifficulty(title, desc, timeMins);
    try {
        const prompt = `You are a task difficulty rater. Rate 1-10.\nTitle: ${title}\nDescription: ${desc}\nTime: ${timeMins} min\nCategory: ${category}\nRespond ONLY with JSON: {"difficulty":<1-10>,"reasoning":"<one sentence>","tips":"<one tip>"}`;
        const res = await fetch(CLAUDE_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01",
                "x-api-key": CLAUDE_API_KEY,
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 200,
                messages: [{ role: "user", content: prompt }],
            }),
        });
        const data = await res.json();
        const text = data.content[0].text;
        const json = JSON.parse(text);
        return {
            difficulty: Math.max(1, Math.min(10, json.difficulty)),
            reasoning: json.reasoning,
            tips: json.tips,
        };
    } catch (e) {
        return localDifficulty(title, desc, timeMins);
    }
}

function localDifficulty(title, desc, timeMins) {
    const text = (title + " " + desc).toLowerCase();
    let score = 5;
    [
        "exam",
        "final",
        "thesis",
        "research",
        "presentation",
        "essay",
        "analysis",
        "complex",
        "debug",
        "deploy",
    ].forEach((k) => {
        if (text.includes(k)) score++;
    });
    [
        "clean",
        "organize",
        "email",
        "read",
        "review",
        "list",
        "simple",
        "basic",
        "quick",
    ].forEach((k) => {
        if (text.includes(k)) score--;
    });
    if (timeMins > 180) score++;
    if (timeMins < 30) score--;
    score = Math.max(1, Math.min(10, score));
    return {
        difficulty: score,
        reasoning: "Estimated from keywords & time frame",
        tips: "Break large tasks into smaller chunks",
    };
}

function checkCheat(task, completionMins) {
    const ratio = completionMins / Math.max(1, task.timeFrameMinutes);
    const suspicious =
        (task.difficulty >= 7 && ratio < 0.1) ||
        (task.difficulty >= 5 && ratio < 0.05);
    return {
        suspicious,
        reason: suspicious
            ? "Completed unusually fast for difficulty"
            : "Seems reasonable",
    };
}

// ============================================
// ONBOARDING
// ============================================
let onbStep = 0;
let selectedEmoji = "⚡";

function initOnboarding() {
    if (state.onboarded) {
        showApp();
        return;
    }
    // Build emoji grid
    const grid = document.getElementById("emojiGrid");
    grid.innerHTML = EMOJIS.map(
        (e) =>
            `<button class="emoji-pick${e === selectedEmoji ? " selected" : ""}" data-emoji="${e}">${e}</button>`,
    ).join("");
    grid.addEventListener("click", (e) => {
        const btn = e.target.closest(".emoji-pick");
        if (!btn) return;
        selectedEmoji = btn.dataset.emoji;
        grid.querySelectorAll(".emoji-pick").forEach((b) =>
            b.classList.remove("selected"),
        );
        btn.classList.add("selected");
        document.getElementById("selectedEmojiDisplay").textContent =
            selectedEmoji;
    });
    // Dots
    renderOnbDots();
    document.getElementById("onbNext").addEventListener("click", nextOnbStep);
}

function renderOnbDots() {
    document.getElementById("onbDots").innerHTML = [0, 1, 2]
        .map((i) => `<div class="dot${i === onbStep ? " active" : ""}"></div>`)
        .join("");
}

function nextOnbStep() {
    if (onbStep < 2) {
        document
            .getElementById(`onb-step-${onbStep}`)
            .classList.remove("active");
        onbStep++;
        document.getElementById(`onb-step-${onbStep}`).classList.add("active");
        renderOnbDots();
        document.getElementById("onbNext").textContent =
            onbStep === 2 ? "Let's Go" : "Next";
    } else {
        const name = document.getElementById("onbName").value.trim();
        if (!name) {
            document.getElementById("onbName").style.borderColor =
                "var(--danger)";
            return;
        }
        state.profile.name = name;
        state.profile.emoji = selectedEmoji;
        state.onboarded = true;
        save();
        showApp();
    }
}

function showApp() {
    document.getElementById("onboarding").classList.remove("active");
    document.getElementById("screen-tasks").classList.add("active");
    document.querySelector(".tab-bar").style.display = "flex";
    renderTasks();
}

// ============================================
// NAVIGATION
// ============================================
function initNav() {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const tab = btn.dataset.tab;
            if (!tab) return;
            switchTab(tab);
        });
    });
    document.getElementById("fabAdd").addEventListener("click", openAddTask);
}

function switchTab(tab) {
    state.currentTab = tab;
    document
        .querySelectorAll(".screen")
        .forEach((s) => s.classList.remove("active"));
    document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
    document.getElementById(`screen-${tab}`).classList.add("active");
    document
        .querySelector(`.tab-btn[data-tab="${tab}"]`)
        .classList.add("active");
    if (tab === "tasks") renderTasks();
    else if (tab === "calendar") renderCalendar();
    else if (tab === "compete") renderCompete();
    else if (tab === "profile") renderProfile();
}

// ============================================
// TASKS SCREEN
// ============================================
function renderTasks() {
    const p = state.profile;
    if (p.streak > 0) {
        document.getElementById("streakBadge").style.display = "flex";
        document.getElementById("streakCount").textContent = p.streak;
    } else {
        document.getElementById("streakBadge").style.display = "none";
    }

    // Filters
    const filters = document.getElementById("taskFilters");
    filters.innerHTML = ["active", "today", "done"]
        .map(
            (f) =>
                `<button class="chip${state.taskFilter === f ? " active" : ""}" data-filter="${f}">${f.charAt(0).toUpperCase() + f.slice(1)}</button>`,
        )
        .join("");
    filters.addEventListener("click", (e) => {
        const btn = e.target.closest(".chip");
        if (!btn) return;
        state.taskFilter = btn.dataset.filter;
        renderTasks();
    });

    let filtered;
    if (state.taskFilter === "active")
        filtered = state.tasks
            .filter((t) => !t.completed)
            .sort((a, b) => a.deadline - b.deadline);
    else if (state.taskFilter === "today")
        filtered = state.tasks
            .filter((t) => isSameDay(t.deadline, Date.now()))
            .sort((a, b) => a.deadline - b.deadline);
    else
        filtered = state.tasks
            .filter((t) => t.completed)
            .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

    const active = state.tasks.filter((t) => !t.completed).length;
    document.getElementById("taskSubheader").textContent = `${active} active`;

    const list = document.getElementById("taskList");
    if (!filtered.length) {
        list.innerHTML = `<div class="empty-state"><div class="emoji">🎯</div><h3>No tasks here</h3><p>Tap + to add your first task</p></div>`;
        return;
    }

    list.innerHTML = filtered
        .map((t) => {
            const cat =
                CATEGORIES.find((c) => c.id === t.category) || CATEGORIES[0];
            const dots = Array.from(
                { length: 5 },
                (_, i) =>
                    `<span class="diff-dot" style="background:${i < Math.ceil(t.difficulty / 2) ? diffColor(t.difficulty) : "rgba(85,85,119,0.3)"}"></span>`,
            ).join("");
            return `
    <div class="task-card${t.flagged ? " flagged" : ""}" data-id="${t.id}" onclick="toggleTask('${t.id}')">
      <div class="task-main">
        <div class="task-diff-bar" style="background:${diffColor(t.difficulty)}"></div>
        <div class="task-info">
          <div class="task-title${t.completed ? " done" : ""}">${t.flagged ? "⚠️ " : ""}${esc(t.title)}</div>
          <div class="task-meta">
            <span style="color:${cat.color}">${cat.icon} ${cat.label}</span>
            <span class="${t.deadline < Date.now() && !t.completed ? "overdue" : ""}">⏱ ${timeUntil(t.deadline)}</span>
          </div>
        </div>
        <div class="task-right">
          <div class="task-points">+${t.points}</div>
          <div class="task-dots">${dots}</div>
        </div>
        <span class="task-chevron">›</span>
      </div>
      <div class="task-expanded">
        ${t.description ? `<div class="task-desc">${esc(t.description)}</div>` : ""}
        <div class="task-detail-meta">
          <span>⏱ ${t.timeFrameMinutes}min</span>
          <span>📊 ${diffLabel(t.difficulty)}</span>
          <span>${MODES.find((m) => m.id === t.competitionMode)?.icon || "🔒"} ${MODES.find((m) => m.id === t.competitionMode)?.label || "Private"}</span>
        </div>
        ${t.flagged ? `<div class="flag-warning">⚠️ ${t.flagReason || "Flagged for review"} — No points awarded</div>` : ""}
        ${
            !t.completed
                ? `
        <div class="task-actions">
          <button class="btn-complete" onclick="event.stopPropagation();completeTask('${t.id}')">✓ Complete</button>
          <button class="btn-delete" onclick="event.stopPropagation();deleteTask('${t.id}')">🗑 Delete</button>
        </div>`
                : ""
        }
      </div>
    </div>`;
        })
        .join("");
}

function toggleTask(id) {
    const el = document.querySelector(`.task-card[data-id="${id}"]`);
    if (el) el.classList.toggle("expanded");
}

function completeTask(id) {
    const t = state.tasks.find((x) => x.id === id);
    if (!t || t.completed) return;
    const completionMins = Math.floor((Date.now() - t.createdAt) / 60000);
    const cheat = checkCheat(t, completionMins);
    t.completed = true;
    t.completedAt = Date.now();
    if (cheat.suspicious) {
        t.flagged = true;
        t.flagReason = cheat.reason;
        t.points = 0;
        alert("⚠️ Flagged: " + cheat.reason + "\nNo points awarded.");
    } else {
        state.profile.totalPoints += t.points;
        state.profile.tasksCompleted++;
        state.profile.streak++;
        state.profile.bestStreak = Math.max(
            state.profile.bestStreak,
            state.profile.streak,
        );
        state.profile.level = calcLevel(state.profile.totalPoints);
    }
    save();
    renderTasks();
}

function deleteTask(id) {
    if (!confirm("Delete this task?")) return;
    state.tasks = state.tasks.filter((t) => t.id !== id);
    save();
    renderTasks();
}

function esc(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
}

// ============================================
// ADD TASK MODAL
// ============================================
let addStep = 0;
let addForm = {
    title: "",
    desc: "",
    deadline: Date.now() + 86400000,
    timeMins: 60,
    category: "general",
    mode: "private",
    difficulty: 5,
    reasoning: "",
    tips: "",
};

function openAddTask() {
    addStep = 0;
    addForm = {
        title: "",
        desc: "",
        deadline: Date.now() + 86400000,
        timeMins: 60,
        category: "general",
        mode: "private",
        difficulty: 5,
        reasoning: "",
        tips: "",
    };
    renderAddModal();
    document.getElementById("addTaskModal").classList.add("open");
}
function closeAddTask() {
    document.getElementById("addTaskModal").classList.remove("open");
}

function renderAddModal() {
    const sheet = document.getElementById("modalSheet");
    if (addStep === 0) {
        const deadlineDate = new Date(addForm.deadline);
        const deadlineStr = deadlineDate.toISOString().slice(0, 16);
        sheet.innerHTML = `
      <div class="modal-header"><h2>New Task</h2><button class="modal-close" onclick="closeAddTask()">×</button></div>
      <div class="form-group"><label class="form-label">Title</label>
        <input class="input-field" id="atTitle" placeholder="e.g., Study for calculus final" value="${esc(addForm.title)}" maxlength="100"></div>
      <div class="form-group"><label class="form-label">Description</label>
        <textarea class="input-field" id="atDesc" placeholder="What does this involve?" rows="2">${esc(addForm.desc)}</textarea></div>
      <div class="form-group"><label class="form-label">Category</label>
        <div class="chip-row">${CATEGORIES.map((c) => `<button class="cat-chip${addForm.category === c.id ? " active" : ""}" data-cat="${c.id}"><span class="cat-icon">${c.icon}</span>${c.label}</button>`).join("")}</div></div>
      <div class="form-group"><label class="form-label">Deadline</label>
        <input type="datetime-local" class="input-field" id="atDeadline" value="${deadlineStr}"></div>
      <div class="form-group"><label class="form-label">Estimated Time</label>
        <div class="chip-row">${TIME_OPTIONS.map((o) => `<button class="chip${addForm.timeMins === o.v ? " active" : ""}" data-time="${o.v}">${o.l}</button>`).join("")}</div></div>
      <div class="form-group"><label class="form-label">Visibility</label>
        <div class="chip-row">${MODES.map((m) => `<button class="chip${addForm.mode === m.id ? " active" : ""}" data-mode="${m.id}">${m.icon} ${m.label}</button>`).join("")}</div></div>
      <button class="btn-primary" id="atNext">Rate Difficulty →</button>`;

        // Events
        sheet.querySelectorAll(".cat-chip").forEach((b) =>
            b.addEventListener("click", () => {
                addForm.category = b.dataset.cat;
                renderAddModal();
            }),
        );
        sheet.querySelectorAll("[data-time]").forEach((b) =>
            b.addEventListener("click", () => {
                addForm.timeMins = +b.dataset.time;
                renderAddModal();
            }),
        );
        sheet.querySelectorAll("[data-mode]").forEach((b) =>
            b.addEventListener("click", () => {
                addForm.mode = b.dataset.mode;
                renderAddModal();
            }),
        );
        sheet.querySelector("#atNext").addEventListener("click", async () => {
            addForm.title = sheet.querySelector("#atTitle").value.trim();
            addForm.desc = sheet.querySelector("#atDesc").value.trim();
            const dl = sheet.querySelector("#atDeadline").value;
            if (dl) addForm.deadline = new Date(dl).getTime();
            if (!addForm.title) {
                sheet.querySelector("#atTitle").style.borderColor =
                    "var(--danger)";
                return;
            }
            addStep = 1;
            renderAddModal();
            // AI rate
            sheet.querySelector("#diffLoading").style.display = "flex";
            sheet.querySelector("#diffResult").style.display = "none";
            const result = await aiRateDifficulty(
                addForm.title,
                addForm.desc,
                addForm.timeMins,
                addForm.category,
            );
            addForm.difficulty = result.difficulty;
            addForm.reasoning = result.reasoning;
            addForm.tips = result.tips;
            renderDiffStep();
        });
    } else {
        sheet.innerHTML = `
      <div class="modal-header"><h2>Difficulty</h2><button class="modal-close" onclick="closeAddTask()">×</button></div>
      <div class="glow-card">
        <div class="loading-indicator" id="diffLoading"><div class="spinner"></div><span style="font-size:14px;color:var(--text-dim);">AI is analyzing…</span></div>
        <div id="diffResult" style="display:none;">
          <div class="diff-display">
            <div style="font-size:12px;font-weight:700;color:var(--text-dim);letter-spacing:2px;">DIFFICULTY</div>
            <div class="diff-number" id="diffNum">${addForm.difficulty}</div>
            <div class="diff-label" id="diffLbl">${diffLabel(addForm.difficulty)}</div>
          </div>
          <div class="diff-bar-track"><div class="diff-bar-fill" id="diffBar"></div></div>
          <div class="ai-reasoning" id="aiReasoning"></div>
          <div class="ai-tip" id="aiTip" style="display:none;"></div>
        </div>
      </div>
      <div class="manual-row" id="manualRow"></div>
      <div class="points-preview">
        <span style="font-size:15px;color:var(--text-dim);">Points for completion:</span>
        <span class="points-value" id="ptsPreview">+${calcPoints(addForm.difficulty, addForm.timeMins, addForm.deadline, Date.now())}</span>
      </div>
      <div class="modal-btns">
        <button class="btn-secondary" onclick="addStep=0;renderAddModal();">Back</button>
        <button class="btn-primary" id="atSave">Add Task</button>
      </div>`;
        // Manual buttons
        const row = sheet.querySelector("#manualRow");
        for (let i = 1; i <= 10; i++) {
            const b = document.createElement("button");
            b.className =
                "manual-btn" + (i === addForm.difficulty ? " active" : "");
            if (i === addForm.difficulty) b.style.background = diffColor(i);
            b.textContent = i;
            b.addEventListener("click", () => {
                addForm.difficulty = i;
                renderDiffStep();
            });
            row.appendChild(b);
        }
        sheet.querySelector("#atSave").addEventListener("click", saveNewTask);
    }
}

function renderDiffStep() {
    const d = addForm.difficulty;
    const sheet = document.getElementById("modalSheet");
    sheet.querySelector("#diffLoading").style.display = "none";
    sheet.querySelector("#diffResult").style.display = "block";
    sheet.querySelector("#diffNum").textContent = d;
    sheet.querySelector("#diffNum").style.color = diffColor(d);
    sheet.querySelector("#diffLbl").textContent = diffLabel(d);
    sheet.querySelector("#diffLbl").style.color = diffColor(d);
    const bar = sheet.querySelector("#diffBar");
    bar.style.width = d * 10 + "%";
    bar.style.background = diffColor(d);
    sheet.querySelector("#aiReasoning").textContent = addForm.reasoning;
    if (addForm.tips) {
        const tip = sheet.querySelector("#aiTip");
        tip.style.display = "flex";
        tip.innerHTML = "💡 " + esc(addForm.tips);
    }
    // Update manual buttons
    sheet.querySelectorAll(".manual-btn").forEach((b, i) => {
        const lv = i + 1;
        b.classList.toggle("active", lv === d);
        b.style.background = lv === d ? diffColor(lv) : "";
    });
    sheet.querySelector("#ptsPreview").textContent =
        "+" + calcPoints(d, addForm.timeMins, addForm.deadline, Date.now());
}

function saveNewTask() {
    const now = Date.now();
    const t = {
        id: crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9),
        title: addForm.title,
        description: addForm.desc,
        deadline: addForm.deadline,
        timeFrameMinutes: addForm.timeMins,
        difficulty: addForm.difficulty,
        points: calcPoints(
            addForm.difficulty,
            addForm.timeMins,
            addForm.deadline,
            now,
        ),
        completed: false,
        completedAt: 0,
        createdAt: now,
        category: addForm.category,
        competitionMode: addForm.mode,
        flagged: false,
        flagReason: "",
    };
    state.tasks.push(t);
    save();
    closeAddTask();
    switchTab("tasks");
}

// ============================================
// CALENDAR SCREEN
// ============================================
function renderCalendar() {
    const month = state.calMonth,
        year = state.calYear;
    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    document.getElementById("calMonthYear").textContent =
        months[month] + " " + year;

    document.getElementById("calPrev").onclick = () => {
        state.calMonth--;
        if (state.calMonth < 0) {
            state.calMonth = 11;
            state.calYear--;
        }
        renderCalendar();
    };
    document.getElementById("calNext").onclick = () => {
        state.calMonth++;
        if (state.calMonth > 11) {
            state.calMonth = 0;
            state.calYear++;
        }
        renderCalendar();
    };

    const grid = document.getElementById("calGrid");
    const days = ["S", "M", "T", "W", "T", "F", "S"];
    let html = days
        .map((d) => `<div class="cal-day-header">${d}</div>`)
        .join("");

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const sel = state.calSelectedDate;

    for (let i = 0; i < firstDay; i++) html += '<div class="cal-day"></div>';

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const ds = startOfDay(date);
        const de = ds + 86400000;
        const dayTasks = state.tasks.filter(
            (t) => t.deadline >= ds && t.deadline < de,
        );
        const isToday = isSameDay(date, today);
        const isSel = isSameDay(date, sel);
        const dots = dayTasks
            .slice(0, 3)
            .map(
                (t) =>
                    `<span class="cal-task-dot" style="background:${diffColor(t.difficulty)}"></span>`,
            )
            .join("");
        html += `<div class="cal-day${isToday ? " today" : ""}${isSel ? " selected" : ""}" data-date="${ds}" onclick="selectCalDay(${ds})">
      <span>${d}</span>${dots ? `<div class="cal-dots">${dots}</div>` : ""}
    </div>`;
    }
    grid.innerHTML = html;
    renderDayDetail();
}

function selectCalDay(ts) {
    state.calSelectedDate = new Date(ts);
    renderCalendar();
}

function renderDayDetail() {
    const sel = state.calSelectedDate;
    const ds = startOfDay(sel);
    const de = ds + 86400000;
    const dayTasks = state.tasks
        .filter((t) => t.deadline >= ds && t.deadline < de)
        .sort((a, b) => a.deadline - b.deadline);

    const detail = document.getElementById("dayDetail");
    let html = `<div class="day-detail-header"><h4>${fmtDate(sel)}</h4><span>${dayTasks.length} tasks</span></div>`;
    if (!dayTasks.length) {
        html +=
            '<div style="text-align:center;padding:24px 0;color:var(--text-dim);">📅 No tasks on this day</div>';
    } else {
        dayTasks.forEach((t) => {
            const cat =
                CATEGORIES.find((c) => c.id === t.category) || CATEGORIES[0];
            html += `<div class="day-task-row">
        <div class="day-task-time">${fmtTime(t.deadline)}</div>
        <div class="day-task-bar" style="background:${diffColor(t.difficulty)}"></div>
        <div class="day-task-info">
          <div class="day-task-title${t.completed ? " done" : ""}">${esc(t.title)}</div>
          <div class="day-task-meta">${cat.label} · +${t.points} pts</div>
        </div>
        ${t.completed ? '<span style="color:var(--success);font-size:16px;">✓</span>' : ""}
      </div>`;
        });
    }
    detail.innerHTML = html;
}

// ============================================
// COMPETE SCREEN
// ============================================
function renderCompete() {
    const tabs = document.getElementById("competeTabs");
    tabs.innerHTML = ["leaderboard", "groups", "challenges"]
        .map(
            (s) =>
                `<button class="compete-tab${state.competeSection === s ? " active" : ""}" data-sec="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</button>`,
        )
        .join("");
    tabs.querySelectorAll(".compete-tab").forEach((b) =>
        b.addEventListener("click", () => {
            state.competeSection = b.dataset.sec;
            renderCompete();
        }),
    );

    const content = document.getElementById("competeContent");
    if (state.competeSection === "leaderboard") renderLeaderboard(content);
    else if (state.competeSection === "groups") renderGroups(content);
    else renderChallenges(content);
}

function renderLeaderboard(el) {
    const sim = [
        { name: "xKraken", emoji: "🦑", pts: 2840 },
        { name: "StudyGrind", emoji: "📚", pts: 2650 },
        { name: "TaskSlayer", emoji: "⚔️", pts: 2200 },
        { name: "NightOwl99", emoji: "🦉", pts: 1980 },
        { name: "CodeMonkey", emoji: "🐒", pts: 1750 },
        { name: "FocusBeast", emoji: "🧠", pts: 1620 },
        { name: "GrindTime", emoji: "⏰", pts: 1400 },
    ];
    const weekAgo = Date.now() - 604800000;
    const userPts = state.tasks
        .filter((t) => t.completed && !t.flagged && t.completedAt > weekAgo)
        .reduce((s, t) => s + t.points, 0);
    const entries = [
        ...sim,
        {
            name: state.profile.name,
            emoji: state.profile.emoji,
            pts: userPts,
            me: true,
        },
    ]
        .sort((a, b) => b.pts - a.pts)
        .map((e, i) => ({ ...e, rank: i + 1 }));

    const top3 = entries.slice(0, 3);
    const rest = entries.slice(3);

    let html = `<div class="podium">
    ${[1, 0, 2]
        .map((i) => {
            const e = top3[i];
            if (!e) return "";
            const medals = ["🥇", "🥈", "🥉"];
            const heights = ["podium-2", "podium-1", "podium-3"];
            return `<div class="podium-card ${heights[i]}${e.me ? " me" : ""}">
        <div class="podium-medal">${medals[i]}</div>
        <div class="podium-emoji">${e.emoji}</div>
        <div class="podium-name${e.me ? " me-name" : ""}">${esc(e.name)}</div>
        <div class="podium-pts">${e.pts}</div>
      </div>`;
        })
        .join("")}</div>`;

    rest.forEach((e) => {
        html += `<div class="lb-row${e.me ? " me" : ""}">
      <span class="lb-rank">#${e.rank}</span>
      <span class="lb-emoji">${e.emoji}</span>
      <span class="lb-name${e.me ? " me-name" : ""}">${esc(e.name)}</span>
      <span class="lb-pts">${e.pts} pts</span>
    </div>`;
    });
    el.innerHTML = html;
}

function renderGroups(el) {
    let html = "";
    if (!state.groups.length) {
        html +=
            '<div class="empty-state" style="padding:40px 0;"><div class="emoji">👥</div><h3>No groups yet</h3><p>Create or join a group to compete with friends</p></div>';
    } else {
        state.groups.forEach((g) => {
            html += `<div class="group-card">
        <div class="group-header">
          <div><div class="group-name">${esc(g.name)}</div><div class="group-members">${g.members} members</div></div>
          <div><div class="group-code-label">CODE</div><div class="group-code">${g.code}</div></div>
        </div>
        ${g.timeLimitDays > 0 ? `<div class="group-time">⏱ ${g.timeLimitDays} day competition</div>` : ""}
        <div class="group-avatars">${g.avatars.map((a) => `<span class="group-avatar">${a}</span>`).join("")}</div>
      </div>`;
        });
    }
    html += `<div class="group-actions">
    <button class="btn-primary" onclick="createGroup()">Create Group</button>
    <button class="btn-secondary" style="flex:1;text-align:center;" onclick="alert('Enter a group code to join — coming soon!')">Join Group</button>
  </div>`;
    el.innerHTML = html;
}

function createGroup() {
    const name = prompt("Group name:");
    if (!name) return;
    const days = prompt(
        "Competition time limit in days (leave blank for none):",
    );
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++)
        code += chars[Math.floor(Math.random() * chars.length)];
    state.groups.push({
        name,
        code,
        members: 1,
        timeLimitDays: days ? parseInt(days) : -1,
        avatars: [state.profile.emoji],
    });
    save();
    renderCompete();
}

function renderChallenges(el) {
    const challenges = [
        {
            title: "Weekend Warrior",
            desc: "Complete 10 tasks as a group this weekend",
            progress: 0.6,
            bonus: 200,
            deadline: "2d left",
        },
        {
            title: "Hard Mode",
            desc: "Everyone completes at least one difficulty 8+ task",
            progress: 0.33,
            bonus: 350,
            deadline: "5d left",
        },
        {
            title: "Study Sprint",
            desc: "Accumulate 1000 points in Exam Prep category",
            progress: 0.75,
            bonus: 500,
            deadline: "1d left",
        },
    ];
    el.innerHTML = challenges
        .map(
            (c) => `
    <div class="challenge-card">
      <div class="challenge-header">
        <div><div class="challenge-title">${c.title}</div><div class="challenge-desc">${c.desc}</div></div>
        <div><div class="challenge-bonus">+${c.bonus}</div><div class="challenge-deadline">${c.deadline}</div></div>
      </div>
      <div class="challenge-bar-track"><div class="challenge-bar-fill" style="width:${c.progress * 100}%"></div></div>
      <div class="challenge-progress">${Math.round(c.progress * 100)}% complete</div>
    </div>`,
        )
        .join("");
}

// ============================================
// PROFILE SCREEN
// ============================================
function renderProfile() {
    const p = state.profile;
    const prog = levelProgress(p.totalPoints);
    const ptsToNext = Math.round(p.level * 150 * (1 - prog));

    // Activity — last 7 days
    const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
    let activityHtml = "";
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = startOfDay(d),
            de = ds + 86400000;
        const count = state.tasks.filter(
            (t) => t.completed && t.completedAt >= ds && t.completedAt < de,
        ).length;
        const intensity = Math.min(1, count / 4);
        const bg =
            intensity > 0
                ? `rgba(0,245,212,${0.15 + intensity * 0.85})`
                : "var(--bg)";
        activityHtml += `<div class="activity-day"><div class="activity-block" style="background:${bg}"></div><div class="activity-label">${dayLabels[d.getDay()]}</div></div>`;
    }

    document.getElementById("profileContent").innerHTML = `
    <div class="profile-card">
      <div class="profile-emoji">${p.emoji}</div>
      <div>
        <div class="profile-name">${esc(p.name)}</div>
        <div><span class="profile-level">Lv. ${p.level}</span><span class="profile-title">${levelTitle(p.level)}</span></div>
      </div>
    </div>
    <div class="level-card">
      <div class="level-header"><span>Level ${p.level}</span><span class="next">Level ${p.level + 1}</span></div>
      <div class="level-bar-track"><div class="level-bar-fill" style="width:${prog * 100}%"></div></div>
      <div class="level-remaining">${ptsToNext} pts to next level</div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon">⭐</div><div class="stat-value">${p.totalPoints}</div><div class="stat-label">Total Points</div></div>
      <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-value">${p.tasksCompleted}</div><div class="stat-label">Tasks Done</div></div>
      <div class="stat-card"><div class="stat-icon">🔥</div><div class="stat-value">${p.streak}</div><div class="stat-label">Current Streak</div></div>
      <div class="stat-card"><div class="stat-icon">🏆</div><div class="stat-value">${p.bestStreak}</div><div class="stat-label">Best Streak</div></div>
    </div>
    <div class="activity-card"><h4>This Week</h4><div class="activity-row">${activityHtml}</div></div>
    <button class="reset-btn" onclick="resetAll()">Reset All Data</button>`;
}

function resetAll() {
    if (
        !confirm(
            "Delete all tasks, points, and progress? This cannot be undone.",
        )
    )
        return;
    localStorage.removeItem("clutch_state");
    location.reload();
}

// ============================================
// INIT
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    load();
    document.querySelector(".tab-bar").style.display = state.onboarded
        ? "flex"
        : "none";
    initOnboarding();
    initNav();
    // Close modal on overlay click
    document.getElementById("addTaskModal").addEventListener("click", (e) => {
        if (e.target === document.getElementById("addTaskModal"))
            closeAddTask();
    });
});
