import './style.css'
import { startMagicGame } from './magic-game.js'
import { supabase, supabaseConfigured } from './supabase.js'

const app = document.querySelector('#app')
const HOUSES = ['Gryffindor', 'Ravenclaw', 'Hufflepuff', 'Slytherin']
const HOUSE_INFO = {
  Gryffindor: { emoji: '🦁', color: '#e85c4a', power: 'Lionheart', detail: 'A short burst of increased spell damage.' },
  Ravenclaw: { emoji: '🦅', color: '#6b9dff', power: 'Arcane Insight', detail: 'Restore mana and briefly reduce spell costs.' },
  Hufflepuff: { emoji: '🦡', color: '#e4bd55', power: 'Kindred Vitality', detail: 'Restore health and gain a protective ward.' },
  Slytherin: { emoji: '🐍', color: '#58c78a', power: 'Serpent Curse', detail: 'Curse nearby enemies for bonus damage.' },
}
let currentUser = null
let currentHouse = 'Gryffindor'
let currentName = 'Wizard'
let sortingScores = [0, 0, 0, 0]
let authMode = 'signin'

function safeText(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char])
}

function renderShell(content) {
  app.innerHTML = `<main class="site-shell"><header class="topbar"><a class="brand" href="#" aria-label="Arcane Academy home"><span class="brand-mark">✦</span><span>ARCANE <b>ACADEMY</b></span></a><span class="topbar-tag">A MAGICAL ADVENTURE</span></header>${content}<footer class="footer-note">An original magical adventure game • Built with Phaser and Supabase</footer></main>`
}

function showLogin(message = '') {
  authMode = 'signin'
  renderShell(`
    <section class="auth-layout">
      <div class="hero-copy">
        <p class="eyebrow">YOUR STORY STARTS HERE</p>
        <h1>Magic is calling.<br><span>Answer it.</span></h1>
        <p class="hero-text">Enter a world of ancient halls, hidden runes, enchanted relics and formidable guardians. Your adventure awaits.</p>
        <div class="feature-pills"><span>✦ Spell combat</span><span>✦ Four houses</span><span>✦ RPG progression</span></div>
        <div class="floating-orb orb-one"></div><div class="floating-orb orb-two"></div>
      </div>
      <div class="auth-card">
        <div class="card-emblem">✧</div>
        <p class="eyebrow centered">WELCOME, WIZARD</p>
        <h2 id="auth-title">Enter the academy</h2>
        <p class="muted centered">Sign in to continue your magical journey.</p>
        ${message ? `<div class="notice">${safeText(message)}</div>` : ''}
        <form id="auth-form">
          <label for="auth-name" id="name-label" class="hidden">Wizard name</label>
          <input id="auth-name" name="name" autocomplete="name" placeholder="Your wizard name" class="hidden" />
          <label for="auth-email">Email address</label>
          <input id="auth-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required />
          <label for="auth-password">Password</label>
          <input id="auth-password" name="password" type="password" autocomplete="current-password" placeholder="At least 6 characters" minlength="6" required />
          <button class="primary-btn full" type="submit" id="auth-submit">Sign in</button>
        </form>
        <button class="text-btn" id="forgot-btn" type="button">Forgot password?</button>
        <div class="auth-switch"><span id="switch-copy">New to the academy?</span> <button id="switch-auth" class="text-btn inline" type="button">Create account</button></div>
        ${!supabaseConfigured ? '<p class="config-warning">Supabase is not configured. Add your Vite environment variables to enable account features.</p>' : ''}
      </div>
    </section>
  `)
  document.querySelector('#auth-form').addEventListener('submit', handleAuth)
  document.querySelector('#switch-auth').addEventListener('click', () => {
    authMode = authMode === 'signin' ? 'signup' : 'signin'
    updateAuthMode()
  })
  document.querySelector('#forgot-btn').addEventListener('click', handlePasswordReset)
}

function updateAuthMode() {
  const signup = authMode === 'signup'
  document.querySelector('#auth-title').textContent = signup ? 'Join the academy' : 'Enter the academy'
  document.querySelector('#auth-password').autocomplete = signup ? 'new-password' : 'current-password'
  document.querySelector('#auth-name').classList.toggle('hidden', !signup)
  document.querySelector('#name-label').classList.toggle('hidden', !signup)
  document.querySelector('#auth-name').required = signup
  document.querySelector('#auth-name').placeholder = 'Your wizard name'
  document.querySelector('#auth-submit').textContent = signup ? 'Create account' : 'Sign in'
  document.querySelector('#switch-copy').textContent = signup ? 'Already enrolled?' : 'New to the academy?'
  document.querySelector('#switch-auth').textContent = signup ? 'Sign in' : 'Create account'
  document.querySelector('.muted.centered').textContent = signup ? 'Create your account to begin.' : 'Sign in to continue your magical journey.'
}

