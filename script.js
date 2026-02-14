const menu = document.getElementById("menu");
const game = document.getElementById("game");
const world = document.getElementById("world");
const playBtn = document.getElementById("playBtn");
const volumeBtn = document.getElementById("volumeBtn");
const exitBtn = document.getElementById("exitBtn");
const backToMenu = document.getElementById("backToMenu");

const playerEl = document.getElementById("player");
const enemyEl = document.getElementById("enemy");
const goalEl = document.getElementById("goal");
const doorEl = document.getElementById("door");
const lightCanvas = document.getElementById("lightCanvas");
const ctx = lightCanvas.getContext("2d");

const energyBar = document.getElementById("energyBar");
const clockText = document.getElementById("clockText");
const nightText = document.getElementById("nightText");
const toggleDoorBtn = document.getElementById("toggleDoorBtn");
const toggleLightBtn = document.getElementById("toggleLightBtn");

const cameraScreen = document.getElementById("cameraScreen");
const cameraText = document.getElementById("cameraText");
const cam1Btn = document.getElementById("cam1Btn");
const cam2Btn = document.getElementById("cam2Btn");
const closeCamBtn = document.getElementById("closeCamBtn");

const level = {
  width: 1600,
  height: 900,
  walls: [
    { id: "wall1", x: 0, y: 0, w: 1600, h: 25 },
    { id: "wall2", x: 0, y: 875, w: 1600, h: 25 },
    { id: "wall3", x: 0, y: 0, w: 25, h: 900 },
    { id: "wall4", x: 1575, y: 0, w: 25, h: 900 },
    { id: "wall5", x: 450, y: 120, w: 24, h: 620 },
    { id: "wall6", x: 850, y: 140, w: 24, h: 640 },
    { id: "wall7", x: 1160, y: 40, w: 24, h: 560 },
    { id: "wall8", x: 260, y: 600, w: 760, h: 24 }
  ],
  stairs: [
    { id: "stairsA", x: 1320, y: 90, w: 120, h: 42, toFloor: 2 },
    { id: "stairsB", x: 90, y: 720, w: 120, h: 42, toFloor: 3 }
  ],
  goal: { x: 1390, y: 700, w: 140, h: 80 },
  door: { x: 1340, y: 640, w: 24, h: 120 }
};

const keys = {};
const player = { x: 150, y: 200, size: 24, speed: 3.1, floor: 1 };
const enemy = { x: 1050, y: 200, size: 24, speed: 2, mode: "patrol", target: null, floor: 1, timer: 0 };

const patrolPoints = [
  { x: 100, y: 100, floor: 1 },
  { x: 720, y: 140, floor: 1 },
  { x: 980, y: 500, floor: 1 },
  { x: 1320, y: 220, floor: 2 },
  { x: 220, y: 760, floor: 3 }
];

const state = {
  running: false,
  raf: null,
  energy: 100,
  night: 1,
  hour: 0,
  minuteTicks: 0,
  gameMs: 0,
  doorClosed: false,
  lightBoost: false,
  camerasOpen: false,
  volumeOn: true
};

const WORLD_SECONDS_PER_HOUR = 30;

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;

  if (k === "c") toggleCameras();
  if (k === "1") player.floor = 1;
  if (k === "2") player.floor = 2;
  if (k === "3") player.floor = 3;
});
window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

playBtn.addEventListener("click", startGame);
backToMenu.addEventListener("click", backMenu);
volumeBtn.addEventListener("click", () => {
  state.volumeOn = !state.volumeOn;
  volumeBtn.textContent = `Volumen: ${state.volumeOn ? "ON" : "OFF"}`;
});
exitBtn.addEventListener("click", () => {
  window.close();
  if (!window.closed) {
    window.location.replace("about:blank");
  }
});

cam1Btn.addEventListener("click", () => (cameraText.textContent = "Cámara 1 - Comedor"));
cam2Btn.addEventListener("click", () => (cameraText.textContent = "Cámara 2 - Pasillo Este"));
closeCamBtn.addEventListener("click", toggleCameras);

