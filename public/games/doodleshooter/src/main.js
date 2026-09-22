// 单人游戏入口：波次、道具、太刀专注、菜单与逐帧更新。
import * as THREE from 'three';
import { mountPortfolioBridge } from '../integration.js';
import { InkRenderer, INK, makeInkMaterial } from './render.js';
import { World } from './physics.js';
import { Input } from './input.js';
import { buildLevel } from './level.js';
import { NavGrid } from './nav.js';
import { Effects } from './effects.js';
import { EnemyManager, BOSSES } from './enemies.js';
import { Player } from './player.js';
import { HUD, CONTROLS_HTML } from './hud.js';
import { audio } from './audio.js';
import { rand, choose, clamp } from './util.js';

const canvas = document.getElementById('c');
const R = new InkRenderer(canvas);
const world = new World();
let level = buildLevel(R.scene, world);
let nav = new NavGrid(world, level.bounds, 1).build();
// 重开时恢复可破坏物，同时重建碰撞与寻路网格。
function rebuildLevel() {
  for (const m of level.meshes) { R.scene.remove(m); if (m.geometry) m.geometry.dispose(); if (m.traverse) m.traverse((o) => { if (o !== m && o.geometry) o.geometry.dispose(); }); }
  level.animated.length = 0; world.clear();
  level = buildLevel(R.scene, world); nav = new NavGrid(world, level.bounds, 1).build();
  ctx.level = level; ctx.nav = nav;
}
const input = new Input(canvas);
const hud = new HUD(document.getElementById('hud'));
const effects = new Effects(R.scene, world);
const ctx = { scene: R.scene, camera: R.camera, world, level, nav, input, hud, effects, audio, renderer: R };

// 本地保存最高分、检查点与控制设置。
let best = Number(localStorage.getItem('doodle_best') || 0);
let musicWanted = localStorage.getItem('doodle_music') !== '0';
let checkpoint = Number(localStorage.getItem('doodle_checkpoint') || 0);
const settings = { sens: Number(localStorage.getItem('doodle_sens') || 100), invert: localStorage.getItem('doodle_invert') === '1' };
function applySettings() {
  input.mouseSens = 0.0022 * settings.sens / 100; input.padSensX = 3.4 * settings.sens / 100; input.padSensY = 2.6 * settings.sens / 100; input.invertY = settings.invert;
  localStorage.setItem('doodle_sens', String(settings.sens)); localStorage.setItem('doodle_invert', settings.invert ? '1' : '0');
}
// 战斗状态与计分。
const game = ctx.game = {
  state: 'start', time: 0, hitstopT: 0, hitstopScale: 1, wave: 0, score: 0, combo: 0, comboT: 0, kills: 0, intermission: 0, queue: [], spawnT: 0, maxAlive: 6, deathT: 0,
  focus: { active: false, t: 0, chain: 0, target: null, dash: null, arm: 0, ready: false }, katanaStreak: 0, boss: null,
  hitstop(d, s) { this.hitstopT = Math.max(this.hitstopT, d); this.hitstopScale = s; },
  addScore(pts, label) { const mult = 1 + Math.min(this.combo, 9) * 0.25; const p = Math.round(pts * mult); this.score += p; if (label) hud.kill(label, p); hud.setScore(this.score, this.combo); },
  onPlayerDeath() { endFocus(); this.state = 'dying'; this.deathT = 0; },
};
const enemies = ctx.enemies = new EnemyManager(ctx);
const player = ctx.player = new Player(ctx);

