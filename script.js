const $ = id => document.getElementById(id);
const cv = $('c'), ctx = cv.getContext('2d');
let W, H, S, dpr;

function resize() {
  dpr = devicePixelRatio || 1;
  cv.width = innerWidth * dpr;
  cv.height = innerHeight * dpr;
  S = innerHeight / 600;
  W = innerWidth / S;
  H = 600;
}
addEventListener('resize', resize);
resize();

// ---- persistent save (best-effort) ----
let save = { coins: 0, best: 0, animal: 0, lv: {}, own: [0] };
try {
  const s = localStorage.getItem('animal-launch');
  if (s) save = Object.assign(save, JSON.parse(s));
} catch (e) {}

if (!Array.isArray(save.own)) save.own = [0];

function persist() {
  try {
    localStorage.setItem('animal-launch', JSON.stringify(save));
  } catch (e) {}
}

const ANIMALS = [
  { n: 'Zebra', d: 'Balanced', c: '#f6f6f6', b: '#fff', sc: '#23304a', ear: 'round', f: 'stripes', pow: 1, bounce: .5, boost: 1, price: 0 },
  { n: 'Penguin', d: 'Bouncy', c: '#34496e', b: '#fff', ear: 'none', f: 'beak', pow: .95, bounce: .66, boost: 1, price: 2500 },
  { n: 'Frog', d: 'Light, big launch', c: '#5fd35f', b: '#d4f8a8', ear: 'none', f: 'bulge', pow: 1.12, bounce: .4, boost: .9, price: 5000 },
  { n: 'Bunny', d: 'Great boost', c: '#f6e3f0', b: '#fff', ear: 'long', f: 'snout', nc: '#ff8fb1', pow: 1, bounce: .52, boost: 1.25, price: 9000 },
  { n: 'Cat', d: 'All-rounder', c: '#ffb04a', b: '#fff1cf', sc: '#d9791c', ear: 'point', f: 'stripes', pow: 1.08, bounce: .5, boost: 1.1, price: 15000 },
  { n: 'Pig', d: 'Heavy bouncer', c: '#ffb3c7', b: '#ffd6e2', ear: 'point', f: 'snout', nc: '#ff7fa3', pow: .98, bounce: .72, boost: 1, price: 24000 },
  { n: 'Fox', d: 'Fast launch', c: '#ff7a2f', b: '#fff', ear: 'point', f: 'snout', nc: '#23304a', pow: 1.2, bounce: .5, boost: 1.1, price: 36000 },
  { n: 'Panda', d: 'Tough bounce', c: '#fff', b: '#fff', ec: '#23304a', ear: 'round', f: 'patch', pow: 1.1, bounce: .78, boost: 1.05, price: 52000 },
  { n: 'Lion', d: 'Power king', c: '#ffc94a', b: '#ffe7a3', ear: 'round', f: 'mane', pow: 1.28, bounce: .5, boost: 1.1, price: 75000 },
  { n: 'Elephant', d: 'Huge bounces', c: '#9aa8bd', b: '#c4cedd', ear: 'big', f: 'trunk', pow: 1.18, bounce: .85, boost: 1, price: 105000 },
  { n: 'Rhino', d: 'Charging launch', c: '#7c879a', b: '#aab3c2', ear: 'round', f: 'horn', pow: 1.36, bounce: .55, boost: 1.15, price: 145000 },
  { n: 'Dragon', d: 'Legendary', c: '#8a4fff', b: '#ffd86b', ear: 'point', f: 'wings', nc: '#5a2bc4', pow: 1.45, bounce: .7, boost: 1.5, price: 250000 }
];

const STATS = [['power', 'Launch'], ['bounce', 'Bounce'], ['boost', 'Boost']];
const STAT = {
  power: (a, l) => a.pow * (1 + .09 * l),
  bounce: (a, l) => Math.min(.88, a.bounce + .045 * l),
  boost: (a, l) => a.boost * (1 + .2 * l)
};

