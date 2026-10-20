const Collision = {
    aabb(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; },
    overlapX(a, b) { return Math.min(a.x + a.w - b.x, b.x + b.w - a.x); },
    overlapY(a, b) { return Math.min(a.y + a.h - b.y, b.y + b.h - a.y); }
};

class InputHandler {
    constructor() {
        this.keys = {}; this.pressedOnce = {};
        window.addEventListener('keydown', e => {
            if (!this.keys[e.code]) this.pressedOnce[e.code] = true;
            this.keys[e.code] = true;
            if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyQ','KeyE','KeyF','KeyR','KeyT'].includes(e.code)) e.preventDefault();
        });
        window.addEventListener('keyup', e => { this.keys[e.code] = false; });
        window.addEventListener('blur', () => { this.keys = {}; this.pressedOnce = {}; });
    }
    isDown(c) { return !!this.keys[c]; }
    wasPressed(c) { if (this.pressedOnce[c]) { this.pressedOnce[c] = false; return true; } return false; }
    endFrame() { this.pressedOnce = {}; }
}

const AudioManager = {
    enabled: true, ctx: null,
    init() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { this.enabled = false; } } },
    beep(freq, dur = 0.08, type = 'square', vol = 0.06) {
        if (!this.enabled) return;
        this.init(); if (!this.ctx) return;
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type; o.frequency.value = freq; g.gain.value = vol;
        o.connect(g); g.connect(this.ctx.destination);
        const t = this.ctx.currentTime;
        o.start(t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.stop(t + dur);
    },
    jump()  { this.beep(520, 0.12, 'sine', 0.08); },
    coin()  { this.beep(880, 0.08, 'square', 0.05); setTimeout(() => this.beep(1320, 0.08, 'square', 0.04), 60); },
    hurt()  { this.beep(180, 0.18, 'sawtooth', 0.09); },
    cast()  { this.beep(660, 0.1, 'triangle', 0.07); setTimeout(() => this.beep(880, 0.12, 'sine', 0.05), 70); },
    crow()  { this.beep(400, 0.08, 'sawtooth', 0.06); setTimeout(() => this.beep(300, 0.12, 'sawtooth', 0.05), 60); },
    win()   { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.beep(f, 0.15, 'sine', 0.07), i * 100)); },
    craft() { [400, 600, 800, 1000, 1200].forEach((f, i) => setTimeout(() => this.beep(f, 0.12, 'triangle', 0.08), i * 80)); },
    bossHit() { this.beep(120, 0.15, 'sawtooth', 0.1); setTimeout(() => this.beep(80, 0.2, 'sawtooth', 0.08), 60); },
    bossRoar() { [100, 80, 120, 60].forEach((f, i) => setTimeout(() => this.beep(f, 0.2, 'sawtooth', 0.1), i * 100)); }
};

const GAME_CONFIG = {
    WIDTH: 1280, HEIGHT: 720,
    GRAVITY: 0.55, PLAYER_SPEED: 5.5, JUMP_SPEED: 14.5,
    MAX_HEALTH: 3, GROUND_Y: 640, FALL_LIMIT: 1000,
    EARTH_COOLDOWN: 3.0, EARTH_DURATION: 5.0,
    FIRE_COOLDOWN: 3.5,
    ICE_COOLDOWN: 4.0, ICE_DURATION: 5.0,
    AIR_COOLDOWN: 5.0, AIR_DURATION: 3.5,
    CROW_COOLDOWN: 8.0,
    EARTH_PILLAR_H: 120, EARTH_PILLAR_W: 70,
    ICE_PLATFORM_W: 140, ICE_PLATFORM_H: 22,
    AIR_GEYSER_H: 260, AIR_GEYSER_W: 90,
    FIRE_RANGE: 240, CROW_RANGE: 260
};

const SaveSystem = {
    KEY: 'magician_trial_v7',
    save(d) { try { localStorage.setItem(this.KEY, JSON.stringify(d)); } catch(e){} },
    load() { try { const raw = localStorage.getItem(this.KEY); if (!raw) return null; return JSON.parse(raw); } catch(e) { return null; } },
    clear() { try { localStorage.removeItem(this.KEY); } catch(e){} }
};

const SHOP_ITEMS = [
    { id: 'hat_default', type: 'hat',  name: 'Шляпа волшебника', price: 0,  color: '#1e0a3a' },
    { id: 'hat_crown',   type: 'hat',  name: 'Корона',           price: 25, color: '#ffd400' },
    { id: 'hat_horns',   type: 'hat',  name: 'Рога',             price: 30, color: '#8b1010' },
    { id: 'hat_halo',    type: 'hat',  name: 'Ореол',            price: 40, color: '#ffee88' },
    { id: 'hat_hood',    type: 'hat',  name: 'Капюшон',          price: 35, color: '#202020' },
    { id: 'robe_purple', type: 'robe', name: 'Лиловая мантия',   price: 0,  color: '#6a3fb5' },
    { id: 'robe_red',    type: 'robe', name: 'Красная мантия',   price: 30, color: '#b03030' },
    { id: 'robe_blue',   type: 'robe', name: 'Синяя мантия',     price: 30, color: '#3060c0' },
    { id: 'robe_gold',   type: 'robe', name: 'Золотая мантия',   price: 55, color: '#c09020' },
    { id: 'robe_black',  type: 'robe', name: 'Мантия тьмы',      price: 60, color: '#101018' },
    { id: 'staff_wood',  type: 'staff',name: 'Деревянный посох', price: 0,  color: '#8b5a2b' },
    { id: 'staff_cryst', type: 'staff',name: 'Кристальный посох',price: 35, color: '#4a9dcd' },
    { id: 'staff_flame', type: 'staff',name: 'Огненный посох',   price: 45, color: '#ff5500' },
    { id: 'staff_star',  type: 'staff',name: 'Звёздный посох',   price: 70, color: '#ffd400' },
];

const INGREDIENTS = [
    { id: 'moonleaf',   name: 'Лунный лист',     color: '#aad4ff', unlockedByLevel: 1 },
    { id: 'emberroot',  name: 'Огненный корень', color: '#ff8844', unlockedByLevel: 3 },
    { id: 'swampmoss',  name: 'Болотный мох',    color: '#88dd44', unlockedByLevel: 5 },
    { id: 'stardust',   name: 'Звёздная пыль',   color: '#ffe066', unlockedByLevel: 7 },
    { id: 'shadowice',  name: 'Тёмный лёд',      color: '#88aaff', unlockedByLevel: 9 },
    { id: 'crystalcore',name: 'Кристальное ядро',color: '#d580ff', unlockedByLevel: 10 },
];

const SUBSTANCES = {
    'force':     { name: 'Эссенция силы',       color: '#ff4433', shape: 'crystal', desc: 'Сгусток первородной мощи' },
    'speed':     { name: 'Эликсир скорости',    color: '#44ff88', shape: 'orb',     desc: 'Зелёная энергия движения' },
    'light':     { name: 'Светящаяся пыль',     color: '#ffe066', shape: 'star',    desc: 'Частицы чистого света' },
    'smoke':     { name: 'Дымный экстракт',     color: '#aa7733', shape: 'cloud',   desc: 'Тлеющая туманная субстанция' },
    'flame':     { name: 'Жидкое пламя',        color: '#ff4422', shape: 'flame',   desc: 'Огненная эссенция' },
    'emerald':   { name: 'Изумрудный ил',       color: '#33ffaa', shape: 'hex',     desc: 'Субстанция жизни' },
    'ice':       { name: 'Кристальный лёд',     color: '#88ddff', shape: 'snow',    desc: 'Вечное сияние холода' },
    'void':      { name: 'Тёмный кристалл',     color: '#a040ff', shape: 'ring',    desc: 'Сгусток пустоты' },
    'infinity':  { name: 'Эссенция бесконечности', color: '#ffffff', shape: 'spiral', desc: 'Начало и конец' },
    'steam':     { name: 'Паровая эссенция',    color: '#cc8844', shape: 'wisp',    desc: 'Тёплый пар' },
    'power':     { name: 'Зелье мощи',          color: '#ff8800', shape: 'burst',   desc: 'Неукротимая сила' },
    'spirit':    { name: 'Эликсир духа',        color: '#99bbff', shape: 'wisp',    desc: 'Дыхание древних' },
    'life':      { name: 'Зелье жизни',         color: '#44cc44', shape: 'orb',     desc: 'Тёплое свечение' },
    'swamp':     { name: 'Болотный лёд',        color: '#449988', shape: 'orb',     desc: 'Странная субстанция' },
    'emptiness': { name: 'Зелье пустоты',       color: '#554477', shape: 'ring',    desc: 'Ничто' }
};

const RECIPES = {
    'emberroot+moonleaf':   { name: 'Эссенция силы',           color: '#ff4433', substance: 'force' },
    'moonleaf+swampmoss':   { name: 'Эликсир скорости',        color: '#44ff88', substance: 'speed' },
    'moonleaf+stardust':    { name: 'Светящаяся пыль',         color: '#ffe066', substance: 'light' },
    'emberroot+swampmoss':  { name: 'Дымный экстракт',         color: '#aa7733', substance: 'smoke' },
    'emberroot+stardust':   { name: 'Жидкое пламя',            color: '#ff4422', substance: 'flame' },
    'stardust+swampmoss':   { name: 'Изумрудный ил',           color: '#33ffaa', substance: 'emerald' },
    'moonleaf+shadowice':   { name: 'Кристальный лёд',         color: '#88ddff', substance: 'ice' },
    'crystalcore+shadowice':{ name: 'Тёмный кристалл',         color: '#a040ff', substance: 'void' },
    'crystalcore+stardust': { name: 'Эссенция бесконечности',  color: '#ffffff', substance: 'infinity' },
    'emberroot+shadowice':  { name: 'Паровая эссенция',        color: '#cc8844', substance: 'steam' },
    'crystalcore+emberroot':{ name: 'Зелье мощи',              color: '#ff8800', substance: 'power' },
    'crystalcore+moonleaf': { name: 'Эликсир духа',            color: '#99bbff', substance: 'spirit' },
    'crystalcore+swampmoss':{ name: 'Зелье жизни',             color: '#44cc44', substance: 'life' },
    'shadowice+swampmoss':  { name: 'Болотный лёд',            color: '#449988', substance: 'swamp' },
    'shadowice+stardust':   { name: 'Зелье пустоты',           color: '#554477', substance: 'emptiness' }
};

/* ============================================================
   ПЛАТФОРМА
   ============================================================ */