const _v = new THREE.Vector3();
// 子弹、刀刃和爆炸共用可破坏物的伤害入口。
ctx.breakHit = (br, dmg, point, dir) => {
  if (!br.alive) return; br.hp -= dmg;
  if (br.hp <= 0) breakProp(br, dir); else { effects.strokeBurst(point, br.ink, 5, 4, { life: 0.2, size: 0.03 }); audio.shieldHit(point); }
};
ctx.breakablesInArc = (pos, dir, range, cosHalf) => level.breakables.filter((br) => { if (!br.alive) return false; _v.subVectors(br.pos, pos); const d = _v.length(); return d < range + 0.5 && (d < 0.4 || _v.divideScalar(d).dot(dir) > cosHalf); });
ctx.blastBreakables = (c, R) => { for (const br of level.breakables) if (br.alive && br.pos.distanceTo(c) < R * 0.9) breakProp(br, br.pos.clone().sub(c).normalize()); };
function breakProp(br, dir) {
  if (!br.alive) return; br.alive = false; world.removeBox(br.box);
  const g = br.group, pos = br.pos; const d = dir && dir.lengthSq() > 0.01 ? dir.clone().normalize() : new THREE.Vector3(rand(-1, 1), 1, rand(-1, 1)).normalize();
  g.updateMatrixWorld(true);
  for (const child of [...g.children]) {
    child.updateWorldMatrix(true, false); R.scene.attach(child);
    const v = d.clone().multiplyScalar(rand(2, 6)); v.x += rand(-3, 3); v.z += rand(-3, 3); v.y += rand(2.5, 6.5);
    effects.debris(child, child.position, v, new THREE.Vector3(rand(-9, 9), rand(-9, 9), rand(-9, 9)), { radius: 0.14, blood: false, life: rand(6, 9) });
  }
  R.scene.remove(g);
  const up = new THREE.Vector3(0, 1, 0);
  effects.strokeBurst(pos, br.ink, 12, 5, { life: 0.35, size: 0.04 }); effects.smoke(pos, up, 3);
  audio.smash(pos, br.kind === 'barrel' || br.kind === 'crate');
}
// 道具的生成、拾取和过期回收。
const pickups = [];
const pmat = { ammo: makeInkMaterial({ ink: INK.BLUE }), health: makeInkMaterial({ ink: INK.GREEN }), cap: makeInkMaterial({ ink: INK.BLACK }) };
function makePickup(kind) {
  const g = new THREE.Group();
  if (kind === 'ammo') { g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.5, 10), pmat.ammo)); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 8), pmat.cap); c.position.y = 0.33; g.add(c); const l = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.02), pmat.cap); l.position.set(0, 0, 0.24); g.add(l); }
  else { g.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.2), pmat.health), new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), pmat.health)); }
  return g;
}
function spawnPickup(kind, pos) {
  const m = makePickup(kind); m.position.copy(pos); m.position.y += 0.6; R.scene.add(m);
  const p = { kind, mesh: m, base: m.position.y, t: rand(0, 6), life: 45 }; pickups.push(p);
  return p;
}
function removePickup(p) { R.scene.remove(p.mesh); const i = pickups.indexOf(p); if (i >= 0) pickups.splice(i, 1); }
function collectPickup(p) {
  if (p.kind === 'ammo') { player.addAmmoAll(0.4); player.grenades = Math.min(player.maxGrenades, player.grenades + 1); hud.kill('+弹药 · +手雷', 0); } else { player.hp = Math.min(player.maxHp, player.hp + 35); hud.kill('+35 生命', 0); }
  audio.pickup(); effects.strokeBurst(p.mesh.position, p.kind === 'ammo' ? INK.BLUE : INK.GREEN, 12, 4, { life: 0.3 });
}
function updatePickups(dt) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i]; p.t += dt; p.mesh.position.y = p.base + Math.sin(p.t * 2.5) * 0.12; p.mesh.rotation.y += dt * 1.8;
    if (player.alive && p.mesh.position.distanceTo(player.center) < 1.5) {
      collectPickup(p); removePickup(p);
      continue;
    }
    p.life -= dt; if (p.life <= 0) removePickup(p);
  }
}
// 按波次增加敌人规模，每五波轮换一次首领。
const ROSTER = [
  { t: 'grunt', from: 1, w: 10 }, { t: 'rusher', from: 2, w: 6 }, { t: 'bomber', from: 3, w: 3 },
  { t: 'sniper', from: 3, w: 4 }, { t: 'flyer', from: 4, w: 4 }, { t: 'heavy', from: 5, w: 4 }, { t: 'shield', from: 6, w: 4 },
];
const MODIFIERS = [
  { name: '', apply: () => { enemies.mods.speed = 1; enemies.mods.damage = 1; } },
  { name: '咖啡因 · 移动更快', apply: () => { enemies.mods.speed = 1.35; enemies.mods.damage = 0.85; } },
  { name: '重墨 · 打人更疼', apply: () => { enemies.mods.speed = 0.9; enemies.mods.damage = 1.4; } },
  { name: '蜂群 · 数量更多、个体更脆', apply: () => { enemies.mods.speed = 1.15; enemies.mods.damage = 0.9; } },
];
const tips = () => [
  `按住 <b>${hud.key('grapple')}</b> 收绳 · 摆动途中再按一次即可松手`,
  `用 <b>${hud.key('block')}</b> 格挡，部分子弹会反弹回去`,
  '空中击杀得分更高 · 尽量别落地',
  `<b>${hud.key('grenade')}</b> 掷出手雷 · 拾取物可补充手雷`,
  `在空中再按一次 <b>${hud.key('jump')}</b> 可二段跳`,
];
const bossFor = (n) => BOSSES[(Math.floor(n / 5) - 1) % BOSSES.length];
const enemyName = (t) => ({ boss: '涂鸦魔王', eraser: '橡皮魔王', inkblot: '墨渍魔王' })[t] || t.toUpperCase();
function startWave(n) {
  game.wave = n; game.queue = []; game.spawnT = 2; game.intermission = 0; game.boss = null; hud.setBoss(null, null);
  const boss = n > 0 && n % 5 === 0;
  const allowed = boss || n < 4 ? 1 : n < 6 ? 3 : MODIFIERS.length; const mod = MODIFIERS[Math.floor(Math.random() * allowed)];
  mod.apply(); enemies.mods.damage *= 1.2; hud.setModifier(mod.name);
  const swarm = mod.name.startsWith('蜂群');
  // the crowd on screen and the wave size both keep growing with the wave number
  game.maxAlive = Math.min(4 + Math.floor(n * 0.9) + (swarm ? 3 : 0), (swarm ? 22 : 18) + Math.floor(n / 3));
  let count = Math.round(Math.min(5 + n * 2.0, 32 + n) * (swarm ? 1.35 : 1));
  if (boss) { count = 7 + n; game.maxAlive += 2 + Math.floor(n / 5); game.queue.push(bossFor(n)); }
  const pool = ROSTER.filter((r) => n >= r.from).map((r) => ({ t: r.t, w: r.w * Math.min(1, 0.3 + 0.25 * (n - r.from)) }));
  const total = pool.reduce((a, r) => a + r.w, 0);
  for (let i = 0; i < count; i++) { let r = Math.random() * total, t = pool[0].t; for (const c of pool) { r -= c.w; if (r <= 0) { t = c.t; break; } } game.queue.push(t); }
  if (boss) { hud.message('第 ' + n + ' 波', enemyName(bossFor(n)) + ' 正在逼近', 3); audio.bossRoar(player.center); }
  else hud.message('第 ' + n + ' 波', n === 1 ? '它们正从纸面外爬进来' : mod.name || choose(['画得更用力些', '继续涂涂画画', '别待在地面上', '挥刀上吧', '把子弹弹回去']), 2.6);
  audio.wave();
  if (n <= tips().length) hud.tip(tips()[n - 1], 7);
  player.grenades = Math.min(player.maxGrenades, player.grenades + 1);
  for (let i = 0; i < 7; i++) spawnPickup(i < 5 ? 'ammo' : 'health', choose(level.pickups));
  if (n >= 5 && n % 5 === 0 && n > checkpoint) { checkpoint = n; localStorage.setItem('doodle_checkpoint', String(n)); hud.kill('检查点 · 第 ' + n + ' 波', 0); }
}
function pickSpawn(type) {
  const spots = type === 'sniper' ? level.snipers : level.spawns; const pp = player.body.pos;
  if (type === 'flyer') { const a = Math.random() * Math.PI * 2, r = 22 + Math.random() * 10; return new THREE.Vector3(clamp(pp.x + Math.cos(a) * r, level.bounds.minX + 4, level.bounds.maxX - 4), pp.y + 12 + Math.random() * 6, clamp(pp.z + Math.sin(a) * r, level.bounds.minZ + 4, level.bounds.maxZ - 4)); }
  if (BOSSES.includes(type)) {
    const fits = (sp) => !world.overlapsAABB({ x: sp.x - 1.1, y: sp.y + 0.1, z: sp.z - 1.1 }, { x: sp.x + 1.1, y: sp.y + 5.2, z: sp.z + 1.1 });
    const open = spots.filter((sp) => fits(sp)); const far = open.filter((sp) => sp.distanceTo(pp) > 20);
    if (far.length) return choose(far).clone(); if (open.length) return choose(open).clone();
    for (let i = 0; i < 200; i++) { const a = Math.random() * Math.PI * 2, r = 22 + Math.random() * 18; const c = new THREE.Vector3(clamp(pp.x + Math.cos(a) * r, -44, 44), 0, clamp(pp.z + Math.sin(a) * r, -44, 44)); c.y = world.groundBelow(c.x, 30, c.z, 40); if (c.y > -3 && fits(c)) return c; }
    return level.playerStart.clone();
  }
  let cands = spots.filter((s) => { const d = s.distanceTo(pp); return d > 14 && d < 48; });
  if (cands.length < 2) cands = spots.filter((s) => s.distanceTo(pp) > 14);
  const hidden = cands.filter((s) => !world.hasLineOfSight(player.eye, new THREE.Vector3(s.x, s.y + 1.2, s.z)));
  return (choose(hidden.length ? hidden : cands.length ? cands : spots)).clone();
}
function updateWaves(dt) {
  if (game.intermission > 0) {
    game.intermission -= dt; hud.setTimer('下一波还有 ' + Math.ceil(game.intermission) + ' 秒');
    if (game.intermission <= 0) { hud.setTimer(''); startWave(game.wave + 1); }
    return;
  }
  if (game.queue.length && enemies.alive < game.maxAlive) {
    game.spawnT -= dt;
    if (game.spawnT <= 0) {
      game.spawnT = Math.max(0.7, 2.9 - game.wave * 0.13); const t = game.queue.shift(); const e = enemies.spawn(t, pickSpawn(t));
      if (e.T.boss) { const mul = 1 + 0.35 * Math.floor((game.wave - 5) / 15); e.hp = e.maxHp = Math.round(e.T.hp * mul); }
    }
  }
  if (!game.queue.length && enemies.alive === 0) {
    game.intermission = 8; hud.message('第 ' + game.wave + ' 波已清除', '喘口气 · +' + 200 * game.wave, 2.5);
    game.addScore(200 * game.wave, null); audio.waveClear(); player.hp = Math.min(player.maxHp, player.hp + 40);
  }
  hud.setWave(game.wave, enemies.alive + game.queue.length);
}
enemies.onKill = (e, info, over) => {
  game.kills++; game.combo++; game.comboT = 3.5;
  let label = e.T.name, pts = e.T.score;
  if (info.crit) { label = '爆头'; pts += 60; }
  if (info.source === 'katana') { label = over ? '一刀两断' : '斩落'; pts += 50; }
  if (info.source === 'focus') { label = '处决'; pts += 150; }
  if (info.source === 'katana' || info.source === 'focus') { game.katanaStreak++; player.weapons[player.katanaIndex].addBlood(0.42); if (game.katanaStreak >= KATANA_CHARGE_KILLS) enterFocus(); }
  else if (info.source !== 'blast') game.katanaStreak = 0;
  if (info.source === 'deflect') { label = '原路奉还'; pts += 120; }
  if (info.source === 'fall') label = '坠出纸面';
  else if (!player.body.onGround && info.source !== 'deflect') { label += ' · 空中击杀'; pts += 40; }
  game.addScore(pts, label); audio.kill(!!info.crit || e.T.boss);
  const r = Math.random(); if (r < 0.5) spawnPickup('ammo', e.body.pos); else if (r < 0.62) spawnPickup('health', e.body.pos);
};
enemies.onBoss = (e) => { if (!e.alive) { hud.setBoss(null, null); game.boss = null; } else { game.boss = e; hud.setBoss(e.T.name, e.hp / e.maxHp); } };