toggleDoorBtn.addEventListener("click", () => {
  state.doorClosed = !state.doorClosed;
  toggleDoorBtn.textContent = `Puerta: ${state.doorClosed ? "CERRADA" : "ABIERTA"}`;
});
toggleLightBtn.addEventListener("click", () => {
  state.lightBoost = !state.lightBoost;
  toggleLightBtn.textContent = `Luz: ${state.lightBoost ? "ON" : "OFF"}`;
});

function startGame() {
  menu.classList.add("hidden");
  game.classList.remove("hidden");
  resizeCanvas();
  paintMapObjects();
  resetMatch();
  if (!state.running) {
    state.running = true;
    state.raf = requestAnimationFrame(loop);
  }
}

function backMenu() {
  stopGame();
  game.classList.add("hidden");
  menu.classList.remove("hidden");
}

function stopGame() {
  state.running = false;
  if (state.raf) cancelAnimationFrame(state.raf);
  state.raf = null;
  state.camerasOpen = false;
  cameraScreen.classList.add("hidden");
}

function resetMatch() {
  state.energy = 100;
  state.hour = 0;
  state.minuteTicks = 0;
  state.gameMs = 0;
  state.doorClosed = false;
  state.lightBoost = false;
  player.x = 150; player.y = 200; player.floor = 1;
  enemy.x = 1050; enemy.y = 200; enemy.floor = 1; enemy.mode = "patrol"; enemy.target = patrolPoints[0];
  updateHUD();
}

function loop() {
  if (!state.running) return;

  updatePlayer();
  updateEnemy();
  updateProgress();
  drawLighting();
  renderEntities();

  if (checkEnemyHit()) {
    alert("¡Game Over! El animatrónico te encontró.");
    backMenu();
    return;
  }

  if (inside(player, level.goal)) {
    alert("¡Sobreviviste y llegaste a la oficina segura!");
    backMenu();
    return;
  }

  state.raf = requestAnimationFrame(loop);
}

function updatePlayer() {
  if (state.camerasOpen) return;

  const oldX = player.x;
  const oldY = player.y;

  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  for (const wall of activeWalls()) {
    if (collides(player.x, player.y, player.size, player.size, wall)) {
      player.x = oldX;
      player.y = oldY;
      break;
    }
  }

  player.x = clamp(player.x, 30, level.width - player.size - 30);
  player.y = clamp(player.y, 30, level.height - player.size - 30);

  for (const stair of level.stairs) {
    if (inside(player, stair) && keys["e"]) {
      player.floor = stair.toFloor;
    }
  }
}

function updateEnemy() {
  const sameFloor = enemy.floor === player.floor;
  const visionDist = distance(player.x, player.y, enemy.x, enemy.y);

  if (sameFloor && visionDist < 230 && hasLineOfSight(enemy.x, enemy.y, player.x, player.y)) {
    enemy.mode = "chase";
    enemy.target = { x: player.x, y: player.y, floor: player.floor };
  } else if (enemy.mode === "chase" && visionDist > 300) {
    enemy.mode = Math.random() < 0.5 ? "investigate" : "patrol";
    enemy.target = randomInterestPoint();
  }

  if (!enemy.target || distance(enemy.x, enemy.y, enemy.target.x, enemy.target.y) < 10) {
    enemy.timer += 1;
    if (enemy.timer > 45) {
      enemy.timer = 0;
      enemy.target = enemy.mode === "patrol" ? randomPatrolPoint() : randomInterestPoint();
      enemy.floor = enemy.target.floor;
      if (Math.random() < 0.2) enemy.mode = "patrol";
    }
  }

  if (!enemy.target) return;

  const dx = enemy.target.x - enemy.x;
  const dy = enemy.target.y - enemy.y;
  const d = Math.max(Math.hypot(dx, dy), 1);
  const speedBoost = state.hour >= 3 ? 0.6 : 0;
  enemy.x += (dx / d) * (enemy.speed + speedBoost);
  enemy.y += (dy / d) * (enemy.speed + speedBoost);

  if (state.doorClosed && collides(enemy.x, enemy.y, enemy.size, enemy.size, level.door)) {
    enemy.x -= (dx / d) * 6;
    enemy.y -= (dy / d) * 6;
  }
}

