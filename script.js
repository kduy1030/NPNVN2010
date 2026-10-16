"use strict";

const canvas = document.querySelector(".petal-canvas");
const context = canvas.getContext("2d");
const bouquetButton = document.querySelector("#bouquet-button");
const bouquetHint = document.querySelector("#bouquet-hint");
const calendarGrid = document.querySelector("#calendar-grid");
const calendarCard = document.querySelector(".calendar-card");
const envelopeButton = document.querySelector("#envelope-button");
const greetingCard = document.querySelector("#greeting-card");
const backButton = document.querySelector("#back-button");
const bouquetScreen = document.querySelector("#bouquet-screen");
const calendarScreen = document.querySelector("#calendar-screen");
const letterScreen = document.querySelector("#letter-screen");

const screens = [bouquetScreen, calendarScreen, letterScreen];
const particles = [];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let width = window.innerWidth;
let height = window.innerHeight;
let transitionStarted = false;

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
  const size = 3 + Math.random() * 8;
  const angle = Math.random() * Math.PI * 2;
  const speed = burst ? 2 + Math.random() * 8 : .35 + Math.random() * .8;
  return {
    x: burst ? originX : Math.random() * width,
    y: burst ? originY : Math.random() * height,
    vx: burst ? Math.cos(angle) * speed : (Math.random() - .5) * .42,
    vy: burst ? Math.sin(angle) * speed : .3 + Math.random() * .7,
    size,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - .5) * .025,
    opacity: .35 + Math.random() * .5,
    type: Math.random() > .76 ? "heart" : "petal",
    burst,
    life: burst ? 75 + Math.random() * 45 : Infinity
  };
}

function drawPetal(particle) {
  context.save();
  context.translate(particle.x, particle.y);
  context.rotate(particle.rotation);
  context.globalAlpha = particle.opacity;
  context.fillStyle = particle.type === "heart" ? "#e97895" : "#f39bb0";

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

  for (let index = particles.length - 1; index >= 0; index -= 1) {
    const particle = particles[index];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.rotation += particle.rotationSpeed;

    if (particle.burst) {
      particle.vx *= .985;
      particle.vy *= .985;
      particle.opacity = Math.max(0, particle.opacity - .008);
      particle.life -= 1;
    } else if (particle.y > height + 20) {
      particle.y = -20;
      particle.x = Math.random() * width;
    }

    drawPetal(particle);

    if (particle.burst && particle.life <= 0) {
      particles.splice(index, 1);
    }
  }

  window.requestAnimationFrame(animateParticles);
}

function addAmbientParticles() {
  const count = reduceMotion ? 12 : Math.min(48, Math.floor(width / 24));
  while (particles.filter((particle) => !particle.burst).length < count) {
    particles.push(createParticle());
  }
}

function burstPetals() {
  const count = reduceMotion ? 24 : 105;
  const bouquetBounds = bouquetButton.getBoundingClientRect();
  const originX = bouquetBounds.left + bouquetBounds.width / 2;
  const originY = bouquetBounds.top + bouquetBounds.height / 2;
  for (let index = 0; index < count; index += 1) {
    particles.push(createParticle(true, originX, originY));
  }
}

function showScreen(activeScreen) {
  for (const screen of screens) {
    const isActive = screen === activeScreen;
    screen.classList.toggle("is-active", isActive);
    screen.setAttribute("aria-hidden", String(!isActive));
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
      specialDay.addEventListener("click", openLetter);
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
  particles.splice(0, particles.length, ...particles.filter((particle) => !particle.burst));
  showScreen(bouquetScreen);
});

resizeCanvas();
buildCalendar();
addAmbientParticles();
window.requestAnimationFrame(animateParticles);
window.addEventListener("resize", () => {
  resizeCanvas();
  addAmbientParticles();
});

// --- TÍNH NĂNG MỞ ĐƯỜNG DẪN RIÊNG DÀNH CHO MẸ (ĐÃ SỬA LỖI CHỒNG CHẤT NỘI DUNG) ---
window.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const recipient = urlParams.get("to");

  // Nếu trên thanh địa chỉ có ?to=me, thay thế hoàn toàn nội dung lời chúc thành dành cho mẹ
  if (recipient === "me") {
    // 1. Đổi tiêu đề bức thư
    const greetingTitle = greetingCard.querySelector("h2, h3, .greeting-title");
    if (greetingTitle) {
      greetingTitle.textContent = "Gửi Mẹ Yêu Dấu Của Con ❤️";
    }

    // 2. Nội dung riêng dành cho mẹ
    const customMessage = `
      <p style="margin-top: 10px;">Mẹ ơi!</p>
      <p>Nhân ngày Phụ nữ Việt Nam 20/10, con muốn gửi đến mẹ những lời chúc tốt đẹp nhất. Cảm ơn mẹ vì đã luôn hy sinh thầm lặng, là vòng tay ấm áp che chở và là điểm tựa vững chắc nhất cho cuộc đời con.</p>
      <p>Con chỉ mong mẹ luôn dồi dào sức khỏe, bình an, giữ mãi nụ cười rạng rỡ và luôn hạnh phúc bên gia đình mình mỗi ngày. Mẹ chính là người phụ nữ tuyệt vời nhất cuộc đời con!</p>
      <p style="text-align: right; font-weight: bold; margin-top: 20px; color: #d81b60;">Con của mẹ kính yêu! 🌸✨</p>
    `;

    // 3. Tìm vùng chứa chữ bên trong thiệp và ghi đè nội dung mới lên (xóa sạch nội dung cũ)
    const greetingBody = greetingCard.querySelector(".greeting-body") || greetingCard.querySelector(".card-body") || greetingCard.querySelector("div");
    
    if (greetingBody) {
      // Tìm tất cả các đoạn văn bản cũ và thay thế bằng nội dung của mẹ
      const oldParagraphs = greetingCard.querySelectorAll("p");
      if (oldParagraphs.length > 0) {
        // Lấy thẻ cha chứa các đoạn văn để thay thế toàn bộ
        const parentContainer = oldParagraphs[0].parentNode;
        parentContainer.innerHTML = customMessage;
      }
    }
  }
});