// 太刀专注：连斩蓄能、慢动作锁定与冲刺处决。
const FOCUS_TIME = 2.6, FOCUS_SCALE = 0.26, FOCUS_RANGE = 24, FOCUS_MAX_CHAIN = 2, FOCUS_ARM = 0.18, DASH_SPEED = 46, KATANA_CHARGE_KILLS = 3;
const _fv = new THREE.Vector3();
function focusCandidate() {
  let best = null, bestScore = -1;
  for (const e of enemies.enemies) {
    if (!e.alive || e.state === 'spawn') continue;
    _fv.subVectors(e.center, player.eye); const d = _fv.length(); if (d > FOCUS_RANGE || d < 0.5) continue;
    const aim = _fv.divideScalar(d).dot(player.forward); if (aim < 0.4) continue;
    if (!world.hasLineOfSight(player.eye, e.center)) continue;
    const score = aim * 3 - d / FOCUS_RANGE; if (score > bestScore) { bestScore = score; best = e; }
  }
  return best;
}
function enterFocus() {
  if (game.focus.chain >= FOCUS_MAX_CHAIN || !focusCandidate()) return;
  const fresh = !game.focus.active;
  game.focus.active = true; game.focus.t = FOCUS_TIME; game.focus.chain++; game.focus.arm = FOCUS_ARM; game.focus.ready = false;
  if (fresh) { audio.focusIn(); hud.tip(`<b>斩击就绪</b> · 按住 ${hud.key('focus')} 冲刺`, 2.2); }
}
function endFocus() { if (!game.focus.active && !game.focus.dash) return; game.focus.active = false; game.focus.target = null; game.focus.chain = 0; game.focus.dash = null; game.katanaStreak = 0; player.dashLock = false; hud.setFocusMark(null); }
function startFocusDash(target) { game.focus.dash = { target, t: 0, trail: player.center.clone(), lastTrail: 0 }; player.dashLock = true; player.body.vel.set(0, 0, 0); audio.dash(); player.kickFov(5); input.rumble(0.5, 0.4, 120); hud.setFocusMark(null); }
function marchBody(b, nx, nz, dist) {
  let moved = 0;
  for (let step = Math.min(0.22, dist); moved + 1e-4 < dist;) { const s2 = Math.min(step, dist - moved); b.pos.x += nx * s2; b.pos.z += nz * s2; if (world.overlapsBody(b)) { b.pos.y += 0.65; if (world.overlapsBody(b)) { b.pos.y -= 0.65; b.pos.x -= nx * s2; b.pos.z -= nz * s2; return moved; } } moved += s2; }
  return moved;
}
function updateFocusDash(dt) {
  const d = game.focus.dash; if (!d) return true;
  const target = d.target; d.t += dt;
  if (!target.alive || d.t > 1.2) { endDash(false); return true; }
  const b = player.body; const dx = target.body.pos.x - b.pos.x, dz = target.body.pos.z - b.pos.z; const flat = Math.hypot(dx, dz); const nx = dx / (flat || 1), nz = dz / (flat || 1);
  player.yaw = Math.atan2(-dx, -dz); _fv.subVectors(target.center, player.eye); player.pitch = clamp(Math.atan2(_fv.y, Math.hypot(_fv.x, _fv.z)), -1.2, 1.2);
  const want = Math.max(0, flat - 1.1); const moved = marchBody(b, nx, nz, Math.min(DASH_SPEED * dt, want));
  const aimY = target.body.pos.y + (target.T.flying ? 0.2 : 0); const dy = aimY - b.pos.y;
  if (Math.abs(dy) > 0.05) { const y = b.pos.y; b.pos.y += clamp(dy, -DASH_SPEED * dt, DASH_SPEED * dt); if (world.overlapsBody(b)) { b.pos.y = y; d.stuckY = (d.stuckY || 0) + dt; } else d.stuckY = 0; }
  d.lastTrail += dt; if (d.lastTrail > 0.02) { d.lastTrail = 0; effects.tracer(d.trail, player.center, INK.BLUE, 0.045, 0.28); d.trail.copy(player.center); effects.strokeBurst(player.center, INK.BLUE, 2, 5, { life: 0.22, size: 0.03 }); }
  const reach = Math.hypot(flat, Math.max(0, Math.abs(dy) - 0.6));
  if (reach <= 1.5) { focusExecute(target); return true; }
  if (moved < 1e-4 && want > 0.05 && (d.stuckY || 0) > 0.08) { endDash(true); return true; }
  return false;
}
function endDash(blocked) { player.dashLock = false; game.focus.dash = null; player.body.vel.set(0, 0, 0); if (blocked) { player.weapons[player.katanaIndex].startSlash(player._weaponState(false, false, 0)); audio.katanaSwing(); hud.tip('被挡下 · 冲刺没能命中', 1.2); } }
function focusExecute(target) {
  player.dashLock = false; game.focus.dash = null; player.body.vel.set(0, 0, 0);
  player.weapons[player.katanaIndex].startSlash(player._weaponState(false, false, 0));
  _fv.subVectors(target.center, player.eye); const dir = _fv.clone().normalize(); const chainBefore = game.focus.chain;
  enemies.damage(target, 100000, { point: target.center.clone(), dir, part: 'head', source: 'focus', crit: true });
  audio.focusSlash(); game.hitstop(0.1, 0.08); effects.shakeAmt += 0.35; input.rumble(0.9, 0.7, 140); player.kickFov(6); player.hp = Math.min(player.maxHp, player.hp + 6);
  if (game.focus.chain === chainBefore) game.focus.t = Math.min(game.focus.t, 0.35);
  game.focus.target = null; hud.setFocusMark(null);
}
function updateFocus(dt) {
  const f = game.focus; if (!f.active) return;
  if (f.dash) { updateFocusDash(dt); return; }
  f.t -= dt; f.arm -= dt; if (f.t <= 0 || !player.alive) { endFocus(); return; }
  const combo = (input.down('aim') && input.down('fire')) || input.down('dash'); if (!combo) f.ready = true;
  const target = focusCandidate(); f.target = target;
  if (!target) { hud.setFocusMark(null); return; }
  _fv.copy(target.center).project(R.camera);
  if (_fv.z < 1) hud.setFocusMark((_fv.x * 0.5 + 0.5) * window.innerWidth, (-_fv.y * 0.5 + 0.5) * window.innerHeight); else hud.setFocusMark(null);
  if (combo && f.ready && f.arm <= 0) { input.consume('fire'); startFocusDash(target); }
}

