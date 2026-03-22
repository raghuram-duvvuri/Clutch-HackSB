# ⚔️ Clutch — Grind To Game

**🌐 Live App: [clutch-hacksb.netlify.app](https://clutch-hacksb.netlify.app)**

> Productivity, gamified. Motivation, engineered.

Clutch is a competitive task management web app that turns your to-do list into a game. Add tasks, get AI-rated difficulty scores, earn points, and compete on live leaderboards against friends — all in real time.

---

## 🚀 Features

### 🧠 AI Difficulty Rating

Every task is sent to **GPT-4o mini** the moment you tap "Rate Difficulty". The AI analyzes the task name, description, category, and estimated duration — giving each task a score from 1–10. The rating is final and cannot be overridden. If the API is unavailable, a keyword-based local fallback kicks in automatically.

**Difficulty scale:**
| Score | Label | Example |
|-------|-------|---------|
| 1–3 | Easy | Reply to an email |
| 4–6 | Medium | Write a short essay |
| 7–8 | Hard | 3-hour deep work session |
| 9–10 | Extreme | All-day exam prep |

### ⏱ Task Types

**Timed Tasks** — tap **▶ Start Task** to begin a live countdown timer. You must run for at least 70% of the estimated duration before tapping **■ End Task**. Ending too early flags the task with zero points.

**Instant Tasks** — scheduled to a specific moment. Must be completed within **±5 minutes** of the set time. A pulsing banner shows when you're in the window. Outside the window: flagged, zero points.

### 🔥 Points & Leveling

```
points = (difficulty × 10) + timeBonus + urgencyBonus

timeBonus    = max(1, 6 − floor(estimatedHours)) × 5
urgencyBonus = 20  →  starts within 24h
               10  →  starts within 72h
                0  →  anything further
```

Points accumulate toward six level titles:

**Rookie → Grinder → Warrior → Elite → Legend → Mythic**

Each level requires `level × 150` points — it gets progressively harder to level up.

### 🏆 Challenges (20 total)

Challenges are tracked live from your real task history. Bonus points auto-award the moment you hit a target. Daily and weekly challenges reset when their window expires.

**⚡ Daily**
| Challenge | Goal | Bonus |
|-----------|------|-------|
| Early Bird | Complete 1 task today | +25 |
| Hat Trick | Complete 3 tasks today | +75 |
| On Fire | Complete 5 tasks today | +150 |
| Clutch Play | Complete a difficulty 8+ task today | +100 |
| Speed Run | Complete 2 tasks within 1 hour | +80 |

**📅 Weekly**
| Challenge | Goal | Bonus |
|-----------|------|-------|
| Grind Mode | 10 tasks this week | +200 |
| Point Chaser | Earn 500 pts this week | +250 |
| Elite Grinder | Earn 1000 pts this week | +500 |
| Hard Mode | 3 difficulty 7+ tasks | +300 |
| Extreme Run | Complete a difficulty 10 task | +400 |
| Consistent | Task every day for 5 days | +350 |
| Study Grind | 300 pts from Exam Prep | +200 |
| Fitness Freak | 5 Fitness tasks | +175 |
| Creative Burst | 3 Creative tasks | +150 |
| Project Mode | 400 pts from Project tasks | +250 |
| Renaissance | Task in every category | +400 |

**🏆 Milestones (all-time)**
| Challenge | Goal | Bonus |
|-----------|------|-------|
| Getting Started | 10 tasks total | +100 |
| Committed | 50 tasks total | +300 |
| Century Club | 100 tasks total | +750 |
| Unbreakable | 10-day streak | +500 |

### 🌐 Global Leaderboard

Live rankings pulled from Firebase. Toggle between **This Week** and **All Time**. Your score syncs automatically every time you complete a task. Top 3 get a podium display.

### 👥 Groups

- Create a group and share the **6-character invite code**
- All members' tasks are visible to everyone in real time
- Set a **Point Race** — first to hit the target wins
- Set a **Time Limit** — 7, 14, or 30 day competitions
- Group task updates sync live via Firebase listeners

### ⚖️ Difficulty Disputes

Inside a group, any member can tap ⚖️ to contest the AI's difficulty rating on someone else's incomplete task. A three-way vote opens:

| Vote        | Effect               |
| ----------- | -------------------- |
| 📈 Too Easy | Raises difficulty +2 |
| ✅ Fair     | Keeps as-is          |
| 📉 Too Hard | Lowers difficulty −2 |

Resolves automatically when all members vote, or when 60%+ majority is reached with at least 2 votes. Firebase updates instantly for everyone.

### 🤝 Friends

- Share your unique user code to add anyone
- Send, accept, or decline friend requests
- View friends' weekly and all-time points live from the leaderboard

### 📅 Calendar

Monthly calendar showing all tasks by start date. Tap any day to see its tasks with times and point values.

### 👤 Profile

- Level badge and XP progress bar
- Stats: total points, tasks completed, current streak, best streak
- 7-day activity heatmap — brightness scales with tasks completed each day

---

## 🛠 Tech Stack

|                 |                                                   |
| --------------- | ------------------------------------------------- |
| **Frontend**    | Vanilla HTML, CSS, JavaScript — zero frameworks   |
| **Database**    | Firebase Realtime Database                        |
| **AI**          | OpenAI API — GPT-4o mini                          |
| **Persistence** | `localStorage` — offline-first, no login required |
| **Hosting**     | Netlify                                           |
| **Fonts**       | Outfit + JetBrains Mono (Google Fonts)            |

No build step. No bundler. No backend. Three files.

---

## 📁 File Structure

```
clutch/
├── index.html      # App shell — screens, tab bar, Firebase SDK
├── style.css       # Full styles — dark cyberpunk theme (~1700 lines)
├── script.js       # Entire application logic (~2900 lines)
└── README.md
```

---

## ⚙️ Setup

**1. Clone the repo**

```bash
git clone https://github.com/your-username/clutch.git
cd clutch
```

**2. Add your OpenAI API key**

In `script.js`, find:

```js
const OPENAI_API_KEY = "your-key-here";
```

Replace with your key from [platform.openai.com](https://platform.openai.com).

Without a key the app still works — difficulty falls back to a local keyword + duration estimator.

**3. Run it**

No build required. Open `index.html` in a browser, or serve locally:

```bash
npx serve .
# or
python3 -m http.server 8080
```

---

## 🔥 Firebase Structure

```
leaderboard/
  <userId>/
    name, emoji, weeklyPts, allTimePts, updatedAt

groups/
  <code>/
    name, creatorId, createdAt, timeLimitDays
    race/          → targetPoints, winnerId, winnerName, wonAt
    members/       → { <userId>: { id, name, emoji } }
    memberTasks/   → { <userId>: [ ...tasks ] }
    disputes/      → { <ownerId>: { <taskId>: { votes, resolved, resolvedDiff } } }

friends/
  <userId>/
    list/          → accepted friends
    incoming/      → pending requests received
    outgoing/      → pending requests sent
```

---

## 🔐 Anti-Cheat

Three independent layers keep the competition honest:

1. **Start/End enforcement** — timed tasks require a formal start. Ending before 70% of the estimate flags the task automatically
2. **Instant task windows** — must complete within ±5 min of the scheduled moment or the task is flagged with zero points
3. **Difficulty disputes** — group members can vote to correct AI ratings that seem too low, adjusting the difficulty and point value for everyone

Flagged tasks show a ⚠️ warning badge, award zero points, and are excluded from all leaderboard syncs and challenge tracking.

---

## 🗺 Roadmap

- [ ] Clutch Moments — double points for completing tasks in the last 10% of their window
- [ ] Rival system — auto-assigned rival just above you on the leaderboard
- [ ] Natural language input — "study bio for 2 hours tomorrow"
- [ ] Productivity DNA — radar chart of your patterns after 30 tasks
- [ ] Push notifications for upcoming task start times
- [ ] Season resets with end-of-season badges and titles
- [ ] PWA — installable on mobile home screen

---

_Built at HackSB · 2026_