class Platform {
    constructor(x, y, w, h, style = 'grass', special = null) {
        this.x = x; this.y = y; this.w = w; this.h = h;
        this.style = style; this.special = special;
        this.baseX = x; this.baseY = y;
        this.t = Math.random() * 10;
        this.phase = Math.random() * Math.PI * 2;
        this.isActive = true;
        this.alpha = 1;
        if (special === 'move-h') this.moveRange = 80 + Math.random() * 50;
        if (special === 'move-v') this.moveRange = 70 + Math.random() * 40;
        if (special === 'vanish') { this.vanishPeriod = 3.5 + Math.random() * 1.5; }
    }
    update(dt) {
        this.t += dt;
        if (this.special === 'move-h') {
            this.x = this.baseX + Math.sin(this.t * 1.2 + this.phase) * this.moveRange;
        } else if (this.special === 'move-v') {
            this.y = this.baseY + Math.sin(this.t * 1.0 + this.phase) * this.moveRange;
        } else if (this.special === 'vanish') {
            const cycle = (this.t % this.vanishPeriod) / this.vanishPeriod;
            if (cycle < 0.55) { this.isActive = true; this.alpha = 1; }
            else if (cycle < 0.65) { this.isActive = false; this.alpha = 1 - (cycle - 0.55) / 0.1; }
            else if (cycle < 0.9) { this.isActive = false; this.alpha = 0; }
            else { this.isActive = false; this.alpha = (cycle - 0.9) / 0.1; if (this.alpha > 0.3) this.isActive = true; }
        }
    }
    getBounds() {
        if (!this.isActive) return null;
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
    draw(ctx, camera) {
        const sx = this.x - camera.x, sy = this.y - camera.y;
        if (sx + this.w < -80 || sx > GAME_CONFIG.WIDTH + 80) return;
        if (sy + this.h < -80 || sy > GAME_CONFIG.HEIGHT + 200) return;
        if (!this.isActive && this.alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.alpha;

        if (this.special === 'move-h' || this.special === 'move-v') {
            const pulse = 0.4 + 0.3 * Math.sin(this.t * 4);
            const col = this.special === 'move-h' ? '140, 200, 255' : '255, 200, 100';
            const auraG = ctx.createRadialGradient(sx + this.w/2, sy + this.h/2, 5, sx + this.w/2, sy + this.h/2, this.w/2 + 30);
            auraG.addColorStop(0, `rgba(${col}, ${pulse})`);
            auraG.addColorStop(1, `rgba(${col}, 0)`);
            ctx.fillStyle = auraG;
            ctx.beginPath(); ctx.arc(sx + this.w/2, sy + this.h/2, this.w/2 + 30, 0, Math.PI * 2); ctx.fill();
        } else if (this.special === 'vanish') {
            const pulse = 0.4 + 0.3 * Math.sin(this.t * 6);
            const auraG = ctx.createRadialGradient(sx + this.w/2, sy + this.h/2, 5, sx + this.w/2, sy + this.h/2, this.w/2 + 25);
            auraG.addColorStop(0, `rgba(255, 150, 255, ${pulse})`);
            auraG.addColorStop(1, 'rgba(255, 150, 255, 0)');
            ctx.fillStyle = auraG;
            ctx.beginPath(); ctx.arc(sx + this.w/2, sy + this.h/2, this.w/2 + 25, 0, Math.PI * 2); ctx.fill();
        }

        switch (this.style) {
            case 'grass':  this.drawGrass(ctx, sx, sy); break;
            case 'stone':  this.drawStone(ctx, sx, sy); break;
            case 'moss':   this.drawMoss(ctx, sx, sy); break;
            case 'ice':    this.drawIce(ctx, sx, sy); break;
            case 'crystal':this.drawCrystal(ctx, sx, sy); break;
            case 'ruin':   this.drawRuin(ctx, sx, sy); break;
            case 'cloud':  this.drawCloud(ctx, sx, sy); break;
            default:       this.drawGrass(ctx, sx, sy);
        }

        if (this.special === 'move-h' || this.special === 'move-v') {
            const sym = this.special === 'move-h' ? '↔' : '↕';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = "bold 16px Nunito, sans-serif";
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(140, 200, 255, 0.9)';
            ctx.shadowBlur = 8;
            ctx.fillText(sym, sx + this.w/2, sy + this.h + 16);
            ctx.shadowBlur = 0;
        } else if (this.special === 'vanish') {
            const cycle = (this.t % this.vanishPeriod) / this.vanishPeriod;
            if (cycle >= 0.4 && cycle < 0.55) {
                const blink = 0.5 + 0.5 * Math.sin(this.t * 20);
                ctx.strokeStyle = `rgba(255, 150, 255, ${blink})`;
                ctx.lineWidth = 2;
                ctx.strokeRect(sx - 2, sy - 2, this.w + 4, this.h + 4);
            }
        }
        ctx.restore();
    }

    drawGrass(ctx, sx, sy) {
        const shadowG = ctx.createLinearGradient(sx, sy + this.h, sx, sy + this.h + 14);
        shadowG.addColorStop(0, 'rgba(0,0,0,0.5)'); shadowG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowG; ctx.fillRect(sx + 4, sy + this.h, this.w, 14);
        const g = ctx.createLinearGradient(sx, sy, sx, sy + this.h);
        g.addColorStop(0, '#8b6a45'); g.addColorStop(0.35, '#6a4f30'); g.addColorStop(1, '#2e1e10');
        ctx.fillStyle = g; ctx.fillRect(sx, sy, this.w, this.h);
        ctx.fillStyle = 'rgba(100, 75, 45, 0.7)';
        for (let i = 0; i < this.w; i += 24) {
            const cx = sx + i + ((i * 13) % 10);
            const cy = sy + 24 + ((i * 7) % (this.h - 30));
            const r = 2 + ((i * 3) % 3);
            ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
        }
        const gt = ctx.createLinearGradient(sx, sy, sx, sy + 14);
        gt.addColorStop(0, '#7ab04a'); gt.addColorStop(0.5, '#5a8a3a'); gt.addColorStop(1, '#3e6228');
        ctx.fillStyle = gt; ctx.fillRect(sx, sy, this.w, 14);
        const time = performance.now() / 800;
        for (let i = 0; i < this.w; i += 7) {
            const h = 5 + ((i * 7) % 7);
            const sway = Math.sin(time + i * 0.15) * 2;
            const grd = ctx.createLinearGradient(sx + i, sy - h, sx + i, sy);
            grd.addColorStop(0, '#a0d060'); grd.addColorStop(1, '#4e7a3f');
            ctx.strokeStyle = grd; ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(sx + i + 2, sy + 1);
            ctx.quadraticCurveTo(sx + i + 3 + sway, sy - h * 0.6, sx + i + 3 + sway * 1.5, sy - h);
            ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(200, 255, 160, 0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(sx, sy + 0.5); ctx.lineTo(sx + this.w, sy + 0.5); ctx.stroke();
    }
    drawStone(ctx, sx, sy) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(sx + 4, sy + this.h, this.w, 14);
        const g = ctx.createLinearGradient(sx, sy, sx, sy + this.h);
        g.addColorStop(0, '#9a9aa8'); g.addColorStop(0.3, '#6a6a78'); g.addColorStop(1, '#2a2a34');
        ctx.fillStyle = g; ctx.fillRect(sx, sy, this.w, this.h);
        ctx.strokeStyle = 'rgba(20, 20, 30, 0.7)'; ctx.lineWidth = 1.5;
        const bh = 20, bw = 34;
        for (let row = 0; row * bh < this.h; row++) {
            const offsetX = (row % 2) * (bw / 2);
            for (let col = -1; col * bw < this.w; col++) {
                const bx = sx + col * bw + offsetX;
                const by = sy + row * bh;
                if (bx + bw > sx && bx < sx + this.w) ctx.strokeRect(bx, by, bw, bh);
            }
        }
        ctx.fillStyle = '#b8b8c8'; ctx.fillRect(sx, sy, this.w, 3);
        ctx.fillStyle = '#e0e0f0'; ctx.fillRect(sx, sy, this.w, 1);
    }
    drawMoss(ctx, sx, sy) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(sx + 4, sy + this.h, this.w, 14);
        const g = ctx.createLinearGradient(sx, sy, sx, sy + this.h);
        g.addColorStop(0, '#4a5c38'); g.addColorStop(0.4, '#324028'); g.addColorStop(1, '#182018');
        ctx.fillStyle = g; ctx.fillRect(sx, sy, this.w, this.h);
        ctx.fillStyle = '#5a7a3e'; ctx.fillRect(sx, sy, this.w, 10);
        const time = performance.now() / 600;
        for (let i = 0; i < this.w; i += 6) {
            const hh = 4 + ((i * 13) % 6);
            const glow = 0.7 + 0.3 * Math.sin(time + i);
            const g2 = ctx.createRadialGradient(sx + i + 2, sy - hh / 2, 0, sx + i + 2, sy - hh / 2, 4);
            g2.addColorStop(0, `rgba(140, 200, 80, ${glow})`);
            g2.addColorStop(1, 'rgba(60, 100, 40, 0)');
            ctx.fillStyle = g2;
            ctx.beginPath(); ctx.arc(sx + i + 2, sy - hh / 2, 4, 0, Math.PI * 2); ctx.fill();
        }
    }
    drawIce(ctx, sx, sy) {
        ctx.fillStyle = 'rgba(0,20,60,0.5)';
        ctx.fillRect(sx + 4, sy + this.h, this.w, 14);
        const g = ctx.createLinearGradient(sx, sy, sx, sy + this.h);
        g.addColorStop(0, '#e8f6ff'); g.addColorStop(0.3, '#a8d8ee'); g.addColorStop(0.7, '#6a9cc0'); g.addColorStop(1, '#3a6080');
        ctx.fillStyle = g; ctx.fillRect(sx, sy, this.w, this.h);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'; ctx.lineWidth = 1;
        for (let i = 6; i < this.w; i += 18) {
            ctx.beginPath();
            ctx.moveTo(sx + i, sy + 4);
            ctx.lineTo(sx + i + 5, sy + this.h * 0.5);
            ctx.lineTo(sx + i + 2, sy + this.h - 4);
            ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; ctx.fillRect(sx, sy, this.w, 3);
    }
    drawCrystal(ctx, sx, sy) {
        ctx.fillStyle = 'rgba(40,10,80,0.5)';
        ctx.fillRect(sx + 4, sy + this.h, this.w, 14);
        const g = ctx.createLinearGradient(sx, sy, sx, sy + this.h);
        g.addColorStop(0, '#b590e8'); g.addColorStop(0.4, '#7a52b0'); g.addColorStop(1, '#3a1e68');
        ctx.fillStyle = g; ctx.fillRect(sx, sy, this.w, this.h);
        for (let i = 0; i < this.w; i += 22) {
            const cg = ctx.createLinearGradient(sx + i, sy - 14, sx + i + 12, sy + this.h);
            cg.addColorStop(0, 'rgba(230, 210, 255, 0.95)');
            cg.addColorStop(0.5, 'rgba(170, 120, 230, 0.7)');
            cg.addColorStop(1, 'rgba(80, 40, 140, 0.4)');
            ctx.fillStyle = cg;
            ctx.beginPath();
            ctx.moveTo(sx + i, sy); ctx.lineTo(sx + i + 8, sy - 14); ctx.lineTo(sx + i + 16, sy);
            ctx.closePath(); ctx.fill();
        }
        const pulse = 0.3 + 0.2 * Math.sin(performance.now() / 700 + sx * 0.05);
        ctx.fillStyle = `rgba(200, 150, 255, ${pulse})`;
        ctx.fillRect(sx, sy - 4, this.w, 8);
    }
    drawRuin(ctx, sx, sy) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(sx + 4, sy + this.h, this.w, 12);
        const g = ctx.createLinearGradient(sx, sy, sx, sy + this.h);
        g.addColorStop(0, '#d0b890'); g.addColorStop(0.3, '#a89068'); g.addColorStop(1, '#4a3a28');
        ctx.fillStyle = g; ctx.fillRect(sx, sy, this.w, this.h);
        ctx.strokeStyle = 'rgba(60, 40, 20, 0.7)'; ctx.lineWidth = 1.5;
        const bh = 18, bw = 40;
        for (let row = 0; row * bh < this.h; row++) {
            const offsetX = (row % 2) * (bw / 2);
            for (let col = -1; col * bw < this.w; col++) {
                ctx.strokeRect(sx + col * bw + offsetX, sy + row * bh, bw, bh);
            }
        }
        const topG = ctx.createLinearGradient(sx, sy, sx, sy + 6);
        topG.addColorStop(0, '#f0dcc0'); topG.addColorStop(1, 'rgba(220, 200, 160, 0)');
        ctx.fillStyle = topG; ctx.fillRect(sx, sy, this.w, 6);
    }
    drawCloud(ctx, sx, sy) {
        const g = ctx.createLinearGradient(sx, sy - 8, sx, sy + this.h + 10);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#e0e8f8'); g.addColorStop(1, '#8098c0');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(sx, sy + this.h);
        const bumps = Math.ceil(this.w / 36);
        for (let i = 0; i <= bumps; i++) {
            const px = sx + (i * this.w / bumps);
            const r = 16 + ((i * 7) % 12);
            ctx.arc(px, sy + 10, r, Math.PI, 0);
        }
        ctx.lineTo(sx + this.w, sy + this.h);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        for (let i = 0; i < this.w; i += 20) {
            const r = 10 + ((i * 5) % 6);
            ctx.beginPath(); ctx.arc(sx + i + 10, sy + 10, r * 0.5, Math.PI, 0); ctx.fill();
        }
    }
}

/* ============================================================
   ОПАСНОСТИ
   ============================================================ */
class Fire {
    constructor(x, y, w = 42, h = 55, period = 2.4, phase = 0) {
        this.x = x; this.y = y; this.w = w; this.h = h;
        this.period = period; this.timer = phase; this.on = false;
        this.particles = [];
    }
    update(dt) {
        this.timer += dt;
        const t = (this.timer % this.period) / this.period;
        this.on = t < 0.55;
        if (this.on && Math.random() < 0.7) {
            this.particles.push({ x: this.x + Math.random() * this.w, y: this.y, vx: (Math.random() - 0.5) * 40, vy: -40 - Math.random() * 80, life: 0.4 + Math.random() * 0.5, maxLife: 0.9 });
        }
        for (const p of this.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 40 * dt; p.life -= dt; }
        this.particles = this.particles.filter(p => p.life > 0);
    }
    getBounds() { return this.on ? { x: this.x + 4, y: this.y - this.h * 0.8, w: this.w - 8, h: this.h * 0.8 } : null; }
    draw(ctx, camera) {
        const sx = this.x - camera.x, sy = this.y - camera.y;
        const gl = ctx.createRadialGradient(sx + this.w / 2, sy - this.h / 2, 5, sx + this.w / 2, sy - this.h / 2, this.h * 2);
        gl.addColorStop(0, this.on ? 'rgba(255, 140, 40, 0.6)' : 'rgba(255, 100, 0, 0.15)');
        gl.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = gl;
        ctx.beginPath(); ctx.arc(sx + this.w / 2, sy - this.h / 2, this.h * 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2a1a0a'; ctx.fillRect(sx - 2, sy - 6, this.w + 4, 8);
        if (this.on) {
            const fl = Math.sin(this.timer * 22) * 4;
            ctx.fillStyle = '#ff2200';
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(sx + this.w / 2, sy - this.h - fl - 5, sx + this.w, sy);
            ctx.lineTo(sx + this.w, sy + 4); ctx.lineTo(sx, sy + 4); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#ff8800';
            ctx.beginPath();
            ctx.moveTo(sx + 5, sy);
            ctx.quadraticCurveTo(sx + this.w / 2, sy - this.h * 0.75 - fl, sx + this.w - 5, sy);
            ctx.lineTo(sx + this.w - 5, sy + 2); ctx.lineTo(sx + 5, sy + 2); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#ffdd66';
            ctx.beginPath();
            ctx.moveTo(sx + 12, sy);
            ctx.quadraticCurveTo(sx + this.w / 2, sy - this.h * 0.45, sx + this.w - 12, sy);
            ctx.lineTo(sx + this.w - 12, sy + 1); ctx.lineTo(sx + 12, sy + 1); ctx.closePath(); ctx.fill();
        }
    }
}

class Tentacle {
    constructor(x, baseY, maxHeight = 130, period = 3.2, phase = 0, w = 24) {
        this.x = x; this.baseY = baseY; this.maxHeight = maxHeight;
        this.period = period; this.timer = phase; this.w = w; this.height = 0;
    }
    update(dt) {
        this.timer += dt;
        const t = (this.timer % this.period) / this.period;
        let h;
        if (t < 0.2) h = this.maxHeight * (t / 0.2);
        else if (t < 0.5) h = this.maxHeight;
        else if (t < 0.7) h = this.maxHeight * (1 - (t - 0.5) / 0.2);
        else h = 0;
        this.height = h;
    }
    getBounds() {
        if (this.height < 25) return null;
        return { x: this.x - this.w / 2 + 4, y: this.baseY - this.height, w: this.w - 8, h: this.height };
    }
    draw(ctx, camera) {
        if (this.height < 4) return;
        const sx = this.x - camera.x;
        const baseY = this.baseY - camera.y;
        const segs = 10, pts = [];
        for (let i = 0; i <= segs; i++) {
            const t = i / segs;
            const y = baseY - this.height * t;
            const wave = Math.sin(this.timer * 5 + t * 4) * 12 * t;
            pts.push({ x: sx + wave, y });
        }
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#0e2a10'; ctx.lineWidth = this.w;
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
        ctx.strokeStyle = '#2a5e20'; ctx.lineWidth = this.w * 0.7;
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
        ctx.fillStyle = '#8a2a2a';
        for (let i = 1; i < pts.length - 1; i++) {
            ctx.beginPath(); ctx.arc(pts[i].x - 4, pts[i].y, 2.5, 0, Math.PI * 2); ctx.fill();
        }
    }
}

class Spike {
    constructor(x, y, w, count = 4) {
        this.x = x; this.y = y; this.w = w;
        this.count = count; this.h = 34;
    }
    getBounds() { return { x: this.x + 2, y: this.y - this.h + 6, w: this.w - 4, h: this.h - 6 }; }
    draw(ctx, camera) {
        const sx = this.x - camera.x, sy = this.y - camera.y;
        const step = this.w / this.count;
        for (let i = 0; i < this.count; i++) {
            const px = sx + i * step;
            const g = ctx.createLinearGradient(px, sy - this.h, px, sy);
            g.addColorStop(0, '#f0f4ff'); g.addColorStop(0.4, '#9aaac8'); g.addColorStop(1, '#3a4460');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(px + 2, sy);
            ctx.lineTo(px + step / 2, sy - this.h);
            ctx.lineTo(px + step - 2, sy);
            ctx.closePath(); ctx.fill();
        }
    }
}

class Torch {
    constructor(x, y, radius = 240) {
        this.x = x; this.y = y; this.radius = radius;
        this.t = Math.random() * 100;
    }
    update(dt) { this.t += dt; }
    getLightRadius() {
        return this.radius * (0.92 + 0.08 * Math.sin(this.t * 8) + 0.03 * Math.sin(this.t * 17));
    }
    draw(ctx, camera) {
        const sx = this.x - camera.x, sy = this.y - camera.y;
        if (sx < -100 || sx > GAME_CONFIG.WIDTH + 100) return;
        ctx.fillStyle = '#4a2f18'; ctx.fillRect(sx - 3, sy - 46, 6, 46);
        ctx.fillStyle = '#2a1a0a';
        ctx.beginPath(); ctx.arc(sx, sy - 46, 6, 0, Math.PI * 2); ctx.fill();
        const fl = Math.sin(this.t * 15) * 3;
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(sx - 8, sy - 48);
        ctx.quadraticCurveTo(sx, sy - 78 - fl, sx + 8, sy - 48);
        ctx.lineTo(sx + 8, sy - 46); ctx.lineTo(sx - 8, sy - 46); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffcc44';
        ctx.beginPath();
        ctx.moveTo(sx - 4, sy - 48);
        ctx.quadraticCurveTo(sx, sy - 66 - fl * 0.6, sx + 4, sy - 48);
        ctx.lineTo(sx + 4, sy - 46); ctx.lineTo(sx - 4, sy - 46); ctx.closePath(); ctx.fill();
    }
}

/* ============================================================
   ВРАГ
   ============================================================ */
class Guardian {
    constructor(x, y, element = 'earth') {
        this.x = x; this.y = y;
        this.w = 48; this.h = 72;
        this.vx = 1.0;
        this.minX = Math.max(20, x - 150);
        this.maxX = x + 150;
        this.element = element;
        this.dead = false;
        this.deathTimer = 0;
        this.t = Math.random() * 10;
        this.hp = element === 'final' ? 2 : 1;
    }
    update(dt) {
        this.t += dt;
        if (this.dead) { this.deathTimer += dt; return; }
        this.x += this.vx;
        if (this.x < this.minX) { this.x = this.minX; this.vx = Math.abs(this.vx); }
        if (this.x + this.w > this.maxX) { this.x = this.maxX - this.w; this.vx = -Math.abs(this.vx); }
    }
    getBounds() { return { x: this.x + 6, y: this.y + 6, w: this.w - 12, h: this.h - 6 }; }
    kill() { this.hp--; if (this.hp <= 0) { this.dead = true; this.deathTimer = 0; } }
    getColors() {
        return {
            earth: { body1: '#3e6a2e', body2: '#2e4a1e', head1: '#4a8a2e', head2: '#1a3a10', eye: '#50ff64', accent: '#8b6a2a' },
            fire:  { body1: '#6a2e1e', body2: '#4a1e10', head1: '#8a3a1a', head2: '#3a0e08', eye: '#ff8030', accent: '#ff4400' },
            water: { body1: '#1e4a6a', body2: '#10304a', head1: '#2a6a9a', head2: '#0e2a4a', eye: '#60d0ff', accent: '#4ad0ff' },
            air:   { body1: '#8a9ac0', body2: '#5a6a90', head1: '#a0b0d0', head2: '#3a4a70', eye: '#e0f0ff', accent: '#c0d0ff' },
            final: { body1: '#5a2e6a', body2: '#3a1050', head1: '#7a4a9a', head2: '#2a1050', eye: '#ff80ff', accent: '#c040ff' }
        }[this.element];
    }
    draw(ctx, camera) {
        const sx = this.x - camera.x, sy = this.y - camera.y;
        const a = this.dead ? Math.max(0, 1 - this.deathTimer * 1.8) : 1;
        const col = this.getColors();
        const sway = Math.sin(this.t * 2) * 3;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(sx + this.w / 2, sy + this.h + 4, this.w / 2 + 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        const bodyG = ctx.createLinearGradient(sx, sy, sx, sy + this.h);
        bodyG.addColorStop(0, col.body1);
        bodyG.addColorStop(0.5, col.body2);
        bodyG.addColorStop(1, '#0a0202');
        ctx.fillStyle = bodyG;
        ctx.beginPath();
        ctx.moveTo(sx + 8, sy + this.h);
        ctx.quadraticCurveTo(sx + 4, sy + 40, sx + 6 + sway, sy + 24);
        ctx.lineTo(sx + this.w - 6 + sway, sy + 24);
        ctx.quadraticCurveTo(sx + this.w - 4, sy + 40, sx + this.w - 8, sy + this.h);
        ctx.closePath(); ctx.fill();
        const headY = sy + 20 + sway * 0.3;
        const headG = ctx.createRadialGradient(sx + this.w/2 + sway, headY, 2, sx + this.w/2 + sway, headY, 20);
        headG.addColorStop(0, col.head1);
        headG.addColorStop(1, col.head2);
        ctx.fillStyle = headG;
        ctx.beginPath(); ctx.arc(sx + this.w/2 + sway, headY, 17, 0, Math.PI * 2); ctx.fill();
        const eyeCol = this.dead ? '#333' : col.eye;
        ctx.fillStyle = eyeCol;
        ctx.shadowColor = eyeCol;
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(sx + this.w/2 - 6 + sway, headY - 2, 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx + this.w/2 + 6 + sway, headY - 2, 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

/* ============================================================
   МАГИЯ
   ============================================================ */
class EarthPillar {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.w = GAME_CONFIG.EARTH_PILLAR_W; this.h = GAME_CONFIG.EARTH_PILLAR_H;
        this.life = GAME_CONFIG.EARTH_DURATION; this.growT = 0;
    }
    update(dt) { this.life -= dt; this.growT = Math.min(1, this.growT + dt * 6); return this.life > 0; }
    getBounds() {
        if (this.growT < 0.5) return null;
        const grownH = this.h * this.growT;
        return { x: this.x, y: this.y - grownH, w: this.w, h: grownH };
    }
    draw(ctx, camera) {
        const sx = this.x - camera.x, sy = this.y - camera.y;
        const growH = this.h * this.growT;
        const topY = sy - growH;
        const a = Math.min(1, this.life * 2);
        ctx.globalAlpha = a;
        const g = ctx.createLinearGradient(sx, topY, sx + this.w, topY + growH);
        g.addColorStop(0, '#8a7048'); g.addColorStop(0.5, '#6a5030'); g.addColorStop(1, '#3a2818');
        ctx.fillStyle = g;
        ctx.fillRect(sx, topY, this.w, growH);
        ctx.fillStyle = 'rgba(160, 255, 140, 0.5)';
        ctx.fillRect(sx, topY - 2, this.w, 4);
        ctx.globalAlpha = 1;
    }
}
class IcePlatform {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.w = GAME_CONFIG.ICE_PLATFORM_W; this.h = GAME_CONFIG.ICE_PLATFORM_H;
        this.life = GAME_CONFIG.ICE_DURATION;
    }
    update(dt) { this.life -= dt; return this.life > 0; }
    getBounds() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
    draw(ctx, camera) {
        const sx = this.x - camera.x, sy = this.y - camera.y;
        const a = Math.min(1, this.life * 2);
        ctx.globalAlpha = a;
        const g = ctx.createLinearGradient(sx, sy, sx, sy + this.h);
        g.addColorStop(0, '#eaf6ff'); g.addColorStop(0.4, '#b8ddf0'); g.addColorStop(1, '#5a90b8');
        ctx.fillStyle = g;
        ctx.fillRect(sx, sy, this.w, this.h);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(sx, sy, this.w, 3);
        ctx.globalAlpha = 1;
    }
}
class AirGeyser {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.w = GAME_CONFIG.AIR_GEYSER_W; this.h = GAME_CONFIG.AIR_GEYSER_H;
        this.life = GAME_CONFIG.AIR_DURATION; this.particles = [];
    }
    update(dt) {
        this.life -= dt;
        if (this.life > 0 && Math.random() < 0.8) {
            this.particles.push({ x: this.x + this.w / 2 + (Math.random() - 0.5) * this.w * 0.8, y: this.y + this.h, vy: -180 - Math.random() * 120, vx: (Math.random() - 0.5) * 40, life: 0.8, maxLife: 0.8, size: 2 + Math.random() * 3 });
        }
        for (const p of this.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
        this.particles = this.particles.filter(p => p.life > 0);
        return this.life > 0;
    }
    getBounds() { return this.life > 0 ? { x: this.x, y: this.y, w: this.w, h: this.h } : null; }
    contains(p) {
        if (this.life <= 0) return false;
        return p.centerX > this.x && p.centerX < this.x + this.w && p.centerY > this.y && p.centerY < this.y + this.h;
    }
    draw(ctx, camera) {
        const sx = this.x - camera.x, sy = this.y - camera.y;
        const a = Math.min(1, this.life * 2);
        ctx.globalAlpha = a;
        const g = ctx.createLinearGradient(sx + this.w/2, sy + this.h, sx + this.w/2, sy);
        g.addColorStop(0, 'rgba(200, 230, 255, 0.5)');
        g.addColorStop(1, 'rgba(220, 240, 255, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(sx, sy, this.w, this.h);
        for (const p of this.particles) {
            ctx.globalAlpha = (p.life / p.maxLife) * a;
            ctx.fillStyle = 'rgba(220, 240, 255, 0.9)';
            ctx.beginPath(); ctx.arc(p.x - camera.x, p.y - camera.y, p.size, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

/* ============================================================
   ВОРОН
   ============================================================ */
class Crow {
    constructor() {
        this.x = 0; this.y = 0;
        this.bobTimer = 0; this.wingTimer = 0;
        this.initialized = false;
        this.trail = [];
        this.mode = 'follow';
        this.diveTimer = 0;
        this.targetX = 0; this.targetY = 0;
        this.helpCooldown = 0;
        this.facing = 1;
    }
    useHelp(player, level, boss) {
        if (this.helpCooldown > 0) return false;
        this.mode = 'dive';
        this.diveTimer = 1.8;
        if (boss && !boss.dead) {
            this.targetX = boss.x + boss.w / 2;
            this.targetY = boss.y + boss.h * 0.35;
        } else {
            this.targetX = Math.min(player.x + 400, level.width - 100);
            this.targetY = player.y - 200;
        }
        this.helpCooldown = 8;
        AudioManager.crow();
        return true;
    }
    update(dt, player) {
        if (!player) return;
        this.bobTimer += dt;
        this.wingTimer += dt;
        this.helpCooldown = Math.max(0, this.helpCooldown - dt);

        let targetX, targetY;
        if (this.mode === 'dive') {
            this.diveTimer -= dt;
            targetX = this.targetX;
            targetY = this.targetY;
            if (this.diveTimer <= 0) this.mode = 'return';
        } else {
            const side = player.facing === 'right' ? -60 : player.w + 60;
            targetX = player.x + side;
            targetY = player.y - 80 + Math.sin(this.bobTimer * 2.2) * 14;
        }
        if (!this.initialized) { this.x = targetX; this.y = targetY; this.initialized = true; }
        const dx = targetX - this.x;
        const lerp = this.mode === 'dive' ? 0.06 : 0.09;
        this.x += dx * lerp;
        this.y += (targetY - this.y) * lerp;

        if (Math.abs(dx) > 0.5) this.facing = dx > 0 ? 1 : -1;
        else this.facing = player.facing === 'right' ? 1 : -1;

        this.trail.push({ x: this.x, y: this.y, life: 0.6 });
        for (const t of this.trail) t.life -= dt;
        this.trail = this.trail.filter(t => t.life > 0);
        if (this.trail.length > 24) this.trail.shift();
    }
    draw(ctx, camera) {
        const sx = this.x - camera.x, sy = this.y - camera.y;
        const flap = Math.sin(this.wingTimer * 12);
        const flapAngle = flap * 0.6;

        for (const t of this.trail) {
            const alpha = (t.life / 0.6) * 0.3;
            ctx.fillStyle = `rgba(60, 40, 80, ${alpha})`;
            ctx.beginPath();
            ctx.arc(t.x - camera.x, t.y - camera.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        const glowG = ctx.createRadialGradient(sx, sy, 3, sx, sy, 40);
        glowG.addColorStop(0, 'rgba(140, 90, 200, 0.35)');
        glowG.addColorStop(1, 'rgba(140, 90, 200, 0)');
        ctx.fillStyle = glowG;
        ctx.beginPath(); ctx.arc(sx, sy, 40, 0, Math.PI * 2); ctx.fill();

        ctx.save();
        ctx.translate(sx, sy);
        ctx.scale(this.facing, 1);

        ctx.save();
        ctx.translate(0, -2);
        ctx.rotate(-flapAngle * 0.9 - 0.15);
        const wingFarG = ctx.createLinearGradient(0, -8, 0, 8);
        wingFarG.addColorStop(0, '#1a1a28'); wingFarG.addColorStop(1, '#06060e');
        ctx.fillStyle = wingFarG;
        ctx.beginPath();
        ctx.moveTo(-2, -4);
        ctx.quadraticCurveTo(-22, -14, -30, -2);
        ctx.quadraticCurveTo(-22, 6, -2, 6);
        ctx.closePath(); ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(0, -2);
        ctx.rotate(flapAngle * 0.9 + 0.15);
        const wingNearG = ctx.createLinearGradient(0, -10, 0, 10);
        wingNearG.addColorStop(0, '#2a2a3e'); wingNearG.addColorStop(1, '#101020');
        ctx.fillStyle = wingNearG;
        ctx.beginPath();
        ctx.moveTo(-2, -4);
        ctx.quadraticCurveTo(-24, -16, -34, -2);
        ctx.quadraticCurveTo(-22, 8, -2, 6);
        ctx.closePath(); ctx.fill();
        ctx.restore();

        const bodyG = ctx.createRadialGradient(2, -3, 2, 0, 0, 16);
        bodyG.addColorStop(0, '#4a4a5e'); bodyG.addColorStop(0.6, '#1e1e2e'); bodyG.addColorStop(1, '#0a0a14');
        ctx.fillStyle = bodyG;
        ctx.beginPath(); ctx.ellipse(0, 0, 15, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(80, 80, 110, 0.7)';
        ctx.beginPath(); ctx.ellipse(2, 3, 9, 6, 0, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#0e0e1c';
        ctx.beginPath();
        ctx.moveTo(-13, -2);
        ctx.lineTo(-26, -8);
        ctx.lineTo(-28, 2);
        ctx.lineTo(-26, 8);
        ctx.lineTo(-13, 4);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = '#15151f';
        ctx.beginPath(); ctx.arc(12, -8, 8, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#c08040';
        ctx.beginPath();
        ctx.moveTo(20, -8);
        ctx.lineTo(28, -6);
        ctx.lineTo(20, -5);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#8a5020';
        ctx.beginPath();
        ctx.moveTo(20, -6);
        ctx.lineTo(27, -6);
        ctx.lineTo(20, -5);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(14, -9, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath(); ctx.arc(14.5, -9, 1.2, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
    }
}

/* ============================================================
   ИГРОК
   ============================================================ */
class Player {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.w = 44; this.h = 62;
        this.vx = 0; this.vy = 0;
        this.onGround = false;
        this.facing = 'right';
        this.health = 3; this.maxHealth = 3;
        this.animTimer = 0;
        this.walkPhase = 0;
        this.blinkTimer = 0;
        this.blink = false;
        this.coyoteTimer = 0; this.coyoteTime = 0.1;
        this.jumpBufferTimer = 0; this.jumpBufferTime = 0.15;
        this.invulnTimer = 0;
        this.robeSway = 0; this.capeSway = 0;
        this.breathTimer = 0;
        this.jumpSquash = 0;
        this.landSquash = 0;
        this.wasOnGround = false;
        this.appearance = { hat: 'hat_default', robe: 'robe_purple', staff: 'staff_wood' };
        this.earthCd = 0; this.fireCd = 0; this.iceCd = 0; this.airCd = 0; this.crowCd = 0;
        this.inAirGeyser = false;
    }
    getBounds() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
    get centerX() { return this.x + this.w / 2; }
    get centerY() { return this.y + this.h / 2; }

    handleInput(input, dt) {
        let moveX = 0;
        if (input.isDown('KeyA') || input.isDown('ArrowLeft'))  moveX -= 1;
        if (input.isDown('KeyD') || input.isDown('ArrowRight')) moveX += 1;
        this.vx = moveX * GAME_CONFIG.PLAYER_SPEED;
        if (moveX < 0) this.facing = 'left';
        else if (moveX > 0) this.facing = 'right';

        const moving = Math.abs(this.vx) > 0.1;
        if (moving && this.onGround) this.walkPhase += dt * 12;
        else this.walkPhase += dt * 2;

        this.animTimer += dt;
        this.breathTimer += dt;

        this.blinkTimer += dt;
        if (this.blinkTimer > 3.2) {
            this.blink = true;
            if (this.blinkTimer > 3.32) { this.blink = false; this.blinkTimer = 0; }
        }

        this.capeSway += dt * 3;
        this.robeSway = Math.sin(this.walkPhase) * (moving ? 1 : 0.3);

        if (input.wasPressed('Space') || input.wasPressed('KeyW') || input.wasPressed('ArrowUp')) {
            this.jumpBufferTimer = this.jumpBufferTime;
        } else {
            this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
        }
        if (this.onGround) this.coyoteTimer = this.coyoteTime;
        else this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);

        if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
            this.vy = -GAME_CONFIG.JUMP_SPEED;
            this.onGround = false;
            this.coyoteTimer = 0; this.jumpBufferTimer = 0;
            this.jumpSquash = 1;
            AudioManager.jump();
        }
        if (this.invulnTimer > 0) this.invulnTimer -= dt;
        this.jumpSquash = Math.max(0, this.jumpSquash - dt * 4);
        this.landSquash = Math.max(0, this.landSquash - dt * 4);

        this.earthCd = Math.max(0, this.earthCd - dt);
        this.fireCd = Math.max(0, this.fireCd - dt);
        this.iceCd = Math.max(0, this.iceCd - dt);
        this.airCd = Math.max(0, this.airCd - dt);
        this.crowCd = Math.max(0, this.crowCd - dt);
    }

    applyPhysics(frameScale) {
        this.wasOnGround = this.onGround;
        this.vy += GAME_CONFIG.GRAVITY * frameScale;
        if (this.vy > 22) this.vy = 22;
        this.x += this.vx * frameScale;
        this.y += this.vy * frameScale;
    }

    hurt(d = 1) {
        if (this.invulnTimer > 0) return false;
        this.health -= d;
        this.invulnTimer = 1.2;
        AudioManager.hurt();
        return true;
    }
    respawn(x, y) { this.x = x; this.y = y; this.vx = 0; this.vy = 0; }
    getColor(type, defaultColor) {
        const item = SHOP_ITEMS.find(i => i.id === this.appearance[type]);
        return item ? item.color : defaultColor;
    }

    draw(ctx, camera) {
        if (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 20) % 2 === 0) return;
        const sx = this.x - camera.x, sy = this.y - camera.y;
        const walking = this.onGround && Math.abs(this.vx) > 0.1;
        const legSwing = walking ? Math.sin(this.walkPhase) * 7 : 0;
        const legSwing2 = walking ? Math.sin(this.walkPhase + Math.PI) * 7 : 0;
        const armSwing = walking ? Math.sin(this.walkPhase + Math.PI) * 5 : 0;
        const breath = Math.sin(this.breathTimer * 2.5) * 1.5;

        const jumpSq = this.jumpSquash;
        const landSq = this.landSquash;
        const scaleY = 1 + jumpSq * 0.15 - landSq * 0.2;
        const scaleX = 1 - jumpSq * 0.1 + landSq * 0.15;

        ctx.save();
        ctx.translate(sx + this.w / 2, sy + this.h);
        ctx.scale(scaleX, scaleY);
        ctx.translate(-this.w / 2, -this.h);

        if (this.onGround) {
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.ellipse(this.w / 2, this.h + 4, this.w / 2 + 4, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.inAirGeyser) {
            const pulse = 0.5 + 0.5 * Math.sin(this.animTimer * 8);
            const g = ctx.createRadialGradient(this.w/2, this.h/2, 5, this.w/2, this.h/2, 50);
            g.addColorStop(0, `rgba(180, 220, 255, ${0.4 * pulse})`);
            g.addColorStop(1, 'rgba(180, 220, 255, 0)');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(this.w/2, this.h/2, 50, 0, Math.PI * 2); ctx.fill();
        }

        ctx.fillStyle = '#1a0e28';
        ctx.fillRect(this.w / 2 - 14, this.h - 18, 11, 18 + legSwing);
        ctx.fillRect(this.w / 2 + 3, this.h - 18, 11, 18 + legSwing2);
        ctx.fillStyle = '#0a0614';
        ctx.beginPath();
        ctx.ellipse(this.w / 2 - 8, this.h - 1 + legSwing, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.w / 2 + 8, this.h - 1 + legSwing2, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        const robeColor = this.getColor('robe', '#6a3fb5');
        const capeWag = Math.sin(this.capeSway) * 4;
        ctx.fillStyle = this.darken(robeColor, 40);
        ctx.beginPath();
        ctx.moveTo(this.w / 2 - 14, 20);
        ctx.quadraticCurveTo(this.w / 2 - 20 + capeWag, this.h * 0.7, this.w / 2 - 16 + capeWag * 1.5, this.h - 4);
        ctx.lineTo(this.w / 2 + 16 + capeWag * 1.5, this.h - 4);
        ctx.quadraticCurveTo(this.w / 2 + 20 + capeWag, this.h * 0.7, this.w / 2 + 14, 20);
        ctx.closePath(); ctx.fill();

        const robeGrad = ctx.createLinearGradient(0, 14, 0, this.h - 10);
        robeGrad.addColorStop(0, this.lighten(robeColor, 25));
        robeGrad.addColorStop(0.5, robeColor);
        robeGrad.addColorStop(1, this.darken(robeColor, 35));
        ctx.fillStyle = robeGrad;
        ctx.beginPath();
        ctx.moveTo(this.w / 2 - 16 + this.robeSway, this.h - 10 + breath);
        ctx.quadraticCurveTo(this.w / 2, this.h - 2 + breath, this.w / 2 + 16 + this.robeSway, this.h - 10 + breath);
        ctx.lineTo(this.w / 2 + 11, 16);
        ctx.lineTo(this.w / 2 - 11, 16);
        ctx.closePath(); ctx.fill();

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        for (let i = -1; i <= 1; i += 2) {
            ctx.beginPath();
            ctx.moveTo(this.w / 2 + i * 3, 18);
            ctx.quadraticCurveTo(this.w / 2 + i * 6, this.h * 0.5, this.w / 2 + i * 8 + this.robeSway, this.h - 12);
            ctx.stroke();
        }

        if (robeColor !== '#101018' && robeColor !== '#202020') {
            const starA = 0.4 + 0.3 * Math.sin(this.animTimer * 2);
            ctx.fillStyle = `rgba(255, 240, 180, ${starA})`;
            for (let i = 0; i < 4; i++) {
                const sx2 = this.w / 2 - 8 + ((i * 37) % 16);
                const sy2 = 30 + ((i * 23) % 20);
                this.drawMiniStar(ctx, sx2, sy2, 1.8);
            }
        }

        ctx.fillStyle = this.darken(robeColor, 60);
        ctx.fillRect(this.w / 2 - 12, this.h - 26, 24, 7);
        ctx.fillStyle = '#ffd400';
        ctx.beginPath();
        ctx.arc(this.w / 2, this.h - 22, 3.5, 0, Math.PI * 2);
        ctx.fill();

        const staffSide = this.facing === 'right' ? 1 : -1;
        const armX = this.w / 2 + staffSide * 16;
        ctx.fillStyle = this.lighten(robeColor, 15);
        ctx.beginPath();
        ctx.ellipse(armX, 34 + armSwing, 5, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        const headY = 14 + breath;
        ctx.fillStyle = '#f8d8b8';
        ctx.beginPath();
        ctx.arc(this.w / 2, headY, 13, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(180, 130, 100, 0.3)';
        ctx.beginPath();
        ctx.arc(this.w / 2 + 5, headY + 2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(240, 140, 140, 0.5)';
        ctx.beginPath(); ctx.ellipse(this.w / 2 - 7, headY + 4, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(this.w / 2 + 7, headY + 4, 3, 2, 0, 0, Math.PI * 2); ctx.fill();

        if (!this.blink) {
            const eyeOffset = this.facing === 'right' ? 2 : -2;
            ctx.fillStyle = '#0a0a14';
            ctx.beginPath(); ctx.ellipse(this.w / 2 - 4 + eyeOffset, headY - 1, 1.6, 2, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(this.w / 2 + 4 + eyeOffset, headY - 1, 1.6, 2, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(this.w / 2 - 3.4 + eyeOffset, headY - 1.6, 0.7, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(this.w / 2 + 4.6 + eyeOffset, headY - 1.6, 0.7, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.strokeStyle = '#0a0a14';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(this.w / 2 - 6, headY - 1);
            ctx.lineTo(this.w / 2 - 2, headY - 1);
            ctx.moveTo(this.w / 2 + 2, headY - 1);
            ctx.lineTo(this.w / 2 + 6, headY - 1);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(140, 60, 60, 0.7)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(this.w / 2 + (this.facing === 'right' ? 1 : -1), headY + 6, 2.5, 0.15, Math.PI - 0.15);
        ctx.stroke();

        const hatId = this.appearance.hat;
        const hatColor = this.getColor('hat', '#1e0a3a');
        this.drawHat(ctx, hatId, hatColor, headY);

        const staffColor = this.getColor('staff', '#8b5a2b');
        const staffX = this.w / 2 + staffSide * 18;
        const staffGrad = ctx.createLinearGradient(staffX - 2, 20, staffX + 2, this.h);
        staffGrad.addColorStop(0, this.lighten(staffColor, 30));
        staffGrad.addColorStop(1, this.darken(staffColor, 30));
        ctx.strokeStyle = staffGrad;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(staffX, 22);
        ctx.quadraticCurveTo(staffX + 1, 40, staffX, this.h - 6);
        ctx.stroke();

        const gemColor = staffColor === '#8b5a2b' ? '#66ccff' :
                         staffColor === '#4a9dcd' ? '#aae0ff' :
                         staffColor === '#ff5500' ? '#ffcc44' : '#fff9a0';
        const gemPulse = 0.8 + 0.2 * Math.sin(this.animTimer * 4);
        const gemGlow = ctx.createRadialGradient(staffX, 18, 1, staffX, 18, 14 * gemPulse);
        gemGlow.addColorStop(0, gemColor);
        gemGlow.addColorStop(0.4, gemColor);
        gemGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gemGlow;
        ctx.beginPath(); ctx.arc(staffX, 18, 14 * gemPulse, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = gemColor;
        ctx.beginPath(); ctx.arc(staffX, 18, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(staffX, 18, 5.5, 0, Math.PI * 2); ctx.stroke();

        for (let i = 0; i < 3; i++) {
            const ang = this.animTimer * 3 + i * 2.1;
            ctx.fillStyle = gemColor;
            ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this.animTimer * 5 + i);
            ctx.beginPath();
            ctx.arc(staffX + Math.cos(ang) * 10, 18 + Math.sin(ang) * 10, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        ctx.restore();
    }

    drawMiniStar(ctx, cx, cy, r) {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const ang = (Math.PI / 5) * i - Math.PI / 2;
            const rr = i % 2 === 0 ? r : r * 0.45;
            const x = cx + Math.cos(ang) * rr;
            const y = cy + Math.sin(ang) * rr;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath(); ctx.fill();
    }

    drawHat(ctx, hatId, color, headY) {
        const cx = this.w / 2;
        const hy = headY - 10;
        switch (hatId) {
            case 'hat_crown':
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(cx - 15, hy + 2); ctx.lineTo(cx - 15, hy - 12);
                ctx.lineTo(cx - 9, hy - 6); ctx.lineTo(cx - 4, hy - 16);
                ctx.lineTo(cx + 4, hy - 16); ctx.lineTo(cx + 9, hy - 6);
                ctx.lineTo(cx + 15, hy - 12); ctx.lineTo(cx + 15, hy + 2);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#ff3355';
                ctx.beginPath(); ctx.arc(cx, hy - 5, 2.5, 0, Math.PI * 2); ctx.fill();
                break;
            case 'hat_horns':
                ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(cx - 9, hy - 6); ctx.quadraticCurveTo(cx - 18, hy - 22, cx - 7, hy - 26); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx + 9, hy - 6); ctx.quadraticCurveTo(cx + 18, hy - 22, cx + 7, hy - 26); ctx.stroke();
                break;
            case 'hat_halo':
                const haloGrad = ctx.createLinearGradient(cx - 16, hy - 22, cx + 16, hy - 22);
                haloGrad.addColorStop(0, 'rgba(255, 230, 100, 0.3)'); haloGrad.addColorStop(0.5, '#ffee88'); haloGrad.addColorStop(1, 'rgba(255, 230, 100, 0.3)');
                ctx.strokeStyle = haloGrad; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.ellipse(cx, hy - 20, 16, 5, 0, 0, Math.PI * 2); ctx.stroke();
                break;
            case 'hat_hood':
                ctx.fillStyle = color;
                ctx.beginPath(); ctx.arc(cx, hy - 2, 18, Math.PI, 0); ctx.lineTo(cx + 14, hy + 8); ctx.lineTo(cx - 14, hy + 8); ctx.closePath(); ctx.fill();
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.beginPath(); ctx.arc(cx, hy - 4, 11, Math.PI, 0); ctx.fill();
                break;
            default:
                const hGrad = ctx.createLinearGradient(cx, hy - 30, cx, hy + 4);
                hGrad.addColorStop(0, this.lighten(color, 30)); hGrad.addColorStop(0.5, color); hGrad.addColorStop(1, this.darken(color, 40));
                ctx.fillStyle = hGrad;
                ctx.beginPath();
                ctx.moveTo(cx - 17, hy - 4); ctx.quadraticCurveTo(cx - 20, hy - 26, cx, hy - 30);
                ctx.quadraticCurveTo(cx + 20, hy - 26, cx + 17, hy - 4);
                ctx.lineTo(cx + 14, hy + 2); ctx.lineTo(cx - 14, hy + 2);
                ctx.closePath(); ctx.fill();
                const starA = 0.6 + 0.4 * Math.sin(this.animTimer * 3);
                ctx.fillStyle = `rgba(255, 220, 100, ${starA})`;
                this.drawMiniStar(ctx, cx - 3, hy - 10, 2.5);
                this.drawMiniStar(ctx, cx + 3, hy - 18, 1.8);
                this.drawMiniStar(ctx, cx + 7, hy - 6, 1.5);
                break;
        }
    }

    lighten(hex, p) {
        if (hex.startsWith('rgb')) return hex;
        const c = hex.replace('#', '');
        const r = Math.min(255, parseInt(c.substr(0, 2), 16) + p);
        const g = Math.min(255, parseInt(c.substr(2, 2), 16) + p);
        const b = Math.min(255, parseInt(c.substr(4, 2), 16) + p);
        return `rgb(${r},${g},${b})`;
    }
    darken(hex, p) {
        if (hex.startsWith('rgb')) return hex;
        const c = hex.replace('#', '');
        const r = Math.max(0, parseInt(c.substr(0, 2), 16) - p);
        const g = Math.max(0, parseInt(c.substr(2, 2), 16) - p);
        const b = Math.max(0, parseInt(c.substr(4, 2), 16) - p);
        return `rgb(${r},${g},${b})`;
    }
}

/* ============================================================
   БОСС
   ============================================================ */
class MountainBoss {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.w = 260; this.h = 380;
        this.baseY = y;
        this.maxHp = 15;
        this.hp = 15;
        this.t = 0;
        this.state = 'idle';
        this.stateTimer = 0;
        this.throwCd = 2.5;
        this.slamCd = 6;
        this.rocks = [];
        this.shockwaves = [];
        this.hitFlash = 0;
        this.dead = false;
        this.deathTimer = 0;
        this.stunned = 0;
        this.eyeGlow = 0;
    }
    getBounds() { return { x: this.x + 30, y: this.y + 30, w: this.w - 60, h: this.h - 30 }; }
    hit(damage) {
        if (this.dead) return;
        this.hp -= damage;
        this.hitFlash = 0.4;
        this.hp = Math.max(0, this.hp);
        AudioManager.bossHit();
        if (this.hp <= 0 && !this.dead) {
            this.dead = true;
            this.deathTimer = 0;
        }
    }
    stun(duration) {
        if (this.dead) return;
        this.stunned = Math.max(this.stunned, duration);
        this.state = 'idle';
        this.stateTimer = 0;
    }
    update(dt, player, level) {
        this.t += dt;
        this.eyeGlow = 0.6 + 0.4 * Math.sin(this.t * 3);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (this.dead) {
            this.deathTimer += dt;
            this.updateProjectiles(dt);
            return;
        }
        if (this.stunned > 0) {
            this.stunned -= dt;
            this.updateProjectiles(dt);
            return;
        }

        this.stateTimer += dt;
        if (this.state === 'idle') {
            this.throwCd -= dt;
            this.slamCd -= dt;
            if (this.slamCd <= 0 && Math.abs(player.centerX - (this.x + this.w / 2)) < 500) {
                this.state = 'windup_slam';
                this.stateTimer = 0;
            } else if (this.throwCd <= 0) {
                this.state = 'windup_throw';
                this.stateTimer = 0;
            }
        } else if (this.state === 'windup_slam') {
            if (this.stateTimer > 1.0) {
                this.slam();
                this.state = 'idle';
                this.slamCd = 6 + Math.random() * 2;
                this.stateTimer = 0;
                AudioManager.bossRoar();
            }
        } else if (this.state === 'windup_throw') {
            if (this.stateTimer > 0.5) {
                this.throwRock(player);
                this.throwCd = 2.2 + Math.random();
                this.state = 'idle';
                this.stateTimer = 0;
            }
        }
        this.updateProjectiles(dt);
    }
    slam() {
        const cx = this.x + this.w / 2;
        this.shockwaves.push({ x: cx, y: GAME_CONFIG.GROUND_Y, dir: -1, life: 3.0, speed: 380 });
        this.shockwaves.push({ x: cx, y: GAME_CONFIG.GROUND_Y, dir: 1, life: 3.0, speed: 380 });
    }
    throwRock(player) {
        const startX = this.x + this.w * 0.25 + Math.random() * this.w * 0.5;
        const startY = this.y + 60;
        const targetX = player.centerX + (Math.random() - 0.5) * 100;
        const dx = targetX - startX;
        const gravity = GAME_CONFIG.GRAVITY * 60;
        const t = 1.4;
        const vx = dx / t;
        const vy = ((GAME_CONFIG.GROUND_Y - startY) - 0.5 * gravity * t * t) / t;
        this.rocks.push({ x: startX, y: startY, vx, vy, r: 22, rot: 0, trail: [] });
    }
    updateProjectiles(dt) {
        const gravity = GAME_CONFIG.GRAVITY * 60 * dt;
        for (const r of this.rocks) {
            r.trail.push({ x: r.x, y: r.y, life: 0.4 });
            r.x += r.vx * dt;
            r.y += r.vy * dt;
            r.vy += gravity;
            r.rot += dt * 4;
            for (const tr of r.trail) tr.life -= dt;
            r.trail = r.trail.filter(t => t.life > 0);
        }
        this.rocks = this.rocks.filter(r => r.y < 760);
        for (const s of this.shockwaves) {
            s.x += s.dir * s.speed * dt;
            s.life -= dt;
        }
        this.shockwaves = this.shockwaves.filter(s => s.life > 0);
    }
    getHazards() {
        const hazards = [];
        for (const r of this.rocks) {
            hazards.push({ x: r.x - r.r, y: r.y - r.r, w: r.r * 2, h: r.r * 2 });
        }
        for (const s of this.shockwaves) {
            hazards.push({ x: s.x - 22, y: GAME_CONFIG.GROUND_Y - 32, w: 44, h: 32 });
        }
        return hazards;
    }
    draw(ctx, camera) {
        const sx = this.x - camera.x;
        const sy = this.y - camera.y;
        const shake = this.hitFlash > 0 ? Math.sin(this.t * 80) * 8 : 0;
        const flash = this.hitFlash > 0 && Math.floor(this.hitFlash * 20) % 2 === 0;
        const deathAlpha = this.dead ? Math.max(0, 1 - this.deathTimer * 0.6) : 1;
        const breathe = Math.sin(this.t * 1.5) * 4;
        const windup = this.state === 'windup_slam' ? Math.sin(this.stateTimer * 20) * 6 : 0;

        ctx.save();
        ctx.globalAlpha = deathAlpha;
        ctx.translate(sx + shake + windup, sy + breathe);

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.ellipse(this.w / 2, this.h + 20, this.w / 2 + 20, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        const bodyG = ctx.createLinearGradient(0, 0, 0, this.h);
        if (flash) {
            bodyG.addColorStop(0, '#ffd0d0');
            bodyG.addColorStop(0.4, '#cc8080');
            bodyG.addColorStop(1, '#5a2020');
        } else {
            bodyG.addColorStop(0, '#7a6a5a');
            bodyG.addColorStop(0.3, '#5a4a3a');
            bodyG.addColorStop(0.7, '#3a2a1a');
            bodyG.addColorStop(1, '#1a0a02');
        }
        ctx.fillStyle = bodyG;
        ctx.beginPath();
        ctx.moveTo(20, this.h);
        ctx.lineTo(0, this.h * 0.65);
        ctx.lineTo(50, this.h * 0.25);
        ctx.lineTo(90, this.h * 0.35);
        ctx.lineTo(130, 0);
        ctx.lineTo(170, this.h * 0.35);
        ctx.lineTo(210, this.h * 0.25);
        ctx.lineTo(260, this.h * 0.65);
        ctx.lineTo(240, this.h);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const cx2 = 40 + i * 35;
            ctx.beginPath();
            ctx.moveTo(cx2, this.h * 0.3 + i * 20);
            ctx.lineTo(cx2 + 10, this.h * 0.5 + i * 15);
            ctx.lineTo(cx2 + 5, this.h * 0.8);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(240, 240, 255, 0.7)';
        ctx.beginPath();
        ctx.moveTo(130, 0);
        ctx.lineTo(115, 40);
        ctx.lineTo(130, 55);
        ctx.lineTo(150, 35);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(90, this.h * 0.35);
        ctx.lineTo(100, this.h * 0.42);
        ctx.lineTo(80, this.h * 0.42);
        ctx.closePath();
        ctx.fill();

        const eyeY = this.h * 0.35;
        const eyeGlow = this.dead ? 0 : this.eyeGlow;
        if (!this.dead) {
            const eyeGrad = ctx.createRadialGradient(95, eyeY, 2, 95, eyeY, 20);
            eyeGrad.addColorStop(0, `rgba(255, 200, 100, ${eyeGlow})`);
            eyeGrad.addColorStop(0.5, `rgba(255, 100, 0, ${eyeGlow * 0.6})`);
            eyeGrad.addColorStop(1, 'rgba(255, 60, 0, 0)');
            ctx.fillStyle = eyeGrad;
            ctx.beginPath(); ctx.arc(95, eyeY, 20, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(165, eyeY, 20, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = this.dead ? '#333' : `rgba(255, ${100 + eyeGlow * 155}, 20, 1)`;
        ctx.shadowColor = this.dead ? '#000' : '#ff8800';
        ctx.shadowBlur = this.dead ? 0 : 15 + eyeGlow * 10;
        ctx.beginPath(); ctx.ellipse(95, eyeY, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(165, eyeY, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        if (!this.dead) {
            ctx.fillStyle = 'rgba(30, 5, 0, 0.9)';
            ctx.beginPath();
            ctx.moveTo(80, this.h * 0.6);
            ctx.lineTo(180, this.h * 0.6);
            ctx.lineTo(170, this.h * 0.72);
            ctx.lineTo(90, this.h * 0.72);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = `rgba(255, ${150 + eyeGlow * 100}, 50, 0.9)`;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.moveTo(85 + i * 20, this.h * 0.6);
                ctx.lineTo(95 + i * 20, this.h * 0.68);
                ctx.lineTo(105 + i * 20, this.h * 0.6);
                ctx.closePath();
                ctx.fill();
            }
        }

        if (!this.dead) {
            const armY = this.h * 0.72;
            const armSwing = this.state === 'windup_slam' ? -20 : 0;
            ctx.fillStyle = flash ? '#cc8080' : '#4a3a2a';
            ctx.beginPath();
            ctx.ellipse(20, armY + armSwing, 30, 25, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(this.w - 20, armY + armSwing, 30, 25, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        for (const r of this.rocks) {
            for (const tr of r.trail) {
                ctx.fillStyle = `rgba(120, 90, 60, ${tr.life * 1.5})`;
                ctx.beginPath();
                ctx.arc(tr.x - camera.x, tr.y - camera.y, r.r * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
            const rsx = r.x - camera.x;
            const rsy = r.y - camera.y;
            ctx.save();
            ctx.translate(rsx, rsy);
            ctx.rotate(r.rot);
            const rockG = ctx.createRadialGradient(-5, -5, 2, 0, 0, r.r);
            rockG.addColorStop(0, '#9a8a6a');
            rockG.addColorStop(1, '#3a2a1a');
            ctx.fillStyle = rockG;
            ctx.beginPath();
            ctx.moveTo(-r.r, 0);
            for (let i = 1; i < 8; i++) {
                const ang = (i / 8) * Math.PI * 2;
                const rr = r.r * (0.85 + Math.sin(i * 7) * 0.15);
                ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
            }
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#1a0a02';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }

        for (const s of this.shockwaves) {
            const alpha = Math.min(1, s.life * 1.5);
            const ssx = s.x - camera.x;
            const ssy = s.y - camera.y;
            ctx.fillStyle = `rgba(255, 150, 50, ${alpha * 0.4})`;
            ctx.beginPath();
            ctx.ellipse(ssx, ssy - 15, 30, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            const waveG = ctx.createRadialGradient(ssx, ssy - 10, 3, ssx, ssy - 10, 40);
            waveG.addColorStop(0, `rgba(255, 240, 200, ${alpha})`);
            waveG.addColorStop(0.4, `rgba(255, 140, 30, ${alpha * 0.8})`);
            waveG.addColorStop(1, 'rgba(255, 60, 0, 0)');
            ctx.fillStyle = waveG;
            ctx.beginPath();
            ctx.arc(ssx, ssy - 10, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = `rgba(80, 40, 10, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(ssx, ssy);
            ctx.lineTo(ssx - s.dir * 15, ssy + 5);
            ctx.stroke();
        }
    }
}

/* ============================================================
   ГЕНЕРАЦИЯ УРОВНЕЙ — платформенные паттерны
   ============================================================ */

// Ряд платформ на одной высоте — «ритмичный бег» (Mario-style)
function rowOfPlats(x, y, count, opts = {}) {
    const gap = opts.gap ?? 120;
    const w = opts.w ?? 110;
    const style = opts.style ?? 'grass';
    const plats = [];
    for (let i = 0; i < count; i++) {
        let special = null;
        if (opts.specialChance && Math.random() < opts.specialChance) {
            special = Math.random() < 0.5 ? 'move-h' : 'move-v';
        }
        plats.push({ x: x + i * (w + gap), y, w, h: 22, style, special });
    }
    return plats;
}

// Ступени вверх (dirY < 0) или вниз
function stairsUp(x, y, count, opts = {}) {
    const stepX = opts.stepX ?? 130;
    const stepY = opts.stepY ?? 70;
    const style = opts.style ?? 'grass';
    const w = opts.w ?? 110;
    const plats = [];
    for (let i = 0; i < count; i++) {
        let special = null;
        if (opts.specialChance && Math.random() < opts.specialChance) {
            special = Math.random() < 0.5 ? 'move-h' : 'move-v';
        }
        plats.push({ x: x + i * stepX, y: y - i * stepY, w, h: 22, style, special });
    }
    return plats;
}

// «Ритм» — платформы с чередующейся высотой, как в Celeste
function platRhythm(x, y, heights, opts = {}) {
    const gap = opts.gap ?? 140;
    const w = opts.w ?? 100;
    const style = opts.style ?? 'grass';
    const plats = [];
    let cx = x;
    for (let i = 0; i < heights.length; i++) {
        let special = null;
        if (opts.specialChance && Math.random() < opts.specialChance) {
            special = Math.random() < 0.5 ? 'move-h' : 'move-v';
        }
        plats.push({ x: cx, y: y + heights[i], w, h: 22, style, special });
        cx += w + gap;
    }
    return plats;
}

// Старый makeTower оставлен для уровней 5+ (используется «башнями»)
function makeTower(x, baseY, steps, style, opts = {}) {
    const plats = [];
    let cx = x, cy = baseY, dir = opts.dirStart || 1;
    for (let i = 0; i < steps; i++) {
        const stepH = (opts.stepH || 85) + (Math.random() - 0.5) * 25;
        cy -= stepH;
        if (cy < 130) break;
        dir *= -1;
        const stepW = (opts.stepW || 75) + (Math.random() - 0.5) * 30;
        cx += dir * stepW;
        if (cx < 60) { cx = 60; dir = -1; }
        const w = 80 + Math.random() * 30;
        let special = null;
        const r = Math.random();
        const sc = opts.specialChance || 0;
        const vc = opts.vanishChance || 0;
        if (r < sc) special = Math.random() < 0.5 ? 'move-h' : 'move-v';
        else if (r < sc + vc) special = 'vanish';
        plats.push({ x: cx, y: cy, w, h: 22, style, special });
    }
    return plats;
}

function makeCoinsAlong(plats, every = 1) {
    const coins = [];
    for (let i = 0; i < plats.length; i += every) {
        const p = plats[i];
        coins.push({ x: p.x + p.w / 2, y: p.y - 30, value: 5 });
    }
    return coins;
}

/* -------- УРОВЕНЬ 1: Зелёные холмы — обучение паттернам -------- */
function buildLevel1() {
    const style = 'grass';
    const platforms = [];
    const coins = [];

    platforms.push({ x: 0, y: 640, w: 500, h: 120, style });

    platforms.push(...rowOfPlats(560, 580, 2, { gap: 60, w: 100, style }));
    coins.push({ x: 610, y: 520, value: 1 });
    coins.push({ x: 770, y: 520, value: 1 });

    platforms.push({ x: 900, y: 640, w: 500, h: 120, style });
    platforms.push(...stairsUp(960, 480, 3, { stepX: 130, stepY: 50, w: 90, style }));
    coins.push({ x: 1005, y: 430, value: 5 });
    coins.push({ x: 1135, y: 380, value: 5 });
    coins.push({ x: 1265, y: 330, value: 5 });
    coins.push({ x: 1000, y: 600, value: 1 });
    coins.push({ x: 1150, y: 600, value: 1 });
    coins.push({ x: 1300, y: 600, value: 1 });

    platforms.push({ x: 1460, y: 560, w: 100, h: 22, style });
    platforms.push({ x: 1640, y: 500, w: 100, h: 22, style });
    coins.push({ x: 1510, y: 500, value: 5 });
    coins.push({ x: 1690, y: 440, value: 5 });

    platforms.push({ x: 1820, y: 640, w: 500, h: 120, style });
    coins.push({ x: 1900, y: 600, value: 1 });
    coins.push({ x: 2000, y: 600, value: 1 });
    coins.push({ x: 2100, y: 600, value: 1 });
    coins.push({ x: 2200, y: 600, value: 1 });

    platforms.push({ x: 2320, y: 580, w: 80, h: 22, style });
    coins.push({ x: 2360, y: 540, value: 1 });

    platforms.push({ x: 2400, y: 640, w: 800, h: 120, style });
    platforms.push(...stairsUp(2560, 560, 3, { stepX: 140, stepY: 70, w: 100, style }));
    coins.push({ x: 2610, y: 510, value: 5 });
    coins.push({ x: 2750, y: 440, value: 5 });
    coins.push({ x: 2890, y: 370, value: 5 });

    platforms.push({ x: 3200, y: 500, w: 200, h: 140, style });
    coins.push({ x: 3300, y: 560, value: 5 });
    const star = { x: 3300, y: 460 };

    return {
        name: 'Зелёные холмы', elem: 'earth', elemName: 'Земля', elemColor: '#a08048',
        width: 3500, sky: ['#87ceeb', '#c7e4a8'],
        mountainFar: 'rgba(90, 130, 170, 0.45)',
        mountainNear: 'rgba(60, 100, 140, 0.65)',
        showClouds: true, stars: false, groundStyle: 'grass', darkness: 0,
        groundSegments: [{ x: 0, w: 500 }, { x: 900, w: 500 }, { x: 1820, w: 500 }, { x: 2400, w: 800 }],
        platforms, coins, star,
        fires: [], tentacles: [], spikes: [], torches: [], guardians: []
    };
}

/* -------- УРОВЕНЬ 2: Каменные врата -------- */
function buildLevel2() {
    const style = 'stone';
    const platforms = [];
    const coins = [];

    platforms.push({ x: 0, y: 640, w: 550, h: 120, style });

    platforms.push({ x: 600, y: 540, w: 90, h: 22, style });
    platforms.push({ x: 790, y: 560, w: 90, h: 22, style });
    coins.push({ x: 645, y: 480, value: 1 });
    coins.push({ x: 835, y: 500, value: 1 });

    platforms.push({ x: 900, y: 640, w: 400, h: 120, style });

    platforms.push(...stairsUp(1360, 580, 3, { stepX: 130, stepY: 60, w: 100, style }));
    platforms.push({ x: 1780, y: 460, w: 100, h: 22, style, special: 'move-h' });
    platforms.push({ x: 1930, y: 520, w: 90, h: 22, style });
    coins.push({ x: 1410, y: 520, value: 5 });
    coins.push({ x: 1540, y: 460, value: 5 });
    coins.push({ x: 1670, y: 400, value: 5 });
    coins.push({ x: 1980, y: 460, value: 5 });

    platforms.push({ x: 2010, y: 640, w: 200, h: 120, style });

    platforms.push({ x: 2260, y: 640, w: 400, h: 120, style });

    platforms.push({ x: 2660, y: 580, w: 100, h: 22, style });
    coins.push({ x: 2710, y: 540, value: 1 });

    platforms.push({ x: 2760, y: 640, w: 640, h: 120, style });
    platforms.push({ x: 3000, y: 500, w: 200, h: 140, style });
    coins.push({ x: 3100, y: 560, value: 5 });
    const star = { x: 3100, y: 460 };

    return {
        name: 'Каменные врата', elem: 'earth', elemName: 'Земля', elemColor: '#a08048',
        width: 3400, sky: ['#c0d0e0', '#e0e8d0'],
        mountainFar: 'rgba(140, 120, 160, 0.55)',
        mountainNear: 'rgba(90, 80, 110, 0.7)',
        showClouds: true, stars: false, groundStyle: 'stone', darkness: 0.1,
        groundSegments: [{ x: 0, w: 550 }, { x: 900, w: 400 }, { x: 2010, w: 200 }, { x: 2260, w: 400 }, { x: 2760, w: 640 }],
        platforms, coins, star,
        fires: [
            { x: 400, y: 640, w: 42, h: 52, period: 2.0, phase: 0 },
            { x: 1100, y: 640, w: 42, h: 52, period: 1.8, phase: 1.0 },
            { x: 2400, y: 640, w: 42, h: 52, period: 2.2, phase: 0.5 }
        ],
        tentacles: [], spikes: [], torches: [], guardians: []
    };
}

/* -------- УРОВЕНЬ 3: Болото щупалец -------- */
function buildLevel3() {
    const style = 'moss';
    const platforms = [];
    const coins = [];

    platforms.push({ x: 0, y: 640, w: 500, h: 120, style });

    platforms.push(...platRhythm(560, 560, [0, -60, -30], { gap: 80, w: 90, style, specialChance: 0.2 }));
    platforms.push({ x: 1020, y: 540, w: 90, h: 22, style });
    coins.push({ x: 605, y: 500, value: 5 });
    coins.push({ x: 775, y: 440, value: 5 });
    coins.push({ x: 945, y: 470, value: 5 });
    coins.push({ x: 1065, y: 480, value: 5 });

    platforms.push({ x: 1150, y: 640, w: 400, h: 120, style });
    platforms.push(...stairsUp(1220, 560, 3, { stepX: 120, stepY: 55, w: 90, style, specialChance: 0.2 }));
    coins.push({ x: 1265, y: 510, value: 5 });
    coins.push({ x: 1385, y: 455, value: 5 });
    coins.push({ x: 1505, y: 400, value: 5 });

    platforms.push({ x: 1600, y: 560, w: 90, h: 22, style });
    platforms.push({ x: 1740, y: 500, w: 90, h: 22, style, special: 'vanish' });
    platforms.push({ x: 1880, y: 540, w: 90, h: 22, style });
    coins.push({ x: 1645, y: 500, value: 5 });
    coins.push({ x: 1785, y: 440, value: 5 });
    coins.push({ x: 1925, y: 480, value: 5 });

    platforms.push({ x: 2000, y: 640, w: 500, h: 120, style });
    platforms.push(...stairsUp(2100, 560, 3, { stepX: 130, stepY: 60, w: 90, style }));
    coins.push({ x: 2145, y: 500, value: 5 });
    coins.push({ x: 2275, y: 440, value: 5 });
    coins.push({ x: 2405, y: 380, value: 5 });

    platforms.push({ x: 2560, y: 560, w: 100, h: 22, style });
    platforms.push({ x: 2720, y: 500, w: 100, h: 22, style, special: 'move-v' });
    platforms.push({ x: 2880, y: 560, w: 100, h: 22, style });
    platforms.push({ x: 3040, y: 500, w: 100, h: 22, style });
    coins.push({ x: 2610, y: 500, value: 5 });
    coins.push({ x: 2770, y: 440, value: 5 });
    coins.push({ x: 2930, y: 500, value: 5 });
    coins.push({ x: 3090, y: 440, value: 5 });

    platforms.push({ x: 3250, y: 640, w: 500, h: 120, style });
    platforms.push({ x: 3600, y: 500, w: 200, h: 140, style });
    coins.push({ x: 3700, y: 560, value: 5 });
    const star = { x: 3700, y: 460 };

    return {
        name: 'Болото щупалец', elem: 'earth', elemName: 'Земля', elemColor: '#a08048',
        width: 3800, sky: ['#4d6a6a', '#1a2a2a'],
        mountainFar: 'rgba(40, 70, 60, 0.5)',
        mountainNear: 'rgba(20, 40, 30, 0.7)',
        showClouds: false, stars: false, groundStyle: 'moss', darkness: 0.3,
        groundSegments: [{ x: 0, w: 500 }, { x: 1150, w: 400 }, { x: 2000, w: 500 }, { x: 3250, w: 500 }],
        platforms, coins, star,
        fires: [],
        tentacles: [
            { x: 250, baseY: 640, maxHeight: 130, period: 3.0, phase: 0 },
            { x: 750, baseY: 640, maxHeight: 140, period: 2.8, phase: 0.5 },
            { x: 1250, baseY: 640, maxHeight: 130, period: 3.2, phase: 1.2 },
            { x: 1600, baseY: 640, maxHeight: 140, period: 2.9, phase: 1.8 },
            { x: 2250, baseY: 640, maxHeight: 130, period: 3.0, phase: 0.8 },
            { x: 2800, baseY: 640, maxHeight: 140, period: 2.8, phase: 1.5 },
            { x: 3400, baseY: 640, maxHeight: 130, period: 3.2, phase: 0.3 }
        ],
        spikes: [], torches: [], guardians: []
    };
}

/* -------- УРОВЕНЬ 4: Ночные поля -------- */
function buildLevel4() {
    const style = 'grass';
    const platforms = [];
    const coins = [];

    platforms.push({ x: 0, y: 640, w: 500, h: 120, style });

    platforms.push({ x: 560, y: 580, w: 100, h: 22, style });
    platforms.push({ x: 700, y: 580, w: 100, h: 22, style });
    coins.push({ x: 610, y: 540, value: 1 });
    coins.push({ x: 750, y: 540, value: 1 });
    platforms.push({ x: 560, y: 480, w: 90, h: 22, style });
    platforms.push({ x: 700, y: 420, w: 90, h: 22, style });
    coins.push({ x: 605, y: 430, value: 5 });
    coins.push({ x: 745, y: 370, value: 5 });

    platforms.push({ x: 800, y: 640, w: 500, h: 120, style });
    platforms.push({ x: 850, y: 380, w: 90, h: 22, style, special: 'move-h' });
    coins.push({ x: 895, y: 330, value: 5 });
    coins.push({ x: 900, y: 600, value: 1 });
    coins.push({ x: 1050, y: 600, value: 1 });
    coins.push({ x: 1200, y: 600, value: 1 });

    platforms.push({ x: 1360, y: 560, w: 80, h: 22, style });
    platforms.push({ x: 1520, y: 500, w: 80, h: 22, style, special: 'move-v' });
    platforms.push({ x: 1680, y: 540, w: 80, h: 22, style });
    platforms.push({ x: 1840, y: 560, w: 80, h: 22, style });
    coins.push({ x: 1400, y: 500, value: 5 });
    coins.push({ x: 1560, y: 440, value: 5 });
    coins.push({ x: 1720, y: 480, value: 5 });
    coins.push({ x: 1880, y: 500, value: 5 });

    platforms.push({ x: 1920, y: 640, w: 600, h: 120, style });
    platforms.push(...stairsUp(2000, 560, 3, { stepX: 130, stepY: 60, w: 90, style }));
    coins.push({ x: 2045, y: 510, value: 5 });
    coins.push({ x: 2175, y: 450, value: 5 });
    coins.push({ x: 2305, y: 390, value: 5 });
    coins.push({ x: 2000, y: 600, value: 1 });
    coins.push({ x: 2150, y: 600, value: 1 });
    coins.push({ x: 2300, y: 600, value: 1 });
    coins.push({ x: 2450, y: 600, value: 1 });

    platforms.push({ x: 2580, y: 560, w: 100, h: 22, style });
    platforms.push({ x: 2740, y: 500, w: 100, h: 22, style, special: 'move-h' });
    platforms.push({ x: 2900, y: 560, w: 100, h: 22, style });
    coins.push({ x: 2630, y: 500, value: 5 });
    coins.push({ x: 2790, y: 440, value: 5 });
    coins.push({ x: 2950, y: 500, value: 5 });

    platforms.push({ x: 3030, y: 640, w: 800, h: 120, style });
    platforms.push(...stairsUp(3100, 560, 2, { stepX: 150, stepY: 60, w: 100, style }));
    coins.push({ x: 3150, y: 510, value: 5 });
    coins.push({ x: 3300, y: 450, value: 5 });

    platforms.push({ x: 3700, y: 500, w: 200, h: 140, style });
    coins.push({ x: 3800, y: 560, value: 5 });
    const star = { x: 3800, y: 460 };

    return {
        name: 'Ночные поля', elem: 'earth', elemName: 'Земля', elemColor: '#a08048',
        width: 3900, sky: ['#1a1a3a', '#050510'],
        mountainFar: 'rgba(60, 40, 90, 0.45)',
        mountainNear: 'rgba(30, 20, 50, 0.7)',
        showClouds: false, stars: true, groundStyle: 'grass', darkness: 0.55,
        groundSegments: [{ x: 0, w: 500 }, { x: 800, w: 500 }, { x: 1920, w: 600 }, { x: 3030, w: 800 }],
        platforms, coins, star,
        fires: [
            { x: 1100, y: 640, w: 42, h: 52, period: 2.0, phase: 0 },
            { x: 2200, y: 640, w: 42, h: 52, period: 2.2, phase: 1.0 },
            { x: 3200, y: 640, w: 42, h: 52, period: 1.9, phase: 0.5 }
        ],
        tentacles: [], spikes: [],
        torches: [
            { x: 300, y: 640 }, { x: 1100, y: 640 }, { x: 2100, y: 640 },
            { x: 3100, y: 640 }, { x: 3600, y: 640 }
        ],
        guardians: [
            { x: 1000, y: 640 - 72, element: 'earth' },
            { x: 2300, y: 640 - 72, element: 'earth' },
            { x: 3300, y: 640 - 72, element: 'earth' }
        ]
    };
}

/* -------- УРОВЕНЬ 5: Кристальные пещеры -------- */
function buildLevel5() {
    const style = 'crystal';
    const platforms = [];
    const coins = [];

    platforms.push({ x: 0, y: 640, w: 450, h: 120, style });

    const t1 = makeTower(500, 640, 6, style, { specialChance: 0.2, vanishChance: 0.15, stepH: 80, stepW: 60 });
    platforms.push(...t1);
    coins.push(...makeCoinsAlong(t1));

    platforms.push({ x: t1[t1.length - 1].x + 120, y: t1[t1.length - 1].y, w: 100, h: 22, style });
    platforms.push({ x: t1[t1.length - 1].x + 250, y: t1[t1.length - 1].y - 20, w: 100, h: 22, style, special: 'move-v' });
    coins.push({ x: t1[t1.length - 1].x + 175, y: t1[t1.length - 1].y - 40, value: 5 });

    const startDescX = t1[t1.length - 1].x + 400;
    const startDescY = t1[t1.length - 1].y;
    platforms.push({ x: startDescX, y: startDescY + 100, w: 100, h: 22, style });
    platforms.push({ x: startDescX + 150, y: startDescY + 200, w: 100, h: 22, style, special: 'vanish' });
    platforms.push({ x: startDescX + 300, y: startDescY + 300, w: 100, h: 22, style });

    const x2 = startDescX + 400;
    platforms.push({ x: x2, y: 640, w: 400, h: 120, style });

    const t2 = makeTower(x2 + 100, 640, 4, style, { specialChance: 0.3 });
    platforms.push(...t2);
    coins.push(...makeCoinsAlong(t2));

    platforms.push({ x: t2[t2.length - 1].x + 250, y: 500, w: 100, h: 22, style });
    platforms.push({ x: t2[t2.length - 1].x + 400, y: 640, w: 600, h: 120, style });

    platforms.push({ x: t2[t2.length - 1].x + 800, y: 500, w: 200, h: 140, style });
    coins.push({ x: t2[t2.length - 1].x + 900, y: 560, value: 5 });

    const star = { x: t2[t2.length - 1].x + 900, y: 460 };

    return {
        name: 'Кристальные пещеры', elem: 'earth', elemName: 'Земля', elemColor: '#a08048',
        width: x2 + 1300, sky: ['#2a1a4a', '#050210'],
        mountainFar: 'rgba(90, 50, 130, 0.5)',
        mountainNear: 'rgba(50, 20, 80, 0.7)',
        showClouds: false, stars: true, groundStyle: 'crystal', darkness: 0.75,
        groundSegments: [{ x: 0, w: 450 }, { x: x2, w: 400 }, { x: t2[t2.length - 1].x + 400, w: 600 }],
        platforms, coins, star,
        fires: [], tentacles: [],
        spikes: [
            { x: 300, y: 640, w: 80, count: 4 },
            { x: x2 + 100, y: 640, w: 80, count: 4 }
        ],
        torches: [
            { x: 250, y: 640 }, { x: 1100, y: 640 }, { x: 1900, y: 640 },
            { x: x2 + 200, y: 640 }, { x: x2 + 1300, y: 640 }
        ],
        guardians: [
            { x: x2 + 200, y: 640 - 72, element: 'earth' }
        ]
    };
}

/* -------- УРОВЕНЬ 6: Ледяные пики -------- */
function buildLevel6() {
    const style = 'ice';
    const platforms = [];
    const coins = [];

    platforms.push({ x: 0, y: 640, w: 500, h: 120, style });

    platforms.push({ x: 570, y: 540, w: 80, h: 22, style });
    platforms.push({ x: 700, y: 460, w: 80, h: 22, style, special: 'vanish' });
    platforms.push({ x: 840, y: 540, w: 80, h: 22, style });
    platforms.push({ x: 970, y: 460, w: 80, h: 22, style, special: 'vanish' });
    platforms.push({ x: 1110, y: 540, w: 80, h: 22, style });
    coins.push({ x: 740, y: 420, value: 5 });
    coins.push({ x: 1010, y: 420, value: 5 });

    platforms.push({ x: 1240, y: 640, w: 500, h: 120, style });

    const t1 = makeTower(1300, 640, 5, style, { specialChance: 0.3, stepW: 70 });
    platforms.push(...t1);
    coins.push(...makeCoinsAlong(t1, 1));

    platforms.push({ x: t1[t1.length - 1].x + 200, y: t1[t1.length - 1].y - 30, w: 100, h: 22, style, special: 'move-h' });
    coins.push({ x: t1[t1.length - 1].x + 250, y: t1[t1.length - 1].y - 70, value: 5 });

    platforms.push({ x: t1[t1.length - 1].x + 400, y: t1[t1.length - 1].y + 100, w: 100, h: 22, style, special: 'vanish' });
    platforms.push({ x: t1[t1.length - 1].x + 550, y: 500, w: 100, h: 22, style });

    const x3 = t1[t1.length - 1].x + 700;
    platforms.push({ x: x3, y: 640, w: 500, h: 120, style });

    const t2 = makeTower(x3 + 100, 640, 3, style);
    platforms.push(...t2);
    coins.push(...makeCoinsAlong(t2));

    platforms.push({ x: x3 + 500, y: 540, w: 100, h: 22, style });
    platforms.push({ x: x3 + 650, y: 440, w: 100, h: 22, style, special: 'vanish' });
    platforms.push({ x: x3 + 800, y: 540, w: 100, h: 22, style });

    platforms.push({ x: x3 + 950, y: 640, w: 700, h: 120, style });
    platforms.push({ x: x3 + 1450, y: 500, w: 200, h: 140, style });
    coins.push({ x: x3 + 1550, y: 560, value: 5 });

    const star = { x: x3 + 1550, y: 460 };

    return {
        name: 'Ледяные пики', elem: 'water', elemName: 'Вода', elemColor: '#48b0ff',
        width: x3 + 1700, sky: ['#a8d8ee', '#e0f0ff'],
        mountainFar: 'rgba(120, 160, 200, 0.45)',
        mountainNear: 'rgba(80, 120, 160, 0.65)',
        showClouds: true, stars: false, groundStyle: 'ice', darkness: 0,
        groundSegments: [{ x: 0, w: 500 }, { x: 1240, w: 500 }, { x: x3, w: 500 }, { x: x3 + 950, w: 700 }],
        platforms, coins, star,
        fires: [], tentacles: [],
        spikes: [
            { x: 350, y: 640, w: 80, count: 4 },
            { x: x3 + 300, y: 640, w: 80, count: 4 }
        ],
        torches: [], guardians: [
            { x: 1450, y: 640 - 72, element: 'water' },
            { x: x3 + 200, y: 640 - 72, element: 'water' }
        ]
    };
}

/* -------- УРОВЕНЬ 7: Вулканические глубины -------- */
function buildLevel7() {
    const style = 'stone';
    const platforms = [];
    const coins = [];

    platforms.push({ x: 0, y: 640, w: 450, h: 120, style });

    const t1 = makeTower(500, 640, 6, style, { specialChance: 0.35, stepW: 65 });
    platforms.push(...t1);
    coins.push(...makeCoinsAlong(t1));

    platforms.push({ x: t1[t1.length - 1].x + 200, y: t1[t1.length - 1].y - 30, w: 100, h: 22, style, special: 'move-h' });
    platforms.push({ x: t1[t1.length - 1].x + 380, y: t1[t1.length - 1].y - 50, w: 100, h: 22, style, special: 'move-v' });
    coins.push({ x: t1[t1.length - 1].x + 290, y: t1[t1.length - 1].y - 90, value: 5 });

    platforms.push({ x: t1[t1.length - 1].x + 560, y: t1[t1.length - 1].y + 80, w: 100, h: 22, style, special: 'vanish' });
    platforms.push({ x: t1[t1.length - 1].x + 720, y: 500, w: 100, h: 22, style });

    const x2 = t1[t1.length - 1].x + 900;
    platforms.push({ x: x2, y: 640, w: 400, h: 120, style });

    const t2 = makeTower(x2 + 100, 640, 4, style, { specialChance: 0.3 });
    platforms.push(...t2);
    coins.push(...makeCoinsAlong(t2));

    platforms.push({ x: t2[t2.length - 1].x + 250, y: t2[t2.length - 1].y + 100, w: 100, h: 22, style });
    platforms.push({ x: t2[t2.length - 1].x + 400, y: 640, w: 800, h: 120, style });

    platforms.push({ x: t2[t2.length - 1].x + 900, y: 500, w: 200, h: 140, style });
    coins.push({ x: t2[t2.length - 1].x + 1000, y: 560, value: 5 });

    const star = { x: t2[t2.length - 1].x + 1000, y: 460 };

    return {
        name: 'Вулканические глубины', elem: 'fire', elemName: 'Огонь', elemColor: '#ff6030',
        width: x2 + 1700, sky: ['#3a1010', '#0a0202'],
        mountainFar: 'rgba(120, 40, 20, 0.5)',
        mountainNear: 'rgba(70, 20, 10, 0.7)',
        showClouds: false, stars: false, groundStyle: 'stone', darkness: 0.65,
        groundSegments: [{ x: 0, w: 450 }, { x: x2, w: 400 }, { x: t2[t2.length - 1].x + 400, w: 800 }],
        platforms, coins, star,
        fires: [
            { x: 300, y: 640, w: 42, h: 52, period: 1.7, phase: 0 },
            { x: x2 + 200, y: 640, w: 42, h: 52, period: 2.1, phase: 1.0 },
            { x: t2[t2.length - 1].x + 600, y: 640, w: 42, h: 52, period: 1.8, phase: 1.5 }
        ],
        tentacles: [], spikes: [
            { x: 200, y: 640, w: 80, count: 4 },
            { x: x2 + 300, y: 640, w: 80, count: 4 }
        ],
        torches: [],
        guardians: [
            { x: 300, y: 640 - 72, element: 'fire' },
            { x: x2 + 250, y: 640 - 72, element: 'fire' }
        ]
    };
}

/* -------- УРОВЕНЬ 8: Древние руины -------- */
function buildLevel8() {
    const style = 'ruin';
    const platforms = [];
    const coins = [];

    platforms.push({ x: 0, y: 640, w: 550, h: 120, style });

    const t1 = makeTower(600, 640, 5, style, { specialChance: 0.2, stepW: 70 });
    platforms.push(...t1);
    coins.push(...makeCoinsAlong(t1));

    platforms.push({ x: t1[t1.length - 1].x + 200, y: t1[t1.length - 1].y - 20, w: 100, h: 22, style });
    platforms.push({ x: t1[t1.length - 1].x + 350, y: t1[t1.length - 1].y, w: 100, h: 22, style, special: 'move-h' });
    coins.push({ x: t1[t1.length - 1].x + 275, y: t1[t1.length - 1].y - 50, value: 5 });

    platforms.push({ x: t1[t1.length - 1].x + 500, y: t1[t1.length - 1].y + 80, w: 100, h: 22, style, special: 'vanish' });
    platforms.push({ x: t1[t1.length - 1].x + 650, y: t1[t1.length - 1].y + 180, w: 100, h: 22, style });

    const x2 = t1[t1.length - 1].x + 800;
    platforms.push({ x: x2, y: 640, w: 500, h: 120, style });

    const t2 = makeTower(x2 + 100, 640, 5, style, { specialChance: 0.25, dirStart: -1 });
    platforms.push(...t2);
    coins.push(...makeCoinsAlong(t2));

    platforms.push({ x: t2[t2.length - 1].x + 300, y: 500, w: 110, h: 22, style, special: 'move-v' });
    platforms.push({ x: t2[t2.length - 1].x + 500, y: 600, w: 110, h: 22, style });

    const x3 = t2[t2.length - 1].x + 700;
    platforms.push({ x: x3, y: 640, w: 500, h: 120, style });

    platforms.push({ x: x3 + 100, y: 540, w: 100, h: 22, style, special: 'move-h' });
    platforms.push({ x: x3 + 280, y: 460, w: 100, h: 22, style });
    coins.push({ x: x3 + 330, y: 420, value: 5 });

    platforms.push({ x: x3 + 500, y: 640, w: 500, h: 120, style });
    platforms.push({ x: x3 + 800, y: 500, w: 200, h: 140, style });
    coins.push({ x: x3 + 900, y: 560, value: 5 });

    const star = { x: x3 + 900, y: 460 };

    return {
        name: 'Древние руины', elem: 'earth', elemName: 'Земля', elemColor: '#a08048',
        width: x2 + 2000, sky: ['#8a7050', '#3a2818'],
        mountainFar: 'rgba(140, 100, 60, 0.45)',
        mountainNear: 'rgba(90, 60, 30, 0.65)',
        showClouds: true, stars: false, groundStyle: 'ruin', darkness: 0.35,
        groundSegments: [{ x: 0, w: 550 }, { x: x2, w: 500 }, { x: x3, w: 500 }, { x: x3 + 500, w: 500 }],
        platforms, coins, star,
        fires: [
            { x: 300, y: 640, w: 42, h: 52, period: 2.0, phase: 0 },
            { x: x2 + 200, y: 640, w: 42, h: 52, period: 2.2, phase: 1.0 },
            { x: x3 + 200, y: 640, w: 42, h: 52, period: 1.9, phase: 0.5 }
        ],
        tentacles: [],
        spikes: [
            { x: 400, y: 640, w: 80, count: 4 },
            { x: x3 + 200, y: 640, w: 80, count: 4 }
        ],
        torches: [
            { x: 300, y: 640 }, { x: 1100, y: 640 }, { x: 2000, y: 640 },
            { x: x2 + 250, y: 640 }, { x: x3 + 250, y: 640 }
        ],
        guardians: [
            { x: x2 + 300, y: 640 - 72, element: 'earth' }
        ]
    };
}

/* -------- УРОВЕНЬ 9: Царство теней -------- */
function buildLevel9() {
    const style = 'crystal';
    const platforms = [];
    const coins = [];

    platforms.push({ x: 0, y: 640, w: 500, h: 120, style });

    platforms.push({ x: 570, y: 540, w: 100, h: 22, style, special: 'vanish' });
    platforms.push({ x: 720, y: 460, w: 100, h: 22, style });
    platforms.push({ x: 870, y: 540, w: 100, h: 22, style, special: 'move-h' });
    platforms.push({ x: 1050, y: 460, w: 100, h: 22, style });
    platforms.push({ x: 1200, y: 540, w: 100, h: 22, style, special: 'vanish' });
    coins.push({ x: 770, y: 420, value: 5 });
    coins.push({ x: 1100, y: 420, value: 5 });

    platforms.push({ x: 1350, y: 640, w: 500, h: 120, style });

    const t1 = makeTower(1420, 640, 6, style, { specialChance: 0.35, vanishChance: 0.2 });
    platforms.push(...t1);
    coins.push(...makeCoinsAlong(t1, 1));

    platforms.push({ x: t1[t1.length - 1].x + 200, y: t1[t1.length - 1].y - 30, w: 100, h: 22, style, special: 'move-v' });
    platforms.push({ x: t1[t1.length - 1].x + 380, y: t1[t1.length - 1].y - 50, w: 100, h: 22, style, special: 'move-h' });
    coins.push({ x: t1[t1.length - 1].x + 290, y: t1[t1.length - 1].y - 90, value: 5 });

    platforms.push({ x: t1[t1.length - 1].x + 560, y: t1[t1.length - 1].y + 100, w: 100, h: 22, style, special: 'vanish' });
    platforms.push({ x: t1[t1.length - 1].x + 720, y: t1[t1.length - 1].y + 220, w: 100, h: 22, style });

    const x3 = t1[t1.length - 1].x + 900;
    platforms.push({ x: x3, y: 640, w: 500, h: 120, style });

    const t2 = makeTower(x3 + 100, 640, 4, style, { specialChance: 0.35 });
    platforms.push(...t2);
    coins.push(...makeCoinsAlong(t2));

    platforms.push({ x: t2[t2.length - 1].x + 280, y: 500, w: 100, h: 22, style, special: 'vanish' });
    platforms.push({ x: t2[t2.length - 1].x + 450, y: 640, w: 700, h: 120, style });

    platforms.push({ x: t2[t2.length - 1].x + 850, y: 500, w: 200, h: 140, style });
    coins.push({ x: t2[t2.length - 1].x + 950, y: 560, value: 5 });

    const star = { x: t2[t2.length - 1].x + 950, y: 460 };

    return {
        name: 'Царство теней', elem: 'air', elemName: 'Воздух', elemColor: '#c8d8ff',
        width: x3 + 1500, sky: ['#0a0a1a', '#000000'],
        mountainFar: 'rgba(40, 20, 60, 0.5)',
        mountainNear: 'rgba(20, 10, 40, 0.8)',
        showClouds: false, stars: true, groundStyle: 'crystal', darkness: 0.85,
        groundSegments: [{ x: 0, w: 500 }, { x: 1350, w: 500 }, { x: x3, w: 500 }, { x: t2[t2.length - 1].x + 450, w: 700 }],
        platforms, coins, star,
        fires: [], tentacles: [
            { x: 800, baseY: 640, maxHeight: 130, period: 3.0, phase: 0 },
            { x: 1500, baseY: 640, maxHeight: 140, period: 2.8, phase: 0.8 },
            { x: 2600, baseY: 640, maxHeight: 130, period: 3.2, phase: 1.6 },
            { x: x3 + 300, baseY: 640, maxHeight: 140, period: 2.9, phase: 0.4 }
        ],
        spikes: [
            { x: 300, y: 640, w: 80, count: 4 },
            { x: x3 + 200, y: 640, w: 80, count: 4 }
        ],
        torches: [
            { x: 400, y: 640 }, { x: 1100, y: 640 }, { x: 1800, y: 640 },
            { x: x3 + 200, y: 640 }, { x: x3 + 800, y: 640 }
        ],
        guardians: [
            { x: 1500, y: 640 - 72, element: 'final' },
            { x: x3 + 250, y: 640 - 72, element: 'final' }
        ]
    };
}

/* -------- УРОВЕНЬ 10: Небесный храм -------- */
function buildLevel10() {
    const style = 'ruin';
    const platforms = [];
    const coins = [];

    platforms.push({ x: 0, y: 640, w: 550, h: 120, style });

    const t1 = makeTower(600, 640, 6, style, { specialChance: 0.3, vanishChance: 0.15 });
    platforms.push(...t1);
    coins.push(...makeCoinsAlong(t1));

    platforms.push({ x: t1[t1.length - 1].x + 200, y: t1[t1.length - 1].y - 30, w: 100, h: 22, style, special: 'move-h' });
    platforms.push({ x: t1[t1.length - 1].x + 400, y: t1[t1.length - 1].y - 50, w: 100, h: 22, style, special: 'move-v' });
    platforms.push({ x: t1[t1.length - 1].x + 600, y: t1[t1.length - 1].y - 30, w: 100, h: 22, style });
    coins.push({ x: t1[t1.length - 1].x + 300, y: t1[t1.length - 1].y - 90, value: 5 });
    coins.push({ x: t1[t1.length - 1].x + 500, y: t1[t1.length - 1].y - 90, value: 5 });

    platforms.push({ x: t1[t1.length - 1].x + 780, y: t1[t1.length - 1].y + 80, w: 100, h: 22, style, special: 'vanish' });
    platforms.push({ x: t1[t1.length - 1].x + 940, y: t1[t1.length - 1].y + 200, w: 100, h: 22, style });

    const x2 = t1[t1.length - 1].x + 1100;
    platforms.push({ x: x2, y: 640, w: 500, h: 120, style });

    const t2 = makeTower(x2 + 100, 640, 5, style, { specialChance: 0.35, dirStart: -1 });
    platforms.push(...t2);
    coins.push(...makeCoinsAlong(t2));

    platforms.push({ x: t2[t2.length - 1].x + 300, y: 500, w: 100, h: 22, style, special: 'vanish' });
    platforms.push({ x: t2[t2.length - 1].x + 450, y: 600, w: 100, h: 22, style });

    const x3 = t2[t2.length - 1].x + 650;
    platforms.push({ x: x3, y: 640, w: 900, h: 120, style });

    platforms.push({ x: x3 + 250, y: 540, w: 100, h: 22, style, special: 'move-h' });
    platforms.push({ x: x3 + 420, y: 460, w: 100, h: 22, style });
    platforms.push({ x: x3 + 580, y: 400, w: 100, h: 22, style, special: 'vanish' });
    platforms.push({ x: x3 + 740, y: 460, w: 100, h: 22, style });
    coins.push({ x: x3 + 470, y: 420, value: 5 });
    coins.push({ x: x3 + 630, y: 360, value: 5 });

    platforms.push({ x: x3 + 700, y: 500, w: 200, h: 140, style });
    coins.push({ x: x3 + 800, y: 560, value: 5 });

    const star = { x: x3 + 800, y: 460 };

    return {
        name: 'Небесный храм', elem: 'final', elemName: 'Финал', elemColor: '#c060ff',
        width: x3 + 1000, sky: ['#c0d0ff', '#f0e0ff'],
        mountainFar: 'rgba(160, 140, 220, 0.45)',
        mountainNear: 'rgba(120, 100, 180, 0.65)',
        showClouds: true, stars: false, groundStyle: 'ruin', darkness: 0.2,
        groundSegments: [{ x: 0, w: 550 }, { x: x2, w: 500 }, { x: x3, w: 900 }],
        platforms, coins, star,
        fires: [
            { x: 300, y: 640, w: 42, h: 52, period: 2.0, phase: 0 },
            { x: x2 + 200, y: 640, w: 42, h: 52, period: 2.2, phase: 1.0 }
        ],
        tentacles: [
            { x: 1500, baseY: 640, maxHeight: 130, period: 3.0, phase: 0.3 },
            { x: x2 + 700, baseY: 640, maxHeight: 140, period: 2.9, phase: 1.2 }
        ],
        spikes: [
            { x: 400, y: 640, w: 80, count: 4 },
            { x: x3 + 150, y: 640, w: 80, count: 4 }
        ],
        torches: [
            { x: 300, y: 640 }, { x: 1200, y: 640 },
            { x: x2 + 200, y: 640 }, { x: x3 + 200, y: 640 }
        ],
        guardians: [
            { x: 400, y: 640 - 72, element: 'final' },
            { x: x2 + 300, y: 640 - 72, element: 'final' },
            { x: x3 + 300, y: 640 - 72, element: 'final' }
        ]
    };
}

/* -------- УРОВЕНЬ 11: БОСС -------- */
function buildBossLevel() {
    const style = 'stone';
    const platforms = [];
    const coins = [];

    platforms.push({ x: 0, y: 640, w: 1800, h: 120, style });

    platforms.push({ x: 250, y: 520, w: 120, h: 22, style, special: 'move-h' });
    platforms.push({ x: 500, y: 460, w: 120, h: 22, style });
    platforms.push({ x: 750, y: 520, w: 120, h: 22, style, special: 'move-v' });

    coins.push({ x: 300, y: 480, value: 5 });
    coins.push({ x: 550, y: 420, value: 5 });
    coins.push({ x: 800, y: 480, value: 5 });

    return {
        name: 'Сердце горы', elem: 'final', elemName: 'Финал', elemColor: '#ff4060',
        isBoss: true,
        bossX: 1250,
        bossY: 640 - 380,
        width: 1800, sky: ['#1a0505', '#000000'],
        mountainFar: 'rgba(80, 20, 20, 0.5)',
        mountainNear: 'rgba(40, 10, 10, 0.8)',
        showClouds: false, stars: true, groundStyle: 'stone', darkness: 0.7,
        groundSegments: [{ x: 0, w: 1800 }],
        platforms, coins, star: null,
        fires: [
            { x: 400, y: 640, w: 42, h: 52, period: 2.0, phase: 0 },
            { x: 900, y: 640, w: 42, h: 52, period: 2.2, phase: 1.0 }
        ],
        tentacles: [], spikes: [],
        torches: [
            { x: 200, y: 640 }, { x: 1600, y: 640 }
        ],
        guardians: []
    };
}

function buildLevels() {
    return [
        buildLevel1(), buildLevel2(), buildLevel3(), buildLevel4(), buildLevel5(),
        buildLevel6(), buildLevel7(), buildLevel8(), buildLevel9(), buildLevel10(),
        buildBossLevel()
    ];
}

const LEVELS = buildLevels();
GAME_CONFIG.TOTAL_LEVELS = LEVELS.length;

const GameState = {
    TUTORIAL: 'tutorial',
    MENU: 'menu', LEVEL_SELECT: 'level_select', SHOP: 'shop', LAB: 'lab',
    SUBSTANCES: 'substances', SETTINGS: 'settings', PLAYING: 'playing', PAUSED: 'paused',
    GAME_OVER: 'game_over', VICTORY: 'victory', COMPLETE: 'complete'
};

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.input = new InputHandler();
        this.lightCanvas = document.createElement('canvas');
        this.lightCanvas.width = GAME_CONFIG.WIDTH;
        this.lightCanvas.height = GAME_CONFIG.HEIGHT;
        this.lightCtx = this.lightCanvas.getContext('2d');

        this.state = GameState.MENU;
        this.levelIndex = 0;
        this.coins = 0;
        this.totalCoins = 0;
        this.unlocked = 1;
        this.owned = ['hat_default', 'robe_purple', 'staff_wood'];
        this.appearance = { hat: 'hat_default', robe: 'robe_purple', staff: 'staff_wood' };

        this.unlockedIngredients = [];
        this.craftedRecipes = [];
        this.unlockedSubstances = [];
        this.labSelected = [];
        this.petAnimation = null;

        this.earthPillars = [];
        this.icePlatforms = [];
        this.airGeysers = [];
        this.fireEffects = [];

        this.player = null;
        this.crow = null;
        this.boss = null;
        this.platforms = [];
        this.coinItems = [];
        this.star = null;
        this.fires = [];
        this.tentacles = [];
        this.spikes = [];
        this.torches = [];
        this.guardians = [];
        this.level = null;

        this.camera = { x: 0, y: 0, lookAhead: 0 };
        this.lastSafePos = { x: 100, y: 500 };
        this.lastTime = performance.now();
        this.rafId = null;

        this.tutorialStep = 0;
        this.tutorialShown = false;

        this.ui = {};
        this.bindUI();
        this.loadSaveData();
    }

    loadSaveData() {
        const d = SaveSystem.load();
        if (d) {
            this.unlocked = d.unlocked || 1;
            this.totalCoins = d.totalCoins || 0;
            this.owned = d.owned || ['hat_default', 'robe_purple', 'staff_wood'];
            this.appearance = d.appearance || { hat: 'hat_default', robe: 'robe_purple', staff: 'staff_wood' };
            this.unlockedIngredients = d.unlockedIngredients || [];
            this.craftedRecipes = d.craftedRecipes || [];
            this.unlockedSubstances = d.unlockedSubstances || [];
            this.tutorialShown = !!d.tutorialShown;
            AudioManager.enabled = d.sfx !== false;
        } else {
            AudioManager.enabled = true;
        }
        this.updateSfxToggle();
        this.updateShopCoins();
    }

    persist() {
        SaveSystem.save({
            unlocked: this.unlocked, totalCoins: this.totalCoins,
            owned: this.owned, appearance: this.appearance,
            unlockedIngredients: this.unlockedIngredients,
            craftedRecipes: this.craftedRecipes,
            unlockedSubstances: this.unlockedSubstances,
            tutorialShown: this.tutorialShown,
            sfx: AudioManager.enabled
        });
    }

    updateSfxToggle() {
        const t = document.getElementById('toggle-sfx');
        if (t) t.classList.toggle('on', AudioManager.enabled);
    }
    updateShopCoins() {
        const s = document.getElementById('shop-coins');
        if (s) s.textContent = this.totalCoins;
    }

    bindUI() {
        this.ui = {
            tutorial: document.getElementById('overlay-tutorial'),
            menu:     document.getElementById('overlay-menu'),
            levels:   document.getElementById('overlay-levels'),
            shop:     document.getElementById('overlay-shop'),
            lab:      document.getElementById('overlay-lab'),
            substances: document.getElementById('overlay-substances'),
            settings: document.getElementById('overlay-settings'),
            pause:    document.getElementById('overlay-pause'),
            gameOver: document.getElementById('overlay-gameover'),
            victory:  document.getElementById('overlay-victory'),
            complete: document.getElementById('overlay-complete'),
            pauseBtn: document.getElementById('pause-btn'),
            levelsGrid: document.getElementById('levels-grid'),
            shopGrid: document.getElementById('shop-grid'),
            ingredientsPanel: document.getElementById('ingredients-panel'),
            recipesList: document.getElementById('recipes-list'),
            substancesGrid: document.getElementById('substances-grid'),
            potionResult: document.getElementById('potion-result'),
            cauldronLiquid: document.getElementById('cauldron-liquid'),
            victoryStats: document.getElementById('victory-stats'),
            victoryUnlock: document.getElementById('victory-unlock'),
            completeStats: document.getElementById('complete-stats'),
            tutorialTitle: document.getElementById('tutorial-title'),
            tutorialContent: document.getElementById('tutorial-content'),
            tutorialDots: document.getElementById('tutorial-dots'),
            tutorialPrev: document.getElementById('tutorial-prev'),
            tutorialNext: document.getElementById('tutorial-next')
        };
        document.querySelectorAll('[data-action]').forEach(b =>
            b.addEventListener('click', () => this.handleAction(b.dataset.action)));
        this.ui.pauseBtn.addEventListener('click', () => this.pauseGame());
        document.getElementById('toggle-sfx').addEventListener('click', () => {
            AudioManager.enabled = !AudioManager.enabled;
            this.updateSfxToggle(); this.persist();
        });
        this.ui.tutorialPrev.addEventListener('click', () => this.tutorialPrev());
        this.ui.tutorialNext.addEventListener('click', () => this.tutorialNext());
        this.buildLevelGrid();
    }

    tutorialSlides = [
        {
            title: 'Добро пожаловать, Маг',
            html: `
                <p class="desc">Ты — последний Хранитель Стихий. Пройди все испытания и сразись с Горным Монстром!</p>
                <p class="desc" style="margin-top:16px;">Движение:</p>
                <div class="keys-demo">
                    <span class="key-badge">A</span>
                    <span class="key-badge">D</span>
                    <span class="key-badge">←</span>
                    <span class="key-badge">→</span>
                </div>
                <p class="desc">Прыжок:</p>
                <div class="keys-demo">
                    <span class="key-badge">W</span>
                    <span class="key-badge">Space</span>
                    <span class="key-badge">↑</span>
                </div>
                <p class="desc" style="margin-top:12px; color:#ffcc00;">На каждом уровне есть несколько путей — выбирай: риск и награда сверху, или безопасность внизу.</p>
            `
        },
        {
            title: 'Стихии — твоё оружие',
            html: `
                <p class="desc">Каждая стихия призывается своей клавишей:</p>
                <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:12px; margin-top:12px;">
                    <div class="elem-badge earth"><span class="key-badge">Q</span> Земля — столб</div>
                    <div class="elem-badge fire"><span class="key-badge">E</span> Огонь — луч</div>
                    <div class="elem-badge water"><span class="key-badge">F</span> Вода — платформа</div>
                    <div class="elem-badge air"><span class="key-badge">T</span> Воздух — вихрь</div>
                </div>
                <p class="desc" style="margin-top:16px;">В битве с боссом все стихии пригодятся: огонь наносит урон, земля блокирует камни, вода и воздух помогают уклоняться.</p>
            `
        },
        {
            title: 'Ворон-помощник и субстанции',
            html: `
                <p class="desc">Нажми <span class="key-badge">R</span> — ворон полетит вперёд и принесёт 3 звезды. В битве с боссом он нанесёт мощный удар.</p>
                <p class="desc" style="margin-top:12px;">В лаборатории смешивай ингредиенты — получай магические субстанции: эссенции, кристаллы, пламя, пустоту...</p>
                <p class="desc" style="margin-top:12px; color:#ffcc00;">Каждый уровень даёт новый ингредиент. Открывай все рецепты!</p>
            `
        }
    ];

    showTutorial() {
        this.state = GameState.TUTORIAL;
        this.tutorialStep = 0;
        this.renderTutorial();
        this.showOverlay('tutorial');
    }

    renderTutorial() {
        const slide = this.tutorialSlides[this.tutorialStep];
        this.ui.tutorialTitle.textContent = slide.title;
        this.ui.tutorialContent.innerHTML = slide.html;
        this.ui.tutorialDots.innerHTML = '';
        for (let i = 0; i < this.tutorialSlides.length; i++) {
            const d = document.createElement('div');
            d.className = 'dot-nav' + (i === this.tutorialStep ? ' active' : '');
            this.ui.tutorialDots.appendChild(d);
        }
        this.ui.tutorialPrev.style.visibility = this.tutorialStep === 0 ? 'hidden' : 'visible';
        this.ui.tutorialNext.textContent =
            this.tutorialStep === this.tutorialSlides.length - 1 ? 'Начать! ✓' : 'Далее ▶';
    }

    tutorialPrev() {
        if (this.tutorialStep > 0) {
            this.tutorialStep--;
            this.renderTutorial();
        }
    }
    tutorialNext() {
        if (this.tutorialStep < this.tutorialSlides.length - 1) {
            this.tutorialStep++;
            this.renderTutorial();
        } else {
            this.tutorialShown = true;
            this.persist();
            this.gotoMenu();
        }
    }

    buildLevelGrid() {
        const grid = this.ui.levelsGrid;
        grid.innerHTML = '';
        const icons = { earth: '⛰', fire: '🔥', water: '💧', air: '💨', final: '✦' };
        LEVELS.forEach((lvl, i) => {
            const locked = (i + 1) > this.unlocked;
            const col = document.createElement('div');
            col.className = 'level-col' + (lvl.isBoss ? ' boss-col' : '');
            col.style.setProperty('--elem-color', lvl.elemColor);

            const info = document.createElement('div');
            info.className = 'level-info';
            const icon = lvl.isBoss ? '☠' : (icons[lvl.elem] || '✦');
            info.innerHTML = `
                <div class="level-icon">${icon}</div>
                <div class="level-name">${lvl.name}</div>
                <div class="level-elem">${lvl.isBoss ? 'Босс' : lvl.elemName}</div>
            `;
            col.appendChild(info);

            const btn = document.createElement('button');
            let btnClass = 'level-btn';
            if (locked) btnClass += ' locked';
            else if ((i + 1) === this.unlocked) btnClass += ' active';
            if (lvl.isBoss) btnClass += ' boss-btn';
            btn.className = btnClass;
            btn.innerHTML = lvl.isBoss ? 'БОСС' : `УРОВЕНЬ ${i + 1}`;
            if (!locked) btn.addEventListener('click', () => this.startLevel(i));
            col.appendChild(btn);

            grid.appendChild(col);
        });
    }

    buildShopGrid() {
        const grid = this.ui.shopGrid;
        grid.innerHTML = '';
        SHOP_ITEMS.forEach(item => {
            const isOwned = this.owned.includes(item.id);
            const isEquipped = this.appearance[item.type] === item.id;
            const card = document.createElement('div');
            card.className = 'shop-item' + (isOwned ? ' owned' : '') + (isEquipped ? ' equipped' : '');
            card.innerHTML = `
                <canvas width="90" height="90"></canvas>
                <div class="item-name">${item.name}</div>
                <div class="item-price">${isOwned ? (isEquipped ? '★ НАДЕТО' : '✓ Куплено') : item.price}</div>
                ${isOwned ? `<div class="item-status">${isEquipped ? 'НАДЕТО' : 'КУПЛЕНО'}</div>` : ''}
            `;
            this.drawItemPreview(card.querySelector('canvas'), item);
            card.addEventListener('click', () => {
                if (isOwned) {
                    this.appearance[item.type] = item.id;
                    this.persist(); this.buildShopGrid();
                } else if (this.totalCoins >= item.price) {
                    this.totalCoins -= item.price;
                    this.owned.push(item.id);
                    this.appearance[item.type] = item.id;
                    this.persist(); this.updateShopCoins(); this.buildShopGrid();
                }
            });
            grid.appendChild(card);
        });
        this.updateShopCoins();
    }

    drawItemPreview(canvas, item) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 90, 90);
        ctx.fillStyle = 'rgba(20, 10, 30, 0.6)';
        ctx.fillRect(0, 0, 90, 90);
        ctx.save(); ctx.translate(45, 60);
        if (item.type === 'hat') {
            ctx.fillStyle = item.color;
            if (item.id === 'hat_crown') {
                ctx.beginPath();
                ctx.moveTo(-22, 0); ctx.lineTo(-22, -14);
                ctx.lineTo(-12, -6); ctx.lineTo(-6, -20);
                ctx.lineTo(0, -6); ctx.lineTo(6, -20);
                ctx.lineTo(12, -6); ctx.lineTo(22, -14);
                ctx.lineTo(22, 0); ctx.closePath(); ctx.fill();
            } else if (item.id === 'hat_horns') {
                ctx.strokeStyle = item.color; ctx.lineWidth = 5; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(-10, 4); ctx.quadraticCurveTo(-22, -20, -8, -24); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(10, 4); ctx.quadraticCurveTo(22, -20, 8, -24); ctx.stroke();
            } else if (item.id === 'hat_halo') {
                ctx.strokeStyle = item.color; ctx.lineWidth = 5;
                ctx.beginPath(); ctx.ellipse(0, -18, 20, 6, 0, 0, Math.PI * 2); ctx.stroke();
            } else if (item.id === 'hat_hood') {
                ctx.beginPath();
                ctx.arc(0, 6, 22, Math.PI, 0);
                ctx.lineTo(16, 16); ctx.lineTo(-16, 16); ctx.closePath(); ctx.fill();
            } else {
                ctx.beginPath();
                ctx.moveTo(-20, 6); ctx.quadraticCurveTo(-22, -22, 0, -28);
                ctx.quadraticCurveTo(22, -22, 20, 6);
                ctx.lineTo(14, 10); ctx.lineTo(-14, 10);
                ctx.closePath(); ctx.fill();
            }
        } else if (item.type === 'robe') {
            const g = ctx.createLinearGradient(0, -20, 0, 25);
            g.addColorStop(0, item.color); g.addColorStop(1, 'rgba(0,0,0,0.7)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(-20, 25); ctx.lineTo(20, 25);
            ctx.lineTo(14, -22); ctx.lineTo(-14, -22);
            ctx.closePath(); ctx.fill();
        } else if (item.type === 'staff') {
            ctx.strokeStyle = item.color; ctx.lineWidth = 5; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(0, 26); ctx.lineTo(0, -20); ctx.stroke();
            const gemCol = item.id === 'staff_wood' ? '#66ccff' :
                          item.id === 'staff_cryst' ? '#aae0ff' :
                          item.id === 'staff_flame' ? '#ff8844' : '#fff9a0';
            ctx.fillStyle = gemCol;
            ctx.beginPath(); ctx.arc(0, -24, 6, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    buildLabUI() {
        const panel = this.ui.ingredientsPanel;
        panel.innerHTML = '';
        INGREDIENTS.forEach(ing => {
            const unlocked = this.unlockedIngredients.includes(ing.id);
            const sel = this.labSelected.includes(ing.id);
            const b = document.createElement('div');
            b.className = 'ingredient' + (unlocked ? '' : ' locked') + (sel ? ' selected' : '');
            b.innerHTML = `
                <div class="ing-dot" style="background:${ing.color}; color:${ing.color}"></div>
                <div class="ing-info">
                    <div class="ing-name">${ing.name}</div>
                    <div class="ing-status">${unlocked ? 'Доступно' : '🔒 Уровень ' + ing.unlockedByLevel}</div>
                </div>
            `;
            if (unlocked) {
                b.addEventListener('click', () => {
                    if (this.petAnimation) return;
                    const i = this.labSelected.indexOf(ing.id);
                    if (i >= 0) this.labSelected.splice(i, 1);
                    else if (this.labSelected.length < 2) this.labSelected.push(ing.id);
                    this.buildLabUI(); this.updateCauldron();
                });
            }
            panel.appendChild(b);
        });

        const list = this.ui.recipesList;
        list.innerHTML = '';
        if (this.craftedRecipes.length === 0) {
            list.innerHTML = '<div style="color:#aaa; padding:10px; font-style:italic;">Пока нет открытий</div>';
        } else {
            this.craftedRecipes.forEach(key => {
                const r = RECIPES[key];
                if (r) {
                    list.innerHTML += `<div class="recipe-item">
                        <span class="r-name">${r.name}</span>
                        <span class="r-subst" style="color:${r.color}">${SUBSTANCES[r.substance].name}</span>
                    </div>`;
                }
            });
        }
    }

    updateCauldron() {
        const l = this.ui.cauldronLiquid;
        if (this.labSelected.length === 0) {
            l.style.background = '#111'; l.classList.remove('mixed');
            this.ui.potionResult.textContent = 'Выберите 2 ингредиента';
        } else if (this.labSelected.length === 1) {
            const ing = INGREDIENTS.find(i => i.id === this.labSelected[0]);
            l.style.background = ing.color; l.classList.remove('mixed');
            this.ui.potionResult.textContent = 'Добавьте второй...';
        } else {
            l.style.background = 'linear-gradient(135deg, ' +
                INGREDIENTS.find(i => i.id === this.labSelected[0]).color + ', ' +
                INGREDIENTS.find(i => i.id === this.labSelected[1]).color + ')';
            this.ui.potionResult.textContent = 'Готово к смешиванию!';
        }
    }

    mixPotion() {
        if (this.petAnimation) return;
        if (this.labSelected.length < 2) {
            this.ui.potionResult.textContent = 'Нужно два ингредиента';
            return;
        }
        const key = [...this.labSelected].sort().join('+');
        const r = RECIPES[key];

        this.petAnimation = { timer: 0, duration: 2.0, result: r };

        if (r) {
            if (!this.craftedRecipes.includes(key)) this.craftedRecipes.push(key);
            if (!this.unlockedSubstances.includes(r.substance)) this.unlockedSubstances.push(r.substance);
            this.ui.potionResult.innerHTML = `<span style="color:${r.color}">✨ ${r.name}! ✨</span>`;
            this.ui.cauldronLiquid.classList.add('mixed');
            AudioManager.craft();
        } else {
            this.ui.potionResult.innerHTML = '<span style="color:#ff4444">Неудача...</span>';
        }
        this.labSelected = [];
        this.persist();
    }

    updateLabAnimation(dt) {
        if (!this.petAnimation) return;
        this.petAnimation.timer += dt;
        if (this.petAnimation.timer >= this.petAnimation.duration) {
            const result = this.petAnimation.result;
            this.petAnimation = null;
            this.buildLabUI();
            this.updateCauldron();
            if (result) {
                this.ui.potionResult.innerHTML = `<span style="color:${result.color}">✨ ${result.name}! ✨<br>
                    <span style="color:#a9f0a9">Субстанция: ${SUBSTANCES[result.substance].name}</span></span>`;
                AudioManager.win();
            }
        }
    }

    buildSubstancesUI() {
        const grid = this.ui.substancesGrid;
        grid.innerHTML = '';
        Object.keys(SUBSTANCES).forEach(substId => {
            const subst = SUBSTANCES[substId];
            const unlocked = this.unlockedSubstances.includes(substId);
            const card = document.createElement('div');
            card.className = 'substance-card' + (unlocked ? ' unlocked' : '');
            card.innerHTML = `
                <canvas width="80" height="80"></canvas>
                <div class="subst-name" style="${unlocked ? 'color:'+subst.color : ''}">${unlocked ? subst.name : '???'}</div>
                <div class="subst-status">${unlocked ? '✓ открыто' : '🔒'}</div>
            `;
            const cv = card.querySelector('canvas');
            const cx = cv.getContext('2d');
            cx.clearRect(0, 0, 80, 80);
            if (unlocked) {
                this.drawSubstance(cx, substId, 40, 40, 30, performance.now() / 1000);
            } else {
                cx.fillStyle = 'rgba(60, 40, 80, 0.8)';
                cx.beginPath(); cx.arc(40, 40, 22, 0, Math.PI * 2); cx.fill();
                cx.fillStyle = '#aaa'; cx.font = "bold 22px Nunito, sans-serif";
                cx.textAlign = 'center'; cx.textBaseline = 'middle';
                cx.fillText('?', 40, 42);
            }
            grid.appendChild(card);
        });
    }

    drawSubstance(ctx, substId, cx, cy, scale, time) {
        const s = SUBSTANCES[substId];
        if (!s) return;
        const t = time || performance.now() / 1000;
        const pulse = 0.85 + 0.15 * Math.sin(t * 2 + substId.length);

        ctx.save();
        ctx.translate(cx, cy);

        const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, scale * 1.3 * pulse);
        glow.addColorStop(0, s.color + 'ff');
        glow.addColorStop(0.4, s.color + '88');
        glow.addColorStop(1, s.color + '00');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(0, 0, scale * 1.3 * pulse, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = s.color;
        const shape = s.shape || 'orb';

        if (shape === 'orb') {
            ctx.beginPath(); ctx.arc(0, 0, scale * 0.65, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.beginPath(); ctx.arc(-scale * 0.22, -scale * 0.22, scale * 0.25, 0, Math.PI * 2); ctx.fill();
        } else if (shape === 'crystal') {
            ctx.beginPath();
            ctx.moveTo(0, -scale * 0.9);
            ctx.lineTo(scale * 0.55, -scale * 0.15);
            ctx.lineTo(0, scale * 0.85);
            ctx.lineTo(-scale * 0.55, -scale * 0.15);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.beginPath();
            ctx.moveTo(0, -scale * 0.9);
            ctx.lineTo(scale * 0.55, -scale * 0.15);
            ctx.lineTo(0, 0);
            ctx.closePath(); ctx.fill();
        } else if (shape === 'star') {
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
                const ang = (Math.PI / 5) * i - Math.PI / 2 + t * 0.5;
                const r = i % 2 === 0 ? scale * 0.9 : scale * 0.4;
                const x = Math.cos(ang) * r;
                const y = Math.sin(ang) * r;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath(); ctx.fill();
        } else if (shape === 'cloud') {
            for (let i = 0; i < 4; i++) {
                const ang = t * 1.5 + i * (Math.PI / 2);
                ctx.beginPath();
                ctx.arc(Math.cos(ang) * scale * 0.35, Math.sin(ang) * scale * 0.35, scale * 0.42, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (shape === 'flame') {
            ctx.beginPath();
            ctx.moveTo(0, -scale);
            ctx.quadraticCurveTo(scale * 0.75, -scale * 0.1, scale * 0.3, scale * 0.6);
            ctx.quadraticCurveTo(0, scale * 0.3, -scale * 0.3, scale * 0.6);
            ctx.quadraticCurveTo(-scale * 0.75, -scale * 0.1, 0, -scale);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,220,0.85)';
            ctx.beginPath(); ctx.arc(0, scale * 0.15, scale * 0.28, 0, Math.PI * 2); ctx.fill();
        } else if (shape === 'hex') {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const ang = (i / 6) * Math.PI * 2 - Math.PI / 2 + t * 0.3;
                const x = Math.cos(ang) * scale * 0.8;
                const y = Math.sin(ang) * scale * 0.8;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.lineWidth = 2; ctx.stroke();
        } else if (shape === 'snow') {
            for (let i = 0; i < 6; i++) {
                const ang = (i / 6) * Math.PI * 2 + t * 0.4;
                ctx.save();
                ctx.rotate(ang);
                ctx.fillRect(-1.5, -scale * 0.9, 3, scale * 0.9);
                ctx.beginPath();
                ctx.arc(0, -scale * 0.7, scale * 0.18, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            ctx.beginPath(); ctx.arc(0, 0, scale * 0.28, 0, Math.PI * 2); ctx.fill();
        } else if (shape === 'ring') {
            ctx.lineWidth = scale * 0.35;
            ctx.strokeStyle = s.color;
            ctx.beginPath(); ctx.arc(0, 0, scale * 0.65, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath(); ctx.arc(0, 0, scale * 0.22, 0, Math.PI * 2); ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath(); ctx.arc(0, 0, scale * 0.95, t, t + Math.PI * 1.2); ctx.stroke();
        } else if (shape === 'spiral') {
            ctx.strokeStyle = s.color; ctx.lineWidth = scale * 0.2; ctx.lineCap = 'round';
            ctx.beginPath();
            for (let i = 0; i <= 40; i++) {
                const ang = (i / 40) * Math.PI * 3 + t * 0.8;
                const r = (i / 40) * scale * 0.85;
                const x = Math.cos(ang) * r;
                const y = Math.sin(ang) * r;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.beginPath(); ctx.arc(0, 0, scale * 0.15, 0, Math.PI * 2); ctx.fill();
        } else if (shape === 'wisp') {
            for (let i = 0; i < 3; i++) {
                const ang = t * 2 + i * (Math.PI * 2 / 3);
                const r = scale * 0.5;
                const wx = Math.cos(ang) * r;
                const wy = Math.sin(ang) * r;
                ctx.beginPath();
                ctx.arc(wx, wy, scale * 0.28, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath(); ctx.arc(0, 0, scale * 0.22, 0, Math.PI * 2); ctx.fill();
        } else if (shape === 'burst') {
            for (let i = 0; i < 8; i++) {
                const ang = (i / 8) * Math.PI * 2 + t * 0.5;
                const r1 = scale * 0.35;
                const r2 = scale * 0.95;
                ctx.beginPath();
                ctx.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
                ctx.lineTo(Math.cos(ang) * r2, Math.sin(ang) * r2);
                ctx.lineTo(Math.cos(ang + 0.2) * r2, Math.sin(ang + 0.2) * r2);
                ctx.lineTo(Math.cos(ang + 0.2) * r1, Math.sin(ang + 0.2) * r1);
                ctx.closePath();
                ctx.fill();
            }
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.beginPath(); ctx.arc(0, 0, scale * 0.25, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    }

    showOverlay(name) {
        Object.values(this.ui).forEach(el => {
            if (el && el.classList && el.classList.contains('overlay')) el.classList.add('hidden');
        });
        if (name && this.ui[name]) this.ui[name].classList.remove('hidden');
        this.ui.pauseBtn.classList.toggle('hidden', this.state !== GameState.PLAYING);
    }

    handleAction(action) {
        switch (action) {
            case 'play':
                this.state = GameState.LEVEL_SELECT;
                this.buildLevelGrid(); this.showOverlay('levels');
                break;
            case 'shop':
                this.state = GameState.SHOP;
                this.buildShopGrid(); this.showOverlay('shop');
                break;
            case 'shop-reset':
                this.appearance = { hat: 'hat_default', robe: 'robe_purple', staff: 'staff_wood' };
                this.persist(); this.buildShopGrid();
                break;
            case 'lab':
                this.state = GameState.LAB;
                this.labSelected = [];
                this.petAnimation = null;
                this.buildLabUI(); this.updateCauldron();
                this.showOverlay('lab');
                break;
            case 'lab-clear':
                if (this.petAnimation) return;
                this.labSelected = []; this.buildLabUI(); this.updateCauldron();
                break;
            case 'lab-mix': this.mixPotion(); break;
            case 'show-substances':
                this.state = GameState.SUBSTANCES;
                this.buildSubstancesUI(); this.showOverlay('substances');
                break;
            case 'back-to-lab':
                this.state = GameState.LAB;
                this.buildLabUI(); this.updateCauldron(); this.showOverlay('lab');
                break;
            case 'settings':
                this.state = GameState.SETTINGS; this.showOverlay('settings');
                break;
            case 'show-tutorial':
                this.showTutorial();
                break;
            case 'back-to-menu':
                this.state = GameState.MENU; this.showOverlay('menu');
                break;
            case 'resume': this.resumeGame(); break;
            case 'restart': this.restartLevel(); break;
            case 'retry': this.restartLevel(); break;
            case 'to-menu': this.gotoMenu(); break;
            case 'next-level': this.nextLevel(); break;
            case 'reset-progress':
                SaveSystem.clear();
                this.unlocked = 1; this.totalCoins = 0;
                this.owned = ['hat_default', 'robe_purple', 'staff_wood'];
                this.appearance = { hat: 'hat_default', robe: 'robe_purple', staff: 'staff_wood' };
                this.unlockedIngredients = []; this.craftedRecipes = []; this.unlockedSubstances = [];
                this.tutorialShown = false;
                this.persist(); this.buildLevelGrid();
                this.state = GameState.MENU; this.showOverlay('menu');
                break;
        }
    }

    gotoMenu() {
        this.state = GameState.MENU; this.showOverlay('menu');
    }

    startLevel(idx) {
        this.levelIndex = idx;
        this.level = LEVELS[idx];
        this.coins = 0;

        this.platforms = [];
        for (const seg of this.level.groundSegments) {
            this.platforms.push(new Platform(seg.x, GAME_CONFIG.GROUND_Y, seg.w, 120, this.level.groundStyle));
        }
        for (const p of this.level.platforms) {
            this.platforms.push(new Platform(p.x, p.y, p.w, p.h, p.style || this.level.groundStyle, p.special || null));
        }

        this.coinItems = this.level.coins.map(c => ({
            x: c.x, y: c.y, w: 22, h: 22, value: c.value, collected: false, bob: Math.random() * 6
        }));
        this.star = this.level.star
            ? { x: this.level.star.x, y: this.level.star.y, w: 44, h: 44, collected: false, bob: 0 }
            : null;

        this.fires = (this.level.fires || []).map(f => new Fire(f.x, f.y, f.w, f.h, f.period, f.phase));
        this.tentacles = (this.level.tentacles || []).map(t => new Tentacle(t.x, t.baseY, t.maxHeight, t.period, t.phase));
        this.spikes = (this.level.spikes || []).map(s => new Spike(s.x, s.y, s.w, s.count));
        this.torches = (this.level.torches || []).map(t => new Torch(t.x, t.y));
        this.guardians = (this.level.guardians || []).map(g => new Guardian(g.x, g.y, g.element));
        this.airGeysers = [];

        this.earthPillars = [];
        this.icePlatforms = [];
        this.fireEffects = [];

        this.boss = this.level.isBoss
            ? new MountainBoss(this.level.bossX, this.level.bossY)
            : null;
        if (this.boss) AudioManager.bossRoar();

        this.player = new Player(80, GAME_CONFIG.GROUND_Y - 60);
        this.player.appearance = { ...this.appearance };
        this.player.health = GAME_CONFIG.MAX_HEALTH;
        this.lastSafePos = { x: 80, y: GAME_CONFIG.GROUND_Y - 60 };

        this.crow = new Crow();
        this.camera.x = 0;
        this.camera.y = 0;
        this.camera.lookAhead = 0;
        this.state = GameState.PLAYING;
        this.showOverlay(null);
    }

    restartLevel() { this.startLevel(this.levelIndex); }

    nextLevel() {
        if (this.levelIndex + 1 >= GAME_CONFIG.TOTAL_LEVELS) {
            this.state = GameState.COMPLETE;
            this.ui.completeStats.textContent = `Все ${GAME_CONFIG.TOTAL_LEVELS} уровней и Горный Монстр побеждены!`;
            this.showOverlay('complete');
            return;
        }
        this.startLevel(this.levelIndex + 1);
    }

    pauseGame() {
        if (this.state !== GameState.PLAYING) return;
        this.state = GameState.PAUSED; this.showOverlay('pause');
    }
    resumeGame() {
        if (this.state !== GameState.PAUSED) return;
        this.state = GameState.PLAYING; this.showOverlay(null);
        this.lastTime = performance.now();
    }
    gameOver() { this.state = GameState.GAME_OVER; this.showOverlay('gameOver'); }

    levelComplete() {
        this.totalCoins += this.coins;
        if (this.levelIndex + 2 > this.unlocked) {
            this.unlocked = Math.min(this.levelIndex + 2, GAME_CONFIG.TOTAL_LEVELS);
        }
        let unlockedMsg = '';
        const nextIng = INGREDIENTS.find(i => i.unlockedByLevel === this.levelIndex + 1);
        if (nextIng && !this.unlockedIngredients.includes(nextIng.id)) {
            this.unlockedIngredients.push(nextIng.id);
            unlockedMsg = `Новый ингредиент: ${nextIng.name}!`;
        }
        this.persist();
        AudioManager.win();
        const isLast = this.levelIndex + 1 >= GAME_CONFIG.TOTAL_LEVELS;
        this.ui.victoryStats.textContent = `Собрано звёзд: ${this.coins}. Всего: ${this.totalCoins}`;
        this.ui.victoryUnlock.textContent = unlockedMsg;
        this.updateShopCoins();
        if (isLast) {
            this.state = GameState.COMPLETE;
            this.ui.completeStats.textContent = `Все ${GAME_CONFIG.TOTAL_LEVELS} испытаний пройдены! Горный Монстр побеждён. Звёзд всего: ${this.totalCoins}`;
            this.showOverlay('complete');
        } else {
            this.state = GameState.VICTORY; this.showOverlay('victory');
        }
    }

    start() {
        if (this.rafId) return;
        const loop = t => {
            this.rafId = requestAnimationFrame(loop);
            const dt = Math.min((t - this.lastTime) / 1000, 0.05);
            this.lastTime = t;
            this.update(dt);
            this.render();
            this.input.endFrame();
        };
        this.rafId = requestAnimationFrame(loop);
    }

    update(dt) {
        if (this.state === GameState.PLAYING) this.updatePlaying(dt);
        else if (this.state === GameState.PAUSED) {
            if (this.input.wasPressed('KeyP') || this.input.wasPressed('Escape')) this.resumeGame();
        } else if (this.state === GameState.GAME_OVER) {
            if (this.input.wasPressed('Enter')) this.restartLevel();
        }
        if (this.state === GameState.LAB) this.updateLabAnimation(dt);
    }

    updatePlaying(dt) {
        const frameScale = dt * 60;
        if (this.input.wasPressed('KeyP') || this.input.wasPressed('Escape')) { this.pauseGame(); return; }

        this.player.handleInput(this.input, dt);
        this.handleMagic();

        for (const p of this.platforms) p.update(dt);

        this.player.inAirGeyser = false;
        for (const g of this.airGeysers) {
            g.update(dt);
            if (g.contains(this.player)) {
                this.player.inAirGeyser = true;
                if (this.player.vy > -6) this.player.vy -= 1.2;
            }
        }

        this.player.applyPhysics(frameScale);
        this.earthPillars = this.earthPillars.filter(p => p.update(dt));
        this.icePlatforms = this.icePlatforms.filter(p => p.update(dt));
        this.fireEffects = this.fireEffects.filter(f => { f.life -= dt; return f.life > 0; });

        this.resolveCollisions();

        if (this.input.wasPressed('KeyR') && this.crow && this.player.crowCd <= 0) {
            if (this.crow.useHelp(this.player, this.level, this.boss)) {
                this.player.crowCd = GAME_CONFIG.CROW_COOLDOWN;
                if (this.boss && !this.boss.dead) {
                    this.boss.hit(3);
                    this.boss.stun(1.5);
                } else {
                    this.coins += 3;
                }
            }
        }

        for (const f of this.fires) f.update(dt);
        for (const t of this.tentacles) t.update(dt);
        for (const t of this.torches) t.update(dt);
        for (const g of this.guardians) g.update(dt);
        if (this.crow) this.crow.update(dt, this.player);
        if (this.boss) this.boss.update(dt, this.player, this.level);

        if (this.boss && this.boss.dead && this.boss.deathTimer > 2.5 && this.state === GameState.PLAYING) {
            this.levelComplete();
            return;
        }

        this.checkHazards();
        this.checkPickups();
        this.updateCamera(dt);
    }

    handleMagic() {
        if (this.input.wasPressed('KeyQ') && this.player.earthCd <= 0) {
            const px = this.player.x + this.player.w / 2 - GAME_CONFIG.EARTH_PILLAR_W / 2;
            const py = this.player.y + this.player.h;
            this.earthPillars.push(new EarthPillar(px, py));
            this.player.earthCd = GAME_CONFIG.EARTH_COOLDOWN;
            AudioManager.cast();
        }
        if (this.input.wasPressed('KeyE') && this.player.fireCd <= 0) {
            const dir = this.player.facing === 'right' ? 1 : -1;
            const fx = this.player.centerX + dir * 60;
            const fy = this.player.centerY;
            this.fireEffects.push({ x: fx, y: fy, life: 0.5, maxLife: 0.5, dir });
            this.player.fireCd = GAME_CONFIG.FIRE_COOLDOWN;

            for (const g of this.guardians) {
                if (g.dead) continue;
                const dx = (g.x + g.w / 2) - this.player.centerX;
                if (dx * dir > 0 && Math.abs(dx) < GAME_CONFIG.FIRE_RANGE && Math.abs(g.y - this.player.y) < 100) {
                    g.kill();
                }
            }
            if (this.boss && !this.boss.dead) {
                const bossCx = this.boss.x + this.boss.w / 2;
                const dxBoss = bossCx - this.player.centerX;
                if (dxBoss * dir > 0 && Math.abs(dxBoss) < GAME_CONFIG.FIRE_RANGE + 100) {
                    this.boss.hit(2);
                }
            }
            AudioManager.cast();
        }
        if (this.input.wasPressed('KeyF') && this.player.iceCd <= 0) {
            const dir = this.player.facing === 'right' ? 1 : -1;
            const ix = this.player.centerX + dir * 40 - GAME_CONFIG.ICE_PLATFORM_W / 2;
            const iy = this.player.y - 30;
            this.icePlatforms.push(new IcePlatform(ix, iy));
            this.player.iceCd = GAME_CONFIG.ICE_COOLDOWN;
            AudioManager.cast();
        }
        if (this.input.wasPressed('KeyT') && this.player.airCd <= 0) {
            const px = this.player.x + this.player.w / 2 - GAME_CONFIG.AIR_GEYSER_W / 2;
            const py = this.player.y + this.player.h - GAME_CONFIG.AIR_GEYSER_H;
            this.airGeysers.push(new AirGeyser(px, py));
            this.player.airCd = GAME_CONFIG.AIR_COOLDOWN;
            AudioManager.cast();
        }
    }

    /* === ПЛАВНАЯ КАМЕРА === */
    updateCamera(dt) {
        const p = this.player;

        const targetLookAhead = p.vx * 25;
        const lookAheadSmoothing = 1 - Math.exp(-dt / 0.15);
        this.camera.lookAhead += (targetLookAhead - this.camera.lookAhead) * lookAheadSmoothing;

        const targetX = p.centerX + this.camera.lookAhead - GAME_CONFIG.WIDTH / 2;
        const maxX = Math.max(0, this.level.width - GAME_CONFIG.WIDTH);
        const clampedX = Math.max(0, Math.min(maxX, targetX));

        const smoothX = 1 - Math.exp(-dt / 0.12);
        this.camera.x += (clampedX - this.camera.x) * smoothX;

        const playerScreenY = p.centerY - this.camera.y;
        let targetY = this.camera.y;
        if (playerScreenY < GAME_CONFIG.HEIGHT * 0.42) {
            targetY = p.centerY - GAME_CONFIG.HEIGHT * 0.42;
        } else if (playerScreenY > GAME_CONFIG.HEIGHT * 0.85) {
            targetY = p.centerY - GAME_CONFIG.HEIGHT * 0.85;
        }
        targetY = Math.max(-520, Math.min(100, targetY));

        const smoothY = 1 - Math.exp(-dt / 0.18);
        this.camera.y += (targetY - this.camera.y) * smoothY;
    }

    resolveCollisions() {
        const p = this.player;
        const wasOnGround = p.onGround;
        p.onGround = false;
        const allPlatforms = [...this.platforms, ...this.earthPillars, ...this.icePlatforms];
        for (const plat of allPlatforms) {
            const bounds = plat.getBounds ? plat.getBounds() : plat;
            if (!bounds) continue;
            const pb = p.getBounds();
            if (!Collision.aabb(pb, bounds)) continue;
            const ovX = Collision.overlapX(pb, bounds), ovY = Collision.overlapY(pb, bounds);
            if (ovX < ovY) {
                if (p.centerX < bounds.x + bounds.w / 2) p.x = bounds.x - p.w;
                else p.x = bounds.x + bounds.w;
                p.vx = 0;
            } else {
                if (p.centerY < bounds.y + bounds.h / 2) {
                    p.y = bounds.y - p.h;
                    p.vy = 0;
                    p.onGround = true;
                } else {
                    p.y = bounds.y + bounds.h;
                    p.vy = 0;
                }
            }
        }
        if (p.x < 0) { p.x = 0; p.vx = 0; }
        if (p.x + p.w > this.level.width) { p.x = this.level.width - p.w; p.vx = 0; }
        if (p.onGround) this.lastSafePos = { x: p.x, y: p.y };
        if (p.onGround && !wasOnGround) p.landSquash = 1;

        if (p.y > GAME_CONFIG.FALL_LIMIT) {
            p.hurt(1);
            if (p.health <= 0) { this.gameOver(); return; }
            p.respawn(this.lastSafePos.x, this.lastSafePos.y - 20);
        }
    }

    checkHazards() {
        const p = this.player, pb = p.getBounds();
        for (const f of this.fires) {
            const fb = f.getBounds();
            if (fb && Collision.aabb(pb, fb)) { if (p.hurt(1) && p.health <= 0) { this.gameOver(); return; } }
        }
        for (const t of this.tentacles) {
            const tb = t.getBounds();
            if (tb && Collision.aabb(pb, tb)) { if (p.hurt(1) && p.health <= 0) { this.gameOver(); return; } }
        }
        for (const s of this.spikes) {
            if (Collision.aabb(pb, s.getBounds())) { if (p.hurt(1) && p.health <= 0) { this.gameOver(); return; } }
        }
        for (const g of this.guardians) {
            if (g.dead) continue;
            if (Collision.aabb(pb, g.getBounds())) { if (p.hurt(1) && p.health <= 0) { this.gameOver(); return; } }
        }
        if (this.boss && !this.boss.dead) {
            for (const h of this.boss.getHazards()) {
                if (Collision.aabb(pb, h)) { if (p.hurt(1) && p.health <= 0) { this.gameOver(); return; } }
            }
        }
    }

    checkPickups() {
        const pb = this.player.getBounds();
        for (const c of this.coinItems) {
            if (c.collected) continue;
            const cb = { x: c.x - c.w / 2, y: c.y - c.h / 2, w: c.w, h: c.h };
            if (Collision.aabb(pb, cb)) { c.collected = true; this.coins += c.value; AudioManager.coin(); }
        }
        if (this.star && !this.star.collected) {
            const sb = { x: this.star.x - 24, y: this.star.y - 24, w: 48, h: 48 };
            if (Collision.aabb(pb, sb)) { this.star.collected = true; this.coins += 5; this.levelComplete(); }
        }
    }

    render() {
        const ctx = this.ctx;
        const W = GAME_CONFIG.WIDTH, H = GAME_CONFIG.HEIGHT;
        if (!this.level) {
            ctx.fillStyle = '#0a1024';
            ctx.fillRect(0, 0, W, H);
            this.drawAtmosphericBackground(ctx, W, H);
            return;
        }
        this.drawSky(ctx);
        this.drawStars(ctx, W, H);
        this.drawMountains(ctx);
        this.drawClouds(ctx);
        if ([GameState.PLAYING, GameState.PAUSED, GameState.GAME_OVER, GameState.VICTORY].includes(this.state)) {
            this.drawWorld(ctx);
            this.applyLighting(ctx);
        }
        if ([GameState.PLAYING, GameState.PAUSED].includes(this.state)) {
            this.drawHUD(ctx);
        }
    }

    drawAtmosphericBackground(ctx, W, H) {
        const t = performance.now() / 3000;
        for (let i = 0; i < 4; i++) {
            const x = W / 2 + Math.cos(t + i * 1.5) * 400;
            const y = H / 2 + Math.sin(t * 1.3 + i * 2) * 200;
            const g = ctx.createRadialGradient(x, y, 10, x, y, 400);
            g.addColorStop(0, i % 2 === 0 ? 'rgba(255, 100, 200, 0.15)' : 'rgba(160, 80, 255, 0.12)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
        }
    }

    drawSky(ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.HEIGHT);
        g.addColorStop(0, this.level.sky[0]);
        g.addColorStop(1, this.level.sky[1]);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    }

    drawStars(ctx, W, H) {
        if (!this.level.stars) return;
        const t = performance.now() / 1000;
        for (let i = 0; i < 130; i++) {
            const x = (i * 137) % W;
            const y = (i * 71) % (H * 0.55);
            const a = 0.3 + 0.7 * Math.abs(Math.sin(t + i * 0.7));
            ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
            const size = (i % 5 === 0) ? 2 : 1.5;
            ctx.fillRect(x, y, size, size);
        }
    }

    drawMountains(ctx) {
        const camX = this.camera.x;
        const off1 = camX * 0.12;
        for (let i = -1; i < 22; i++) {
            const baseX = i * 380 - off1;
            const peak = 460 + (i % 3) * 40;
            const g = ctx.createLinearGradient(baseX, peak, baseX, GAME_CONFIG.GROUND_Y);
            g.addColorStop(0, this.level.mountainFar);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(baseX - 140, GAME_CONFIG.GROUND_Y);
            ctx.lineTo(baseX + 60, peak);
            ctx.lineTo(baseX + 280, GAME_CONFIG.GROUND_Y);
            ctx.closePath(); ctx.fill();
        }
        const off2 = camX * 0.28;
        for (let i = -1; i < 24; i++) {
            const baseX = i * 320 - off2;
            const peak = 530 + (i % 2) * 40;
            const g = ctx.createLinearGradient(baseX, peak, baseX, GAME_CONFIG.GROUND_Y);
            g.addColorStop(0, this.level.mountainNear);
            g.addColorStop(1, 'rgba(0,0,0,0.2)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(baseX - 100, GAME_CONFIG.GROUND_Y);
            ctx.lineTo(baseX + 70, peak);
            ctx.lineTo(baseX + 240, GAME_CONFIG.GROUND_Y);
            ctx.closePath(); ctx.fill();
        }
    }

    drawClouds(ctx) {
        if (!this.level.showClouds) return;
        const off = this.camera.x * 0.06;
        for (let i = 0; i < 12; i++) {
            const x = ((i * 620 - off) % 7000 + 7000) % 7000 - 300;
            const y = 60 + (i * 47) % 200;
            const g = ctx.createRadialGradient(x, y, 10, x, y, 80);
            g.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
            g.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, 34, 0, Math.PI * 2);
            ctx.arc(x + 34, y + 8, 26, 0, Math.PI * 2);
            ctx.arc(x - 34, y + 8, 26, 0, Math.PI * 2);
            ctx.arc(x + 8, y - 18, 26, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawWorld(ctx) {
        for (const t of this.torches) t.draw(ctx, this.camera);
        for (const p of this.platforms) p.draw(ctx, this.camera);
        for (const p of this.earthPillars) p.draw(ctx, this.camera);
        for (const p of this.icePlatforms) p.draw(ctx, this.camera);
        for (const g of this.airGeysers) g.draw(ctx, this.camera);
        for (const s of this.spikes) s.draw(ctx, this.camera);

        for (const c of this.coinItems) {
            if (c.collected) continue;
            c.bob += 0.05;
            const sx = c.x - this.camera.x;
            const sy = c.y - this.camera.y + Math.sin(c.bob) * 4;
            if (c.value >= 5) {
                const gl = ctx.createRadialGradient(sx, sy, 5, sx, sy, 28);
                gl.addColorStop(0, 'rgba(255, 220, 0, 0.6)');
                gl.addColorStop(1, 'rgba(255, 200, 0, 0)');
                ctx.fillStyle = gl;
                ctx.beginPath(); ctx.arc(sx, sy, 28, 0, Math.PI * 2); ctx.fill();
            }
            const coinG = ctx.createRadialGradient(sx - 3, sy - 3, 1, sx, sy, 12);
            coinG.addColorStop(0, c.value >= 5 ? '#fff9a0' : '#fff8c0');
            coinG.addColorStop(1, c.value >= 5 ? '#c08800' : '#b8860b');
            ctx.fillStyle = coinG;
            this.drawStarShape(ctx, sx, sy, 11, 5);
            ctx.strokeStyle = c.value >= 5 ? '#8a6000' : '#7a5500';
            ctx.lineWidth = 2; ctx.stroke();
        }

        if (this.star && !this.star.collected) {
            this.star.bob += 0.05;
            const sx = this.star.x - this.camera.x;
            const sy = this.star.y - this.camera.y + Math.sin(this.star.bob) * 6;
            const gl = ctx.createRadialGradient(sx, sy, 5, sx, sy, 70);
            gl.addColorStop(0, 'rgba(255, 230, 100, 0.8)');
            gl.addColorStop(1, 'rgba(255, 230, 100, 0)');
            ctx.fillStyle = gl;
            ctx.beginPath(); ctx.arc(sx, sy, 70, 0, Math.PI * 2); ctx.fill();
            const starG = ctx.createRadialGradient(sx - 4, sy - 4, 2, sx, sy, 26);
            starG.addColorStop(0, '#fffde0'); starG.addColorStop(1, '#ffc800');
            ctx.fillStyle = starG;
            this.drawStarShape(ctx, sx, sy, 24, 11);
            ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 2; ctx.stroke();
        }

        for (const f of this.fires) f.draw(ctx, this.camera);
        for (const t of this.tentacles) t.draw(ctx, this.camera);

        for (const fe of this.fireEffects) {
            const a = fe.life / fe.maxLife;
            const sx = fe.x - this.camera.x;
            const sy = fe.y - this.camera.y;
            ctx.globalAlpha = a;
            const g = ctx.createRadialGradient(sx, sy, 5, sx, sy, 100);
            g.addColorStop(0, 'rgba(255, 240, 150, 0.9)');
            g.addColorStop(0.5, 'rgba(255, 120, 30, 0.6)');
            g.addColorStop(1, 'rgba(255, 60, 0, 0)');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(sx, sy, 100, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        }

        for (const g of this.guardians) g.draw(ctx, this.camera);
        if (this.boss) this.boss.draw(ctx, this.camera);
        if (this.crow) this.crow.draw(ctx, this.camera);
        if (this.player && this.player.health > 0) this.player.draw(ctx, this.camera);
    }

    applyLighting(ctx) {
        const darkness = this.level.darkness || 0;
        if (darkness <= 0.02) return;
        const lctx = this.lightCtx;
        lctx.globalCompositeOperation = 'source-over';
        lctx.clearRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
        lctx.fillStyle = `rgba(0,0,0,${darkness})`;
        lctx.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
        lctx.globalCompositeOperation = 'destination-out';
        this.cutLight(lctx, this.player.centerX - this.camera.x, this.player.centerY - this.camera.y, 220, 0.95);
        for (const t of this.torches) {
            const r = t.getLightRadius();
            this.cutLight(lctx, t.x - this.camera.x, t.y - 40 - this.camera.y, r, 0.95);
        }
        for (const f of this.fires) {
            if (f.on) this.cutLight(lctx, f.x + f.w / 2 - this.camera.x, f.y - f.h / 2 - this.camera.y, 110, 0.8);
        }
        if (this.star && !this.star.collected) {
            this.cutLight(lctx, this.star.x - this.camera.x, this.star.y - this.camera.y, 150, 0.75);
        }
        if (this.boss && !this.boss.dead) {
            const bx = this.boss.x + this.boss.w / 2 - this.camera.x;
            const by = this.boss.y + this.boss.h * 0.4 - this.camera.y;
            this.cutLight(lctx, bx, by, 300, 0.7);
        }
        ctx.drawImage(this.lightCanvas, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
    }

    cutLight(lctx, x, y, radius, intensity) {
        const grad = lctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, `rgba(255,255,255,${intensity})`);
        grad.addColorStop(0.5, `rgba(255,255,255,${intensity * 0.55})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        lctx.fillStyle = grad;
        lctx.beginPath(); lctx.arc(x, y, radius, 0, Math.PI * 2); lctx.fill();
    }

    drawStarShape(ctx, cx, cy, outer, inner) {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI / 5) * i - Math.PI / 2;
            const r = i % 2 === 0 ? outer : inner;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath(); ctx.fill();
    }

    drawHUD(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, GAME_CONFIG.WIDTH, 60);

        for (let i = 0; i < this.player.maxHealth; i++) {
            ctx.fillStyle = i < this.player.health ? '#ff4080' : 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.moveTo(40 + i * 40, 35);
            ctx.bezierCurveTo(40 + i * 40, 25, 25 + i * 40, 25, 25 + i * 40, 35);
            ctx.bezierCurveTo(25 + i * 40, 45, 40 + i * 40, 55, 40 + i * 40, 55);
            ctx.bezierCurveTo(40 + i * 40, 55, 55 + i * 40, 45, 55 + i * 40, 35);
            ctx.bezierCurveTo(55 + i * 40, 25, 40 + i * 40, 25, 40 + i * 40, 35);
            ctx.fill();
        }

        ctx.fillStyle = '#fff';
        ctx.font = "bold 24px Nunito, sans-serif";
        ctx.textAlign = 'left';
        ctx.fillText(`💎 ${this.coins}`, 180, 40);

        ctx.textAlign = 'center';
        ctx.font = "bold 18px Nunito, sans-serif";
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText(`${this.levelIndex + 1}/${GAME_CONFIG.TOTAL_LEVELS} — ${this.level.name}`, GAME_CONFIG.WIDTH / 2, 40);

        const cds = [
            { key: 'Q', name: 'Земля', cd: this.player.earthCd, max: GAME_CONFIG.EARTH_COOLDOWN, color: '#8a6a3a' },
            { key: 'E', name: 'Огонь', cd: this.player.fireCd,  max: GAME_CONFIG.FIRE_COOLDOWN,  color: '#c04030' },
            { key: 'F', name: 'Вода',  cd: this.player.iceCd,   max: GAME_CONFIG.ICE_COOLDOWN,   color: '#4090c0' },
            { key: 'T', name: 'Воздух',cd: this.player.airCd,   max: GAME_CONFIG.AIR_COOLDOWN,   color: '#8090c0' },
            { key: 'R', name: 'Ворон', cd: this.player.crowCd,  max: GAME_CONFIG.CROW_COOLDOWN,  color: '#8a2050' }
        ];
        const totalW = cds.length * 100;
        let cx = GAME_CONFIG.WIDTH / 2 - totalW / 2 + 5;
        for (const c of cds) {
            const ready = c.cd <= 0;
            ctx.fillStyle = ready ? c.color : 'rgba(60,60,80,0.7)';
            ctx.fillRect(cx, 68, 90, 26);
            ctx.strokeStyle = ready ? '#fff' : '#555';
            ctx.lineWidth = 2;
            ctx.strokeRect(cx, 68, 90, 26);
            if (!ready) {
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(cx, 68, 90 * (c.cd / c.max), 26);
            }
            ctx.fillStyle = '#fff';
            ctx.font = "13px Nunito, sans-serif";
            ctx.textAlign = 'center';
            if (ready) ctx.fillText(`${c.key} — ${c.name}`, cx + 45, 86);
            else ctx.fillText(`${c.cd.toFixed(1)}с`, cx + 45, 86);
            cx += 100;
        }

        if (this.boss && !this.boss.dead) {
            const barW = 700;
            const barH = 26;
            const bx = GAME_CONFIG.WIDTH / 2 - barW / 2;
            const by = 110;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(bx - 6, by - 6, barW + 12, barH + 12);
            ctx.strokeStyle = '#ff4060';
            ctx.lineWidth = 3;
            ctx.strokeRect(bx - 6, by - 6, barW + 12, barH + 12);
            const hpRatio = Math.max(0, this.boss.hp / this.boss.maxHp);
            const hpGrad = ctx.createLinearGradient(bx, by, bx + barW, by);
            hpGrad.addColorStop(0, '#ff2040');
            hpGrad.addColorStop(1, '#ff8050');
            ctx.fillStyle = hpGrad;
            ctx.fillRect(bx, by, barW * hpRatio, barH);
            ctx.fillStyle = '#fff';
            ctx.font = "bold 16px Nunito, sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText(`ГОРНЫЙ МОНСТР  ${this.boss.hp} / ${this.boss.maxHp}`, GAME_CONFIG.WIDTH / 2, by + 18);
        }

        const prog = Math.min(1, this.player.centerX / this.level.width);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(20, GAME_CONFIG.HEIGHT - 22, GAME_CONFIG.WIDTH - 40, 8);
        const pg = ctx.createLinearGradient(0, 0, GAME_CONFIG.WIDTH, 0);
        pg.addColorStop(0, '#5a9dff'); pg.addColorStop(1, '#ffd400');
        ctx.fillStyle = pg;
        ctx.fillRect(20, GAME_CONFIG.HEIGHT - 22, (GAME_CONFIG.WIDTH - 40) * prog, 8);
    }
}

window.addEventListener('load', () => {
    const canvas = document.getElementById('game');
    const game = new Game(canvas);
    window.__game = game;
    if (!game.tutorialShown) {
        game.showTutorial();
    } else {
        game.gotoMenu();
    }
    game.start();
});