// 开始、暂停和结算共用设置与检查点控件。
function settingsHTML() {
  return `<div class="settings" id="settings">
    <label>鼠标灵敏度 <input type="range" id="setSens" min="25" max="250" step="5" value="${settings.sens}"><b id="setSensV">${settings.sens}%</b></label>
    <label><input type="checkbox" id="setInv" ${settings.invert ? 'checked' : ''}> 反转垂直视角</label>
    <label><input type="checkbox" id="setMus" ${musicWanted ? 'checked' : ''}> 音乐 <span class="k">(M)</span></label>
  </div>`;
}
function wireSettings() {
  const box = hud.el.panel.querySelector('#settings'); if (!box) return;
  box.addEventListener('click', (e) => e.stopPropagation()); box.addEventListener('keydown', (e) => e.stopPropagation());
  const sens = box.querySelector('#setSens'), out = box.querySelector('#setSensV');
  sens.addEventListener('input', () => { settings.sens = Number(sens.value); out.textContent = settings.sens + '%'; applySettings(); });
  box.querySelector('#setInv').addEventListener('change', (e) => { settings.invert = e.target.checked; applySettings(); });
  box.querySelector('#setMus').addEventListener('change', (e) => { musicWanted = e.target.checked; localStorage.setItem('doodle_music', musicWanted ? '1' : '0'); audio.musicOn(musicWanted); });
}
function checkpointHTML() {
  if (checkpoint < 5) return '';
  let h = '<div class="checkpoints"><span>检查点</span>';
  for (let w = 5; w <= checkpoint; w += 5) h += `<button type="button" data-cp="${w}">第 ${w} 波</button>`;
  return h + '</div>';
}
function wireCheckpoints(onGo) { const box = hud.el.panel.querySelector('.checkpoints'); if (!box) return; box.addEventListener('click', (e) => { e.stopPropagation(); const b = e.target.closest('button'); if (b) onGo(Number(b.dataset.cp)); }); }
function mainHTML() {
  return `<h1>涂鸦街区</h1><h2>一款涂鸦风生存射击游戏</h2>
    <div class="mainbtns"><button type="button" class="start" id="soloBtn">开始游戏<i>单人 · 抵御一波波敌人</i></button></div>
    ${CONTROLS_HTML}${settingsHTML()}${checkpointHTML()}${best ? `<div class="beststat">最高分：${best}</div>` : ''}`;
}
function showStart() {
  hud.setGameplayVisible(false);
  hud.showScreen(mainHTML());
  wireSettings(); wireCheckpoints(beginAtWave);
  hud.el.panel.querySelector('#soloBtn').addEventListener('click', (event) => {
    event.stopPropagation(); begin();
  });
}
function showPause() {
  hud.showScreen(`<h1>已暂停</h1><h2>第 ${game.wave} 波 · 得分 ${game.score}</h2>${CONTROLS_HTML}${settingsHTML()}${menuBtnHTML()}<div class="go">点击任意位置（或按 ${hud.key('confirm')}）继续</div>`);
  wireSettings(); wireMenuBtn();
}
function showDead() {
  hud.setGameplayVisible(false); const nb = game.score > best; if (nb) { best = game.score; localStorage.setItem('doodle_best', String(best)); }
  hud.showScreen(`<h1>被抹除</h1><div class="stats">你撑过了 <b>${game.wave}</b> 波 · <b>${game.kills}</b> 次击杀 · 得分 <b>${game.score}</b>${nb ? ' · <b>新纪录</b>' : ` · 最高分 ${best}`}</div>${checkpointHTML()}${menuBtnHTML()}<div class="go">点击（或按 ${hud.key('confirm')}）再画一次</div>`);
  wireCheckpoints((w) => beginAtWave(w)); wireMenuBtn();
}
function menuBtnHTML() { return '<div class="menubtn"><button type="button" id="menuBtn">主菜单</button></div>'; }
function wireMenuBtn() { const b = hud.el.panel.querySelector('#menuBtn'); if (b) b.addEventListener('click', (e) => { e.stopPropagation(); toMainMenu(); }); }
function toMainMenu() {
  game.state = 'start'; resetGame(); audio.reelLoop(false); input.exitLock(); showStart();
}

