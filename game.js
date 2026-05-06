// =============================================================
// DefGame — выжившие против зомби (top-down PvZ-стиль).
// Скелет игры: Phaser 3 без сборки и без внешних ассетов.
// Все спрайты рисуются программно через Graphics → generateTexture.
// =============================================================

// Bump on EVERY change so the user can verify the new build is loaded.
const VERSION = "0.3.0";

const C = {
  VERSION,
  W: 1280,
  H: 720,
  COLS: 9,
  ROWS: 5,
  CELL: 110,
  GRID_X: 180,
  GRID_Y: 130,

  STARTING_SCRAP: 75,
  PASSIVE_SCRAP_MS: 9000,
  PASSIVE_SCRAP: 3,

  SHOOTER_COST: 50,
  SHOOTER_HP: 100,
  SHOOTER_FIRE_MS: 1100,
  BULLET_DAMAGE: 22,
  BULLET_SPEED: 700,

  SCAVENGER_COST: 75,
  SCAVENGER_HP: 60,
  SCAVENGER_TICK_MS: 7000,
  SCAVENGER_INCOME: 20,

  ZOMBIE_HP: 140,
  ZOMBIE_SPEED: 32,
  ZOMBIE_DAMAGE: 22,
  ZOMBIE_ATTACK_MS: 800,
  ZOMBIE_KILL_REWARD: 7,

  RUNNER_HP: 55,
  RUNNER_SPEED: 70,
  RUNNER_DAMAGE: 16,
  RUNNER_KILL_REWARD: 9,
  RUNNER_UNLOCK_MS: 25000,
  RUNNER_CHANCE: 0.3,

  WAVE_BASE_SPAWN_MS: 3800,
  WAVE_MIN_SPAWN_MS: 900,
  WAVE_RAMP_MS: 90000, // полная раскрутка к 90с
  HORDE_UNLOCK_MS: 60000, // после минуты — пачки
};

const COLOR = {
  BG: 0x121a14,
  CELL_LIGHT: 0x6d9a4e,
  CELL_DARK: 0x5a8240,
  CELL_HOVER: 0xf5e16a,
  SHOOTER_BODY: 0x3a6ea5,
  SHOOTER_HEAD: 0xf2c89a,
  SHOOTER_GUN: 0x2a2a2a,
  SCAV_BODY: 0xc97f3b,
  SCAV_HEAD: 0xf2c89a,
  ZOMBIE_BODY: 0x4f7d3a,
  ZOMBIE_DARK: 0x33531e,
  ZOMBIE_EYE: 0xff3030,
  BULLET: 0xfff066,
};

