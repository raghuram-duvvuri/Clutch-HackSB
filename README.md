# ⚔️ Clutch — Grind To Game

> Productivity, gamified. Motivation, engineered.

Clutch is a competitive task management app that turns your to-do list into a game. Add tasks, get AI-rated difficulty scores, earn points, and compete against friends on live leaderboards.

---

## 🚀 Features

### Core Loop

- **Add Tasks** — set a title, description, category, start time, and estimated duration
- **AI Difficulty Rating** — GPT-4o mini analyzes the task name, description, category, and duration to assign a difficulty score from 1–10. The rating is final and cannot be changed
- **Earn Points** — points are calculated from difficulty, duration, and urgency. Harder tasks and tighter deadlines = bigger rewards
- **Level Up** — accumulate points to level up through Rookie → Grinder → Warrior → Elite → Legend → Mythic

### Task Types

- **Timed Tasks** — tap Start Task to begin a timer. End Task validates you worked for at least 70% of the estimated duration
- **Instant Tasks** — must be completed within ±5 minutes of the scheduled time. Built for habits and quick actions

### Anti-Cheat

- Timed tasks track actual elapsed time from Start to End
- Completing too fast flags the task and awards zero points
- Instant tasks outside the ±5 min window are flagged automatically

### Challenges

20 built-in challenges across three tiers:

| Tier          | Examples                                                                    |
| ------------- | --------------------------------------------------------------------------- |
| ⚡ Daily      | Early Bird, Hat Trick, On Fire, Clutch Play, Speed Run                      |
| 📅 Weekly     | Grind Mode, Point Chaser, Elite Grinder, Hard Mode, Consistent, Renaissance |
| 🏆 Milestones | Getting Started, Committed, Century Club, Unbreakable                       |

Progress is tracked live. Bonus points are awarded automatically when a challenge completes. Daily and weekly challenges reset after their window expires.

### Compete

- **Global Leaderboard** — live Firebase rankings with weekly and all-time toggles
- **Groups** — create or join groups with a 6-character invite code. Group tasks are always visible to all members
- **Point Races** — first member to hit a target score wins
- **Difficulty Disputes** — group members can contest AI ratings with a 3-way vote: Too Easy (+2), Fair, Too Hard (−2). Majority wins and the difficulty updates in Firebase for everyone

### Friends

- Add friends by sharing your unique user code
- Send, accept, or decline friend requests
- View friends' weekly and all-time points

### Profile

- XP progress bar toward next level
- Stats: total points, tasks completed, current streak, best streak
- 7-day activity heatmap

---

## 🛠 Tech Stack

| Layer       | Technology                                    |
| ----------- | --------------------------------------------- |
| Frontend    | Vanilla HTML, CSS, JavaScript — no frameworks |
| Database    | Firebase Realtime Database                    |
| AI          | OpenAI API (GPT-4o mini)                      |
| Persistence | localStorage for offline-first state          |

---

## 📁 Project Structure

```
clutch/
├── index.html          # App shell, Firebase init, script loading
├── style.css           # All styles — dark cyberpunk theme
├── script.js           # Full application logic (~2900 lines)
├── config.example.js   # Template for API key configuration
└── README.md
```

---

## ⚙️ Setup

**1. Clone the repo**

```bash
git clone https://github.com/your-username/clutch.git
cd clutch
```

**2. Configure your OpenAI API key**

The API key is stored in `script.js` directly (repo is private). Find the line near the top of the AI service section:

```js
const OPENAI_API_KEY = "your-key-here";
```

Replace it with your key from [platform.openai.com](https://platform.openai.com).

**3. Open the app**

No build step required. Open `index.html` directly in a browser, or serve with any static file server:

```bash
npx serve .
```

---

## 🔥 Firebase Structure

```
/leaderboard/<userId>
  name, emoji, weeklyPts, allTimePts, updatedAt

/groups/<code>
  name, creatorId, members, memberTasks, race, disputes

/friends/<userId>
  list/       ← accepted friends
  incoming/   ← pending requests received
  outgoing/   ← pending requests sent
```

---

## 📐 Points Formula

```
points = (difficulty × 10) + timeBonus + urgencyBonus

timeBonus   = max(1, 6 − floor(timeMins / 60)) × 5
urgencyBonus = 20 if deadline < 24h
               10 if deadline < 72h
                0 otherwise
```

---

## 🤖 AI Difficulty Prompt

The AI receives the task name, description, category, and duration. It rates on a 1–10 scale with anchored examples (1–2 = trivial, 9–10 = extreme) and is instructed to weigh both the nature of the task and how long it takes. It returns a JSON object with `difficulty`, `reasoning`, and `tips`. If the API call fails, a keyword-based local fallback runs instead.

---

## 🏗 Architecture Notes

- **Single state object** — all app data lives in `state` and is serialized to `localStorage` on every change
- **No build tooling** — the entire app ships as three files with no compilation step
- **Firebase for multiplayer only** — solo use works fully offline; Firebase is only needed for groups, leaderboards, and friends
- **Challenge engine** — `getChallengeProgress()` computes live progress from task history. `evaluateChallenges()` runs after every task completion and auto-awards bonuses

---

## 🗺 Roadmap

- [ ] Push notifications for upcoming tasks
- [ ] Clutch Moments — double points for last-minute completions
- [ ] Rival system — auto-assigned rival just above you on the leaderboard
- [ ] Seasonal resets with end-of-season badges
- [ ] Natural language task input ("study bio for 2 hours tomorrow")
- [ ] Productivity DNA — personalized radar chart after 30 tasks
- [ ] PWA / installable on mobile home screen

---

## 👥 Team

Built for [Hackathon Name] · [Year]