async function handleAuth(event) {
  event.preventDefault()
  const form = new FormData(event.currentTarget)
  const email = String(form.get('email') || '').trim()
  const password = String(form.get('password') || '')
  const name = String(form.get('name') || '').trim()
  const submit = document.querySelector('#auth-submit')
  submit.disabled = true
  submit.textContent = 'Please wait…'
  try {
    if (!supabaseConfigured) throw new Error('Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your .env file first.')
    if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: name || email.split('@')[0] } },
      })
      if (error) throw error
      if (!data.session) {
        showLogin('Account created. Check your email to confirm it, then sign in.')
        return
      }
      currentUser = data.user
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      currentUser = data.user
    }
    await showAcceptanceLetter(currentUser)
  } catch (error) {
    showLogin(error.message || 'Unable to sign in. Please try again.')
  } finally {
    const button = document.querySelector('#auth-submit')
    if (button) button.disabled = false
  }
}

async function handlePasswordReset() {
  const email = document.querySelector('#auth-email').value.trim()
  if (!email) return showLogin('Enter your email address first, then choose Forgot password.')
  if (!supabaseConfigured) return showLogin('Supabase is not configured yet.')
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) throw error
    showLogin('If an account exists for that email, a password-reset link has been sent.')
  } catch (error) {
    showLogin(error.message || 'Could not request a password reset.')
  }
}

async function showAcceptanceLetter(user) {
  currentUser = user
  currentName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Wizard'
  const savedHouse = user.user_metadata?.house
  renderShell(`
    <section class="story-card parchment">
      <div class="wax-seal">✦</div><p class="eyebrow centered">OFFICIAL ACADEMY NOTICE</p>
      <h1 class="letter-title">Dear ${safeText(currentName)},</h1>
      <p>We are delighted to inform you that a place has been reserved for you at Arcane Academy of Witchcraft and Wizardry.</p>
      <p>Within these ancient walls, you will learn to master spells, uncover forgotten secrets, and prove your courage against the shadows that threaten the realm.</p>
      <p>Your journey begins with the Sorting Ceremony. Your choices will help determine the house that best suits your magical spirit.</p>
      <p class="signature">With magical regards,<br><b>Office of the Headmistress</b></p>
      ${savedHouse && HOUSES.includes(savedHouse) ? `<p class="notice">Your saved house is ${safeText(savedHouse)}. You may keep it or take the Sorting Hat quiz again.</p><button id="continue-saved" class="primary-btn full">Continue as ${safeText(savedHouse)}</button>` : ''}
      <button id="sorting-start" class="primary-btn full">${savedHouse ? 'Choose / change my house' : 'Begin the Sorting Ceremony'} →</button>
      <button id="signout" class="text-btn centered-btn">Sign out</button>
    </section>
  `)
  document.querySelector('#sorting-start').addEventListener('click', () => showSortingHat(currentName))
  document.querySelector('#signout').addEventListener('click', signOut)
  const savedButton = document.querySelector('#continue-saved')
  if (savedButton) savedButton.addEventListener('click', () => {
    currentHouse = savedHouse
    showHouseReveal(currentHouse)
  })
}

async function signOut() {
  if (supabaseConfigured) await supabase.auth.signOut()
  currentUser = null
  showLogin()
}

const questions = [
  { question: 'A locked door blocks your path. What do you do?', answers: [
    ['Face it head-on with courage.', 0], ['Study the lock for a clever solution.', 1], ['Ask your companions to help.', 2], ['Find a quiet way around it.', 3],
  ] },
  { question: 'Which magical quality matters most?', answers: [
    ['Bravery', 0], ['Wisdom', 1], ['Loyalty', 2], ['Ambition', 3],
  ] },
  { question: 'A friend is in trouble. You…', answers: [
    ['Rush to protect them.', 0], ['Plan the safest rescue.', 1], ['Stay by their side.', 2], ['Find the most effective leverage.', 3],
  ] },
  { question: 'Choose an enchanted object.', answers: [
    ['A sword that glows in danger.', 0], ['A book of forgotten knowledge.', 1], ['A charm that protects loved ones.', 2], ['A ring that amplifies willpower.', 3],
  ] },
  { question: 'What would you most like to master?', answers: [
    ['Defensive and duelling magic.', 0], ['Ancient mysteries and runes.', 1], ['Healing and protective charms.', 2], ['Powerful advanced magic.', 3],
  ] },
]