function updateProgress() {
  state.gameMs += 16;
  const worldHours = Math.floor(state.gameMs / (WORLD_SECONDS_PER_HOUR * 1000));
  state.hour = clamp(worldHours, 0, 6);

  const baseDrain = 0.02;
  const cameraDrain = state.camerasOpen ? 0.08 : 0;
  const lightDrain = state.lightBoost ? 0.06 : 0;
  const doorDrain = state.doorClosed ? 0.04 : 0;

  state.energy = Math.max(0, state.energy - (baseDrain + cameraDrain + lightDrain + doorDrain));
  updateHUD();

  if (state.hour >= 6) {
    alert("¡6:00 AM! Sobreviviste la noche.");
    state.night += 1;
    resetMatch();
  }

  if (state.energy <= 0) {
    state.camerasOpen = false;
    state.doorClosed = false;
    state.lightBoost = false;
    cameraScreen.classList.add("hidden");
    toggleDoorBtn.textContent = "Puerta: ABIERTA";
    toggleLightBtn.textContent = "Luz: OFF";
  }
}

function drawLighting() {
  resizeCanvas();
  const sx = lightCanvas.width / level.width;
  const sy = lightCanvas.height / level.height;

  const px = (player.x + player.size / 2) * sx;
  const py = (player.y + player.size / 2) * sy;
  const radius = state.lightBoost ? 175 : 115;

  ctx.clearRect(0, 0, lightCanvas.width, lightCanvas.height);
  ctx.fillStyle = "rgba(0,0,0,0.93)";
  ctx.fillRect(0, 0, lightCanvas.width, lightCanvas.height);

  const points = castVisibilityPolygon(px, py, radius, sx, sy);
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.moveTo(px, py);
  points.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
}

function castVisibilityPolygon(px, py, radius, sx, sy) {
  const segments = [];
  for (const w of activeWalls()) {
    const x = w.x * sx;
    const y = w.y * sy;
    const ww = w.w * sx;
    const wh = w.h * sy;

    segments.push([[x, y], [x + ww, y]]);
    segments.push([[x + ww, y], [x + ww, y + wh]]);
    segments.push([[x + ww, y + wh], [x, y + wh]]);
    segments.push([[x, y + wh], [x, y]]);
  }

  const points = [];
  for (let a = 0; a < Math.PI * 2; a += 0.03) {
    const rayEnd = { x: px + Math.cos(a) * radius, y: py + Math.sin(a) * radius };
    let closest = rayEnd;
    let minDist = radius;

    for (const seg of segments) {
      const hit = segmentIntersection(px, py, rayEnd.x, rayEnd.y, seg[0][0], seg[0][1], seg[1][0], seg[1][1]);
      if (hit) {
        const d = distance(px, py, hit.x, hit.y);
        if (d < minDist) {
          minDist = d;
          closest = hit;
        }
      }
    }
    points.push(closest);
  }
  return points;
}

function segmentIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
  const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (den === 0) return null;

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    };
  }
  return null;
}

function hasLineOfSight(ax, ay, bx, by) {
  for (const w of activeWalls()) {
    const lines = [
      [w.x, w.y, w.x + w.w, w.y],
      [w.x + w.w, w.y, w.x + w.w, w.y + w.h],
      [w.x + w.w, w.y + w.h, w.x, w.y + w.h],
      [w.x, w.y + w.h, w.x, w.y]
    ];
    for (const line of lines) {
      if (segmentIntersection(ax, ay, bx, by, ...line)) return false;
    }
  }
  return true;
}