// ---------------------------------------------------------------
// BootScene — генерируем все текстуры один раз.
// ---------------------------------------------------------------
class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    const g = this.make.graphics({ add: false });

    // Светлая клетка газона
    g.fillStyle(COLOR.CELL_LIGHT);
    g.fillRect(0, 0, C.CELL, C.CELL);
    g.lineStyle(2, 0x3d5e2a, 0.6);
    g.strokeRect(1, 1, C.CELL - 2, C.CELL - 2);
    g.generateTexture("cell-light", C.CELL, C.CELL);
    g.clear();

    // Тёмная клетка (шахматка)
    g.fillStyle(COLOR.CELL_DARK);
    g.fillRect(0, 0, C.CELL, C.CELL);
    g.lineStyle(2, 0x3d5e2a, 0.6);
    g.strokeRect(1, 1, C.CELL - 2, C.CELL - 2);
    g.generateTexture("cell-dark", C.CELL, C.CELL);
    g.clear();

    // Подсветка клетки при наведении
    g.fillStyle(COLOR.CELL_HOVER, 0.25);
    g.fillRect(0, 0, C.CELL, C.CELL);
    g.lineStyle(3, COLOR.CELL_HOVER, 0.9);
    g.strokeRect(2, 2, C.CELL - 4, C.CELL - 4);
    g.generateTexture("cell-hover", C.CELL, C.CELL);
    g.clear();

    // Стрелок: тело + голова + ствол справа
    const sx = 90,
      sy = 80;
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(sx / 2, sy - 8, 50, 12); // тень
    g.fillStyle(COLOR.SHOOTER_BODY);
    g.fillCircle(sx / 2, sy / 2, 28);
    g.lineStyle(2, 0x1f3a5a);
    g.strokeCircle(sx / 2, sy / 2, 28);
    g.fillStyle(COLOR.SHOOTER_HEAD);
    g.fillCircle(sx / 2, sy / 2, 16);
    g.fillStyle(COLOR.SHOOTER_GUN);
    g.fillRect(sx / 2 + 6, sy / 2 - 5, 36, 10);
    g.lineStyle(2, 0x000000);
    g.strokeRect(sx / 2 + 6, sy / 2 - 5, 36, 10);
    g.generateTexture("shooter", sx, sy);
    g.clear();

    // Скавенджер (генератор ресурсов): фигура с ящиком/деталями
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(40, 72, 50, 12);
    g.fillStyle(COLOR.SCAV_BODY);
    g.fillCircle(40, 40, 28);
    g.lineStyle(2, 0x6f4416);
    g.strokeCircle(40, 40, 28);
    g.fillStyle(COLOR.SCAV_HEAD);
    g.fillCircle(40, 40, 16);
    g.fillStyle(0xc0c0c0);
    g.fillRect(58, 30, 14, 22);
    g.lineStyle(1, 0x666666);
    g.strokeRect(58, 30, 14, 22);
    g.generateTexture("scavenger", 80, 80);
    g.clear();

    // Зомби обычный
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(35, 65, 44, 10);
    g.fillStyle(COLOR.ZOMBIE_BODY);
    g.fillCircle(35, 35, 26);
    g.lineStyle(2, COLOR.ZOMBIE_DARK);
    g.strokeCircle(35, 35, 26);
    // глаза светятся красным
    g.fillStyle(COLOR.ZOMBIE_EYE);
    g.fillCircle(27, 30, 4);
    g.fillCircle(43, 30, 4);
    // рот
    g.lineStyle(2, COLOR.ZOMBIE_DARK);
    g.beginPath();
    g.moveTo(26, 44);
    g.lineTo(44, 44);
    g.strokePath();
    g.generateTexture("zombie", 70, 70);
    g.clear();

    // Бегун: меньше, светлее, жёлтые глаза
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(28, 54, 36, 8);
    g.fillStyle(0x9ab86a);
    g.fillCircle(28, 28, 20);
    g.lineStyle(2, 0x4d6926);
    g.strokeCircle(28, 28, 20);
    g.fillStyle(0xffe14a);
    g.fillCircle(22, 24, 3);
    g.fillCircle(34, 24, 3);
    g.lineStyle(2, 0x4d6926);
    g.beginPath();
    g.moveTo(22, 35);
    g.lineTo(34, 35);
    g.strokePath();
    g.generateTexture("zombie-runner", 56, 56);
    g.clear();

    // Пуля
    g.fillStyle(COLOR.BULLET);
    g.fillCircle(7, 4, 4);
    g.fillCircle(4, 4, 4);
    g.lineStyle(1, 0xc09020);
    g.strokeCircle(7, 4, 4);
    g.generateTexture("bullet", 14, 8);
    g.clear();

    // Иконка скрапа (для UI)
    g.fillStyle(0xc0c0c0);
    g.fillCircle(12, 12, 11);
    g.lineStyle(2, 0x808080);
    g.strokeCircle(12, 12, 11);
    g.fillStyle(0x808080);
    g.fillRect(8, 10, 8, 4);
    g.generateTexture("scrap-icon", 24, 24);
    g.clear();

    g.destroy();
  }

  create() {
    this.scene.start("game");
  }
}

// ---------------------------------------------------------------
// GameScene — основной геймплей.
// ---------------------------------------------------------------
class GameScene extends Phaser.Scene {
  constructor() {
    super("game");
  }

