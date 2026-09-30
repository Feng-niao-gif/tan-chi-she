const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const startBtn = document.getElementById("start-btn");

const GRID = 20;
const COLS = canvas.width / GRID;
const ROWS = canvas.height / GRID;
const TICK_MS = 120;
const HIGH_SCORE_KEY = "snake-high-score";

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

let snake;
let dir;
let queuedDir;
let food;
let score;
let running = false;
let paused = false;
let timer = null;

function loadHighScore() {
  return Number(localStorage.getItem(HIGH_SCORE_KEY) || 0);
}

function saveHighScore(value) {
  localStorage.setItem(HIGH_SCORE_KEY, String(value));
}

function resetGame() {
  const startX = Math.floor(COLS / 2);
  const startY = Math.floor(ROWS / 2);
  snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];
  dir = DIRS.right;
  queuedDir = dir;
  score = 0;
  scoreEl.textContent = "0";
  highScoreEl.textContent = String(loadHighScore());
  placeFood();
}

function placeFood() {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  let x;
  let y;
  do {
    x = Math.floor(Math.random() * COLS);
    y = Math.floor(Math.random() * ROWS);
  } while (occupied.has(`${x},${y}`));
  food = { x, y };
}

function opposite(a, b) {
  return a.x + b.x === 0 && a.y + b.y === 0;
}

function setDirection(next) {
  if (!opposite(next, dir)) {
    queuedDir = next;
  }
}

function tick() {
  if (!running || paused) return;

  dir = queuedDir;
  const head = snake[0];
  const next = { x: head.x + dir.x, y: head.y + dir.y };

  const hitWall = next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS;
  const hitSelf = snake.some((p) => p.x === next.x && p.y === next.y);

  if (hitWall || hitSelf) {
    gameOver();
    return;
  }

  snake.unshift(next);

  if (next.x === food.x && next.y === food.y) {
    score += 10;
    scoreEl.textContent = String(score);
    const high = loadHighScore();
    if (score > high) {
      saveHighScore(score);
      highScoreEl.textContent = String(score);
    }
    placeFood();
  } else {
    snake.pop();
  }

  draw();
}

function drawCell(x, y, color, radius = 6) {
  ctx.fillStyle = color;
  const px = x * GRID;
  const py = y * GRID;
  ctx.beginPath();
  ctx.roundRect(px + 2, py + 2, GRID - 4, GRID - 4, radius);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCell(food.x, food.y, "#f43f5e", 10);

  snake.forEach((part, i) => {
    const color = i === 0 ? "#4ade80" : "#22c55e";
    drawCell(part.x, part.y, color, i === 0 ? 8 : 5);
  });
}

function start() {
  resetGame();
  running = true;
  paused = false;
  overlay.classList.add("hidden");
  draw();
  clearInterval(timer);
  timer = setInterval(tick, TICK_MS);
}

function pause() {
  if (!running) return;
  paused = !paused;
  if (paused) {
    overlayTitle.textContent = "已暂停";
    startBtn.textContent = "继续";
    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
  }
}

function gameOver() {
  running = false;
  paused = false;
  clearInterval(timer);
  overlayTitle.textContent = `游戏结束 · ${score} 分`;
  startBtn.textContent = "再来一局";
  overlay.classList.remove("hidden");
}

function handleKey(event) {
  const map = {
    ArrowUp: DIRS.up,
    ArrowDown: DIRS.down,
    ArrowLeft: DIRS.left,
    ArrowRight: DIRS.right,
    w: DIRS.up,
    s: DIRS.down,
    a: DIRS.left,
    d: DIRS.right,
    W: DIRS.up,
    S: DIRS.down,
    A: DIRS.left,
    D: DIRS.right,
  };

  if (event.key === " " || event.code === "Space") {
    event.preventDefault();
    if (!running) start();
    else pause();
    return;
  }

  const next = map[event.key];
  if (next) {
    event.preventDefault();
    if (!running) start();
    setDirection(next);
  }
}

startBtn.addEventListener("click", () => {
  if (running && paused) {
    pause();
    return;
  }
  start();
});

document.addEventListener("keydown", handleKey);

document.querySelectorAll(".dpad button").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!running) start();
    setDirection(DIRS[btn.dataset.dir]);
  });
});

resetGame();
draw();