// 单人状态只有开始、游玩、暂停、死亡过场和结算，暂停不会继续推进战斗。
function resetGame() {
  if (level.breakables.some((item) => !item.alive)) rebuildLevel();
  enemies.clear(); effects.clear();
  for (const item of pickups) R.scene.remove(item.mesh);
  pickups.length = 0;
  player.reset(level.playerStart);
  enemies.mods.speed = 1; enemies.mods.damage = 1;
  hud.setModifier(''); hud.setBoss(null, null); game.boss = null; endFocus(); game.katanaStreak = 0;
  game.score = 0; game.kills = 0; game.combo = 0; game.wave = 0; game.intermission = 0; game.queue = []; game.time = 0;
  hud.setScore(0, 0); hud.setTimer(''); hud.setWave(1, 0);
}
function begin() {
  audio.init(); audio.resume();
  if (game.state === 'start' || game.state === 'dead') { resetGame(); startWave(1); }
  if (!input.usingGamepad) input.requestLock();
  if (musicWanted && !audio.musicPlaying) audio.musicOn(true);
  hud.hideScreen(); hud.setGameplayVisible(true); game.state = 'play';
}
function beginAtWave(wave) { resetGame(); startWave(wave); game.state = 'pause'; begin(); }
function pause() {
  if (game.state !== 'play') return;
  game.state = 'pause'; showPause(); audio.reelLoop(false);
}
hud.onScreenClick = () => {
  if (['start', 'pause', 'dead'].includes(game.state)) begin();
};
canvas.addEventListener('click', () => {
  if (game.state === 'play' && !input.pointerLocked && !input.usingGamepad) input.requestLock();
});
input.onLockChange = (locked) => { if (!locked && !input.usingGamepad) pause(); };
input.onDeviceChange = (pad) => { hud.setDevice(pad); hud.setWeapon(player.weapon.name, player.weapon.hint); };
// 浏览器要求用手势开启声音；返回暂停画面后由下一次点击恢复。
for (const event of ['pointerdown', 'keydown']) window.addEventListener(event, () => { audio.init(); audio.resume(); }, { passive: true });
hud.setDevice(input.usingGamepad); applySettings(); hud.setWeapon(player.weapon.name, player.weapon.hint); showStart();