  create() {
    // Фон
    this.add.rectangle(0, 0, C.W, C.H, COLOR.BG).setOrigin(0);

    // Сетка клеток
    this.cellMap = []; // [row][col] -> sprite или null
    this.hoverHighlights = [];
    for (let r = 0; r < C.ROWS; r++) {
      this.cellMap.push([]);
      for (let c = 0; c < C.COLS; c++) {
        const tex = (r + c) % 2 === 0 ? "cell-light" : "cell-dark";
        const x = C.GRID_X + c * C.CELL;
        const y = C.GRID_Y + r * C.CELL;
        const cell = this.add.image(x, y, tex).setOrigin(0).setInteractive();
        cell.on("pointerdown", () => this.onCellClick(r, c));
        cell.on("pointerover", () => this.showHover(r, c, true));
        cell.on("pointerout", () => this.showHover(r, c, false));
        this.cellMap[r].push(null);
      }
    }
    // Слой подсветки
    this.hoverImage = this.add
      .image(0, 0, "cell-hover")
      .setOrigin(0)
      .setVisible(false);

    // Группы (без физики, считаем сами — проще и предсказуемее)
    this.shooters = [];
    this.scavengers = [];
    this.zombies = [];
    this.bullets = [];

    // Игровое состояние
    this.scrap = C.STARTING_SCRAP;
    this.selectedUnit = "shooter";
    this.gameOver = false;
    this.kills = 0;
    this.startTime = this.time.now;

    // UI вверху
    this.drawHUD();

    // Нижняя панель выбора юнитов
    this.drawUnitBar();

    // Тики экономики/спавна
    this.time.addEvent({
      delay: C.PASSIVE_SCRAP_MS,
      loop: true,
      callback: () => this.addScrap(C.PASSIVE_SCRAP),
    });
    this.scheduleNextSpawn();

    // Клавиши
    this.input.keyboard.on("keydown-ONE", () => this.selectUnit("shooter"));
    this.input.keyboard.on("keydown-TWO", () => this.selectUnit("scavenger"));
    this.input.keyboard.on("keydown-R", () => this.scene.restart());
  }

  // -------------------- UI --------------------

  drawHUD() {
    this.add.image(28, 28, "scrap-icon");
    this.scrapText = this.add.text(48, 16, "100", {
      fontSize: "26px",
      fontStyle: "bold",
      color: "#ffe680",
    });
    this.waveText = this.add.text(180, 18, "Время: 0с", {
      fontSize: "20px",
      color: "#ddd",
    });
    this.killsText = this.add.text(360, 18, "Убито: 0", {
      fontSize: "20px",
      color: "#ddd",
    });
    this.add
      .text(C.W - 20, 12, `v${C.VERSION}`, {
        fontSize: "18px",
        fontStyle: "bold",
        color: "#6cf",
      })
      .setOrigin(1, 0);
    this.add
      .text(C.W - 20, 38, "1 / 2 — выбрать юнит   |   R — рестарт", {
        fontSize: "13px",
        color: "#888",
      })
      .setOrigin(1, 0);
  }

  drawUnitBar() {
    const barY = C.H - 60;
    this.add
      .rectangle(0, barY - 10, C.W, 80, 0x000000, 0.45)
      .setOrigin(0);

    this.unitButtons = {};
    const items = [
      { key: "shooter", label: "Стрелок", cost: C.SHOOTER_COST, hotkey: "1" },
      {
        key: "scavenger",
        label: "Сборщик",
        cost: C.SCAVENGER_COST,
        hotkey: "2",
      },
    ];
    items.forEach((item, i) => {
      const x = 30 + i * 200;
      const bg = this.add
        .rectangle(x, barY, 180, 64, 0x1f2a1a)
        .setOrigin(0)
        .setStrokeStyle(2, 0x55aa55)
        .setInteractive();
      bg.on("pointerdown", () => this.selectUnit(item.key));
      const icon = this.add.image(x + 32, barY + 32, item.key);
      const txt = this.add.text(
        x + 70,
        barY + 8,
        `${item.label}\n${item.cost} скрапа\n[${item.hotkey}]`,
        { fontSize: "13px", color: "#fff", lineSpacing: 2 }
      );
      this.unitButtons[item.key] = { bg, icon, txt, cost: item.cost };
    });
    this.refreshUnitBar();
  }

