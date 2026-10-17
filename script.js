"use strict";

let universeClickCount = 0;

const canvas = document.querySelector(".petal-canvas");
const context = canvas.getContext("2d");
const bouquetButton = document.querySelector("#bouquet-button");
const bouquetHint = document.querySelector("#bouquet-hint");
const calendarGrid = document.querySelector("#calendar-grid");
const calendarCard = document.querySelector(".calendar-card");
const envelopeButton = document.querySelector("#envelope-button");
const greetingCard = document.querySelector("#greeting-card");
const backButton = document.querySelector("#back-button");
const universeScreen = document.querySelector("#universe-screen");
const universeStage = document.querySelector("#universe-stage");
const universeEnter = document.querySelector("#universe-enter");
const universeStatus = document.querySelector("#universe-status");
const bouquetScreen = document.querySelector("#bouquet-screen");
const calendarScreen = document.querySelector("#calendar-screen");
const letterScreen = document.querySelector("#letter-screen");
const backgroundMusic = document.querySelector("#background-music");
const musicStatus = document.querySelector("#music-status");

const screens = [universeScreen, bouquetScreen, calendarScreen, letterScreen];
const floatParticles = [];
const burstParticles = [];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const universeParticleCount = 5000; // Tăng số lượng hạt giúp viền trái tim sắc nét và lung linh hơn
const FLOAT_COUNT = 150;
const AMBIENT_COUNT = 250;
const universeColors = [0xffb6c1, 0xffc0cb, 0xff69b4, 0xff1493, 0xffffffff];
const ambientColors = ["#ffb6c1", "#ffc0cb", "#ffe4e1", "#ff69b4", "#ff1493", "#e91e63", "#ff1744"];
let width = window.innerWidth;
let height = window.innerHeight;
let transitionStarted = false;
let universeTransitionStarted = false;
let universeRenderer;
let universeScene;
let universeCamera;
let universeGroup;
let universePoints;
let spherePositions;
let heartPositions;
let universeAnimationFrame;
let morphStartedAt = 0;
let explosionStartedAt = 0;
let pointerX = 0;
let pointerY = 0;
let musicStarted = false;
let musicAttempted = false;

