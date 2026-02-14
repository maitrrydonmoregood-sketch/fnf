/* ==========================
   ELEMENTOS DEL DOM
========================== */
const menu = document.getElementById("menu");
const game = document.getElementById("game");
const playBtn = document.getElementById("playBtn");
const volumeBtn = document.getElementById("volumeBtn");
const exitBtn = document.getElementById("exitBtn");
const backToMenu = document.getElementById("backToMenu");

const player = document.getElementById("player");
const enemy = document.getElementById("enemy");
const exit = document.getElementById("exit");
const energyBar = document.getElementById("energyBar");

/* ==========================
   VARIABLES DE JUEGO
========================== */
let px = -50, py = 200; // Empezamos afuera en la calle
let ex = 300, ey = 150; // Freddy dentro de la pizzería
const playerSize = 30, enemySize = 30;
const speed = 3, enemySpeed = 1.2;
let keys = {};
let energy = 100;
let gameRunning = false;
let rafId = null;

/* ==========================
   PAREDES / MAPA
========================== */
const walls = [
  { id:"wall1", x:0, y:0, w:600, h:20 },
  { id:"wall2", x:0, y:380, w:600, h:20 },
  { id:"wall3", x:0, y:0, w:20, h:400 },
  { id:"wall4", x:580, y:0, w:20, h:400 },
  // Puedes agregar paredes internas de la habitación aquí
];

/* ==========================
   EVENTOS DE TECLADO
========================== */
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

/* ==========================
   BOTONES
========================== */
playBtn.addEventListener("click", () => {
  menu.classList.add("hidden");
  game.classList.remove("hidden");
  setupWalls();
  resetGame();
  if(!gameRunning){ gameRunning = true; rafId = requestAnimationFrame(update); }
});

exitBtn.addEventListener("click", () => {
  alert("Para salir, cierra la pestaña del navegador.");
});

backToMenu.addEventListener("click", () => {
  stopGame();
  game.classList.add("hidden");
  menu.classList.remove("hidden");
  resetGame();
});

volumeBtn.addEventListener("click", () => {
  volumeBtn.textContent = volumeBtn.textContent === "Volumen: ON" ? "Volumen: OFF" : "Volumen: ON";
});

/* ==========================
   FUNCIONES PRINCIPALES
========================== */
function setupWalls(){
  walls.forEach(w=>{
    const el = document.getElementById(w.id);
    if(el){
      el.style.left = w.x + "px";
      el.style.top = w.y + "px";
      el.style.width = w.w + "px";
      el.style.height = w.h + "px";
    }
  });

  // Salida dentro de la habitación
  exit.style.left = "520px";
  exit.style.top = "180px";
}

/* ==========================
   COLISIÓN
========================== */
function collides(x,y,w,h,wall){
  return x < wall.x+wall.w && x+w > wall.x && y < wall.y+wall.h && y+h > wall.y;
}

/* ==========================
   UPDATE LOOP
========================== */
function update(){
  if(!gameRunning) return;

  const oldX = px;
  const oldY = py;

  // Movimiento jugador
  if(keys["w"]) py -= speed;
  if(keys["s"]) py += speed;
  if(keys["a"]) px -= speed;
  if(keys["d"]) px += speed;

  // Revisar colisiones con paredes
  walls.forEach(w => {
    if(collides(px, py, playerSize, playerSize, w)){
      px = oldX;
      py = oldY;
    }
  });

  // Actualizar posición jugador
  player.style.left = px + "px";
  player.style.top = py + "px";

  // Movimiento enemigo (Freddy simple: sigue al jugador dentro de la habitación)
  let dx = px - ex;
  let dy = py - ey;
  let dist = Math.sqrt(dx*dx + dy*dy);
  if(dist > 1 && px>0){ // Freddy solo entra cuando jugador está dentro
    ex += (dx/dist) * enemySpeed;
    ey += (dy/dist) * enemySpeed;
  }

  enemy.style.left = ex + "px";
  enemy.style.top = ey + "px";

  // Colisión jugador-enemigo
  if(Math.abs(px-ex)<30 && Math.abs(py-ey)<30 && px>0){
    alert("¡Game Over! Freddy te atrapó.");
    backToMenu.click();
    return;
  }

  // Salida
  if(Math.abs(px-520)<40 && Math.abs(py-180)<40){
    alert("¡Ganaste! Llegaste a la salida.");
    backToMenu.click();
    return;
  }

  // Energía
  energy -= 0.02;
  if(energy<0) energy=0;
  energyBar.style.width = energy+"%";

  // Luz tipo cono pequeña
  const gameEl = document.getElementById("game");
  gameEl.style.setProperty("--lightX", px+playerSize/2+"px");
  gameEl.style.setProperty("--lightY", py+playerSize/2+"px");
  gameEl.style.setProperty("--lightRadius","100px"); // luz pequeña

  rafId = requestAnimationFrame(update);
}

/* ==========================
   CONTROL DE LOOP
========================== */
function stopGame(){
  gameRunning=false;
  if(rafId) cancelAnimationFrame(rafId);
  rafId = null;
  keys = {};
}

/* ==========================
   REINICIO
========================== */
function resetGame(){
  px = -50; py = 200; // empezamos afuera
  ex = 300; ey = 150; // Freddy adentro
  energy = 100;
  player.style.left = px + "px";
  player.style.top = py + "px";
  enemy.style.left = ex + "px";
  enemy.style.top = ey + "px";
  energyBar.style.width = energy+"%";
}
