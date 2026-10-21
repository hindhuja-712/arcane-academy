# 🪄 ARCANE ACADEMY
### *Some worlds are discovered. Others are summoned.*

<p align="center">
  <img src="https://img.shields.io/badge/REALM-FANTASY_RPG-6D28D9?style=for-the-badge&labelColor=171126" alt="Fantasy RPG" />
  <img src="https://img.shields.io/badge/POWERED_BY-PHASER_3-8B5CF6?style=for-the-badge&labelColor=171126" alt="Phaser 3" />
  <img src="https://img.shields.io/badge/BUILT_WITH-JAVASCRIPT-FACC15?style=for-the-badge&labelColor=171126" alt="JavaScript" />
</p>

<p align="center">
  <b>A magical adventure RPG that brings a fantasy academy to life in your browser.</b>
  <br />
  Explore the unknown. Enter the extraordinary. Write your own adventure.
</p>

<p align="center">
  <a href="https://arcane-academy-ogkmc0pq1-nexus-34dd.vercel.app/">
    <img src="https://img.shields.io/badge/✦_ENTER_THE_ACADEMY-Play_Now-7C3AED?style=for-the-badge" alt="Play Arcane Academy" />
  </a>
  &nbsp;
  <a href="https://github.com/hindhuja-712/arcane-academy">
    <img src="https://img.shields.io/badge/EXPLORE-THE_SOURCE-242938?style=for-the-badge&logo=github&logoColor=white" alt="Explore Source Code" />
  </a>
</p>

---

## 🌙 01 — The World Beyond the Screen

What if a browser could become a doorway to a magical world?

**Arcane Academy** is a fantasy-inspired browser RPG built around the atmosphere of a mysterious academy and the excitement of interactive adventure. It brings together game development, visual design, JavaScript, and backend integration to create an experience that runs directly in the browser.

This project is my exploration of how web technologies can move beyond traditional websites and become interactive worlds.

> *The academy awaits. Your adventure begins when you step inside.*

## 🗝️ 02 — Inside the Academy

| ✦ Experience | What it brings |
|---|---|
| 🪄 Magical atmosphere | A fantasy-inspired setting designed to make the game feel like an adventure. |
| ⚔️ Interactive world | Browser-based game interactions powered by JavaScript and Phaser. |
| 🔐 Connected experience | Supabase integration for authentication and game-related backend functionality. |
| 🌐 No installation to play | Access the deployed experience through a web browser. |
| 🚀 From local code to live world | Built with Vite and deployed through Vercel. |

*The exact gameplay experience depends on the features implemented in the current version.*

## 🧪 03 — The Craft Behind the Magic

Every magical world has a system behind it. Here is the technology powering this one.

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Phaser_3-8B5CF6?style=flat-square" alt="Phaser 3" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=black" alt="Supabase" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
</p>

| Layer | Role in the realm |
|---|---|
| HTML5 & CSS3 | Structure and presentation |
| JavaScript | Gameplay logic and interactivity |
| Phaser 3 | Browser game framework |
| Vite | Development and production builds |
| Supabase | Backend integration |
| Vercel | Live deployment |
| Git & GitHub | Source control and collaboration workflow |

## 🧭 04 — The Architecture Map

```text
                 ARCANE ACADEMY
                        │
              ┌─────────┴─────────┐
              │                   │
          Game World          Web Layer
              │                   │
        magic-game.js      main.js + style.css
              │                   │
              └─────────┬─────────┘
                        │
                 supabase.js
                        │
                    Supabase
```

The project keeps its main game logic, application entry point, visual styling, and Supabase integration in separate source files.

### Repository map

```text
arcane-academy/
│
├── src/
│   ├── magic-game.js   # Game implementation
│   ├── main.js         # Application entry point
│   ├── style.css       # Visual styling
│   └── supabase.js     # Supabase integration
│
├── supabase/
│   └── schema.sql      # Database schema
│
├── index.html
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## 🛠️ 05 — Open the Developer's Grimoire

Want to run the academy on your own machine? Follow the steps below.

### Requirements

- [Node.js](https://nodejs.org/)
- npm
- Supabase project credentials if you want to use the connected backend features

### Summon the source code

```bash
git clone https://github.com/hindhuja-712/arcane-academy.git
cd arcane-academy
```

### Gather the dependencies

```bash
npm install
```

### Configure the connection

Create a `.env` file in the project root. Use the exact environment-variable names expected by `src/supabase.js`.

For example, if the source code expects these names:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_public_key
```

Replace the example values with your own Supabase project URL and appropriate public client key. If your source code uses different variable names, follow those instead.

**Keep secrets secret:** never commit `.env` or expose a Supabase service-role key in frontend code.

### Open the academy locally

```bash
npm run dev
```

Open the local URL printed in the terminal.

### Prepare the production build

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## ✨ 06 — From an Idea to a Live World

Arcane Academy brought together several parts of building and shipping a web application:

- Developing interactive browser experiences with JavaScript.
- Working with a game framework and organizing game code.
- Connecting frontend code to backend services.
- Managing project dependencies and environment configuration.
- Using Git and GitHub to maintain source code.
- Building and deploying an application using Vite and Vercel.

The result is a live project that can be explored beyond a local development environment.

## 🔭 07 — What the Next Chapter Could Hold

The academy can continue to grow through future updates, such as:

- New quests, locations, and magical challenges.
- Deeper character progression and rewards.
- Additional animations, sound effects, and world interactions.
- More robust saving and progress management.

These are possible future additions, not claims about features already implemented.

---

## 🦉 The Creator Behind the Academy

**Hindhuja G.**  
B.E. Electronics and Communication Engineering  
Bannari Amman Institute of Technology

This project reflects my interest in combining software development with creative, interactive experiences.

<p align="center">
  <a href="https://github.com/hindhuja-712/arcane-academy">
    <img src="https://img.shields.io/badge/VIEW_THE_CODE-GitHub-171126?style=for-the-badge&logo=github&logoColor=white" alt="View source on GitHub" />
  </a>
  <a href="https://arcane-academy-ogkmc0pq1-nexus-34dd.vercel.app/">
    <img src="https://img.shields.io/badge/ENTER_THE_WORLD-Live_Demo-6D28D9?style=for-the-badge" alt="Open live demo" />
  </a>
</p>

<p align="center">
  <i>Built with code, shaped by imagination, and powered by a little magic. ✦</i>
</p>