function renderEntities() {
  playerEl.style.left = `${player.x}px`;
  playerEl.style.top = `${player.y}px`;
  enemyEl.style.left = `${enemy.x}px`;
  enemyEl.style.top = `${enemy.y}px`;

  enemyEl.style.opacity = enemy.floor === player.floor ? "1" : "0.35";
  goalEl.style.opacity = player.floor === 1 ? "1" : "0.3";

  const floorTint = ["1", "0.85", "0.7"][player.floor - 1] || "1";
  world.style.filter = `brightness(${floorTint})`;
}

function updateHUD() {
  energyBar.style.width = `${state.energy}%`;
  nightText.textContent = `Noche ${state.night} | Piso ${player.floor}`;
  clockText.textContent = `${12 + state.hour}:00 AM`;
}

function paintMapObjects() {
  for (const wall of level.walls) {
    const el = document.getElementById(wall.id);
    if (!el) continue;
    el.style.left = `${wall.x}px`;
    el.style.top = `${wall.y}px`;
    el.style.width = `${wall.w}px`;
    el.style.height = `${wall.h}px`;
  }

  for (const stair of level.stairs) {
    const el = document.getElementById(stair.id);
    if (!el) continue;
    el.style.left = `${stair.x}px`;
    el.style.top = `${stair.y}px`;
    el.style.width = `${stair.w}px`;
    el.style.height = `${stair.h}px`;
  }

  goalEl.style.left = `${level.goal.x}px`;
  goalEl.style.top = `${level.goal.y}px`;
  goalEl.style.width = `${level.goal.w}px`;
  goalEl.style.height = `${level.goal.h}px`;

  doorEl.style.left = `${level.door.x}px`;
  doorEl.style.top = `${level.door.y}px`;
  doorEl.style.width = `${level.door.w}px`;
  doorEl.style.height = `${level.door.h}px`;
}

function toggleCameras() {
  if (state.energy <= 0 || !state.running) return;
  state.camerasOpen = !state.camerasOpen;
  cameraScreen.classList.toggle("hidden", !state.camerasOpen);
}

function checkEnemyHit() {
  return enemy.floor === player.floor && collides(player.x, player.y, player.size, player.size, {
    x: enemy.x,
    y: enemy.y,
    w: enemy.size,
    h: enemy.size
  });
}

function activeWalls() {
  if (!state.doorClosed) return level.walls;
  return [...level.walls, level.door];
}

function collides(x, y, w, h, r) {
  return x < r.x + r.w && x + w > r.x && y < r.y + r.h && y + h > r.y;
}

function inside(a, box) {
  return a.x + a.size / 2 >= box.x && a.x + a.size / 2 <= box.x + box.w &&
    a.y + a.size / 2 >= box.y && a.y + a.size / 2 <= box.y + box.h;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function randomPatrolPoint() {
  return patrolPoints[Math.floor(Math.random() * patrolPoints.length)];
}

function randomInterestPoint() {
  const pool = [
    { x: player.x + (Math.random() * 180 - 90), y: player.y + (Math.random() * 180 - 90), floor: player.floor },
    { x: 1400, y: 150, floor: 2 },
    { x: 350, y: 760, floor: 3 },
    randomPatrolPoint()
  ];
  const point = pool[Math.floor(Math.random() * pool.length)];
  point.x = clamp(point.x, 40, level.width - 40);
  point.y = clamp(point.y, 40, level.height - 40);
  return point;
}

function resizeCanvas() {
  const gameRect = game.getBoundingClientRect();
  const scale = Math.min(gameRect.width / level.width, gameRect.height / level.height);
  world.style.transform = `scale(${scale})`;

  const offsetX = (gameRect.width - level.width * scale) / 2;
  const offsetY = (gameRect.height - level.height * scale) / 2;
  world.style.left = `${offsetX}px`;
  world.style.top = `${offsetY}px`;

  const rect = world.getBoundingClientRect();
  if (lightCanvas.width !== rect.width || lightCanvas.height !== rect.height) {
    lightCanvas.width = rect.width;
    lightCanvas.height = rect.height;
  }
}

window.addEventListener("resize", resizeCanvas);