  refreshUnitBar() {
    Object.entries(this.unitButtons).forEach(([key, b]) => {
      const selected = key === this.selectedUnit;
      const affordable = this.scrap >= b.cost;
      b.bg.setStrokeStyle(
        selected ? 4 : 2,
        selected ? 0xffe680 : affordable ? 0x55aa55 : 0x884444
      );
      b.bg.fillColor = affordable ? 0x1f2a1a : 0x2a1a1a;
      b.icon.setAlpha(affordable ? 1 : 0.5);
      b.txt.setAlpha(affordable ? 1 : 0.6);
    });
  }

  selectUnit(key) {
    this.selectedUnit = key;
    this.refreshUnitBar();
  }

  showHover(r, c, on) {
    if (!on || this.gameOver) {
      this.hoverImage.setVisible(false);
      return;
    }
    this.hoverImage
      .setPosition(C.GRID_X + c * C.CELL, C.GRID_Y + r * C.CELL)
      .setVisible(true);
  }

  // -------------------- Размещение юнитов --------------------

  onCellClick(r, c) {
    if (this.gameOver) return;
    if (this.cellMap[r][c]) return;
    const cost = this.selectedUnit === "shooter" ? C.SHOOTER_COST : C.SCAVENGER_COST;
    if (this.scrap < cost) {
      this.flashText("Недостаточно скрапа!");
      return;
    }
    this.scrap -= cost;

    const x = C.GRID_X + c * C.CELL + C.CELL / 2;
    const y = C.GRID_Y + r * C.CELL + C.CELL / 2;
    if (this.selectedUnit === "shooter") {
      const s = this.add.image(x, y, "shooter");
      s.row = r;
      s.col = c;
      s.hp = C.SHOOTER_HP;
      s.maxHp = C.SHOOTER_HP;
      s.lastShot = 0;
      this.createHpBar(s, 50, 36);
      this.shooters.push(s);
      this.cellMap[r][c] = s;
    } else {
      const s = this.add.image(x, y, "scavenger");
      s.row = r;
      s.col = c;
      s.hp = C.SCAVENGER_HP;
      s.maxHp = C.SCAVENGER_HP;
      s.lastTick = this.time.now;
      this.createHpBar(s, 50, 36);
      this.scavengers.push(s);
      this.cellMap[r][c] = s;
    }
    this.updateUI();
  }

  // -------------------- Зомби --------------------

  scheduleNextSpawn() {
    if (this.gameOver) return;
    const elapsed = this.time.now - this.startTime;
    const ratio = Math.min(1, elapsed / C.WAVE_RAMP_MS);
    const delay = Phaser.Math.Linear(
      C.WAVE_BASE_SPAWN_MS,
      C.WAVE_MIN_SPAWN_MS,
      ratio
    );
    this.time.delayedCall(delay, () => {
      this.spawnTick();
      this.scheduleNextSpawn();
    });
  }

  spawnTick() {
    if (this.gameOver) return;
    const elapsed = this.time.now - this.startTime;
    // Размер пачки растёт со временем.
    let count = 1;
    if (elapsed > C.HORDE_UNLOCK_MS && Math.random() < 0.35) count = 2;
    if (elapsed > C.HORDE_UNLOCK_MS * 2 && Math.random() < 0.25) count = 3;
    const usedRows = new Set();
    for (let i = 0; i < count; i++) {
      let r;
      let attempts = 0;
      do {
        r = Phaser.Math.Between(0, C.ROWS - 1);
        attempts++;
      } while (usedRows.has(r) && attempts < 8);
      usedRows.add(r);
      this.spawnZombie(r, elapsed);
    }
  }

