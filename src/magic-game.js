import Phaser from 'phaser';

const WIDTH = 960;
const HEIGHT = 600;
const SAVE_KEY = 'arcane-academy-local-save';

const HOUSE_INFO = {
  gryffindor: {
    color: 0xff5555,
    name: 'Gryffindor',
    power: 'Courage Burst',
  },
  slytherin: {
    color: 0x55dd99,
    name: 'Slytherin',
    power: 'Shadow Strike',
  },
  ravenclaw: {
    color: 0x66aaff,
    name: 'Ravenclaw',
    power: 'Arcane Focus',
  },
  hufflepuff: {
    color: 0xffd866,
    name: 'Hufflepuff',
    power: 'Healing Light',
  },
};

const LEVELS = [
  {
    name: 'The Grand Hall',
    description: 'Collect five ancient artifacts.',
    objective: 'artifacts',
    required: 5,
    enemyCount: 3,
    color: 0x21133c,
  },
  {
    name: 'The Shadow Corridor',
    description: 'Defeat the guardians and find the golden key.',
    objective: 'key',
    required: 1,
    enemyCount: 5,
    color: 0x17233e,
  },
  {
    name: 'The Final Sanctum',
    description: 'Defeat the Dark Sorcerer.',
    objective: 'boss',
    required: 1,
    enemyCount: 3,
    color: 0x35162f,
  },
  {
    name: 'The Forbidden Forest',
    description: 'Collect three runes and defeat the Forest Guardian.',
    objective: 'runes',
    required: 3,
    enemyCount: 6,
    color: 0x102b2a,
  },
];