const lv = (i, k) => (save.lv[i + k] || 0);
const cost = (i, k) => Math.round(150 * Math.pow(1.9, lv(i, k)) * (1 + i * .25) / 10) * 10;
const MAXLV = 8;
const getStat = i => ({
  pow: STAT.power(ANIMALS[i], lv(i, 'power')),
  bounce: STAT.bounce(ANIMALS[i], lv(i, 'bounce')),
  boost: STAT.boost(ANIMALS[i], lv(i, 'boost'))
});
const tier = i => {
  const t = lv(i, 'power') + lv(i, 'bounce') + lv(i, 'boost');
  return t >= 24 ? 3 : t >= 16 ? 2 : t >= 8 ? 1 : 0;
};
const AURA = ['', '#4ac0ff', '#c46bff', '#ffd23f'];
const TN = ['Rookie', 'Glowing', 'Elite', 'LEGEND'];
let sel = save.animal;

const EMO = {
  Zebra: '🦓', Penguin: '🐧', Frog: '🐸', Bunny: '🐰', Cat: '🐱', Pig: '🐷',
  Fox: '🦊', Panda: '🐼', Lion: '🦁', Elephant: '🐘', Rhino: '🦏', Dragon: '🐲'
};

function drawAnimal(c, a, r) {
  c.globalAlpha = 1;
  c.beginPath();
  c.arc(0, 0, r * 1.05, 0, 7);
  c.fillStyle = a.c;
  c.fill();
  c.lineWidth = r * .12;
  c.strokeStyle = '#23304a';
  c.stroke();
  c.font = Math.round(r * 1.5) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = '#000';
  c.fillText(EMO[a.n], 0, r * .06);
}

// ---- UI ----
function show(id) {
  document.querySelectorAll('.ov').forEach(o => o.classList.toggle('on', o.id === id));
  $('hud').style.display = (id === 'none') ? 'flex' : 'none';
  $('boost').style.display = 'none';
}

function renderSelect() {
  if (!save.own.includes(save.animal)) save.animal = 0;
  const box = $('cards');
  box.innerHTML = '';
  
  ANIMALS.forEach((a, i) => {
    const own = save.own.includes(i), d = document.createElement('div');
    d.className = 'card' + (i === sel ? ' sel' : '');
    d.innerHTML = '<canvas width="120" height="120"></canvas><b>' + a.n + '</b><small>' + (own ? a.d : '🔒 ' + a.price.toLocaleString() + ' 🪙') + '</small>';
    const cv2 = d.firstChild, cc = cv2.getContext('2d');
    cc.translate(60, 66);
    drawAnimal(cc, a, 32);
    if (!own) cv2.style.filter = 'brightness(.55)';
    d.onclick = () => { sel = i; renderSelect(); };
    box.appendChild(d);
  });

  const i = sel, a = ANIMALS[i], own = save.own.includes(i);
  let h = '<b>' + a.n + ' — 🪙 ' + save.coins.toLocaleString() + '</b>';
  
  if (!own) {
    h += '<div class="up"><span>' + a.d + '</span></div><button id="buy" ' + (save.coins < a.price ? 'disabled' : '') + '>BUY ' + a.price.toLocaleString() + ' 🪙</button>';
  } else {
    STATS.forEach(([k, label]) => {
      const l = lv(i, k), v = Math.round(STAT[k](a, l) * 100), n = Math.round(STAT[k](a, l + 1) * 100);
      h += '<div class="up"><span>' + label + '<br><small>' + v + '%' + (l < MAXLV ? ' → ' + n + '%' : '') + '</small></span><span class="bar">' + '■'.repeat(l) + '□'.repeat(MAXLV - l) + '</span>' +
        '<button data-k="' + k + '" ' + (l >= MAXLV || save.coins < cost(i, k) ? 'disabled' : '') + '>' + (l >= MAXLV ? 'MAX' : cost(i, k).toLocaleString() + ' 🪙') + '</button></div>';
    });
    h += '<small>Rank: <b>' + TN[tier(i)] + '</b>' + (tier(i) < 3 ? ' (glow aura at ' + [8, 16, 24][tier(i)] + ' total levels)' : '') + '</small>';
  }

  $('upg').innerHTML = h;
  $('go').disabled = !own;

  const buy = $('buy');
  if (buy) buy.onclick = () => {
    if (save.coins >= a.price) {
      save.coins -= a.price;
      save.own.push(i);
      save.animal = i;
      persist();
      renderSelect();
    }
  };

  $('upg').querySelectorAll('button[data-k]').forEach(b => b.onclick = () => {
    const k = b.dataset.k;
    if (save.coins >= cost(i, k) && lv(i, k) < MAXLV) {
      save.coins -= cost(i, k);
      save.lv[i + k] = lv(i, k) + 1;
      persist();
      renderSelect();
    }
  });
}

