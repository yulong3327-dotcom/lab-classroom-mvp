import * as THREE from './lab/vendor/three-r160/three.module.min.js';
import { createClassroom } from './scene.js';

const el = id => document.getElementById(id);
const room = el('classroom');
const canvas = el('view');
const help = el('help');
const experiment = el('experiment');
const lab = el('lab');
const stations = {
  physics: { name: '物理实验台', url: './lab/platform/player.html?id=current-voltage', accent: '#77c8ff' },
  chemistry: { name: '化学实验台', url: './lab/', accent: '#ffd58e' },
};

function icons() { window.lucide?.createIcons(); }
if (document.readyState === 'complete') icons();
else window.addEventListener('load', icons, { once: true });

try {
  startClassroom();
} catch (error) {
  el('status').textContent = '无法启动 3D 教室，请检查浏览器的 WebGL 支持。';
  el('status').hidden = false;
  console.error(error);
}

function startClassroom() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;
  const scene = new THREE.Scene();
  const { benches, obstacles } = createClassroom(scene);
  const camera = new THREE.PerspectiveCamera(58, 1, 0.05, 52);
  camera.position.set(0, 1.62, 6.12);
  camera.rotation.order = 'YXZ';
  let yaw = 0;
  let pitch = -0.105;
  let selected = null;
  let active = null;
  const coarse = matchMedia('(pointer: coarse)');
  let inputMode = 'auto';
  let touchMode = coarse.matches;
  room.dataset.touch = String(touchMode);

  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const labelPoint = new THREE.Vector3();
  const labels = benches.map(bench => ({ bench, label: el(`marker-${bench.id}`) }));
  const tables = benches.map(bench => bench.tabletop);
  const outlines = new Map(benches.map(bench => {
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(bench.tabletop.geometry), new THREE.LineBasicMaterial({
      color: stations[bench.id].accent, transparent: true, opacity: 0.95,
    }));
    edges.scale.set(1.004, 1.04, 1.004);
    edges.visible = false;
    bench.tabletop.add(edges);
    return [bench, edges];
  }));
  const keys = new Set();
  const controls = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);
  const move = new THREE.Vector2();
  const stick = new THREE.Vector2();
  const clamp = THREE.MathUtils.clamp;
  let aimPointer = null;
  let lookDrag = null;
  let joystickPointer = null;
  let width = 1, height = 1;

  function resize() {
    ({ width, height } = room.getBoundingClientRect());
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.fov = Math.max(55, Math.min(101, 2 * Math.atan(Math.tan(58 * Math.PI / 360) / camera.aspect) * 180 / Math.PI));
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
    renderer.setSize(width, height, false);
  }
  new ResizeObserver(resize).observe(room);
  resize();

  function changeLook(x, y, factor) {
    yaw = (yaw - x * factor) % (2 * Math.PI);
    pitch = clamp(pitch - y * factor, -1.32, 1.32);
  }
  function stopInput() {
    keys.clear();
    lookDrag = null;
    aimPointer = null;
    resetJoystick();
  }
  function handoffInput() {
    stopInput();
    if (document.pointerLockElement === canvas) document.exitPointerLock();
  }
  window.addEventListener('blur', stopInput);
  document.addEventListener('visibilitychange', stopInput);
  document.addEventListener('pointerlockchange', () => { aimPointer = null; });

  function distance(bench) { return Math.hypot(camera.position.x - bench.x, camera.position.z - bench.z); }
  function near(bench) { return distance(bench) < 2.75; }
  function cast(pos) {
    camera.updateMatrixWorld();
    ray.setFromCamera(pos, camera);
    const hit = ray.intersectObjects(tables, false)[0];
    const bench = hit && benches.find(item => item.tabletop === hit.object);
    return bench && near(bench) ? bench : null;
  }
  function viewPoint(x, y) {
    const rect = canvas.getBoundingClientRect();
    return new THREE.Vector2(2 * (x - rect.left) / rect.width - 1, 1 - 2 * (y - rect.top) / rect.height);
  }
  function chooseStation() {
    const centerTarget = cast(pointer.set(0, 0));
    if (centerTarget) return centerTarget;
    if (aimPointer && !document.pointerLockElement) {
      const hover = cast(aimPointer);
      if (hover) return hover;
    }
    let closest = null;
    let best = Infinity;
    for (const bench of benches) {
      const length = distance(bench);
      if (length >= 2.45 || length >= best) continue;
      const bearing = ((bench.x - camera.position.x) * -Math.sin(yaw) + (bench.z - camera.position.z) * -Math.cos(yaw)) / (length || 1);
      if (bearing > 0.64) { closest = bench; best = length; }
    }
    return closest;
  }
  function updateStation() {
    const target = chooseStation();
    const locked = document.pointerLockElement === canvas;
    if (target === selected && room.dataset.locked === String(locked) && room.dataset.input === String(touchMode)) return;
    selected = target;
    room.dataset.locked = String(locked);
    room.dataset.input = String(touchMode);
    room.dataset.target = String(Boolean(target));
    el('station').hidden = !target;
    el('interact').hidden = !target || !touchMode;
    canvas.style.cursor = target && !locked && !touchMode ? 'crosshair' : '';
    if (target) {
      el('station-name').textContent = stations[target.id].name;
      el('station-mouse').toggleAttribute('hidden', touchMode);
      el('interact').setAttribute('aria-label', `进入${stations[target.id].name}`);
    }
    for (const [bench, outline] of outlines) outline.visible = bench === target;
  }
  function updateLabels() {
    for (const { bench, label } of labels) {
      labelPoint.set(bench.x, 1.53, bench.z).project(camera);
      const visible = labelPoint.z > -1 && labelPoint.z < 1 && Math.abs(labelPoint.x) < 1.17 && Math.abs(labelPoint.y) < 0.78 && distance(bench) > 1.35 && bench !== selected;
      label.hidden = !visible;
      if (!visible) continue;
      label.style.left = `${clamp((labelPoint.x + 1) * width / 2, 39, width - 39)}px`;
      label.style.top = `${(1 - labelPoint.y) * height / 2}px`;
    }
  }

  function openStation(bench, push = true) {
    if (!bench || active) return;
    active = bench;
    handoffInput();
    el('load-error').hidden = true;
    room.inert = true;
    lab.hidden = false;
    el('lab-title').textContent = stations[bench.id].name;
    if (push) history.pushState({ station: bench.id }, '', `#${bench.id}`);
    experiment.src = stations[bench.id].url;
    el('back').focus({ preventScroll: true });
  }
  function closeStation() {
    if (!active) return;
    active = null;
    lab.hidden = true;
    experiment.removeAttribute('src');
    room.inert = false;
    canvas.focus({ preventScroll: true });
  }
  window.addEventListener('popstate', event => {
    if (!event.state?.station) closeStation();
    else if (!active) openStation(benches.find(bench => bench.id === event.state.station), false);
  });
  if (Object.hasOwn(stations, location.hash.slice(1))) history.replaceState(null, '', location.pathname + location.search);
  el('back').addEventListener('click', () => {
    if (history.state?.station) history.back();
    else closeStation();
  });
  experiment.addEventListener('load', () => {
    if (!active) return;
    const content = experiment.contentDocument;
    if (!content || content.URL === 'about:blank') return;
    el('load-error').hidden = Boolean(content.querySelector('canvas'));
  });
  el('interact').addEventListener('click', () => openStation(selected));
  el('controls').addEventListener('click', () => { handoffInput(); help.showModal(); });
  el('close-help').addEventListener('click', () => help.close());
  const modeButtons = [...help.querySelectorAll('[data-mode]')];
  for (const button of modeButtons) button.addEventListener('click', () => {
    inputMode = button.dataset.mode;
    setTouch(inputMode === 'touch' || (inputMode === 'auto' && coarse.matches));
    for (const item of modeButtons) item.setAttribute('aria-pressed', String(item === button));
    help.close();
  });

  function setTouch(value) {
    if (value === touchMode) return;
    touchMode = value;
    room.dataset.touch = String(value);
  }
  function keyDown(event) {
    if (active || help.open || !controls.has(event.code) || (event.target instanceof HTMLButtonElement && event.code === 'KeyE')) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    keys.add(event.code);
    if (event.code === 'KeyE' && !event.repeat) openStation(chooseStation());
  }
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', event => keys.delete(event.code));
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  document.addEventListener('mousemove', event => {
    if (document.pointerLockElement === canvas) changeLook(event.movementX, event.movementY, 0.00215);
  });

  canvas.addEventListener('pointerdown', event => {
    if (active || help.open) return;
    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      if (inputMode === 'auto') setTouch(true);
      if (lookDrag) return;
      lookDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: 0, touch: true };
      canvas.setPointerCapture(event.pointerId);
      return;
    }
    if (inputMode === 'auto' && !coarse.matches) setTouch(false);
    if (event.button === 2 && !document.pointerLockElement) {
      lookDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: 0, touch: false };
      canvas.setPointerCapture(event.pointerId);
    }
    if (event.button !== 0) return;
    const locked = document.pointerLockElement === canvas;
    const station = cast(locked ? pointer.set(0, 0) : viewPoint(event.clientX, event.clientY));
    if (station) openStation(station);
    else if (!locked && canvas.requestPointerLock) {
      try { canvas.requestPointerLock()?.catch(() => {}); } catch { /* Arrow keys and drag also work. */ }
    }
  });
  canvas.addEventListener('pointermove', event => {
    if (lookDrag?.id === event.pointerId) {
      const dx = event.clientX - lookDrag.x;
      const dy = event.clientY - lookDrag.y;
      lookDrag.x = event.clientX;
      lookDrag.y = event.clientY;
      lookDrag.moved += Math.hypot(dx, dy);
      changeLook(dx, dy, lookDrag.touch ? 0.0047 : 0.0031);
      aimPointer = null;
    } else if (event.pointerType === 'mouse' && !document.pointerLockElement) aimPointer = viewPoint(event.clientX, event.clientY);
  });
  canvas.addEventListener('pointerleave', () => { aimPointer = null; });
  canvas.addEventListener('pointerup', event => {
    if (lookDrag?.id !== event.pointerId) return;
    const tap = lookDrag.touch && lookDrag.moved < 9;
    lookDrag = null;
    if (tap) openStation(cast(viewPoint(event.clientX, event.clientY)));
  });
  const cancelLook = event => { if (lookDrag?.id === event.pointerId) lookDrag = null; };
  canvas.addEventListener('pointercancel', cancelLook);
  canvas.addEventListener('lostpointercapture', cancelLook);

  const joystick = el('joystick');
  function updateJoystick(event) {
    const rect = joystick.getBoundingClientRect();
    stick.set(event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2).clampLength(0, 34);
    el('stick').style.transform = `translate(calc(-50% + ${stick.x}px), calc(-50% + ${stick.y}px))`;
    stick.divideScalar(34);
    if (stick.length() < 0.14) stick.set(0, 0);
  }
  function resetJoystick() {
    joystickPointer = null;
    stick.set(0, 0);
    el('stick').style.transform = '';
  }
  joystick.addEventListener('pointerdown', event => {
    if (joystickPointer !== null) return;
    event.preventDefault();
    joystickPointer = event.pointerId;
    joystick.setPointerCapture(event.pointerId);
    updateJoystick(event);
  });
  joystick.addEventListener('pointermove', event => { if (joystickPointer === event.pointerId) updateJoystick(event); });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    joystick.addEventListener(name, event => { if (joystickPointer === event.pointerId) resetJoystick(); });
  }

  const radius = 0.24;
  function walkable(x, z) {
    if (x < -5.6 + radius || x > 5.6 - radius || z < -7.2 + radius || z > 6.5 - radius) return false;
    return !obstacles.some(item => x > item.minX - radius && x < item.maxX + radius && z > item.minZ - radius && z < item.maxZ + radius);
  }
  let last = 0;
  renderer.setAnimationLoop(time => {
    const dt = Math.min((time - last) / 1000, 0.034);
    last = time;
    if (active) return;
    const on = key => Number(keys.has(key));
    if (!help.open) {
      move.set(on('KeyD') - on('KeyA') + stick.x, on('KeyS') - on('KeyW') + stick.y).clampLength(0, 1);
      changeLook(on('ArrowRight') - on('ArrowLeft'), on('ArrowDown') - on('ArrowUp'), 1.68 * dt);
      if (move.lengthSq() > 0) {
        const cos = Math.cos(yaw), sin = Math.sin(yaw);
        const step = 2.75 * dt;
        const dx = (move.x * cos + move.y * sin) * step;
        const dz = (-move.x * sin + move.y * cos) * step;
        if (walkable(camera.position.x + dx, camera.position.z)) camera.position.x += dx;
        if (walkable(camera.position.x, camera.position.z + dz)) camera.position.z += dz;
      }
    }
    camera.rotation.set(pitch, yaw, 0);
    updateStation();
    updateLabels();
    renderer.render(scene, camera);
  });
}