const SPELLS = [
  { name: 'Arc Bolt', key: 'SPACE', mana: 5, damage: 20 },
  { name: 'Astral Burst', key: '1', mana: 20, damage: 45 },
  { name: 'Frost Bind', key: '2', mana: 15, damage: 12 },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normaliseHouse(house) {
  const value = String(house || 'gryffindor').toLowerCase();

  if (value.includes('slytherin')) return 'slytherin';
  if (value.includes('ravenclaw')) return 'ravenclaw';
  if (value.includes('hufflepuff')) return 'hufflepuff';

  return 'gryffindor';
}

class MagicRoom extends Phaser.Scene {
  constructor() {
    super('MagicRoom');
  }

  init(data = {}) {
    this.configData = data.configData || data;
    this.house = normaliseHouse(this.configData.house);
    this.houseInfo = HOUSE_INFO[this.house];

    this.playerName = this.configData.playerName || 'Young Wizard';
    this.userId = this.configData.userId || null;
    this.supabase = this.configData.supabase || null;
    this.onStatus = this.configData.onStatus || (() => {});

    const state = data.state || null;

    this.levelIndex = clamp(
      Number(state?.levelIndex ?? data.levelIndex ?? 0),
      0,
      LEVELS.length - 1
    );

    this.health = Number(state?.health ?? 100);
    this.maxHealth = 100;

    this.mana = Number(state?.mana ?? 100);
    this.maxMana = 100;

    this.score = Number(state?.score ?? 0);
    this.totalDefeated = Number(state?.totalDefeated ?? 0);
    this.artifactsCollected = Number(state?.artifactsCollected ?? 0);
    this.runesCollected = Number(state?.runesCollected ?? 0);

    this.hasKey = Boolean(state?.hasKey);
    this.bossDefeated = Boolean(state?.bossDefeated);

    this.potions = Number(state?.potions ?? 3);
    this.isPaused = false;
    this.gameOver = false;
    this.victory = false;
    this.levelReady = false;
    this.lastSpellTime = 0;
    this.lastDamageTime = 0;
    this.lastSaveTime = 0;
    this.lastMessageTime = 0;
    this.specialCooldown = 0;
    this.frostUntil = 0;
    this.playerFacing = 1;

    this.enemies = null;
    this.projectiles = null;
    this.artifacts = null;
    this.pickups = null;
    this.runes = null;
    this.walls = null;
    this.exitObject = null;
    this.boss = null;
    this.player = null;

    this.messageText = null;
    this.hudText = null;
    this.statusText = null;
    this.healthText = null;
    this.manaText = null;
    this.levelText = null;
    this.controlsText = null;

    this.mobileKeys = {
      up: false,
      down: false,
      left: false,
      right: false,
    };

    this.stateWasProvided = Boolean(state);
  }

  create() {
    this.createTextures();
    this.createWorld();
    
    // Zoom controls
    this.gameZoom = 1;

    const zoomControls = document.createElement('div');
    zoomControls.style.cssText = `
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 9999;
      display: flex;
      gap: 8px;
    `;

    const makeZoomButton = (label, action) => {
      const button = document.createElement('button');
      button.textContent = label;
      button.style.cssText = `
        width: 42px;
        height: 42px;
        font-size: 24px;
        font-weight: bold;
        color: #ffe6a1;
        background: #291945;
        border: 2px solid #bba0ff;
        border-radius: 10px;
        cursor: pointer;
      `;
      button.onclick = action;
      zoomControls.appendChild(button);
    };

    const changeZoom = (amount) => {
      this.gameZoom = Phaser.Math.Clamp(
        this.gameZoom + amount, 0.6, 1.4
      );
      this.cameras.main.setZoom(this.gameZoom);
    };

    makeZoomButton('−', () => changeZoom(-0.1));
    makeZoomButton('+', () => changeZoom(0.1));
    makeZoomButton('↺', () => {
      this.gameZoom = 1;
      this.cameras.main.setZoom(1);
    });

    this.game.canvas.parentElement.style.position = 'relative';
    this.game.canvas.parentElement.appendChild(zoomControls);

    this.events.once('shutdown', () => zoomControls.remove());

    this.createPlayer();
    this.createGroups();
    this.createLevelObjects();
    this.createHUD();
    this.createKeyboard();
    this.createMobileControls();
    this.bindCollisions();

    if (!this.stateWasProvided) {
      this.loadLocalProgress();
    }

    this.updateHUD();

    this.showMessage(
      `Welcome, ${this.playerName}! Your adventure begins.`,
      3500
    );

    this.events.once('shutdown', () => {
      this.removeMobileControls();
    });

    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-R', () => this.restartLevel());
    this.input.keyboard.on('keydown-E', () => this.interact());
    this.input.keyboard.on('keydown-Q', () => this.useHousePower());
    this.input.keyboard.on('keydown-ONE', () => this.castSpell(1));
    this.input.keyboard.on('keydown-TWO', () => this.castSpell(2));
    this.input.keyboard.on('keydown-THREE', () => this.usePotion());

    this.input.keyboard.on('keydown-SPACE', () => {
      if (!this.isPaused && !this.gameOver) {
        this.castSpell(0);
      }
    });

    this.onStatus('Game started');

    this.saveProgress(false);
  }

  createTextures() {
    const g = this.make.graphics({
      x: 0,
      y: 0,
      add: false,
    });

    // Wizard character: robe, face, hat and wand.
    g.clear();

    g.fillStyle(0x26184b, 1);
    g.fillRoundedRect(7, 23, 34, 31, 9);

    g.fillStyle(0xeac49b, 1);
    g.fillCircle(24, 19, 12);

    g.fillStyle(0x35214f, 1);
    g.fillTriangle(6, 19, 24, 0, 42, 19);
    g.fillRect(7, 17, 34, 5);

    g.fillStyle(0xf5d67d, 1);
    g.fillCircle(20, 19, 1.5);
    g.fillCircle(28, 19, 1.5);

    g.lineStyle(3, 0xf7d58a, 1);
    g.lineBetween(37, 32, 47, 22);

    g.generateTexture('player', 50, 58);

    // Enemy.
    g.clear();
    g.fillStyle(0x421a45, 1);
    g.fillCircle(18, 19, 16);
    g.fillStyle(0xb94eaf, 1);
    g.fillCircle(18, 15, 11);
    g.fillStyle(0xffe7ff, 1);
    g.fillCircle(13, 14, 3);
    g.fillCircle(23, 14, 3);
    g.fillStyle(0x25102a, 1);
    g.fillCircle(13, 14, 1.4);
    g.fillCircle(23, 14, 1.4);
    g.generateTexture('enemy', 36, 38);

    // Boss.
    g.clear();
    g.fillStyle(0x210e2d, 1);
    g.fillCircle(28, 29, 27);
    g.fillStyle(0x6b245e, 1);
    g.fillCircle(28, 24, 21);
    g.fillStyle(0xff477e, 1);
    g.fillCircle(20, 23, 4);
    g.fillCircle(36, 23, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(20, 23, 1.5);
    g.fillCircle(36, 23, 1.5);
    g.lineStyle(3, 0xb98aff, 1);
    g.lineBetween(28, 1, 28, 12);
    g.generateTexture('boss', 58, 58);

    // Arcane projectile.
    g.clear();
    g.fillStyle(0x9d73ff, 0.35);
    g.fillCircle(12, 12, 12);
    g.fillStyle(0xbceaff, 1);
    g.fillCircle(12, 12, 7);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(10, 10, 3);
    g.generateTexture('projectile', 24, 24);

    // Artifact.
    g.clear();

    const starPoints = [];

    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const radius = i % 2 === 0 ? 15 : 7;

      starPoints.push(
        new Phaser.Math.Vector2(
          16 + Math.cos(angle) * radius,
          16 + Math.sin(angle) * radius
        )
      );
    }

    g.fillStyle(0xffdc75, 1);
    g.fillPoints(starPoints, true);
    g.lineStyle(2, 0xffffff, 0.9);
    g.strokePoints(starPoints, true);
    g.generateTexture('artifact', 32, 32);

    // Potion.
    g.clear();
    g.fillStyle(0xe5d7ff, 1);
    g.fillRect(9, 2, 8, 5);
    g.fillStyle(0x55e5b0, 1);
    g.fillRoundedRect(5, 7, 16, 17, 5);
    g.fillStyle(0xffffff, 0.6);
    g.fillRect(8, 10, 3, 8);
    g.generateTexture('potion', 26, 28);

    // Golden key.
    g.clear();
    g.lineStyle(5, 0xffd96b, 1);
    g.strokeCircle(9, 11, 6);
    g.lineBetween(15, 11, 31, 11);
    g.lineBetween(25, 11, 25, 17);
    g.lineBetween(30, 11, 30, 15);
    g.generateTexture('key', 36, 24);

    // Rune.
    g.clear();
    g.fillStyle(0x1c8f8b, 0.35);
    g.fillCircle(18, 18, 17);
    g.lineStyle(3, 0x74fff0, 1);
    g.strokeCircle(18, 18, 12);
    g.lineBetween(18, 7, 18, 29);
    g.lineBetween(9, 13, 27, 23);
    g.lineBetween(27, 13, 9, 23);
    g.generateTexture('rune', 36, 36);

    // Wall.
    g.clear();
    g.fillStyle(0x33284c, 1);
    g.fillRoundedRect(0, 0, 64, 32, 5);
    g.lineStyle(2, 0x77618e, 1);
    g.strokeRoundedRect(1, 1, 62, 30, 5);
    g.lineBetween(0, 16, 64, 16);
    g.lineBetween(21, 0, 21, 16);
    g.lineBetween(43, 16, 43, 32);
    g.generateTexture('wall', 64, 32);

    // Exit portal.
    g.clear();
    g.fillStyle(0x5a36a1, 0.35);
    g.fillCircle(26, 26, 25);
    g.lineStyle(4, 0xbba0ff, 1);
    g.strokeCircle(26, 26, 20);
    g.lineStyle(3, 0x6eeaff, 1);
    g.strokeCircle(26, 26, 13);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(26, 26, 5);
    g.generateTexture('portal', 52, 52);

    // Small spark.
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(8, 0),
        new Phaser.Math.Vector2(10, 6),
        new Phaser.Math.Vector2(16, 8),
        new Phaser.Math.Vector2(10, 10),
        new Phaser.Math.Vector2(8, 16),
        new Phaser.Math.Vector2(6, 10),
        new Phaser.Math.Vector2(0, 8),
        new Phaser.Math.Vector2(6, 6),
      ],
      true
    );
    g.generateTexture('spark', 16, 16);

    g.destroy();
  }

  createWorld() {
    const level = LEVELS[this.levelIndex];

    this.cameras.main.setBackgroundColor(level.color);

    const background = this.add.graphics();

    background.fillStyle(level.color, 1);
    background.fillRect(0, 0, WIDTH, HEIGHT);

    background.lineStyle(1, 0x8472a8, 0.1);

    for (let x = 0; x < WIDTH; x += 48) {
      background.lineBetween(x, 0, x, HEIGHT);
    }

    for (let y = 0; y < HEIGHT; y += 48) {
      background.lineBetween(0, y, WIDTH, y);
    }

    for (let i = 0; i < 65; i++) {
      const x = Phaser.Math.Between(10, WIDTH - 10);
      const y = Phaser.Math.Between(10, HEIGHT - 10);
      const star = this.add.image(x, y, 'spark');

      star.setScale(Phaser.Math.FloatBetween(0.15, 0.45));
      star.setAlpha(Phaser.Math.FloatBetween(0.15, 0.6));

      this.tweens.add({
        targets: star,
        alpha: 0.08,
        duration: Phaser.Math.Between(900, 2200),
        yoyo: true,
        repeat: -1,
      });
    }

    this.physics.world.setBounds(12, 12, WIDTH - 24, HEIGHT - 24);

    this.add
      .text(WIDTH / 2, 48, level.name, {
        fontFamily: 'Georgia, serif',
        fontSize: '25px',
        color: '#f4d895',
        fontStyle: 'bold',
        stroke: '#21132e',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(WIDTH / 2, 78, level.description, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#e5dcff',
        stroke: '#21132e',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
  }

  createPlayer() {
    this.player = this.physics.add.sprite(
      90,
      HEIGHT / 2,
      'player'
    );

    this.player.setDepth(10);
    this.player.setCollideWorldBounds(true);
    this.player.setTint(this.houseInfo.color);
    this.player.setSize(30, 38);
    this.player.setOffset(10, 15);
    this.player.body.setMaxSpeed(250);

    this.playerLabel = this.add
      .text(this.player.x, this.player.y - 39, this.playerName, {
        fontSize: '11px',
        color: '#ffffff',
        stroke: '#1a1030',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
  }

  createGroups() {
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group({
      defaultKey: 'projectile',
      maxSize: 40,
    });

    this.enemyProjectiles = this.physics.add.group({
      defaultKey: 'projectile',
      maxSize: 30,
    });

    this.artifacts = this.physics.add.staticGroup();
    this.pickups = this.physics.add.staticGroup();
    this.runes = this.physics.add.staticGroup();
    this.walls = this.physics.add.staticGroup();
  }

  createLevelObjects() {
    const level = LEVELS[this.levelIndex];

    // Fixed obstacles.
    const layouts = [
      [
        [270, 190, 90, 28],
        [430, 350, 100, 28],
        [620, 190, 100, 28],
        [760, 400, 80, 28],
      ],
      [
        [240, 170, 110, 28],
        [390, 310, 110, 28],
        [570, 170, 110, 28],
        [730, 330, 100, 28],
      ],
      [
        [260, 200, 90, 28],
        [420, 390, 110, 28],
        [650, 200, 90, 28],
      ],
      [
        [230, 180, 100, 28],
        [390, 350, 110, 28],
        [570, 180, 100, 28],
        [740, 350, 100, 28],
      ],
    ];

    for (const [x, y, w, h] of layouts[this.levelIndex]) {
      const wall = this.walls
        .create(x, y, 'wall')
        .setDisplaySize(w, h)
        .setDepth(3);

      wall.refreshBody();
    }

    // Spawn enemies.
    const enemyCount = level.enemyCount;

    for (let i = 0; i < enemyCount; i++) {
      const position = this.findOpenPosition();

      this.spawnEnemy(
        position.x,
        position.y,
        Phaser.Math.Between(35, 55),
        1
      );
    }

    // Objective-specific items.
    if (level.objective === 'artifacts') {
      for (let i = 0; i < level.required; i++) {
        const position = this.findOpenPosition();

        this.artifacts
          .create(position.x, position.y, 'artifact')
          .setScale(1.1)
          .setDepth(5);
      }
    }

    if (level.objective === 'key') {
      const position = this.findOpenPosition();

      this.keyObject = this.physics.add
        .staticImage(position.x, position.y, 'key')
        .setDepth(5);

      this.keyObject.refreshBody();
    }

    if (level.objective === 'boss') {
      this.spawnBoss(WIDTH - 150, HEIGHT / 2);
    }

    if (level.objective === 'runes') {
      for (let i = 0; i < level.required; i++) {
        const position = this.findOpenPosition();

        this.runes
          .create(position.x, position.y, 'rune')
          .setDepth(5);
      }

      this.spawnBoss(WIDTH - 150, HEIGHT / 2);
    }

    // Exit portal.
    this.exitObject = this.physics.add
      .staticImage(WIDTH - 65, HEIGHT - 75, 'portal')
      .setDepth(4);

    this.exitObject.setScale(1.05);
    this.exitObject.refreshBody();

    // Potion pickups.
    for (let i = 0; i < 2; i++) {
      const position = this.findOpenPosition();

      this.pickups
        .create(position.x, position.y, 'potion')
        .setDepth(5);
    }
  }

  findOpenPosition() {
    for (let attempt = 0; attempt < 100; attempt++) {
      const x = Phaser.Math.Between(100, WIDTH - 110);
      const y = Phaser.Math.Between(120, HEIGHT - 100);

      const overlapsWall = this.walls.getChildren().some((wall) => {
        const bounds = wall.getBounds();

        return (
          Phaser.Geom.Rectangle.Contains(bounds, x, y) ||
          Phaser.Math.Distance.Between(x, y, wall.x, wall.y) < 45
        );
      });

      if (
        !overlapsWall &&
        Phaser.Math.Distance.Between(x, y, 90, HEIGHT / 2) > 100
      ) {
        return { x, y };
      }
    }

    return {
      x: Phaser.Math.Between(150, WIDTH - 150),
      y: Phaser.Math.Between(130, HEIGHT - 100),
    };
  }

  spawnEnemy(x, y, health = 45, scale = 1) {
    const enemy = this.enemies.create(x, y, 'enemy');

    enemy.setScale(scale);
    enemy.setDepth(7);
    enemy.setCollideWorldBounds(true);
    enemy.setBounce(0.2);
    enemy.setTint(
      Phaser.Math.RND.pick([
        0xff6688,
        0xb46bff,
        0x8e75ff,
        0x69d9ff,
      ])
    );

    enemy.health = health;
    enemy.maxHealth = health;
    enemy.damage = 10;
    enemy.speed = Phaser.Math.Between(45, 75);
    enemy.lastAttack = 0;
    enemy.nextShot = 0;
    enemy.isBoss = false;
    enemy.setSize(25, 28);
    enemy.setOffset(5, 5);

    this.physics.add.collider(enemy, this.walls);

    return enemy;
  }

  spawnBoss(x, y) {
    this.boss = this.enemies.create(x, y, 'boss');

    this.boss.setDepth(8);
    this.boss.setCollideWorldBounds(true);
    this.boss.setTint(0xffa3ed);
    this.boss.setSize(42, 44);
    this.boss.setOffset(8, 8);

    this.boss.health = 220;
    this.boss.maxHealth = 220;
    this.boss.damage = 18;
    this.boss.speed = 42;
    this.boss.lastAttack = 0;
    this.boss.nextShot = 0;
    this.boss.isBoss = true;

    this.physics.add.collider(this.boss, this.walls);

    this.bossHealthText = this.add
      .text(WIDTH - 25, 105, 'BOSS: 220 / 220', {
        fontSize: '13px',
        color: '#ff9bda',
        fontStyle: 'bold',
        stroke: '#160d23',
        strokeThickness: 3,
      })
      .setOrigin(1, 0);
  }

  createHUD() {
    this.hudText = this.add
      .text(18, 105, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        lineSpacing: 5,
        stroke: '#160d23',
        strokeThickness: 3,
      })
      .setDepth(50);

    this.statusText = this.add
      .text(WIDTH - 18, HEIGHT - 18, '', {
        fontSize: '12px',
        color: '#f6e2ac',
        stroke: '#160d23',
        strokeThickness: 3,
      })
      .setOrigin(1, 1)
      .setDepth(50);

    this.healthText = this.add
      .text(18, HEIGHT - 76, '', {
        fontSize: '14px',
        color: '#ff9aab',
        stroke: '#160d23',
        strokeThickness: 3,
      })
      .setDepth(50);

    this.manaText = this.add
      .text(18, HEIGHT - 49, '', {
        fontSize: '14px',
        color: '#a5d6ff',
        stroke: '#160d23',
        strokeThickness: 3,
      })
      .setDepth(50);

    this.controlsText = this.add
      .text(WIDTH / 2, HEIGHT - 17, 'WASD / Arrows: Move  |  SPACE: Arc Bolt  |  1: Burst  |  2: Frost  |  Q: House Power  |  E: Interact  |  P: Pause', {
        fontSize: '10px',
        color: '#d8c9f4',
        stroke: '#160d23',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1)
      .setDepth(50);

    this.messageText = this.add
      .text(WIDTH / 2, HEIGHT - 115, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '17px',
        color: '#ffe6a1',
        fontStyle: 'bold',
        stroke: '#241331',
        strokeThickness: 5,
        align: 'center',
        wordWrap: { width: 680 },
      })
      .setOrigin(0.5)
      .setDepth(100);
  }

  createKeyboard() {
    this.keys = this.input.keyboard.addKeys({
      up: 'W',
      down: 'S',
      left: 'A',
      right: 'D',
      upArrow: 'UP',
      downArrow: 'DOWN',
      leftArrow: 'LEFT',
      rightArrow: 'RIGHT',
    });

    this.input.on('pointerdown', (pointer) => {
      if (this.isPaused || this.gameOver) return;

      // Clicking the game world casts a spell towards the pointer.
      this.castSpell(0, pointer.worldX, pointer.worldY);
    });
  }

  createMobileControls() {
    const parent = this.game.canvas.parentElement;

    if (!parent || parent.querySelector('.magic-mobile-controls')) {
      return;
    }

    const controls = document.createElement('div');

    controls.className = 'magic-mobile-controls';

    controls.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding: 10px;
      flex-wrap: wrap;
      user-select: none;
      touch-action: none;
    `;

    const buttonStyle = `
      border: 1px solid rgba(224, 193, 255, 0.5);
      border-radius: 12px;
      background: rgba(41, 25, 69, 0.94);
      color: #fff0c5;
      font-size: 14px;
      font-weight: bold;
      min-width: 48px;
      min-height: 42px;
      padding: 9px;
      touch-action: none;
    `;

    const directions = document.createElement('div');

    directions.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 48px);
      gap: 5px;
    `;

    const actions = document.createElement('div');

    actions.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      justify-content: flex-end;
    `;

    const makeButton = (label, callback) => {
      const button = document.createElement('button');

      button.type = 'button';
      button.textContent = label;
      button.style.cssText = buttonStyle;

      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);
        callback(true);
      });

      const release = (event) => {
        event.preventDefault();
        callback(false);
      };

      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);

      return button;
    };

    directions.append(
      makeButton('↖', (v) => {
        this.mobileKeys.up = v;
        this.mobileKeys.left = v;
      }),
      makeButton('↑', (v) => (this.mobileKeys.up = v)),
      makeButton('↗', (v) => {
        this.mobileKeys.up = v;
        this.mobileKeys.right = v;
      }),
      makeButton('←', (v) => (this.mobileKeys.left = v)),
      makeButton('↓', (v) => (this.mobileKeys.down = v)),
      makeButton('→', (v) => (this.mobileKeys.right = v))
    );

    actions.append(
      makeButton('SPELL', (v) => {
        if (v) this.castSpell(0);
      }),
      makeButton('BURST', (v) => {
        if (v) this.castSpell(1);
      }),
      makeButton('POWER', (v) => {
        if (v) this.useHousePower();
      }),
      makeButton('POTION', (v) => {
        if (v) this.usePotion();
      }),
      makeButton('INTERACT', (v) => {
        if (v) this.interact();
      })
    );

    controls.append(directions, actions);
    parent.appendChild(controls);

    this.mobileControlsElement = controls;
  }

  removeMobileControls() {
    if (this.mobileControlsElement?.parentElement) {
      this.mobileControlsElement.remove();
    }

    this.mobileControlsElement = null;
  }

  bindCollisions() {
    this.physics.add.collider(this.player, this.walls);

    this.physics.add.collider(this.enemies, this.walls);

    this.physics.add.overlap(
      this.player,
      this.artifacts,
      (_, artifact) => this.collectArtifact(artifact),
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.pickups,
      (_, pickup) => this.collectPotion(pickup),
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.runes,
      (_, rune) => this.collectRune(rune),
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.projectiles,
      (player, projectile) => {
        if (projectile.owner === 'enemy') {
          this.damagePlayer(projectile.damage || 10);
          projectile.destroy();
        }
      },
      undefined,
      this
    );

    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      (projectile, enemy) => this.hitEnemy(projectile, enemy),
      (projectile, enemy) =>
        projectile.active && enemy.active && projectile.owner !== 'enemy',
      this
    );

    this.physics.add.overlap(
      this.player,
      this.enemies,
      (_, enemy) => this.enemyTouch(enemy),
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.exitObject,
      () => this.tryExit(),
      undefined,
      this
    );

    if (this.keyObject) {
      this.physics.add.overlap(
        this.player,
        this.keyObject,
        () => this.collectKey(),
        undefined,
        this
      );
    }
  }

  update(time, delta) {
    if (!this.player || !this.player.active) return;

    if (this.isPaused || this.gameOver) {
      this.player.setVelocity(0, 0);
      return;
    }

    this.updateMovement();
    this.updateEnemies(time);
    this.regenerateMana(delta);
    this.updatePlayerVisuals();
    this.updateHUD();

    if (time - this.lastSaveTime > 15000) {
      this.lastSaveTime = time;
      this.saveProgress(false);
    }
  }

  updateMovement() {
    const keys = this.keys;

    const left =
      keys.left.isDown ||
      keys.leftArrow.isDown ||
      this.mobileKeys.left;

    const right =
      keys.right.isDown ||
      keys.rightArrow.isDown ||
      this.mobileKeys.right;

    const up =
      keys.up.isDown ||
      keys.upArrow.isDown ||
      this.mobileKeys.up;

    const down =
      keys.down.isDown ||
      keys.downArrow.isDown ||
      this.mobileKeys.down;

    let vx = 0;
    let vy = 0;

    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    if (vx !== 0 && vy !== 0) {
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }

    const speed = 190;

    this.player.setVelocity(vx * speed, vy * speed);

    if (vx < 0) this.playerFacing = -1;
    if (vx > 0) this.playerFacing = 1;
  }

  updatePlayerVisuals() {
    if (!this.player?.active) return;

    this.player.setFlipX(this.playerFacing < 0);

    if (this.playerLabel) {
      this.playerLabel.setPosition(
        this.player.x,
        this.player.y - 39
      );
    }

    const moving =
      Math.abs(this.player.body.velocity.x) +
      Math.abs(this.player.body.velocity.y) > 5;

    this.player.setAngle(
      moving ? Math.sin(this.time.now / 90) * 2 : 0
    );
  }

  updateEnemies(time) {
    this.enemies.getChildren().forEach((enemy) => {
      if (!enemy.active) return;

      const distance = Phaser.Math.Distance.Between(
        enemy.x,
        enemy.y,
        this.player.x,
        this.player.y
      );

      if (distance > 500) {
        enemy.setVelocity(0, 0);
        return;
      }

      const frozen = time < (enemy.frostUntil || 0);

      if (frozen) {
        enemy.setVelocity(0, 0);
        return;
      }

      if (distance > 55) {
        this.physics.moveToObject(
          enemy,
          this.player,
          enemy.speed
        );
      } else {
        enemy.setVelocity(0, 0);

        if (time - enemy.lastAttack > 1100) {
          enemy.lastAttack = time;
          this.damagePlayer(enemy.damage);
        }
      }

      // Boss fires occasional magical projectiles.
      if (
        enemy.isBoss &&
        distance < 450 &&
        time > enemy.nextShot
      ) {
        enemy.nextShot = time + 1900;
        this.fireEnemyProjectile(enemy);
      }
    });
  }

  fireEnemyProjectile(enemy) {
    const projectile = this.enemyProjectiles.get(
      enemy.x,
      enemy.y,
      'projectile'
    );

    if (!projectile) return;

    projectile.enableBody(true, enemy.x, enemy.y, true, true);
    projectile.setActive(true);
    projectile.setVisible(true);
    projectile.setTint(0xff4c91);
    projectile.owner = 'enemy';
    projectile.damage = 12;
    projectile.setDepth(6);

    this.physics.moveToObject(projectile, this.player, 170);

    projectile.body.setSize(18, 18);
    projectile.body.setAllowGravity(false);

    this.time.delayedCall(2400, () => {
      if (projectile.active) projectile.destroy();
    });
  }

  castSpell(index = 0, targetX = null, targetY = null) {
    if (this.isPaused || this.gameOver) return;

    const time = this.time.now;

    if (time - this.lastSpellTime < 240) return;

    const spell = SPELLS[index] || SPELLS[0];

    if (this.mana < spell.mana) {
      this.showMessage('Not enough mana! Wait for it to regenerate.', 1300);
      return;
    }

    this.lastSpellTime = time;
    this.mana -= spell.mana;

    if (index === 1) {
      this.castAstralBurst();
      this.updateHUD();
      return;
    }

    if (index === 2) {
      this.castFrostBind();
      this.updateHUD();
      return;
    }

    const pointer = this.input.activePointer;

    const tx = targetX ?? (
      pointer?.isDown ? pointer.worldX :
      this.player.x + this.playerFacing * 100
    );

    const ty = targetY ?? (
      pointer?.isDown ? pointer.worldY :
      this.player.y
    );

    const projectile = this.projectiles.create(
      this.player.x + this.playerFacing * 20,
      this.player.y,
      'projectile'
    );

    if (!projectile) return;

    projectile.setActive(true);
    projectile.setVisible(true);
    projectile.setTint(this.houseInfo.color);
    projectile.setDepth(9);
    projectile.damage = spell.damage;
    projectile.owner = 'player';
    projectile.body.setAllowGravity(false);
    projectile.body.setSize(18, 18);

    this.physics.moveTo(
      projectile,
      tx,
      ty,
      360
    );

    this.time.delayedCall(1800, () => {
      if (projectile.active) projectile.destroy();
    });
  }

  castAstralBurst() {
    this.showMessage('ASTRAL BURST!', 1000);

    const burst = this.add.circle(
      this.player.x,
      this.player.y,
      15,
      0xb8a1ff,
      0.5
    );

    burst.setDepth(20);

    this.tweens.add({
      targets: burst,
      radius: 115,
      alpha: 0,
      duration: 350,
      onUpdate: () => {
        this.enemies.getChildren().forEach((enemy) => {
          if (!enemy.active || enemy.burstHit) return;

          const distance = Phaser.Math.Distance.Between(
            burst.x,
            burst.y,
            enemy.x,
            enemy.y
          );

          if (distance < burst.radius + 15) {
            enemy.burstHit = true;
            this.damageEnemy(enemy, SPELLS[1].damage);

            this.time.delayedCall(400, () => {
              if (enemy.active) enemy.burstHit = false;
            });
          }
        });
      },
      onComplete: () => burst.destroy(),
    });
  }

  castFrostBind() {
    this.showMessage('FROST BIND!', 1000);

    this.enemies.getChildren().forEach((enemy) => {
      if (!enemy.active) return;

      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        enemy.x,
        enemy.y
      );

      if (distance < 230) {
        this.damageEnemy(enemy, SPELLS[2].damage);
        enemy.frostUntil = this.time.now + 2500;
        enemy.setTint(0x7eeeff);

        this.time.delayedCall(2500, () => {
          if (enemy.active) {
            enemy.clearTint();

            if (enemy.isBoss) {
              enemy.setTint(0xffa3ed);
            }
          }
        });
      }
    });
  }

  useHousePower() {
    if (this.isPaused || this.gameOver) return;

    if (this.time.now < this.specialCooldown) {
      this.showMessage('Your house power is recharging!', 1200);
      return;
    }

    this.specialCooldown = this.time.now + 12000;

    switch (this.house) {
      case 'gryffindor':
        this.showMessage('COURAGE BURST!', 1200);
        this.enemies.getChildren().forEach((enemy) => {
          if (
            enemy.active &&
            Phaser.Math.Distance.Between(
              this.player.x,
              this.player.y,
              enemy.x,
              enemy.y
            ) < 160
          ) {
            this.damageEnemy(enemy, 35);
          }
        });
        break;

      case 'slytherin':
        this.showMessage('SHADOW STRIKE!', 1200);
        this.enemies.getChildren().forEach((enemy) => {
          if (
            enemy.active &&
            Phaser.Math.Distance.Between(
              this.player.x,
              this.player.y,
              enemy.x,
              enemy.y
            ) < 260
          ) {
            this.damageEnemy(enemy, 28);
            enemy.frostUntil = this.time.now + 1200;
          }
        });
        break;

      case 'ravenclaw':
        this.showMessage('ARCANE FOCUS!', 1200);
        this.mana = this.maxMana;
        this.health = Math.min(this.maxHealth, this.health + 10);
        break;

      case 'hufflepuff':
        this.showMessage('HEALING LIGHT!', 1200);
        this.health = Math.min(this.maxHealth, this.health + 40);
        this.mana = Math.min(this.maxMana, this.mana + 25);
        break;
    }

    this.updateHUD();
    this.saveProgress(false);
  }

  usePotion() {
    if (this.isPaused || this.gameOver) return;

    if (this.potions <= 0) {
      this.showMessage('You have no potions left!', 1200);
      return;
    }

    if (this.health >= this.maxHealth && this.mana >= this.maxMana) {
      this.showMessage('Your health and mana are already full.', 1200);
      return;
    }

    this.potions--;
    this.health = Math.min(this.maxHealth, this.health + 35);
    this.mana = Math.min(this.maxMana, this.mana + 30);

    this.showMessage('Potion used! Health and mana restored.', 1600);
    this.updateHUD();
    this.saveProgress(false);
  }

  regenerateMana(delta) {
    this.mana = Math.min(
      this.maxMana,
      this.mana + delta * 0.008
    );
  }

  damagePlayer(amount) {
    if (this.gameOver || this.isPaused) return;

    if (this.time.now - this.lastDamageTime < 650) return;

    this.lastDamageTime = this.time.now;
    this.health = Math.max(0, this.health - amount);

    this.cameras.main.shake(100, 0.003);
    this.player.setTint(0xff7777);

    this.time.delayedCall(180, () => {
      if (this.player?.active) {
        this.player.setTint(this.houseInfo.color);
      }
    });

    if (this.health <= 0) {
      this.endGame(false);
    }

    this.updateHUD();
  }

  enemyTouch(enemy) {
    if (!enemy?.active || this.gameOver) return;

    if (this.time.now - this.lastDamageTime > 800) {
      this.damagePlayer(enemy.damage || 10);
    }
  }

  hitEnemy(projectile, enemy) {
    if (!projectile.active || !enemy.active) return;
    if (projectile.owner === 'enemy') return;

    const damage = projectile.damage || 20;

    projectile.destroy();
    this.damageEnemy(enemy, damage);
  }

  damageEnemy(enemy, damage) {
    if (!enemy?.active) return;

    enemy.health -= damage;
    enemy.setAlpha(0.55);

    this.time.delayedCall(100, () => {
      if (enemy.active) enemy.setAlpha(1);
    });

    if (enemy.health <= 0) {
      this.defeatEnemy(enemy);
    } else if (enemy.isBoss && this.bossHealthText) {
      this.bossHealthText.setText(
        `BOSS: ${Math.max(0, enemy.health)} / ${enemy.maxHealth}`
      );
    }
  }

  defeatEnemy(enemy) {
    if (!enemy?.active) return;

    const isBoss = Boolean(enemy.isBoss);

    this.totalDefeated++;
    this.score += isBoss ? 300 : 50;

    this.add
      .text(enemy.x, enemy.y - 10, isBoss ? '+300' : '+50', {
        fontSize: '16px',
        color: '#ffe18a',
        fontStyle: 'bold',
        stroke: '#251433',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(30);

    this.tweens.add({
      targets: enemy,
      alpha: 0,
      scale: 0.1,
      duration: 220,
      onComplete: () => enemy.destroy(),
    });

    if (isBoss) {
      this.bossDefeated = true;
      this.showMessage('The boss has fallen! Find the portal.', 2500);
    } else if (Math.random() < 0.25) {
      const potion = this.pickups.create(
        enemy.x,
        enemy.y,
        'potion'
      );

      potion.refreshBody();
    }

    this.updateHUD();
    this.saveProgress(false);
  }

  collectArtifact(artifact) {
    if (!artifact?.active) return;

    artifact.destroy();
    this.artifactsCollected++;
    this.score += 100;

    this.showMessage(
      `Ancient artifact collected! ${this.artifactsCollected}/5`,
      1300
    );

    this.updateHUD();
    this.saveProgress(false);
  }

  collectPotion(pickup) {
    if (!pickup?.active) return;

    pickup.destroy();
    this.potions++;

    this.showMessage('Potion collected! Press 3 to use it.', 1400);
    this.updateHUD();
    this.saveProgress(false);
  }

  collectRune(rune) {
    if (!rune?.active) return;

    rune.destroy();
    this.runesCollected++;
    this.score += 75;

    this.showMessage(
      `Forest rune collected! ${this.runesCollected}/3`,
      1500
    );

    this.updateHUD();
    this.saveProgress(false);
  }

  collectKey() {
    if (this.hasKey || !this.keyObject?.active) return;

    this.hasKey = true;
    this.keyObject.destroy();

    this.score += 100;

    this.showMessage('Golden key acquired! Reach the exit portal.', 2200);
    this.updateHUD();
    this.saveProgress(false);
  }

  isObjectiveComplete() {
    const objective = LEVELS[this.levelIndex].objective;

    if (objective === 'artifacts') {
      return this.artifactsCollected >= LEVELS[this.levelIndex].required;
    }

    if (objective === 'key') {
      return this.hasKey && this.enemies.countActive() === 0;
    }

    if (objective === 'boss') {
      return this.bossDefeated;
    }

    if (objective === 'runes') {
      return (
        this.runesCollected >= LEVELS[this.levelIndex].required &&
        this.bossDefeated
      );
    }

    return false;
  }

  tryExit() {
    if (this.levelReady || this.gameOver) return;

    if (!this.isObjectiveComplete()) {
      const objective = LEVELS[this.levelIndex].objective;

      if (objective === 'artifacts') {
        this.showMessage(
          `Collect all artifacts first: ${this.artifactsCollected}/5`,
          1500
        );
      } else if (objective === 'key') {
        this.showMessage(
          'Defeat all guardians and find the golden key.',
          1600
        );
      } else if (objective === 'boss') {
        this.showMessage('Defeat the Dark Sorcerer first!', 1500);
      } else {
        this.showMessage(
          `Collect all runes (${this.runesCollected}/3) and defeat the Guardian.`,
          1800
        );
      }

      return;
    }

    this.levelReady = true;
    this.advanceLevel();
  }

  interact() {
    if (this.isPaused || this.gameOver) return;

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.exitObject.x,
      this.exitObject.y
    );

    if (distance < 100) {
      this.tryExit();
    } else {
      this.showMessage(
        'Explore the room, defeat enemies, and look for glowing objects.',
        1800
      );
    }
  }

  advanceLevel() {
    this.score += 250;

    if (this.levelIndex >= LEVELS.length - 1) {
      this.endGame(true);
      return;
    }

    const nextState = {
      levelIndex: this.levelIndex + 1,
      health: this.health,
      mana: this.mana,
      score: this.score,
      totalDefeated: this.totalDefeated,
      artifactsCollected: this.artifactsCollected,
      runesCollected: this.runesCollected,
      hasKey: this.hasKey,
      bossDefeated: this.bossDefeated,
      potions: this.potions,
    };

    this.saveProgress(false);

    this.showMessage('Level complete! Entering the next realm...', 1800);

    this.time.delayedCall(1400, () => {
      this.scene.restart({
        configData: this.configData,
        state: nextState,
      });
    });
  }

  endGame(won) {
    if (this.gameOver) return;

    this.gameOver = true;
    this.victory = won;
    this.physics.pause();

    const title = won ? '🏆 ACADEMY CHAMPION!' : 'YOUR JOURNEY ENDS';
    const subtitle = won
      ? 'You have conquered every realm!'
      : 'Rest, young wizard. Your adventure can begin again.';
    const color = won ? '#ffe18a' : '#ff9aab';

    this.add
      .rectangle(
        WIDTH / 2,
        HEIGHT / 2,
        WIDTH,
        HEIGHT,
        0x10091d,
        0.88
      )
      .setDepth(200);

    this.add
      .text(WIDTH / 2, HEIGHT / 2 - 80, title, {
        fontFamily: 'Georgia, serif',
        fontSize: '34px',
        color,
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(201);

    this.add
      .text(
        WIDTH / 2,
        HEIGHT / 2 - 25,
        `${subtitle}\n\nScore: ${this.score}\nEnemies defeated: ${this.totalDefeated}`,
        {
          fontSize: '17px',
          color: '#ffffff',
          align: 'center',
          lineSpacing: 8,
        }
      )
      .setOrigin(0.5)
      .setDepth(201);

    const restartText = this.add
      .text(WIDTH / 2, HEIGHT / 2 + 95, 'CLICK HERE TO PLAY AGAIN', {
        fontSize: '18px',
        color: '#ffe4a3',
        backgroundColor: '#38235e',
        padding: { x: 18, y: 12 },
      })
      .setOrigin(0.5)
      .setDepth(202)
      .setInteractive({ useHandCursor: true });

    restartText.on('pointerdown', () => {
      this.scene.restart({
        configData: this.configData,
        state: {
          levelIndex: 0,
          health: 100,
          mana: 100,
          score: 0,
          totalDefeated: 0,
          artifactsCollected: 0,
          runesCollected: 0,
          hasKey: false,
          bossDefeated: false,
          potions: 3,
        },
      });
    });

    this.saveProgress(true);

    this.onStatus(won ? 'Victory' : 'Game over');
  }

  togglePause() {
    if (this.gameOver) return;

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.physics.pause();

      this.pauseOverlay = this.add
        .rectangle(
          WIDTH / 2,
          HEIGHT / 2,
          WIDTH,
          HEIGHT,
          0x0c0718,
          0.82
        )
        .setDepth(150);

      this.pauseText = this.add
        .text(WIDTH / 2, HEIGHT / 2, 'PAUSED\n\nPress P or ESC to resume', {
          fontFamily: 'Georgia, serif',
          fontSize: '27px',
          color: '#ffe6a1',
          align: 'center',
          lineSpacing: 12,
        })
        .setOrigin(0.5)
        .setDepth(151);
    } else {
      this.physics.resume();
      this.pauseOverlay?.destroy();
      this.pauseText?.destroy();
    }
  }

  restartLevel() {
    if (this.gameOver) {
      this.scene.restart({
        configData: this.configData,
        state: {
          levelIndex: 0,
          health: 100,
          mana: 100,
          score: 0,
          totalDefeated: 0,
          artifactsCollected: 0,
          runesCollected: 0,
          hasKey: false,
          bossDefeated: false,
          potions: 3,
        },
      });

      return;
    }

    this.scene.restart({
      configData: this.configData,
      state: {
        levelIndex: this.levelIndex,
        health: 100,
        mana: 100,
        score: this.score,
        totalDefeated: this.totalDefeated,
        artifactsCollected: this.artifactsCollected,
        runesCollected: this.runesCollected,
        hasKey: this.hasKey,
        bossDefeated: this.bossDefeated,
        potions: this.potions,
      },
    });
  }

  updateHUD() {
    if (!this.hudText) return;

    const level = LEVELS[this.levelIndex];

    let objectiveText = '';

    if (level.objective === 'artifacts') {
      objectiveText = `Artifacts: ${this.artifactsCollected}/${level.required}`;
    } else if (level.objective === 'key') {
      objectiveText = `Golden key: ${this.hasKey ? 'Found' : 'Missing'}\nGuardians remaining: ${this.enemies?.countActive() || 0}`;
    } else if (level.objective === 'boss') {
      objectiveText = `Dark Sorcerer: ${this.bossDefeated ? 'Defeated' : 'Alive'}`;
    } else {
      objectiveText = `Runes: ${this.runesCollected}/${level.required}\nGuardian: ${this.bossDefeated ? 'Defeated' : 'Alive'}`;
    }

    this.hudText.setText(
      [
        `${this.houseInfo.name} Wizard`,
        `Level ${this.levelIndex + 1}/${LEVELS.length}`,
        objectiveText,
        `Score: ${this.score}`,
        `Enemies defeated: ${this.totalDefeated}`,
        `Potions: ${this.potions}`,
        `House Power: ${this.houseInfo.power}`,
      ].join('\n')
    );

    this.healthText?.setText(
      `♥ Health: ${Math.ceil(this.health)}/${this.maxHealth}`
    );

    this.manaText?.setText(
      `✦ Mana: ${Math.floor(this.mana)}/${this.maxMana}`
    );

    if (this.statusText) {
      const cooldown = Math.max(
        0,
        Math.ceil((this.specialCooldown - this.time.now) / 1000)
      );

      this.statusText.setText(
        cooldown > 0
          ? `House power recharging: ${cooldown}s`
          : 'House power ready: Q'
      );
    }

    if (this.bossHealthText && this.boss?.active) {
      this.bossHealthText.setText(
        `BOSS: ${Math.max(0, this.boss.health)} / ${this.boss.maxHealth}`
      );
    }
  }

  showMessage(message, duration = 1800) {
    if (!this.messageText) return;

    this.messageText.setText(message);
    this.messageText.setAlpha(1);

    this.tweens.killTweensOf(this.messageText);

    this.tweens.add({
      targets: this.messageText,
      alpha: 0,
      delay: duration,
      duration: 350,
    });
  }

  getSaveData() {
    return {
      version: 1,
      house: this.house,
      playerName: this.playerName,
      levelIndex: this.levelIndex,
      health: this.health,
      mana: this.mana,
      score: this.score,
      totalDefeated: this.totalDefeated,
      artifactsCollected: this.artifactsCollected,
      runesCollected: this.runesCollected,
      hasKey: this.hasKey,
      bossDefeated: this.bossDefeated,
      potions: this.potions,
      updatedAt: new Date().toISOString(),
    };
  }

  loadLocalProgress() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);

      if (!raw) return;

      const save = JSON.parse(raw);

      // Do not load another character's progress.
      if (save.house && normaliseHouse(save.house) !== this.house) {
        return;
      }

      this.levelIndex = clamp(
        Number(save.levelIndex ?? 0),
        0,
        LEVELS.length - 1
      );

      this.health = clamp(Number(save.health ?? 100), 1, 100);
      this.mana = clamp(Number(save.mana ?? 100), 0, 100);
      this.score = Math.max(0, Number(save.score ?? 0));
      this.totalDefeated = Math.max(0, Number(save.totalDefeated ?? 0));
      this.artifactsCollected = Math.max(0, Number(save.artifactsCollected ?? 0));
      this.runesCollected = Math.max(0, Number(save.runesCollected ?? 0));
      this.hasKey = Boolean(save.hasKey);
      this.bossDefeated = Boolean(save.bossDefeated);
      this.potions = Math.max(0, Number(save.potions ?? 3));
    } catch (error) {
      console.warn('Could not load local game save:', error);
    }
  }

  async saveProgress(showMessage = false) {
    const data = this.getSaveData();

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Could not save local progress:', error);
    }

    if (this.supabase && this.userId) {
      try {
        // Expected table: game_saves
        // Expected columns: user_id (unique), save_data (json/jsonb).
        const { error } = await this.supabase
          .from('game_saves')
          .upsert(
            {
              user_id: this.userId,
              save_data: data,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );

        if (error) {
          console.warn('Cloud save failed:', error.message);
          this.onStatus('Progress saved locally; cloud save needs checking');
        } else {
          this.onStatus('Progress saved');
        }
      } catch (error) {
        console.warn('Cloud save failed:', error);
        this.onStatus('Progress saved locally');
      }
    } else {
      this.onStatus('Progress saved locally');
    }

    if (showMessage && this.messageText) {
      this.showMessage('Progress saved!', 1200);
    }
  }
}

class AcademyHub extends Phaser.Scene {
  constructor() {
    super('AcademyHub');
  }

  init(data = {}) {
    this.configData = data.configData || {};
    this.stateData = data.state || {};

    this.house = normaliseHouse(
      this.stateData.house || this.configData.house
    );
    this.houseInfo = HOUSE_INFO[this.house];
    this.playerName =
      this.stateData.playerName ||
      this.configData.playerName ||
      'Young Wizard';

    this.userId = this.configData.userId || null;
    this.supabase = this.configData.supabase || null;
    this.onStatus = this.configData.onStatus || (() => {});

    this.score = Number(this.stateData.score || 0);
    this.totalDefeated = Number(this.stateData.totalDefeated || 0);
    this.health = Number(this.stateData.health ?? 100);
    this.mana = Number(this.stateData.mana ?? 100);
    this.potions = Number(this.stateData.potions ?? 3);

    this.questDone = Boolean(this.stateData.hubQuestDone);
    this.scrolls = 0;
    this.duelStarted = false;
    this.message = null;
    this.lastShot = 0;
  }

 
create() {
    this.physics.world.setBounds(20, 20, WIDTH - 40, HEIGHT - 40);
    this.cameras.main.setBackgroundColor('#17112d');

    // NEW: Default camera zoom
    this.gameZoom = 0.8;
    this.cameras.main.setZoom(this.gameZoom);

    // Magical academy floor
    const bg = this.add.graphics();
    bg.fillStyle(0x211936, 1);
    bg.fillRect(0, 0, WIDTH, HEIGHT);

    bg.lineStyle(2, 0x8f70b9, 0.22);

    for (let x = 30; x < WIDTH; x += 64) {
      bg.lineBetween(x, 100, x, HEIGHT - 30);
    }

    for (let y = 110; y < HEIGHT; y += 64) {
      bg.lineBetween(25, y, WIDTH - 25, y);
    }

    this.add.text(WIDTH / 2, 30, 'THE LIVING ACADEMY', {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      color: '#ffe4a0',
      fontStyle: 'bold',
      stroke: '#130b20',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 62,
      'Explore freely • Meet characters • Discover secrets', {
        fontSize: '14px',
        color: '#d9c9ff',
      }).setOrigin(0.5);

    // NEW: Zoom controls in the camera view
    const zoomControls = this.add.container(WIDTH - 115, 90);

    const makeZoomButton = (x, label, callback, width = 34) => {
      const button = this.add.rectangle(
        x, 0, width, 34, 0x100d24, 0.95
      ).setStrokeStyle(1.5, 0xa66cff).setInteractive({ useHandCursor: true });

      const text = this.add.text(x, 0, label, {
        fontSize: '20px',
        color: '#f5d58b',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      button.on('pointerdown', callback);
      button.on('pointerover', () => button.setFillStyle(0x30204b));
      button.on('pointerout', () => button.setFillStyle(0x100d24));

      zoomControls.add([button, text]);
    };

    makeZoomButton(0, '−', () => {
      this.gameZoom = Math.max(0.5, this.gameZoom - 0.1);
      this.cameras.main.setZoom(this.gameZoom);
    });

    makeZoomButton(40, '+', () => {
      this.gameZoom = Math.min(1.5, this.gameZoom + 0.1);
      this.cameras.main.setZoom(this.gameZoom);
    });

    makeZoomButton(83, '↺', () => {
      this.gameZoom = 0.8;
      this.cameras.main.setZoom(this.gameZoom);
    }, 34);

    zoomControls.setScrollFactor(0);
    zoomControls.setDepth(1000);

    // Player
    this.player = this.physics.add.sprite(100, 300, 'player');
    this.player.setTint(this.houseInfo.color);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.setSize(30, 38);
    this.player.setOffset(10, 15);

    this.keys = this.input.keyboard.addKeys({
      up: 'W',
      down: 'S',
      left: 'A',
      right: 'D',
      upArrow: 'UP',
      downArrow: 'DOWN',
      leftArrow: 'LEFT',
      rightArrow: 'RIGHT',
    });

    // Academy characters
    this.npcs = [
      this.makeNPC(300, 210, 'Professor Eldrin', 0xffd36e),
      this.makeNPC(510, 390, 'Mira the Explorer', 0x75dfff),
      this.makeNPC(690, 200, 'Duel Master', 0xff8cae),
    ];

    // Side-quest scrolls
    this.scrollGroup = this.physics.add.staticGroup();

    if (!this.questDone) {
      [[230, 440], [440, 160], [740, 430]].forEach(([x, y]) => {
        this.scrollGroup.create(x, y, 'artifact')
          .setTint(0x9b7bff)
          .setScale(1.25)
          .refreshBody();
      });
    }

    this.physics.add.overlap(
      this.player,
      this.scrollGroup,
      (_, scroll) => this.collectScroll(scroll)
    );

    // Magical duel arena
    this.duelPortal = this.physics.add.staticImage(850, 310, 'portal');
    this.duelPortal.setTint(0xff8bd5);
    this.duelPortal.setScale(1.4);
    this.duelPortal.refreshBody();

    this.duelEnemies = this.physics.add.group();
    this.spells = this.physics.add.group();

    this.physics.add.overlap(
      this.spells,
      this.duelEnemies,
      (spell, enemy) => {
        if (!spell.active || !enemy.active) return;

        spell.destroy();
        enemy.health -= spell.damage || 20;

        enemy.setAlpha(0.5);
        this.time.delayedCall(100, () => {
          if (enemy.active) enemy.setAlpha(1);
        });

        if (enemy.health <= 0) {
          this.score += 100;
          this.totalDefeated++;
          enemy.destroy();

          if (this.duelEnemies.countActive() === 0) {
            this.duelStarted = false;
            this.showMessage(
              'DUEL WON! +100 points per opponent. You are becoming a legend!',
              3500
            );
            this.saveHub();
          }
        }
      }
    );

    this.physics.add.overlap(
      this.player,
      this.duelEnemies,
      (_, enemy) => {
        if (this.time.now < (this.nextDamage || 0)) return;

        this.nextDamage = this.time.now + 900;
        this.health = Math.max(1, this.health - 8);

        this.showMessage(
          `You were hit! Health: ${this.health}`,
          900
        );
      }
    );

    this.add.text(20, 100,
      `${this.houseInfo.name} Wizard\nScore: ${this.score}\nHealth: ${this.health}\nMana: ${Math.floor(this.mana)}`,
      {
        fontSize: '15px',
        color: '#ffffff',
        lineSpacing: 7,
        stroke: '#120a20',
        strokeThickness: 4,
      }
    );

    this.add.text(WIDTH / 2, HEIGHT - 20,
      'WASD / Arrows: Move  •  SPACE: Cast spell  •  E: Interact  •  P: Pause',
      {
        fontSize: '12px',
        color: '#f0dca8',
        stroke: '#120a20',
        strokeThickness: 3,
      }
    ).setOrigin(0.5, 1);

    this.message = this.add.text(
      WIDTH / 2, HEIGHT - 75, '',
      {
        fontFamily: 'Georgia, serif',
        fontSize: '17px',
        color: '#ffe6a1',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#180d27',
        strokeThickness: 5,
        wordWrap: { width: 750 },
      }
    ).setOrigin(0.5);

    this.input.keyboard.on('keydown-E', () => this.interact());
    this.input.keyboard.on('keydown-SPACE', () => this.castHubSpell());
    this.input.keyboard.on('keydown-ONE', () => this.castHubSpell(45));
    this.input.keyboard.on('keydown-P', () => this.toggleHubPause());
    this.input.keyboard.on('keydown-ESC', () => this.toggleHubPause());

    this.input.keyboard.on('keydown-Q', () => {
      this.health = Math.min(100, this.health + 20);
      this.mana = Math.min(100, this.mana + 20);
      this.showMessage(`${this.houseInfo.power}! Your energy is restored.`, 1800);
    });

    this.showMessage(
      this.questDone
        ? 'Welcome back! Explore the academy and challenge the duel arena.'
        : 'Welcome to the academy! Find the three glowing scrolls.',
      3000
    );

    this.onStatus('Academy Hub unlocked');
    this.saveHub();
}

  makeNPC(x, y, name, tint) {
    const npc = this.physics.add.staticImage(x, y, 'player');
    npc.setTint(tint);
    npc.setScale(0.9);
    npc.refreshBody();

    this.add.text(x, y + 38, name, {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#241536',
      padding: { x: 5, y: 4 },
    }).setOrigin(0.5);

    return { sprite: npc, name };
  }

  update() {
    if (this.hubPaused) {
      this.player.setVelocity(0, 0);
      return;
    }

    const left = this.keys.left.isDown || this.keys.leftArrow.isDown;
    const right = this.keys.right.isDown || this.keys.rightArrow.isDown;
    const up = this.keys.up.isDown || this.keys.upArrow.isDown;
    const down = this.keys.down.isDown || this.keys.downArrow.isDown;

    let x = Number(right) - Number(left);
    let y = Number(down) - Number(up);

    if (x && y) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }

    this.player.setVelocity(x * 190, y * 190);

    if (x) this.player.setFlipX(x < 0);
  }

  interact() {
    if (this.hubPaused) return;

    const nearby = this.npcs
      .map(npc => ({
        ...npc,
        distance: Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          npc.sprite.x, npc.sprite.y
        ),
      }))
      .filter(npc => npc.distance < 90)
      .sort((a, b) => a.distance - b.distance)[0];

    if (nearby) {
      if (nearby.name === 'Professor Eldrin') {
        this.showMessage(
          this.questDone
            ? 'Professor: Excellent work, wizard. The academy has more secrets to uncover!'
            : 'Professor: Three ancient scrolls are hidden around the hall. Collect them and return to me!',
          3200
        );
      } else if (nearby.name === 'Mira the Explorer') {
        this.showMessage(
          'Mira: Look behind pillars and glowing objects. Hidden magic is everywhere!',
          2600
        );
      } else {
        this.startDuel();
      }
      return;
    }

    const portalDistance = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.duelPortal.x, this.duelPortal.y
    );

    if (portalDistance < 100) {
      this.startDuel();
      return;
    }

    this.showMessage('Move close to a character or the glowing duel portal, then press E.', 2200);
  }

  collectScroll(scroll) {
    if (!scroll.active || this.questDone) return;

    scroll.destroy();
    this.scrolls++;

    this.showMessage(`Ancient scroll found: ${this.scrolls}/3`, 1300);

    if (this.scrolls >= 3) {
      this.questDone = true;
      this.score += 300;
      this.showMessage('SIDE QUEST COMPLETE! +300 points. Speak to Professor Eldrin!', 3000);
      this.saveHub();
    }
  }

  startDuel() {
    if (this.duelEnemies.countActive() > 0) {
      this.showMessage('Defeat the current challengers first!', 1800);
      return;
    }

    this.duelStarted = true;

    [[760, 240], [830, 390], [690, 450]].forEach(([x, y]) => {
      const enemy = this.duelEnemies.create(x, y, 'enemy');
      enemy.health = 60;
      enemy.setTint(0xff75b5);
      enemy.setCollideWorldBounds(true);
      enemy.setDepth(8);
    });

    this.showMessage('DUEL CHALLENGE! Press SPACE to cast Arc Bolt or 1 for a powerful spell!', 3000);
  }

  castHubSpell(damage = 20) {
    if (this.hubPaused) return;

    const enemy = this.duelEnemies.getChildren()
      .filter(item => item.active)
      .sort((a, b) =>
        Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y) -
        Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y)
      )[0];

    if (!enemy) {
      this.showMessage('Visit the Duel Master or glowing portal to begin a duel.', 2000);
      return;
    }

    if (this.mana < (damage > 20 ? 20 : 5)) {
      this.showMessage('Not enough mana!', 1200);
      return;
    }

    this.mana -= damage > 20 ? 20 : 5;

    const spell = this.spells.create(
      this.player.x, this.player.y, 'projectile'
    );

    if (!spell) return;

    spell.damage = damage;
    spell.setTint(this.houseInfo.color);
    spell.setDepth(20);

    this.physics.moveToObject(spell, enemy, 430);

    this.time.delayedCall(1500, () => {
      if (spell.active) spell.destroy();
    });
  }

  toggleHubPause() {
    this.hubPaused = !this.hubPaused;

    if (this.hubPaused) {
      this.physics.pause();
      this.pauseLabel = this.add.text(
        WIDTH / 2, HEIGHT / 2,
        'PAUSED\n\nPress P or ESC to resume',
        {
          fontFamily: 'Georgia, serif',
          fontSize: '28px',
          color: '#ffe6a1',
          align: 'center',
          backgroundColor: '#160d29',
          padding: { x: 25, y: 20 },
        }
      ).setOrigin(0.5).setDepth(100);
    } else {
      this.physics.resume();
      this.pauseLabel?.destroy();
    }
  }

  showMessage(text, duration = 1800) {
    this.message.setText(text);
    this.message.setAlpha(1);

    this.tweens.killTweensOf(this.message);
    this.tweens.add({
      targets: this.message,
      alpha: 0,
      delay: duration,
      duration: 350,
    });
  }

  async saveHub() {
    const data = {
      version: 2,
      scene: 'hub',
      hubUnlocked: true,
      hubQuestDone: this.questDone,
      house: this.house,
      playerName: this.playerName,
      levelIndex: LEVELS.length - 1,
      health: this.health,
      mana: this.mana,
      score: this.score,
      totalDefeated: this.totalDefeated,
      potions: this.potions,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Local academy save failed:', error);
    }

    if (this.supabase && this.userId) {
      const { error } = await this.supabase
        .from('game_saves')
        .upsert({
          user_id: this.userId,
          save_data: data,
          updated_at: data.updatedAt,
        }, { onConflict: 'user_id' });

      if (error) {
        console.warn('Cloud academy save failed:', error.message);
        this.onStatus('Academy saved locally; cloud save needs checking');
        return;
      }
    }

    this.onStatus('Academy progress saved');
  }
}

export function startMagicGame(parent, config = {}) {
  const gameConfig = {
    type: Phaser.AUTO,
    parent,
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: '#160d29',
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
        gravity: { x: 0, y: 0 },
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: WIDTH,
      height: HEIGHT,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: true,
    },
    scene: [MagicRoom, AcademyHub],
  };

  const game = new Phaser.Game(gameConfig);

  game.events.once('ready', () => {
    game.scene.start('MagicRoom', {
      configData: config,
    });
  });

  return game;
}