  spawnZombie(row, elapsed) {
    const isRunner =
      elapsed > C.RUNNER_UNLOCK_MS && Math.random() < C.RUNNER_CHANCE;
    const tex = isRunner ? "zombie-runner" : "zombie";
    const x = C.GRID_X + C.COLS * C.CELL + 40;
    const y = C.GRID_Y + row * C.CELL + C.CELL / 2;
    const z = this.add.image(x, y, tex);
    z.row = row;
    z.kind = isRunner ? "runner" : "normal";
    z.hp = isRunner ? C.RUNNER_HP : C.ZOMBIE_HP;
    z.maxHp = z.hp;
    z.speed = isRunner ? C.RUNNER_SPEED : C.ZOMBIE_SPEED;
    z.damage = isRunner ? C.RUNNER_DAMAGE : C.ZOMBIE_DAMAGE;
    z.reward = isRunner ? C.RUNNER_KILL_REWARD : C.ZOMBIE_KILL_REWARD;
    z.lastAttack = 0;
    z.eatingTarget = null;
    this.createHpBar(z, isRunner ? 36 : 50, isRunner ? 24 : 30);
    this.zombies.push(z);
  }

  // -------------------- Цикл --------------------

  update(time, delta) {
    if (this.gameOver) return;

    // Стрелки стреляют, если в их ряду есть зомби справа.
    for (const s of this.shooters) {
      const target = this.zombies.find(
        (z) => z.row === s.row && z.x > s.x - 10 && z.x < C.W + 50
      );
      if (target && time - s.lastShot > C.SHOOTER_FIRE_MS) {
        s.lastShot = time;
        this.fireBullet(s);
      }
    }

    // Скавенджеры тикают.
    for (const sc of this.scavengers) {
      if (time - sc.lastTick > C.SCAVENGER_TICK_MS) {
        sc.lastTick = time;
        this.addScrap(C.SCAVENGER_INCOME);
        this.spawnFloatText(sc.x, sc.y - 30, `+${C.SCAVENGER_INCOME}`, "#ffe680");
      }
    }

    // Пули летят и попадают.
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += (C.BULLET_SPEED * delta) / 1000;
      const hit = this.zombies.find(
        (z) => z.row === b.row && Math.abs(z.x - b.x) < 22
      );
      if (hit) {
        this.damageZombie(hit, C.BULLET_DAMAGE);
        b.destroy();
        this.bullets.splice(i, 1);
      } else if (b.x > C.W + 30) {
        b.destroy();
        this.bullets.splice(i, 1);
      }
    }