$('play').onclick = () => { sel = save.animal; renderSelect(); show('select'); };
$('go').onclick = () => { save.animal = sel; persist(); startAim(); };
$('again').onclick = startAim;
$('toSel').onclick = () => { sel = save.animal; renderSelect(); show('select'); };

// ---- game ----
const GY = () => H - 90, AX = 150, AY = () => GY() - 110, PPM = 8, G = 950, MAXPULL = 130;
let state = 'menu', p, cam = 0, pull = { x: 0, y: 0 }, drag = false, boostUsed = false, parts = [], best0 = 0, stat, trail = [];

function startAim() {
  const i = save.animal;
  stat = getStat(i);
  p = { x: AX, y: AY(), vx: 0, vy: 0, rot: 0, sx: 1, sy: 1 };
  cam = 0;
  pull = { x: 0, y: 0 };
  boostUsed = false;
  parts = [];
  trail = [];
  best0 = save.best;
  state = 'aim';
  show('none');
  $('boost').style.display = 'none';
}

function pos(e) { return { x: e.clientX / S, y: e.clientY / S }; }

cv.addEventListener('pointerdown', e => {
  if (state !== 'aim') return;
  const m = pos(e);
  if (Math.hypot(m.x - AX, m.y - AY()) < 120) {
    drag = true;
    setPull(m);
  }
});

addEventListener('pointermove', e => { if (drag) setPull(pos(e)); });
addEventListener('pointerup', () => {
  if (!drag) return;
  drag = false;
  const len = Math.hypot(pull.x, pull.y);
  if (len < 20) { pull = { x: 0, y: 0 }; return; }
  const k = 9 * stat.pow;
  p.vx = -pull.x * k;
  p.vy = -pull.y * k;
  p.sx = 1.5;
  p.sy = .6;
  state = 'fly';
  $('boost').style.display = 'block';
  burst(p.x, p.y, 10, '#fff');
});

function setPull(m) {
  let dx = m.x - AX, dy = m.y - AY();
  dx = Math.min(dx, 0);
  const l = Math.hypot(dx, dy);
  if (l > MAXPULL) { dx *= MAXPULL / l; dy *= MAXPULL / l; }
  pull = { x: dx, y: dy };
}

function doBoost() {
  if (state !== 'fly' || boostUsed) return;
  boostUsed = true;
  p.vx += 280 * stat.boost;
  p.vy -= 220 * stat.boost;
  p.sx = 1.4;
  p.sy = .7;
  burst(p.x, p.y, 18, '#ffb13d');
  $('boost').style.display = 'none';
}

$('boost').addEventListener('pointerdown', e => { e.stopPropagation(); doBoost(); });
addEventListener('keydown', e => { if (e.code === 'Space') doBoost(); });

function burst(x, y, n, col) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28, s = 60 + Math.random() * 220;
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, t: .6 + Math.random() * .4, c: col });
  }
}

const dist = () => Math.max(0, Math.floor((p.x - AX) / PPM));

function update(dt) {
  parts.forEach(q => { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 600 * dt; q.t -= dt; });
  parts = parts.filter(q => q.t > 0);
  p.sx += (1 - p.sx) * Math.min(1, dt * 10);
  p.sy += (1 - p.sy) * Math.min(1, dt * 10);

  if (state !== 'fly') return;

  p.vy += G * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.rot += p.vx * dt * .01;

  if (Math.random() < .5) trail.push({ x: p.x, y: p.y, t: .4 });
  trail.forEach(t => t.t -= dt);
  trail = trail.filter(t => t.t > 0);

  const gy = GY() - 16;
  if (p.y >= gy) {
    p.y = gy;
    if (Math.abs(p.vy) > 140) {
      p.vy = -p.vy * stat.bounce;
      p.vx *= .82;
      p.sx = .6;
      p.sy = 1.4;
      burst(p.x, gy + 14, 8, '#8a6a3a');
    } else {
      p.vy = 0;
      p.vx *= 1 - Math.min(1, 3 * dt);
    }
    if (p.vy === 0 && Math.abs(p.vx) < 12) return finish();
  }

  cam = Math.max(0, p.x - W * .3);
  $('dist').textContent = dist() + ' m';
}