let last = performance.now(), lockTipT = 0.5, musicHealT = 2, frame;
function tick(now) { frame = requestAnimationFrame(tick); step(now); }
function step(now) {
  // 切回标签页时限制时间步长，避免物理和武器弹簧因长间隔突然跳动。
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  input.update(dt);
  if (game.state === 'play' && input.pressed('pause')) { pause(); input.exitLock(); }
  else if (['start', 'pause', 'dead'].includes(game.state) && (input.pressed('jump') || input.pressed('confirm') || (game.state === 'pause' && input.pressed('pause')))) begin();
  if (input.pressed('music')) { musicWanted = !musicWanted; localStorage.setItem('doodle_music', musicWanted ? '1' : '0'); audio.musicOn(musicWanted); hud.tip(musicWanted ? '音乐已开启' : '音乐已关闭', 1.5); }
  const st = game.state, playing = st === 'play' || st === 'dying';
  if (st === 'play' && !input.pointerLocked && !input.usingGamepad) { lockTipT -= dt; if (lockTipT <= 0) { lockTipT = 2.5; hud.tip('点击画面以锁定鼠标', 2); } }
  let scale = 1;
  if (game.hitstopT > 0) { game.hitstopT -= dt; scale = game.hitstopScale; }
  else if (game.focus.active) scale = FOCUS_SCALE;
  const sdt = dt * scale;
  if (st === 'play') updateFocus(dt); else endFocus();
  if (playing) {
    game.time += sdt;
    musicHealT -= dt; if (musicHealT <= 0) { musicHealT = 2; if (musicWanted && st === 'play' && !audio.musicPlaying && audio.ctx) audio.musicOn(true); if (input.anyInput) audio.resume(); }
    const bounds = level.bounds, pos = player.body.pos;
    if (pos.x < bounds.minX - 8 || pos.x > bounds.maxX + 8 || pos.z < bounds.minZ - 8 || pos.z > bounds.maxZ + 8 || pos.y > 150) pos.y = -100;
    player.update(sdt); enemies.update(sdt); effects.update(sdt); updatePickups(sdt);
    if (st === 'play') updateWaves(sdt);
    if (game.comboT > 0) { game.comboT -= sdt; if (game.comboT <= 0) { game.combo = 0; hud.setScore(game.score, 0); } }
    if (st === 'dying') { game.deathT += dt; if (game.deathT > 1.7) { game.state = 'dead'; showDead(); input.exitLock(); } }
  } else {
    game.time += dt;
    if (st === 'start' || st === 'dead') player.idleCam(game.time);
    effects.update(dt);
  }
  for (const a of level.animated) a.update(game.time);
  audio.setListener(player.eye, player.right);
  const w = player.weapon; if (w.isGun) hud.setAmmo(w.mag, w.reserve, w.magSize, w.reloading); else hud.setKatana();
  hud.setSlots(player.weapons.map((wp, i) => ({ name: wp.name, active: i === player.weaponIndex, ammo: wp.isGun ? wp.mag + '/' + wp.reserve : '∞', empty: wp.isGun && wp.mag === 0 && wp.reserve === 0 })));
  hud.setGrenades(player.grenades); hud.setGrappleStamina(player.grapStam); hud.setHealth(player.hp, player.maxHp); hud.setSpread(w.spreadPx); hud.update(dt);
  hud.setFocusMeter(playing && (w.kind === 'katana' || game.katanaStreak > 0 || game.focus.active), game.focus.active ? 1 : clamp(game.katanaStreak / KATANA_CHARGE_KILLS, 0, 1), game.focus.active, '太刀');
  if (game.boss) { if (game.boss.alive) hud.setBoss(game.boss.T.name, game.boss.hp / game.boss.maxHp); else { hud.setBoss(null, null); game.boss = null; } }
  audio.setIntensity(clamp((enemies.alive + game.queue.length) / 12, 0, 1) * (game.intermission > 0 ? 0.25 : 1));
  R.render(game.time, { hurt: player.hurtFx, flash: player.flashFx, slow: scale < 1 ? 1 : 0, lowHp: player.alive && player.hp < 30 ? 1 - player.hp / 30 : 0 });
}
frame = requestAnimationFrame(tick);

// 仅接入宿主生命周期；游戏内容保留上游实现。
mountPortfolioBridge({ input, pause, audio, stop: () => {
  cancelAnimationFrame(frame);
  R.renderer.dispose();
  R.renderer.forceContextLoss();
} });