    // Зомби идут и кусают.
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      // Найти ближайшего юнита в этой строке слева от зомби, в пределах клетки
      const blocker = this.findBlocker(z);
      if (blocker) {
        z.eatingTarget = blocker;
        if (time - z.lastAttack > C.ZOMBIE_ATTACK_MS) {
          z.lastAttack = time;
          blocker.hp -= z.damage;
          this.updateHpBar(blocker);
          this.flashTint(blocker, 0xff5555);
          if (blocker.hp <= 0) {
            this.cellMap[blocker.row][blocker.col] = null;
            this.removeFromList(this.shooters, blocker);
            this.removeFromList(this.scavengers, blocker);
            this.destroyHpBar(blocker);
            blocker.destroy();
            z.eatingTarget = null;
          }
        }
      } else {
        z.eatingTarget = null;
        z.x -= (z.speed * delta) / 1000;
      }
      this.updateHpBar(z);
      // Зомби пересёк левую границу — поражение.
      if (z.x < C.GRID_X - 10) {
        return this.endGame(false);
      }
    }

    // Обновить таймеры HUD.
    const sec = Math.floor((time - this.startTime) / 1000);
    this.waveText.setText(`Время: ${sec}с`);
  }

  findBlocker(z) {
    // Проверяем юниты в той же строке, чьи x-координаты пересекают z.
    const row = this.cellMap[z.row];
    for (const u of row) {
      if (u && Math.abs(u.x - z.x) < C.CELL * 0.55 && z.x >= u.x - 10) {
        return u;
      }
    }
    return null;
  }

  fireBullet(shooter) {
    const b = this.add.image(shooter.x + 35, shooter.y, "bullet");
    b.row = shooter.row;
    this.bullets.push(b);
  }

  damageZombie(z, dmg) {
    z.hp -= dmg;
    this.updateHpBar(z);
    this.flashTint(z, 0xffffff);
    if (z.hp <= 0) {
      this.removeFromList(this.zombies, z);
      this.spawnFloatText(z.x, z.y - 20, `+${z.reward}`, "#ffe680");
      this.addScrap(z.reward);
      this.kills++;
      this.killsText.setText("Убито: " + this.kills);
      this.destroyHpBar(z);
      z.destroy();
    }
  }

  createHpBar(obj, width, offsetY) {
    obj._hpW = width;
    obj._hpYOff = offsetY;
    obj._hpBg = this.add
      .rectangle(obj.x, obj.y + offsetY, width + 2, 6, 0x000000, 0.7)
      .setOrigin(0.5);
    obj._hpFg = this.add
      .rectangle(obj.x - width / 2, obj.y + offsetY, width, 4, 0x55cc55)
      .setOrigin(0, 0.5);
  }

  updateHpBar(obj) {
    if (!obj._hpFg) return;
    const ratio = Math.max(0, obj.hp / obj.maxHp);
    obj._hpBg.x = obj.x;
    obj._hpBg.y = obj.y + obj._hpYOff;
    obj._hpFg.x = obj.x - obj._hpW / 2;
    obj._hpFg.y = obj.y + obj._hpYOff;
    obj._hpFg.width = obj._hpW * ratio;
    obj._hpFg.fillColor =
      ratio > 0.5 ? 0x55cc55 : ratio > 0.25 ? 0xeeaa33 : 0xcc4444;
  }

  destroyHpBar(obj) {
    if (obj._hpBg) obj._hpBg.destroy();
    if (obj._hpFg) obj._hpFg.destroy();
    obj._hpBg = obj._hpFg = null;
  }

  // -------------------- Утилиты --------------------

  removeFromList(list, item) {
    const i = list.indexOf(item);
    if (i >= 0) list.splice(i, 1);
  }

  addScrap(n) {
    this.scrap += n;
    this.updateUI();
  }

  updateUI() {
    this.scrapText.setText(String(this.scrap));
    this.refreshUnitBar();
  }

  flashTint(obj, color) {
    obj.setTint(color);
    this.time.delayedCall(80, () => obj && obj.active && obj.clearTint());
  }

  flashText(msg) {
    const t = this.add
      .text(C.W / 2, C.H / 2 - 100, msg, {
        fontSize: "32px",
        color: "#ff8080",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: t,
      alpha: 0,
      y: t.y - 40,
      duration: 800,
      onComplete: () => t.destroy(),
    });
  }

  spawnFloatText(x, y, msg, color) {
    const t = this.add
      .text(x, y, msg, { fontSize: "16px", color, fontStyle: "bold" })
      .setOrigin(0.5);
    this.tweens.add({
      targets: t,
      y: y - 30,
      alpha: 0,
      duration: 700,
      onComplete: () => t.destroy(),
    });
  }

  endGame(won) {
    this.gameOver = true;
    const overlay = this.add
      .rectangle(0, 0, C.W, C.H, 0x000000, 0.6)
      .setOrigin(0);
    const title = this.add
      .text(C.W / 2, C.H / 2 - 30, won ? "Победа!" : "Орда прорвалась!", {
        fontSize: "64px",
        fontStyle: "bold",
        color: won ? "#ffe680" : "#ff6060",
      })
      .setOrigin(0.5);
    const sub = this.add
      .text(
        C.W / 2,
        C.H / 2 + 40,
        `Убито зомби: ${this.kills}\nНажмите R для рестарта`,
        { fontSize: "22px", color: "#fff", align: "center" }
      )
      .setOrigin(0.5);
  }
}

// ---------------------------------------------------------------
// Запуск
// ---------------------------------------------------------------
new Phaser.Game({
  type: Phaser.AUTO,
  width: C.W,
  height: C.H,
  parent: "game-container",
  backgroundColor: "#0d130c",
  scene: [BootScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});