function createUniverse() {
  if (!window.THREE) {
    universeStatus.textContent = "Không tải được không gian 3D. Bạn vẫn có thể tiếp tục.";
    return;
  }

  try {
    universeRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    universeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    universeRenderer.setSize(width, height);
    universeRenderer.setClearColor(0x000000, 0);
    universeStage.prepend(universeRenderer.domElement);

    universeScene = new THREE.Scene();
    universeCamera = new THREE.PerspectiveCamera(45, width / height, .1, 100);
    universeCamera.position.z = 20;
    universeGroup = new THREE.Group();
    universeGroup.position.y = 3.3;
    universeScene.add(universeGroup);

    spherePositions = new Float32Array(universeParticleCount * 3);
    heartPositions = new Float32Array(universeParticleCount * 3);
    const positions = new Float32Array(universeParticleCount * 3);
    const colors = new Float32Array(universeParticleCount * 3);
    const color = new THREE.Color();

    for (let index = 0; index < universeParticleCount; index += 1) {
      const offset = index * 3;
      
      // Tạo hình quả cầu ban đầu
      const z = Math.random() * 2 - 1;
      const angle = Math.random() * Math.PI * 2;
      const radius = 4.8;
      const ring = Math.sqrt(1 - z * z);
      spherePositions[offset] = radius * ring * Math.cos(angle);
      spherePositions[offset + 1] = radius * ring * Math.sin(angle);
      spherePositions[offset + 2] = radius * z;

      // Tạo hình trái tim dạng viền rỗng ruột (hollow shell / surface outline) để lõi thông thoáng, dễ nhìn chữ bên trong
      const t = Math.random() * Math.PI * 2;
      const u = (Math.random() - 0.5) * Math.PI * 0.75;
      
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      const scale = 0.33;
      
      const depthFactor = Math.cos(u);
      heartPositions[offset] = hx * scale * (0.85 + 0.15 * Math.abs(depthFactor));
      heartPositions[offset + 1] = hy * scale * (0.85 + 0.15 * Math.abs(depthFactor)) - 0.8;
      heartPositions[offset + 2] = Math.sin(u) * 1.6;

      positions[offset] = spherePositions[offset];
      positions[offset + 1] = spherePositions[offset + 1];
      positions[offset + 2] = spherePositions[offset + 2];
      
      color.setHex(universeColors[Math.floor(Math.random() * universeColors.length)]);
      colors[offset] = color.r;
      colors[offset + 1] = color.g;
      colors[offset + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    
    const particleCanvas = document.createElement("canvas");
    particleCanvas.width = 32;
    particleCanvas.height = 32;
    const particleContext = particleCanvas.getContext("2d");
    const particleGlow = particleContext.createRadialGradient(16, 16, 0, 16, 16, 16);
    particleGlow.addColorStop(0, "rgba(255,255,255,1)");
    particleGlow.addColorStop(.4, "rgba(255,182,193,0.8)");
    particleGlow.addColorStop(1, "rgba(255,255,255,0)");
    particleContext.fillStyle = particleGlow;
    particleContext.fillRect(0, 0, 32, 32);
    
    const particleTexture = new THREE.CanvasTexture(particleCanvas);
    const material = new THREE.PointsMaterial({
      size: 0.35, // Hạt sắc nét, lung linh
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      alphaTest: .01,
      depthWrite: false,
      blending: THREE.AdditiveBlending // Hiệu ứng phát sáng rực rỡ như các hạt sao trong không gian
    });
    
    universePoints = new THREE.Points(geometry, material);
    universeGroup.add(universePoints);
    morphStartedAt = performance.now();
    animateUniverse();
  } catch (error) {
    universeStatus.textContent = "Không thể khởi tạo không gian 3D trên thiết bị này. Bạn vẫn có thể tiếp tục.";
    console.error("Không thể khởi tạo không gian 3D:", error);
  }
}

function animateUniverse(now = performance.now()) {
  if (!universeRenderer || !universeScreen.classList.contains("is-active")) return;

  const positionAttribute = universePoints.geometry.attributes.position;
  const positions = positionAttribute.array;
  const morphProgress = Math.min(1, (now - morphStartedAt) / (reduceMotion ? 300 : 3400));
  const morphEase = morphProgress * morphProgress * (3 - 2 * morphProgress);
  const exploding = universeTransitionStarted;

  for (let index = 0; index < universeParticleCount; index += 1) {
    const offset = index * 3;
    if (exploding) {
      const elapsed = Math.min(1, (now - explosionStartedAt) / (reduceMotion ? 150 : 900));
      const expansion = 1 + elapsed * 23;
      positions[offset] = heartPositions[offset] * expansion;
      positions[offset + 1] = heartPositions[offset + 1] * expansion;
      positions[offset + 2] = heartPositions[offset + 2] * expansion;
    } else {
      positions[offset] = THREE.MathUtils.lerp(spherePositions[offset], heartPositions[offset], morphEase);
      positions[offset + 1] = THREE.MathUtils.lerp(spherePositions[offset + 1], heartPositions[offset + 1], morphEase);
      positions[offset + 2] = THREE.MathUtils.lerp(spherePositions[offset + 2], heartPositions[offset + 2], morphEase);
    }
  }
  positionAttribute.needsUpdate = true;

  const targetRotationY = pointerX * .62;
  const targetRotationX = pointerY * .44;
  universePoints.rotation.y += .0026;
  universeGroup.rotation.y += (targetRotationY - universeGroup.rotation.y) * .07;
  universeGroup.rotation.x += (targetRotationX - universeGroup.rotation.x) * .07;
  universeRenderer.render(universeScene, universeCamera);

  universeAnimationFrame = window.requestAnimationFrame(animateUniverse);
}

function resizeUniverse() {
  if (!universeRenderer || !universeCamera) return;
  universeCamera.aspect = width / height;
  universeCamera.updateProjectionMatrix();
  universeRenderer.setSize(width, height);
}

function beginUniverseTransition() {
  if (universeTransitionStarted) return;
  universeTransitionStarted = true;
  explosionStartedAt = performance.now();
  universeScreen.classList.add("is-exploding");
  universeEnter.disabled = true;
  startBackgroundMusic();
  if (universeRenderer && !universeAnimationFrame) animateUniverse();
  window.setTimeout(() => {
    window.cancelAnimationFrame(universeAnimationFrame);
    universeAnimationFrame = undefined;
    showScreen(bouquetScreen);
  }, reduceMotion ? 150 : 950);
}

async function startBackgroundMusic() {
  if (!backgroundMusic || musicStarted || musicAttempted) return;
  musicAttempted = true;
  try {
    await backgroundMusic.play();
    musicStarted = true;
    musicStatus.textContent = "";
  } catch (error) {
    if (error.name === "NotAllowedError") {
      musicAttempted = false;
      musicStatus.textContent = "Trình duyệt sẽ phát nhạc sau lần chạm đầu tiên.";
    } else {
      musicStatus.textContent = "Không tìm thấy bản nhạc nền river-flows-in-you.mp3.";
    }
  }
}

function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function createParticle(burst = false, originX = width / 2, originY = height / 2) {
  const size = 1.5 + Math.random() * 4;
  const angle = Math.random() * Math.PI * 2;
  const speed = burst ? 2 + Math.random() * 8 : .5 + Math.random() * 1.05;
  const maxLife = 240 + Math.random() * 200;
  const opacity = burst ? .35 + Math.random() * .5 : .2 + Math.random() * .35;
  return {
    x: burst ? originX : Math.random() * width,
    y: burst ? originY : Math.random() * height,
    vx: burst ? Math.cos(angle) * speed : (Math.random() - .5) * .42,
    vy: burst ? Math.sin(angle) * speed : .42 + Math.random() * .98,
    size,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - .5) * .025,
    opacity,
    baseOpacity: opacity,
    life: burst ? 75 + Math.random() * 45 : Math.random() * maxLife,
    maxLife: burst ? 120 : maxLife,
    color: ambientColors[Math.floor(Math.random() * ambientColors.length)],
    type: Math.random() > .76 ? "heart" : "petal",
    burst
  };
}

function spawnHeartBurst(x, y) {
  for (let index = 0; index < FLOAT_COUNT; index += 1) {
    burstParticles.push(createParticle(true, x, y));
  }
}

function drawPetal(particle) {
  context.save();
  context.translate(particle.x, particle.y);
  context.rotate(particle.rotation);
  context.globalAlpha = particle.opacity;
  context.fillStyle = particle.color;

  if (particle.type === "heart") {
    const size = particle.size;
    context.beginPath();
    context.moveTo(0, size * .38);
    context.bezierCurveTo(-size * 1.1, -size * .25, -size * .45, -size * .9, 0, -size * .37);
    context.bezierCurveTo(size * .45, -size * .9, size * 1.1, -size * .25, 0, size * .38);
    context.fill();
  } else {
    context.beginPath();
    context.ellipse(0, 0, particle.size * .46, particle.size, 0, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
}

function animateParticles() {
  context.clearRect(0, 0, width, height);

  for (const particle of floatParticles) {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.rotation += particle.rotationSpeed;
    particle.life = (particle.life + 1) % particle.maxLife;
    particle.opacity = particle.baseOpacity * Math.sin(Math.PI * particle.life / particle.maxLife);

    if (particle.y > height + 20) {
      particle.y = -20;
      particle.x = Math.random() * width;
    }

    drawPetal(particle);
  }

  for (let index = burstParticles.length - 1; index >= 0; index -= 1) {
    const particle = burstParticles[index];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.rotation += particle.rotationSpeed;
    particle.vx *= .985;
    particle.vy *= .985;
    particle.opacity = Math.max(0, particle.opacity - .008);
    particle.life -= 1;

    drawPetal(particle);

    if (particle.burst && particle.life <= 0) {
      burstParticles.splice(index, 1);
    }
  }

  window.requestAnimationFrame(animateParticles);
}

function addAmbientParticles() {
  while (floatParticles.length < AMBIENT_COUNT) {
    floatParticles.push(createParticle());
  }
}

function burstPetals() {
  const bouquetBounds = bouquetButton.getBoundingClientRect();
  const originX = bouquetBounds.left + bouquetBounds.width / 2;
  const originY = bouquetBounds.top + bouquetBounds.height / 2;
  spawnHeartBurst(originX, originY);
}

function showScreen(activeScreen) {
  for (const screen of screens) {
    const isActive = screen === activeScreen;
    screen.classList.toggle("is-active", isActive);
    screen.setAttribute("aria-hidden", String(!isActive));
  }
  if (activeScreen === universeScreen && universeRenderer && !universeAnimationFrame) {
    animateUniverse();
  }
}

function buildCalendar() {
  const firstDay = new Date(2026, 9, 1).getDay();
  const mondayOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(2026, 10, 0).getDate();

  for (let index = 0; index < mondayOffset; index += 1) {
    const emptyDay = document.createElement("span");
    emptyDay.className = "calendar-day is-empty";
    emptyDay.setAttribute("aria-hidden", "true");
    calendarGrid.append(emptyDay);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    if (day === 20) {
      const specialDay = document.createElement("button");
      specialDay.className = "calendar-day is-twentieth";
      specialDay.type = "button";
      specialDay.textContent = String(day);
      specialDay.setAttribute("aria-label", "Ngày 20 tháng 10 — nhấn để mở lời chúc");
      specialDay.addEventListener("click", (event) => {
        spawnHeartBurst(event.clientX, event.clientY);
        openLetter();
      });
      calendarGrid.append(specialDay);
    } else {
      const dateCell = document.createElement("span");
      dateCell.className = "calendar-day";
      dateCell.setAttribute("role", "gridcell");
      dateCell.textContent = String(day);
      calendarGrid.append(dateCell);
    }
  }
}

function openLetter() {
  calendarCard.classList.add("is-leaving");
  window.setTimeout(() => showScreen(letterScreen), reduceMotion ? 50 : 450);
}

function beginBouquetTransition() {
  if (transitionStarted) return;
  transitionStarted = true;
  bouquetButton.classList.add("is-burst");
  bouquetHint.disabled = true;
  burstPetals();
  window.setTimeout(() => showScreen(calendarScreen), reduceMotion ? 80 : 850);
}

bouquetButton.addEventListener("click", beginBouquetTransition);
bouquetHint.addEventListener("click", beginBouquetTransition);
universeStage.addEventListener("click", () => {
  universeClickCount++;
  startBackgroundMusic(); // Đảm bảo click đầu tiên kích hoạt nhạc nền
  
  if (universeClickCount >= 2) {
    beginUniverseTransition(); // Click thứ 2 mới làm mất hình trái tim và chuyển sang màn hình tiếp theo
  }
});
backgroundMusic.addEventListener("error", () => {
  musicStatus.textContent = "Không tìm thấy bản nhạc nền river-flows-in-you.mp3.";
});

envelopeButton.addEventListener("click", () => {
  if (envelopeButton.classList.contains("is-opening")) return;
  envelopeButton.classList.add("is-opening");
  envelopeButton.setAttribute("aria-expanded", "true");
  window.setTimeout(() => {
    greetingCard.classList.add("is-open");
    greetingCard.setAttribute("aria-hidden", "false");
    greetingCard.focus({ preventScroll: true });
  }, reduceMotion ? 30 : 480);
});

greetingCard.tabIndex = -1;

backButton.addEventListener("click", () => {
  calendarCard.classList.remove("is-leaving");
  bouquetButton.classList.remove("is-burst");
  bouquetHint.disabled = false;
  transitionStarted = false;
  envelopeButton.classList.remove("is-opening");
  envelopeButton.setAttribute("aria-expanded", "false");
  greetingCard.classList.remove("is-open");
  greetingCard.setAttribute("aria-hidden", "true");
  burstParticles.length = 0;
  universeScreen.classList.remove("is-exploding");
  universeEnter.disabled = false;
  universeTransitionStarted = false;
  morphStartedAt = performance.now();
  showScreen(universeScreen);
});

resizeCanvas();
createUniverse();
buildCalendar();
addAmbientParticles();
window.requestAnimationFrame(animateParticles);
startBackgroundMusic();
window.addEventListener("pointerdown", startBackgroundMusic, { once: true });
window.addEventListener("keydown", startBackgroundMusic, { once: true });
window.addEventListener("resize", () => {
  resizeCanvas();
  resizeUniverse();
  addAmbientParticles();
});
window.addEventListener("pointermove", (event) => {
  pointerX = (event.clientX / width - .5) * 2;
  pointerY = (event.clientY / height - .5) * 2;
});

// --- TÍNH NĂNG MỞ ĐƯỜNG DẪN RIÊNG DÀNH CHO MẸ ---
window.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const recipient = urlParams.get("to");

  if (recipient === "me") {
    const greetingTitle = greetingCard.querySelector("h2, h3, .greeting-title");
    if (greetingTitle) {
      greetingTitle.textContent = "Gửi Mẹ Yêu Dấu Của Con ❤️";
    }

    const customMessage = `
      <p style="margin-top: 10px;">Mẹ ơi!</p>
      <p>Nhân ngày Phụ nữ Việt Nam 20/10, con muốn gửi đến mẹ những lời chúc tốt đẹp nhất. Cảm ơn mẹ vì đã luôn hy sinh thầm lặng, là vòng tay ấm áp che chở và là điểm tựa vững chắc nhất cho cuộc đời con.</p>
      <p>Con chỉ mong mẹ luôn dồi dào sức khỏe, bình an, giữ mãi nụ cười rạng rỡ và luôn hạnh phúc bên gia đình mình mỗi ngày. Mẹ chính là người phụ nữ tuyệt vời nhất cuộc đời con!</p>
      <p style="text-align: right; font-weight: bold; margin-top: 20px; color: #d81b60;">Con của mẹ kính yêu! 🌸✨</p>
    `;

    const greetingBody = greetingCard.querySelector(".greeting-body") || greetingCard.querySelector(".card-body") || greetingCard.querySelector("div");
    
    if (greetingBody) {
      const oldParagraphs = greetingCard.querySelectorAll("p");
      if (oldParagraphs.length > 0) {
        const parentContainer = oldParagraphs[0].parentNode;
        parentContainer.innerHTML = customMessage;
      }
    }
  }
});