function finish() {
  state = 'result';
  const d = dist(), rec = d > save.best;
  if (rec) save.best = d;
  save.coins += d;
  persist();

  $('coins').textContent = '🪙 ' + save.coins;
  $('rd').textContent = d + ' m';
  $('rb').textContent = 'BEST: ' + save.best + ' m   ·   +' + d + ' 🪙';
  $('rn').textContent = rec ? 'NEW RECORD!' : '';
  burst(p.x, p.y, 30, '#ffe35a');
  setTimeout(() => { if (state === 'result') show('result'); }, 700);
}

// ---- render ----
function draw(t) {
  ctx.setTransform(dpr * S, 0, 0, dpr * S, 0, 0);
  
  // 1. Vibrant Sky Gradient
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#4facfe');
  g.addColorStop(0.6, '#87e0fd');
  g.addColorStop(1, '#cdeeff');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // 2. Sun with glow (very slow parallax)
  const sunX = W * 0.85 - (cam * 0.05) % W;
  const sunY = H * 0.15;
  ctx.save();
  ctx.shadowColor = '#fff700';
  ctx.shadowBlur = 60;
  ctx.fillStyle = '#fffacd';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. Distant Mountains (Parallax layer 1)
  ctx.fillStyle = '#a8d8ea';
  ctx.beginPath();
  for (let i = -1; i < W / 400 + 2; i++) {
    const x = i * 400 - (cam * 0.15 % 400);
    const h = 150 + Math.sin(i * 1.5) * 60;
    ctx.moveTo(x, GY());
    ctx.lineTo(x + 200, GY() - h);
    ctx.lineTo(x + 400, GY());
  }
  ctx.fill();

  // 4. Clouds (Parallax layer 2 - improved & fluffier)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  for (let i = 0; i < 10; i++) {
    const x = ((i * 320 - cam * 0.25 + t * 12) % (W + 400) + W + 400) % (W + 400) - 200;
    const y = 50 + (i * 73) % 180;
    const scale = 0.8 + (i % 3) * 0.4;
    ctx.beginPath();
    ctx.arc(x, y, 30 * scale, 0, Math.PI * 2);
    ctx.arc(x + 25 * scale, y - 10 * scale, 35 * scale, 0, Math.PI * 2);
    ctx.arc(x + 50 * scale, y, 28 * scale, 0, Math.PI * 2);
    ctx.arc(x + 20 * scale, y + 10 * scale, 25 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Midground Hills (Parallax layer 3)
  ctx.fillStyle = '#88d498';
  for (let i = -1; i < W / 350 + 2; i++) {
    const x = i * 350 - (cam * 0.4 % 350);
    const h = 100 + Math.cos(i * 2.3) * 40;
    ctx.beginPath();
    ctx.ellipse(x + 175, GY() + 20, 220, h, 0, Math.PI, 0);
    ctx.fill();
  }

  // 6. Trees/Bushes on midground hills (Procedural detail)
  ctx.fillStyle = '#53b267';
  for (let i = -1; i < W / 250 + 2; i++) {
    const x = i * 250 - (cam * 0.45 % 250);
    const r = Math.abs(Math.sin(i * 12.9898) * 10000) % 100;
    if (r > 65) { // Only draw bushes sometimes for natural spacing
      const h = 25 + (r % 25);
      ctx.beginPath();
      ctx.arc(x, GY() - 15, h * 0.6, 0, Math.PI * 2);
      ctx.arc(x + 15, GY() - 20, h * 0.5, 0, Math.PI * 2);
      ctx.arc(x - 15, GY() - 18, h * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 7. Ground (Enhanced with grass blade details)
  const gy = GY();
  ctx.fillStyle = '#4cae4c';
  ctx.fillRect(0, gy, W, H - gy);
  ctx.fillStyle = '#8a6a3a';
  ctx.fillRect(0, gy + 20, W, H - gy);
  ctx.fillStyle = '#3d9a3d';
  for (let x = -(cam % 80); x < W; x += 80) {
    ctx.fillRect(x, gy, 40, 8);
    // Grass blade details
    ctx.beginPath();
    ctx.moveTo(x + 10, gy);
    ctx.lineTo(x + 14, gy - 10);
    ctx.lineTo(x + 18, gy);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 28, gy);
    ctx.lineTo(x + 33, gy - 8);
    ctx.lineTo(x + 38, gy);
    ctx.fill();
  }

  // distance markers every 50m
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  for (let m = 0; m <= 30000; m += 50) {
    const x = AX + m * PPM - cam;
    if (x < -40 || x > W + 40) continue;
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 1, gy - (m % 100 === 0 ? 44 : 26), 3, m % 100 === 0 ? 44 : 26);
    if (m % 100 === 0) { ctx.fillText(m ? m + 'm' : '🏁', x, gy - 50); }
  }

  // record line
  if (best0 > 0) {
    const x = AX + best0 * PPM - cam;
    ctx.fillStyle = '#ff5a5a';
    ctx.fillRect(x - 2, gy - 90, 4, 90);
    ctx.fillText('BEST', x, gy - 96);
  }

  // slingshot back
  const ax = AX - cam, ay = AY();
  ctx.strokeStyle = '#6b4423';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ax, gy);
  ctx.lineTo(ax, ay + 40);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ax, ay + 40);
  ctx.lineTo(ax - 20, ay - 6);
  ctx.moveTo(ax, ay + 40);
  ctx.lineTo(ax + 20, ay - 6);
  ctx.stroke();

  const a = ANIMALS[save.animal];
  if (state === 'aim' || state === 'fly' || state === 'result') {
    let px = p.x - cam, py = p.y;
    if (state === 'aim') {
      px = ax + pull.x;
      py = ay + pull.y;
      // bands
      ctx.strokeStyle = '#3b2412';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(ax - 20, ay - 6);
      ctx.lineTo(px, py);
      ctx.lineTo(ax + 20, ay - 6);
      ctx.stroke();

      // trajectory preview
      if (drag) {
        const k = 9 * stat.pow;
        let x = px, y = py, vx = -pull.x * k, vy = -pull.y * k;
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        for (let i = 0; i < 22; i++) {
          for (let j = 0; j < 3; j++) {
            vx += 0;
            vy += G * .02;
            x += vx * .02;
            y += vy * .02;
          }
          if (y > gy) break;
          ctx.beginPath();
          ctx.arc(x, y, 5 - i * .13, 0, 7);
          ctx.fill();
        }
      }
    }

    // trail
    trail.forEach(q => {
      ctx.fillStyle = `rgba(255,255,255,${q.t})`;
      ctx.beginPath();
      ctx.arc(q.x - cam, q.y, 6 * q.t * 2, 0, 7);
      ctx.fill();
    });

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath();
    ctx.ellipse(px, gy + 6, 22, 6, 0, 0, 7);
    ctx.fill();

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(state === 'aim' ? 0 : p.rot);
    ctx.scale(p.sx, p.sy);
    const tr = tier(save.animal);
    if (tr) {
      ctx.shadowColor = AURA[tr];
      ctx.shadowBlur = 24;
    }
    drawAnimal(ctx, a, 22);
    ctx.restore();
  }

  // slingshot front fork
  ctx.strokeStyle = '#8b5a2b';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(ax, ay + 40);
  ctx.lineTo(ax - 20, ay - 6);
  ctx.moveTo(ax, ay + 40);
  ctx.lineTo(ax + 20, ay - 6);
  ctx.stroke();

  parts.forEach(q => {
    ctx.globalAlpha = Math.min(1, q.t * 2);
    ctx.fillStyle = q.c;
    ctx.beginPath();
    ctx.arc(q.x - cam, q.y, 4, 0, 7);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  if (state === 'aim' && !drag) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('← Drag back and release', ax + 120, ay - 70);
  }
}

let last = performance.now();
(function loop(now) {
  const dt = Math.min(.033, (now - last) / 1000);
  last = now;
  if (state === 'menu' || state === 'select') {
    p = p || { x: AX, y: AY(), rot: 0, sx: 1, sy: 1 };
    cam = 0;
    draw(now / 1000);
  } else {
    update(dt);
    draw(now / 1000);
  }
  requestAnimationFrame(loop);
})(last);

$('coins').textContent = '🪙 ' + save.coins;