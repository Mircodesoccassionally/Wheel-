// ==============================
// Default Data & Setup
// ==============================

// Default list of names to display on the wheel
const defaultNames = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Heidi"];

// Get canvas and its 2D context
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const size = canvas.width;

// Center (cx, cy) and radius of the wheel
const cx = size / 2, cy = size / 2, radius = size / 2 - 6;

// Dynamic state variables
let names = [...defaultNames];  // Current names list
let rotation = 0;               // Current rotation angle in degrees
let spinning = false;           // Prevents multiple spins at once

// UI elements
const spinBtn = document.getElementById('spinBtn');
const namesInput = document.getElementById('namesInput');
const updateBtn = document.getElementById('updateBtn');
const resultText = document.getElementById('resultText');

// Populate the input with the default names
namesInput.value = names.join(', ');

// ==============================
// Audio Effects
// ==============================
const spinSound = new Audio('sounds/spin.mp3');  // path to spin sound
spinSound.loop = true; // keep looping during spin

const winSound = new Audio('sounds/win.mp3');    // path to win sound

// ==============================
// Drawing the Wheel
// ==============================

function drawWheel(rotDeg = 0) {
  ctx.clearRect(0, 0, size, size); // Clear canvas
  const segCount = Math.max(1, names.length); // Number of slices
  const anglePer = (Math.PI * 2) / segCount;  // Angle per slice in radians

  ctx.save();
  ctx.translate(cx, cy);                    // Move origin to center
  ctx.rotate((rotDeg * Math.PI) / 180);     // Apply rotation

  for (let i = 0; i < segCount; i++) {
    const start = i * anglePer;
    const end = start + anglePer;

    // Draw colored slice
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = (i % 2 === 0) ? "#EFB83A" : "#33D7FF"; // Alternate colors
    ctx.fill();

    // Draw thin white separator line
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(radius * Math.cos(start), radius * Math.sin(start));
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw text label inside slice
    ctx.save();
    ctx.rotate(start + anglePer / 2);            // Rotate to slice center
    ctx.translate(radius * 0.6, 0);              // Push text outward
    ctx.rotate(Math.PI / 2);                     // Orient text upright
    ctx.fillStyle = '#122049';                   // Text color
    ctx.font = `${Math.max(12, Math.floor(radius / 10))}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    wrapText(ctx, names[i], 0, 0, radius * 0.45, Math.floor(radius / 9));
    ctx.restore();
  }

  // Draw outer ring around the wheel
  ctx.beginPath();
  ctx.arc(0,0,radius+4,0,Math.PI*2);
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.stroke();

  ctx.restore();
}


// ==============================
// Text Wrapping for Slice Labels
// ==============================

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lineY = y;

  // Split text into multiple lines if too long for slice
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);

    if (metrics.width > maxWidth && n > 0) {
      context.fillText(line.trim(), x, lineY);
      line = words[n] + ' ';
      lineY += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line.trim(), x, lineY);
}


// ==============================
// Easing Function for Smooth Spin
// ==============================

function easeOutCubic(t) {
  // Starts fast, slows down near the end
  return 1 - Math.pow(1 - t, 3);
}


// ==============================
// Spin Logic
// ==============================

function spin() {
  if (spinning || names.length === 0) return; // Prevent double spin
  spinning = true;
  spinBtn.disabled = true;
  updateBtn.disabled = true;
  resultText.textContent = 'Spinning...';

// 🔊 Start spin sound
  spinSound.currentTime = 0;
  spinSound.play();

  const segCount = names.length;
  const targetIndex = Math.floor(Math.random() * segCount); // Random winner
  const fullRot = 4 + Math.floor(Math.random() * 3);        // Full wheel spins (4–6 times)
  const anglePer = 360 / segCount;

  // Mid-angle of chosen slice (adjusted so pointer aligns at 12 o’clock)
  const targetMidAngle = (targetIndex * anglePer) + (anglePer / 2) - 90;

  // Final total rotation
  const finalRotation = fullRot * 360 + targetMidAngle;
  const duration = 4200 + Math.floor(Math.random() * 1200); // Spin duration (ms)
  const start = performance.now();
  const startRotation = rotation % 360;
  const endRotation = rotation + finalRotation;

  // Animate spin using requestAnimationFrame
  function animate(now) {
    const elapsed = now - start;
    const t = Math.min(1, elapsed / duration);  // Normalize time [0–1]
    const eased = easeOutCubic(t);              // Apply easing
    rotation = startRotation + (endRotation - startRotation) * eased;

    drawWheel(rotation);

    if (t < 1) requestAnimationFrame(animate);
    else finishSpin(targetIndex);
  }

  requestAnimationFrame(animate);
}


// ==============================
// Finish Spin & Pick Winner
// ==============================

function finishSpin(winIndex) {
  spinning = false;
  spinBtn.disabled = false;
  updateBtn.disabled = false;

// Stop spin sound
  spinSound.pause();
  spinSound.currentTime = 0;

  const segCount = names.length;

  // Normalize rotation to [0, 360)
  const normalizedRotation = rotation % 360;

  // Pointer is fixed at top (12 o’clock → 270° in canvas coordinates)
  const pointerAngle = 270;

  // Find which slice the pointer lands on
  const index = Math.floor(((360 + pointerAngle - normalizedRotation) % 360) / (360 / segCount));
  const winner = names[index] || '—';

  resultText.textContent = `Winner: ${winner}`;

// Play winning sound
  winSound.currentTime = 0;
  winSound.play();
}


// ==============================
// UI Event Handlers
// ==============================

// Update button → refresh names list
updateBtn.addEventListener('click', () => {
  const raw = namesInput.value.trim();
  if (!raw) return;

  const arr = raw.split(',').map(s => s.trim()).filter(Boolean);
  names = arr.length ? arr : [...defaultNames];

  resultText.textContent = 'Winner: —';
  rotation = 0;
  drawWheel(rotation);
});

// Spin button → start spin
spinBtn.addEventListener('click', spin);

// Initial draw
drawWheel(0);

// Keyboard shortcut: Space = spin
document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault();
    spin();
  }
});
