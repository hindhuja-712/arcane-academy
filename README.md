# 🏰ARCANE ACADEMY
### *Some worlds are discovered. Others are summoned.*

A magical adventure RPG built for the browser, where code creates the world and imagination sets the rules.

<p align="center">
  <img src="https://img.shields.io/badge/Genre-Fantasy%20RPG-6C4AB6?style=for-the-badge" alt="Fantasy RPG" />
  <img src="https://img.shields.io/badge/Engine-Phaser%203-4B8B3B?style=for-the-badge" alt="Phaser 3" />
  <img src="https://img.shields.io/badge/Language-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=black" alt="Supabase" />
</p>

<p align="center">
  <a href="https://arcane-academy-ogkmc0pq1-nexus-34dd.vercel.app/"><strong>✨ ENTER THE ACADEMY — LIVE DEMO</strong></a>
  &nbsp; | &nbsp;
  <a href="https://github.com/hindhuja-712/arcane-academy"><strong>📜 VIEW SOURCE CODE</strong></a>
</p>

---

## 🌙 01 — The World Beyond the Screen

**Arcane Academy** is a browser-based magical adventure RPG project that brings together interactive game development, a fantasy-inspired experience, and modern web technologies.

Instead of building just another static website, this project explores how a browser can become the doorway to an interactive game world.

The idea is simple: combine the atmosphere of a magical adventure with the logic of real software development.

Enter the academy. Explore the experience. Discover what happens when imagination meets code.

## 🗝️ 02 — Inside the Academy

- 🪄 **Fantasy-Inspired Experience** — A magical adventure concept brought to life in the browser.
- 🎮 **Interactive Game Development** — Built with Phaser 3 for browser-based game functionality.
- 🌌 **Web-Based Access** — Run the game through a browser without installing a desktop application.
- 🔐 **Supabase Integration** — Backend integration for supported application features.
- 🎨 **Custom Interface** — Styling and presentation developed with HTML and CSS.
- 🚀 **Online Deployment** — Hosted online so the project can be accessed through a web link.

*The goal is to create a project that feels like entering a world, not simply opening a webpage.*

## 🧪 03 — The Craft Behind the Magic

| Technology | Role in the Project |
|---|---|
| HTML5 | Web page structure |
| CSS3 | Visual styling and interface presentation |
| JavaScript | Game logic and application behaviour |
| Phaser 3 | Browser game framework |
| Vite | Development server and production build |
| Supabase | Backend services and database integration |
| Git & GitHub | Version control and source code hosting |
| Vercel | Web deployment |

## 🧭 04 — The Architecture Map

The project is organised into separate files so that the game logic, web interface, styling, and backend connection can be maintained independently.

```text
ARCANE ACADEMY
│
├── index.html
│
├── src/
│   ├── main.js          → Application entry point
│   ├── magic-game.js    → Game implementation
│   ├── style.css        → Visual styling
│   └── supabase.js      → Supabase integration
│
├── supabase/
│   └── schema.sql       → Database schema
│
├── package.json         → Dependencies and scripts
├── vite.config.js       → Vite configuration
└── README.md            → Project documentation
```

## 🛠️ 05 — Open the Developer's Grimoire

Want to explore the source code or run the project locally? Follow these steps.

### Prerequisites

- Node.js and npm
- Git
- A Supabase project if you want to use the configured backend features

### Step 1 — Clone the repository

```bash
git clone https://github.com/hindhuja-712/arcane-academy.git
```

### Step 2 — Enter the project directory

```bash
cd arcane-academy
```

### Step 3 — Install dependencies

```bash
npm install
```

### Step 4 — Configure environment variables

Create a `.env` file in the project root and add the Supabase values using the **exact variable names expected by `src/supabase.js`**.

For example, if your code uses these names:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

Replace the example values with your own project credentials. Never commit your `.env` file or expose a Supabase service-role key in browser code.

### Step 5 — Start the development server

```bash
npm run dev
```

Open the local URL printed in the terminal.

### Step 6 — Build for production

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## ✨ 06 — From an Idea to a Live World

This project provides practical experience with:

- Building an interactive browser-based application.
- Organising JavaScript across multiple source files.
- Using Phaser 3 as a game development framework.
- Styling a web interface with CSS.
- Connecting frontend code with Supabase services.
- Managing source code and changes using Git and GitHub.
- Building and deploying a Vite application.

The project also demonstrates how different parts of a web application can work together to deliver one connected experience.

## 🔭 07 — The Next Chapter

Possible directions for future development include:

- 🧙 Additional quests and magical challenges.
- 🏰 More locations and exploration areas.
- 🔑New spells, abilities, and character progression.
- 💾 Expanded save and progress systems.
- 🏆 Achievements and collectible rewards.
- 🎵 More immersive sound and visual effects.

These are ideas for future improvements, not claims that every feature is currently implemented.

## 🚀 08 — Enter the Academy

<p align="center">
  <a href="https://arcane-academy-ogkmc0pq1-nexus-34dd.vercel.app/"><strong>🪄 PLAY ARCANE ACADEMY</strong></a>
</p>

<p align="center">
  <a href="https://github.com/hindhuja-712/arcane-academy">Explore the source code on GitHub</a>
</p>

## 🧑‍💻 The Creator Behind the Spell

**Hindhuja G.**

B.E. Electronics and Communication Engineering  
Bannari Amman Institute of Technology

This project represents an exploration of browser game development, frontend technologies, and backend integration — bringing an imaginative concept into a working software project.

---

<p align="center">
  <i>⚡ Made with love by a girl who grew up dreaming of the Wizarding World — a Harry Potter fan turning a little magic into reality. 🪄❤️</i>
</p>