function showSortingHat(name, index = 0) {
  if (index === 0) sortingScores = [0, 0, 0, 0]
  if (index >= questions.length) {
    const max = Math.max(...sortingScores)
    const candidates = sortingScores.map((score, i) => score === max ? i : -1).filter(i => i >= 0)
    const selected = candidates[Math.floor(Math.random() * candidates.length)]
    currentHouse = HOUSES[selected]
    saveHouse(currentHouse).finally(() => showHouseReveal(currentHouse))
    return
  }
  const q = questions[index]
  renderShell(`
    <section class="quiz-card">
      <p class="eyebrow centered">THE SORTING CEREMONY</p><div class="progress-track"><span style="width:${(index / questions.length) * 100}%"></span></div>
      <p class="muted centered">Question ${index + 1} of ${questions.length}</p>
      <h1>${safeText(q.question)}</h1>
      <div class="quiz-options">${q.answers.map((answer, i) => `<button class="quiz-option" data-answer="${i}"><span class="option-number">${String(i + 1).padStart(2, '0')}</span><span>${safeText(answer[0])}</span><span>↗</span></button>`).join('')}</div>
      <button class="text-btn centered-btn" id="quiz-back">← Back to letter</button>
    </section>
  `)
  document.querySelectorAll('[data-answer]').forEach(button => button.addEventListener('click', () => {
    const chosen = q.answers[Number(button.dataset.answer)][1]
    sortingScores[chosen] += 1
    showSortingHat(name, index + 1)
  }))
  document.querySelector('#quiz-back').addEventListener('click', () => showAcceptanceLetter(currentUser))
}

async function saveHouse(house) {
  if (supabaseConfigured && currentUser) {
    const { error } = await supabase.auth.updateUser({ data: { house } })
    if (error) console.warn('House metadata could not be updated:', error.message)
  }
}

function showHouseReveal(house) {
  const info = HOUSE_INFO[house] || HOUSE_INFO.Gryffindor
  renderShell(`
    <section class="house-reveal" style="--house-color:${info.color}">
      <p class="eyebrow centered">THE HAT HAS SPOKEN</p><div class="house-emblem">${info.emoji}</div>
      <h1>You belong to <span>${safeText(house)}</span></h1>
      <p class="house-power"><b>${safeText(info.power)}</b> — ${safeText(info.detail)}</p>
      <p class="muted centered">Your house ability will be available during your adventure.</p>
      <button id="enter-game" class="primary-btn full">Enter the magical world →</button>
      <button id="change-house" class="text-btn centered-btn">Take the Sorting Hat quiz again</button>
    </section>
  `)
  document.querySelector('#enter-game').addEventListener('click', enterGame)
  document.querySelector('#change-house').addEventListener('click', () => showSortingHat(currentName))
}

function enterGame() {
  renderShell(`
    <section class="game-page">
      <div class="game-heading"><div><p class="eyebrow">YOUR ADVENTURE</p><h1>Welcome, ${safeText(currentName)}</h1><p class="muted">House: ${safeText(currentHouse)} · Explore, collect, and master your magic.</p></div><div class="game-heading-actions"><button id="save-now" class="secondary-btn">Save progress</button><button id="back-house" class="text-btn">House screen</button></div></div>
      <div id="game-status" class="notice status-bar">Loading the magical world…</div>
      <div id="magic-game" class="magic-shell"></div>
      <div class="game-footnote"><span>Move: WASD / arrows</span><span>Spell: SPACE</span><span>Special: Q</span><span>Shield: F</span><span>Dodge: SHIFT</span><span>Interact: E</span><span>Pause: P / Esc</span></div>
    </section>
  `)
  document.querySelector('#back-house').addEventListener('click', () => {
    window.__magicGame?.destroy(true)
    window.__magicGame = null
    showHouseReveal(currentHouse)
  })
  document.querySelector('#save-now').addEventListener('click', () => {
    window.__magicGame?.events.emit('manual-save')
  })
  const parent = document.querySelector('#magic-game')
  try {
    window.__magicGame = startMagicGame(parent, {
      userId: currentUser?.id || null,
      house: currentHouse,
      playerName: currentName,
      supabase: supabaseConfigured ? supabase : null,
      onStatus: (text, kind = 'info') => {
        const status = document.querySelector('#game-status')
        if (status) {
          status.textContent = text
          status.className = `notice status-bar ${kind}`
        }
      },
    })
  } catch (error) {
    console.error(error)
    document.querySelector('#game-status').textContent = `Game could not start: ${error.message}`
  }
}

async function boot() {
  if (supabaseConfigured) {
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      currentUser = data.session.user
      currentName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Wizard'
      showAcceptanceLetter(currentUser)
      return
    }
    supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) currentUser = null
    })
  }
  showLogin()
}

boot()
