/* =========================================================
   Scène Three.js : ordinateur portable holographique
   - modèle construit par code (aucun asset externe)
   - animations réellement exécutées (boucle requestAnimationFrame)
   - réagit au pointeur, au défilement et à la section active
   - qualité adaptée aux appareils modestes
   ========================================================= */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* Positions cibles par section (x, y, z, échelle, rotations) */
const POSES = {
  hero: { x: 1.85, y: 0.05, z: 0, s: 1.0, ry: -0.42, rx: 0.1 },
  services: { x: 2.35, y: -0.15, z: -0.9, s: 0.7, ry: -1.1, rx: 0.06 },
  experience: { x: 0.0, y: -0.05, z: -0.4, s: 0.95, ry: 0.5, rx: 0.08 },
  approche: { x: -1.95, y: 0.05, z: -0.2, s: 0.9, ry: 0.9, rx: 0.05 },
  contact: { x: -1.6, y: -0.35, z: -1.1, s: 0.62, ry: 0.25, rx: 0.02 }
};

const LID_OPEN_ANGLE = -0.42;
const LID_CLOSED_ANGLE = -1.45;
const CAMERA_POS = new THREE.Vector3(0, 1.25, 7);
const CAMERA_TARGET = new THREE.Vector3(0, 0.2, 0);

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/** Crée une texture canvas et renvoie aussi le contexte pour la dessiner */
function createCanvasTexture(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { canvas, ctx, texture };
}

/** Clavier : rangées de touches dessinées sur un canvas */
function drawKeyboard(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  const layouts = [
    Array(14).fill(1),
    Array(14).fill(1),
    Array(13).fill(1),
    [1.6, ...Array(11).fill(1), 1.6],
    [1.6, 1.6, 1.6, 6.5, 1.6, 1.6, 1.6]
  ];
  const padX = 28;
  const padY = 22;
  const gap = 9;
  const rowH = (h - padY * 2 - gap * (layouts.length - 1)) / layouts.length;

  layouts.forEach((row, r) => {
    const totalUnits = row.reduce((a, b) => a + b, 0);
    const unit = (w - padX * 2 - gap * (row.length - 1)) / totalUnits;
    let x = padX;
    const y = padY + r * (rowH + gap);
    row.forEach((units) => {
      const kw = unit * units;
      const lit = Math.random() < 0.07;
      ctx.beginPath();
      ctx.roundRect(x, y, kw, rowH, 10);
      ctx.fillStyle = lit ? 'rgba(53,224,255,0.55)' : 'rgba(14,34,78,0.9)';
      ctx.shadowColor = lit ? '#35e0ff' : 'transparent';
      ctx.shadowBlur = lit ? 22 : 0;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(90,160,255,0.45)';
      ctx.stroke();
      x += kw + gap;
    });
  });
}

/** Écran : interface de diagnostic animée */
function drawScreen(ctx, w, h, t) {
  ctx.fillStyle = '#030814';
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(w * 0.66, h * 0.5, 30, w * 0.66, h * 0.5, w * 0.6);
  glow.addColorStop(0, 'rgba(29,99,255,0.38)');
  glow.addColorStop(1, 'rgba(3,8,20,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(80,140,255,0.07)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 42) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const mono = '"JetBrains Mono", ui-monospace, monospace';
  ctx.fillStyle = '#35e0ff';
  ctx.font = `600 26px ${mono}`;
  ctx.fillText('MOMO TECH · DIAGNOSTIC', 44, 62);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#7ff0b4';
  ctx.fillText('● SYSTÈME EN LIGNE', w - 44, 62);
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(80,140,255,0.35)';
  ctx.fillRect(44, 84, w - 88, 2);

  /* Modules à gauche */
  const modules = [
    ['PROCESSEUR', 0.42 + 0.18 * Math.sin(t * 0.9)],
    ['MÉMOIRE', 0.61 + 0.1 * Math.sin(t * 0.6 + 1)],
    ['STOCKAGE', 0.33 + 0.05 * Math.sin(t * 0.4 + 2)],
    ['SYSTÈME', 0.92 - 0.02 * Math.sin(t * 1.7)],
    ['RÉSEAU', 0.78 + 0.1 * Math.sin(t * 1.3)]
  ];
  modules.forEach(([label, value], i) => {
    const y = 160 + i * 96;
    const v = clamp(value, 0, 1);
    ctx.font = `500 22px ${mono}`;
    ctx.fillStyle = '#93a3c4';
    ctx.fillText(label, 44, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#e8efff';
    ctx.fillText(`${Math.round(v * 100)}%`, 430, y);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(80,140,255,0.16)';
    ctx.beginPath();
    ctx.roundRect(44, y + 18, 386, 10, 5);
    ctx.fill();
    const bar = ctx.createLinearGradient(44, 0, 430, 0);
    bar.addColorStop(0, '#1d63ff');
    bar.addColorStop(1, '#46e9ff');
    ctx.fillStyle = bar;
    ctx.shadowColor = '#35e0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(44, y + 18, 386 * v, 10, 5);
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  /* Jauge de scan au centre-droit */
  const cx = w * 0.67;
  const cy = h * 0.44;
  const r = 130;
  const scan = (t * 0.12) % 1;
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(80,140,255,0.15)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#35e0ff';
  ctx.shadowColor = '#35e0ff';
  ctx.shadowBlur = 18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * scan);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.lineCap = 'butt';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8efff';
  ctx.font = `600 64px ${mono}`;
  ctx.fillText(`${Math.round(scan * 100)}`, cx, cy + 14);
  ctx.font = `500 18px ${mono}`;
  ctx.fillStyle = '#93a3c4';
  ctx.fillText('SCAN %', cx, cy + 50);
  ctx.textAlign = 'left';

  /* Faisceau de balayage qui descend l'écran */
  const sy = ((t * 0.32) % 1) * (h + 120) - 60;
  const beam = ctx.createLinearGradient(0, sy - 60, 0, sy + 60);
  beam.addColorStop(0, 'rgba(53,224,255,0)');
  beam.addColorStop(0.5, 'rgba(53,224,255,0.22)');
  beam.addColorStop(1, 'rgba(53,224,255,0)');
  ctx.fillStyle = beam;
  ctx.fillRect(0, sy - 60, w, 120);
  ctx.fillStyle = 'rgba(160,250,255,0.85)';
  ctx.fillRect(0, sy, w, 1.5);

  /* Courbe de signal en bas */
  const baseY = h - 130;
  ctx.beginPath();
  for (let x = 44; x <= w - 44; x += 6) {
    const k = (x - 44) / (w - 88);
    const y =
      baseY +
      Math.sin(k * 14 + t * 2.4) * 18 * (0.4 + 0.6 * Math.sin(k * 3 + t)) +
      Math.sin(k * 40 - t * 5) * 4;
    if (x === 44) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = '#35e0ff';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#35e0ff';
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.font = `500 20px ${mono}`;
  ctx.fillStyle = '#93a3c4';
  ctx.fillText(`CPU ${40 + Math.round(4 * Math.sin(t))}°C   ·   RAM 8.1 / 16 GB   ·   SSD OK   ·   MAJ OK`, 44, h - 56);

  /* Coins de cadre */
  ctx.strokeStyle = 'rgba(53,224,255,0.6)';
  ctx.lineWidth = 3;
  [
    [18, 18, 1, 1],
    [w - 18, 18, -1, 1],
    [18, h - 18, 1, -1],
    [w - 18, h - 18, -1, -1]
  ].forEach(([x, y, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(x, y + dy * 40);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * 40, y);
    ctx.stroke();
  });
}

/** Halo radial pour l'éclairage volumétrique simulé */
function createHaloTexture() {
  const { canvas, ctx, texture } = createCanvasTexture(256, 256);
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(53,160,255,0.55)');
  g.addColorStop(0.35, 'rgba(29,99,255,0.18)');
  g.addColorStop(1, 'rgba(29,99,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return texture;
}

/** Grille de sol qui s'estompe */
function createFloorTexture() {
  const { canvas, ctx, texture } = createCanvasTexture(512, 512);
  ctx.clearRect(0, 0, 512, 512);
  ctx.strokeStyle = 'rgba(80,160,255,0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 512; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }
  const mask = ctx.createRadialGradient(256, 256, 40, 256, 256, 256);
  mask.addColorStop(0, 'rgba(0,0,0,1)');
  mask.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, 512, 512);
  return texture;
}

/** Vérifie la disponibilité de WebGL */
export function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) {
    return false;
  }
}

/**
 * Initialise la scène. Renvoie un contrôleur, ou null si WebGL est indisponible.
 */
export function createLaptopScene(canvas, { reducedMotion = false, lowPower = false } = {}) {
  if (!supportsWebGL()) return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !lowPower,
      alpha: true,
      powerPreference: 'high-performance'
    });
  } catch (e) {
    return null;
  }

  const maxDpr = lowPower ? 1 : 1.75;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.copy(CAMERA_POS);
  camera.lookAt(CAMERA_TARGET);

  /* Lumières */
  scene.add(new THREE.AmbientLight(0x1a2a50, 0.6));
  const key = new THREE.DirectionalLight(0x9fd8ff, 1.2);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x2f7bff, 2.4);
  rim.position.set(-4, 3, -4);
  scene.add(rim);

  /* Racine animée : position, échelle et rotation selon la section */
  const pivot = new THREE.Group();
  scene.add(pivot);

  const laptop = new THREE.Group();
  pivot.add(laptop);

  const materials = [];
  const geometries = [];
  const textures = [];
  const track = (obj, list) => {
    list.push(obj);
    return obj;
  };

  const metal = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x0b1326,
      metalness: 0.85,
      roughness: 0.32,
      clearcoat: 0.6,
      clearcoatRoughness: 0.25
    }),
    materials
  );
  const metalLight = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x16233f,
      metalness: 0.9,
      roughness: 0.28,
      clearcoat: 0.7,
      clearcoatRoughness: 0.2
    }),
    materials
  );
  const edgeMat = track(
    new THREE.LineBasicMaterial({ color: 0x2f7bff, transparent: true, opacity: 0.85 }),
    materials
  );
  const cyanGlow = track(
    new THREE.MeshBasicMaterial({ color: 0x35e0ff, toneMapped: false }),
    materials
  );

  /* Châssis (base) */
  const baseGeo = track(new RoundedBoxGeometry(3.0, 0.12, 2.05, 4, 0.04), geometries);
  const base = new THREE.Mesh(baseGeo, metal);
  base.position.y = 0.06;
  laptop.add(base);
  const baseEdges = track(new THREE.EdgesGeometry(baseGeo, 25), geometries);
  laptop.add(new THREE.LineSegments(baseEdges, edgeMat));

  /* Clavier */
  const keyboardTex = createCanvasTexture(1024, 420);
  textures.push(keyboardTex.texture);
  drawKeyboard(keyboardTex.ctx, 1024, 420);
  keyboardTex.texture.needsUpdate = true;
  const keyboardMat = track(
    new THREE.MeshStandardMaterial({
      map: keyboardTex.texture,
      emissiveMap: keyboardTex.texture,
      emissive: 0x1a5cff,
      emissiveIntensity: 0.55,
      transparent: true,
      roughness: 0.55,
      metalness: 0.2,
      depthWrite: false
    }),
    materials
  );
  const keyboard = new THREE.Mesh(track(new THREE.PlaneGeometry(2.5, 1.02), geometries), keyboardMat);
  keyboard.rotation.x = -Math.PI / 2;
  keyboard.position.set(0, 0.1215, -0.22);
  laptop.add(keyboard);

  /* Trackpad */
  const trackpad = new THREE.Mesh(track(new RoundedBoxGeometry(1.1, 0.012, 0.52, 3, 0.03), geometries), metalLight);
  trackpad.position.set(0, 0.126, 0.6);
  laptop.add(trackpad);
  laptop.add(
    new THREE.LineSegments(
      track(new THREE.EdgesGeometry(trackpad.geometry, 25), geometries),
      edgeMat
    )
  );

  /* Bande lumineuse à l'avant */
  const led = new THREE.Mesh(track(new THREE.BoxGeometry(2.9, 0.012, 0.018), geometries), cyanGlow);
  led.position.set(0, 0.07, 1.03);
  laptop.add(led);

  /* Couvercle (écran) : charnière à l'arrière */
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.12, -1.02);
  lidPivot.rotation.x = LID_CLOSED_ANGLE;
  laptop.add(lidPivot);

  const lidGeo = track(new RoundedBoxGeometry(3.0, 2.05, 0.1, 4, 0.04), geometries);
  const lid = new THREE.Mesh(lidGeo, metalLight);
  lid.position.set(0, 1.025, 0);
  lidPivot.add(lid);
  lidPivot.add(
    new THREE.LineSegments(track(new THREE.EdgesGeometry(lidGeo, 25), geometries), edgeMat).translateY(1.025)
  );

  /* Écran holographique */
  const screenTex = createCanvasTexture(1280, 820);
  textures.push(screenTex.texture);
  const screenMat = track(
    new THREE.MeshBasicMaterial({ map: screenTex.texture, toneMapped: false }),
    materials
  );
  const screen = new THREE.Mesh(track(new THREE.PlaneGeometry(2.7, 1.73), geometries), screenMat);
  screen.position.set(0, 1.025, 0.0515);
  lidPivot.add(screen);

  /* Logo lumineux au dos du couvercle */
  const backGlow = new THREE.Mesh(track(new THREE.PlaneGeometry(0.5, 0.12), geometries), cyanGlow);
  backGlow.position.set(0, 1.0, -0.0515);
  backGlow.rotation.y = Math.PI;
  lidPivot.add(backGlow);

  /* Lumière qui émane de l'écran */
  const screenLight = new THREE.PointLight(0x35e0ff, 5, 6, 1.6);
  screenLight.position.set(0, 1.0, 1.1);
  laptop.add(screenLight);

  /* Halo volumétrique derrière l'ordinateur */
  const haloTex = createHaloTexture();
  textures.push(haloTex);
  const haloMat = track(
    new THREE.SpriteMaterial({
      map: haloTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.75
    }),
    materials
  );
  const halo = new THREE.Sprite(haloMat);
  halo.scale.set(7, 5, 1);
  halo.position.set(0, 1.0, -1.6);
  laptop.add(halo);

  /* Anneaux holographiques en orbite */
  const orbitGroup = new THREE.Group();
  orbitGroup.position.set(0, 0.9, 0);
  pivot.add(orbitGroup);
  const ringMat = track(
    new THREE.MeshBasicMaterial({
      color: 0x35e0ff,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }),
    materials
  );
  const ringDefs = [
    { r: 2.35, tube: 0.008, tilt: 1.32, spin: 0.22 },
    { r: 2.75, tube: 0.006, tilt: 1.18, spin: -0.14 },
    { r: 2.05, tube: 0.01, tilt: 1.46, spin: 0.3 }
  ];
  const rings = ringDefs.map((def) => {
    const holder = new THREE.Group();
    holder.rotation.x = def.tilt;
    holder.rotation.z = def.spin;
    orbitGroup.add(holder);
    const ring = new THREE.Mesh(track(new THREE.TorusGeometry(def.r, def.tube, 8, 180), geometries), ringMat);
    holder.add(ring);
    /* Petit nœud lumineux sur l'anneau */
    const node = new THREE.Mesh(track(new THREE.SphereGeometry(0.035, 12, 12), geometries), cyanGlow);
    node.position.set(def.r, 0, 0);
    holder.add(node);
    return { holder, spin: def.spin };
  });

  /* Sol en grille */
  const floorTex = createFloorTexture();
  textures.push(floorTex);
  const floorMat = track(
    new THREE.MeshBasicMaterial({
      map: floorTex,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }),
    materials
  );
  const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(14, 14), geometries), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.7;
  scene.add(floor);

  /* Particules lumineuses en profondeur */
  const particleCount = lowPower ? 200 : 620;
  const particlePos = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const r = 2.6 + Math.random() * 5.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    particlePos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    particlePos[i * 3 + 1] = r * Math.cos(phi) * 0.7;
    particlePos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 1.5;
  }
  const particleGeo = track(new THREE.BufferGeometry(), geometries);
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
  const particleMat = track(
    new THREE.PointsMaterial({
      color: 0x6fd8ff,
      size: lowPower ? 0.04 : 0.03,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    }),
    materials
  );
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  /* ---------- État et animation ---------- */

  const state = {
    x: POSES.hero.x,
    y: POSES.hero.y,
    z: POSES.hero.z,
    s: POSES.hero.s,
    ry: POSES.hero.ry,
    rx: POSES.hero.rx,
    scroll: 0,
    scrollTarget: 0,
    sceneKey: 'hero',
    pointerX: 0,
    pointerY: 0,
    pointerTargetX: 0,
    pointerTargetY: 0,
    open: reducedMotion ? 1 : 0,
    startTime: null
  };

  const aspect = () => (canvas.clientWidth || 1) / (canvas.clientHeight || 1);

  /* Positions adaptées au format portrait (téléphones) */
  function resolvePose(key) {
    const base = POSES[key] || POSES.hero;
    const a = aspect();
    if (a >= 1) return base;
    const scale = clamp(a * 0.9, 0.42, 0.8);
    return {
      x: base.x * 0.18,
      y: base.y + (key === 'hero' ? 1.0 : 0.7),
      z: base.z,
      s: scale,
      ry: base.ry,
      rx: base.rx
    };
  }

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function updateScreen(t) {
    drawScreen(screenTex.ctx, 1280, 820, t);
    screenTex.texture.needsUpdate = true;
  }

  let lastScreenUpdate = -1;
  let lastTime = 0;

  function update(t, dt) {
    const pose = resolvePose(state.sceneKey);
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 2.6);

    state.x = lerp(state.x, pose.x, k);
    state.y = lerp(state.y, pose.y, k);
    state.z = lerp(state.z, pose.z, k);
    state.s = lerp(state.s, pose.s, k);
    state.ry = lerp(state.ry, pose.ry, k);
    state.rx = lerp(state.rx, pose.rx, k);
    state.scroll = lerp(state.scroll, state.scrollTarget, reducedMotion ? 1 : 1 - Math.exp(-dt * 4));

    state.pointerX = lerp(state.pointerX, state.pointerTargetX, reducedMotion ? 1 : 1 - Math.exp(-dt * 3));
    state.pointerY = lerp(state.pointerY, state.pointerTargetY, reducedMotion ? 1 : 1 - Math.exp(-dt * 3));

    const float = reducedMotion ? 0 : 1;
    pivot.position.set(
      state.x + Math.sin(t * 0.7) * 0.05 * float,
      state.y + Math.sin(t * 0.9) * 0.07 * float,
      state.z
    );
    pivot.scale.setScalar(state.s);
    pivot.rotation.y =
      state.ry + (Math.sin(t * 0.25) * 0.08 + state.pointerX * 0.22 + state.scroll * 0.9) * float;
    pivot.rotation.x = state.rx + state.pointerY * 0.1 * float;
    pivot.rotation.z = Math.sin(t * 0.5) * 0.01 * float;

    /* Ouverture du couvercle à l'arrivée */
    if (!reducedMotion && state.open < 1) {
      if (state.startTime === null) state.startTime = t;
      state.open = Math.min(1, (t - state.startTime) / 2.6);
    }
    lidPivot.rotation.x = lerp(LID_CLOSED_ANGLE, LID_OPEN_ANGLE, easeOutCubic(state.open));

    /* Caméra : parallaxe souris */
    camera.position.x = lerp(camera.position.x, CAMERA_POS.x + state.pointerX * 0.6, reducedMotion ? 1 : 0.05);
    camera.position.y = lerp(camera.position.y, CAMERA_POS.y - state.pointerY * 0.35, reducedMotion ? 1 : 0.05);
    camera.lookAt(CAMERA_TARGET);

    /* Anneaux */
    if (!reducedMotion) {
      rings.forEach((ring, i) => {
        ring.holder.rotation.y = t * (0.3 + i * 0.08);
      });
      particles.rotation.y = t * 0.02 + state.scroll * 0.6;
      particles.position.y = Math.sin(t * 0.2) * 0.08;
    }

    /* Écran : 30 images par seconde suffisent */
    if (t - lastScreenUpdate > 1 / 30 || lastScreenUpdate < 0) {
      lastScreenUpdate = t;
      updateScreen(t);
    }
  }

  function render() {
    renderer.render(scene, camera);
  }

  let rafId = 0;
  let running = false;

  function loop(now) {
    rafId = requestAnimationFrame(loop);
    const t = now * 0.001;
    const dt = Math.min(0.05, t - (lastTime || t));
    lastTime = t;
    update(t, dt);
    render();
  }

  function start() {
    if (running) return;
    running = true;
    if (reducedMotion) {
      update(performance.now() * 0.001, 1);
      render();
      return;
    }
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  /* Pause quand l'onglet est caché */
  const onVisibility = () => {
    if (document.hidden) stop();
    else start();
  };
  document.addEventListener('visibilitychange', onVisibility);

  const onResize = () => {
    resize();
    if (reducedMotion) {
      update(performance.now() * 0.001, 1);
      render();
    }
  };
  window.addEventListener('resize', onResize);

  /* Perte du contexte WebGL : on coupe proprement */
  const onContextLost = (e) => {
    e.preventDefault();
    stop();
    document.documentElement.classList.add('no-webgl');
  };
  canvas.addEventListener('webglcontextlost', onContextLost);

  resize();
  updateScreen(0);

  return {
    /** Change la pose 3D (nom de section : hero, services, experience, approche, contact) */
    setScene(key) {
      if (!POSES[key] || key === state.sceneKey) return;
      state.sceneKey = key;
    },
    /** Progression du défilement, de 0 à 1 */
    setScroll(p) {
      state.scrollTarget = clamp(p, 0, 1);
    },
    /** Position du pointeur normalisée entre -1 et 1 */
    setPointer(x, y) {
      state.pointerTargetX = clamp(x, -1, 1);
      state.pointerTargetY = clamp(y, -1, 1);
    },
    start,
    stop,
    /** Libère toutes les ressources GPU et les écouteurs */
    destroy() {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      pmrem.dispose();
      renderer.dispose();
    }
  };
}
