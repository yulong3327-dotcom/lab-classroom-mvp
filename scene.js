import * as THREE from './lab/vendor/three-r160/three.module.min.js';

function texture(width, height, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  paint(canvas.getContext('2d'), width, height);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}

function rng(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function floorMap() {
  const map = texture(512, 512, (ctx, w, h) => {
    const random = rng(84);
    const shades = ['#adbaba', '#b8c3bf', '#b0bdb9', '#bac4c2'];
    ctx.fillStyle = '#929f9b';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      const x = (i % 2) * w / 2;
      const y = Math.floor(i / 2) * h / 2;
      ctx.fillStyle = shades[i];
      ctx.fillRect(x + 2, y + 2, w / 2 - 3, h / 2 - 3);
      ctx.fillStyle = '#ffffff38';
      ctx.fillRect(x + 3, y + 3, w / 2 - 5, 1);
      ctx.fillRect(x + 3, y + 3, 1, h / 2 - 5);
    }
    for (let i = 0; i < 10000; i++) {
      ctx.fillStyle = i % 3 === 0 ? '#516d6211' : '#ffffff12';
      ctx.fillRect(random() * w, random() * h, 0.4 + random() * 2.4, 0.4 + random());
    }
  });
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(7, 8);
  return map;
}

function viewMap(seed) {
  return texture(640, 384, (ctx, w, h) => {
    const random = rng(seed);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#aecbd6');
    sky.addColorStop(0.67, '#e0e7d9');
    sky.addColorStop(1, '#b6c2a2');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#edf0e99c';
    ctx.beginPath();
    ctx.ellipse(417, 84, 245, 16, 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c5c8b7';
    ctx.fillRect(26 + seed % 23, 130, 260, 208);
    ctx.fillStyle = '#e4e2cc';
    ctx.fillRect(35 + seed % 23, 122, 258, 19);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        const x = 51 + col * 44 + seed % 23;
        const y = 158 + row * 51;
        ctx.fillStyle = '#929f99';
        ctx.fillRect(x, y, 28, 27);
        ctx.fillStyle = '#c6d4cc';
        ctx.fillRect(x + 13, y + 1, 2, 24);
        ctx.fillRect(x + 1, y + 25, 27, 2);
      }
    }
    ctx.fillStyle = '#a6ba93';
    ctx.fillRect(0, 318, w, h - 318);
    const treeColors = ['#8ea987', '#9db590', '#a9bf99', '#829d7d', '#bac8a1'];
    for (let group = 0; group < 4; group++) {
      const x = 300 + 98 * group + 24 * random();
      const y = 205 - 72 * random();
      ctx.fillStyle = '#a49e83';
      ctx.fillRect(x - 3, y + 22, 6, h - y);
      for (let i = 0; i < 35; i++) {
        const angle = random() * Math.PI * 2;
        const radius = 63 * Math.sqrt(random());
        ctx.fillStyle = treeColors[(i + group) % treeColors.length];
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius * 0.76 + 27, 12 + random() * 29, 11 + random() * 22, angle, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#e4e9dc30';
    ctx.fillRect(0, 0, w, h);
  });
}

function boardMap() {
  return texture(1400, 384, (ctx, w, h) => {
    const random = rng(714);
    ctx.fillStyle = '#31514a';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1300; i++) {
      ctx.fillStyle = i % 3 === 0 ? '#112f1f0b' : '#ddf0d307';
      ctx.fillRect(random() * w, random() * h, 2 + random() * 190, 1 + random() * 11);
    }
    ctx.fillStyle = '#cedbd1';
    ctx.font = '500 76px "Microsoft YaHei", sans-serif';
    ctx.fillText('\u7efc\u5408\u5b9e\u9a8c\u5ba4', 390, 168);
    ctx.fillStyle = '#a0c0ad';
    ctx.font = '400 26px "Microsoft YaHei", sans-serif';
    ctx.fillText('\u89c2\u5bdf  /  \u63a2\u7a76  /  \u9a8c\u8bc1', 482, 233);
    ctx.strokeStyle = '#a8c9b49a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const stroke = (...points) => {
      ctx.beginPath();
      points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.stroke();
    };
    stroke([100, 158], [151, 158], [151, 217], [255, 217], [255, 126], [181, 126]);
    stroke([163, 109], [163, 144]);
    stroke([178, 116], [178, 138]);
    stroke([108, 278], [236, 278]);
    stroke([1119, 113], [1119, 152], [1086, 218], [1088, 232], [1182, 232], [1187, 220], [1154, 153], [1154, 114]);
    stroke([1110, 113], [1163, 113]);
    stroke([1100, 194], [1137, 192], [1174, 197]);
    for (const [x, y, r] of [[1116, 178, 5], [1141, 210, 7], [1146, 172, 4]]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    stroke([1074, 278], [1211, 278]);
  });
}

function labelMap(title, lines, color, dark = false) {
  return texture(512, lines ? 256 : 128, (ctx, w, h) => {
    ctx.fillStyle = dark ? '#24454a' : '#edf1e9';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, dark ? 20 : w, dark ? h : 15);
    ctx.fillStyle = dark ? '#f1f6eb' : '#325450';
    ctx.font = '600 56px "Microsoft YaHei", sans-serif';
    ctx.fillText(title, 47, lines ? 93 : 84);
    if (!lines) return;
    ctx.font = '400 26px "Microsoft YaHei", sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, 47, 145 + i * 36));
  });
}

export function createClassroom(scene) {
  const standard = (color, properties) => new THREE.MeshStandardMaterial({ color, roughness: 0.82, ...properties });
  const mapped = (map, properties) => standard('#ffffff', { map, ...properties });
  const mat = {
    wall: standard('#e3e5d8'), lower: standard('#b3c2b9'), molding: standard('#c4d2c7'),
    ceiling: standard('#e0e3d9'), structural: standard('#d1dbce'),
    frame: standard('#8e9d94', { metalness: 0.24, roughness: 0.54 }),
    windowFrame: standard('#657e73', { metalness: 0.22, roughness: 0.62 }),
    desk: standard('#3b736e', { roughness: 0.56 }), rim: standard('#387a76', { roughness: 0.51 }),
    edge: standard('#213d3c'), panels: standard('#e0e5d8'), inset: standard('#bfcfc6'),
    steel: standard('#aabdb6', { metalness: 0.58, roughness: 0.28 }),
    black: standard('#293d3b'), rubber: standard('#233431'), wood: standard('#af8754'),
    door: standard('#94604c'), doorInset: standard('#a96a54'), brick: standard('#73473d'),
    paper: standard('#eeeade'), brass: standard('#bd9255', { metalness: 0.22 }),
    red: standard('#aa5e4b'), blue: standard('#5a7e89'), clearGlass: standard('#a9d3c4', { transparent: true, opacity: 0.7, roughness: 0.24 }),
  };
  const geometry = new Map();
  const make = (key, create) => {
    if (!geometry.has(key)) geometry.set(key, create());
    return geometry.get(key);
  };
  const mesh = (g, material, x, y, z, parent = scene) => {
    const result = new THREE.Mesh(g, material);
    result.position.set(x, y, z);
    result.receiveShadow = true;
    parent.add(result);
    return result;
  };
  const box = (x, y, z, w, h, d, material, parent = scene) =>
    mesh(make(`box/${w}/${h}/${d}`, () => new THREE.BoxGeometry(w, h, d)), material, x, y, z, parent);
  const cylinder = (x, y, z, radius, length, material, parent = scene, radial = 16) =>
    mesh(make(`cyl/${radius}/${length}/${radial}`, () => new THREE.CylinderGeometry(radius, radius, length, radial)), material, x, y, z, parent);
  const panel = (x, y, z, w, h, material, parent = scene) =>
    mesh(make(`plane/${w}/${h}`, () => new THREE.PlaneGeometry(w, h)), material, x, y, z, parent);
  const tube = (points, width, material, parent) => {
    const path = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
    return mesh(new THREE.TubeGeometry(path, 24, width, 8, false), material, 0, 0, 0, parent);
  };

  scene.background = new THREE.Color('#c5d9d3');
  scene.fog = new THREE.Fog('#d6e1d9', 13.5, 28);
  scene.add(new THREE.HemisphereLight('#e7f3ff', '#ada88c', 2.05));
  const daylight = new THREE.DirectionalLight('#fff1d4', 1.86);
  daylight.position.set(5.4, 5.9, 2.4);
  daylight.castShadow = true;
  daylight.shadow.mapSize.set(1024, 1024);
  Object.assign(daylight.shadow.camera, { left: -8.2, right: 8.2, top: 7.4, bottom: -7.4, near: 0.5, far: 22 });
  daylight.shadow.normalBias = 0.035;
  daylight.shadow.bias = -0.00021;
  scene.add(daylight);
  const fill = new THREE.DirectionalLight('#ccdff1', 0.62);
  fill.position.set(-3.5, 2.8, -4.2);
  scene.add(fill);

  const floor = panel(0, 0, -0.35, 11.2, 13.7, mapped(floorMap(), { roughness: 0.67 }));
  floor.rotation.x = -Math.PI / 2;
  box(0, 3.58, -0.34, 11.2, 0.14, 13.72, mat.ceiling);
  box(0, 1.78, -7.28, 11.36, 3.56, 0.16, mat.wall);
  box(0, 0.53, -7.178, 11.2, 1.06, 0.05, mat.lower);
  box(0, 1.065, -7.135, 11.2, 0.045, 0.025, mat.molding);
  box(0, 0.06, -7.13, 11.2, 0.12, 0.04, mat.frame);
  box(0, 1.78, 6.58, 11.36, 3.56, 0.16, mat.wall);
  box(0, 0.53, 6.48, 11.2, 1.06, 0.05, mat.lower);
  box(0, 0.06, 6.44, 11.2, 0.12, 0.04, mat.frame);
  for (const side of [-1, 1]) {
    box(side * 5.68, 1.78, -0.35, 0.16, 3.56, 13.7, mat.wall);
    box(side * 5.575, 0.53, -0.35, 0.05, 1.06, 13.7, mat.lower);
    box(side * 5.53, 1.065, -0.35, 0.025, 0.045, 13.7, mat.molding);
    box(side * 5.53, 0.06, -0.35, 0.035, 0.12, 13.7, mat.frame);
    for (const [index, z] of [-4.49, -0.58, 3.33].entries()) {
      const w = 3.25;
      const h = 1.66;
      const y = 2.18;
      const win = panel(side * 5.564, y, z, w, h, new THREE.MeshBasicMaterial({ map: viewMap(21 + index * 32 + side * 12) }));
      win.rotation.y = -side * Math.PI / 2;
      for (const xz of [-w / 2, -w / 6, w / 6, w / 2]) box(side * 5.518, y, z + xz, 0.09, h + 0.08, 0.05, mat.windowFrame);
      for (const dy of [-h / 2, 0.16, h / 2]) box(side * 5.515, y + dy, z, 0.092, 0.045, w + 0.06, mat.windowFrame);
      box(side * 5.45, y - h / 2 - 0.04, z, 0.22, 0.06, w + 0.18, mat.structural);
    }
    for (const z of [-6.91, -2.52, 1.35, 5.77]) box(side * 5.51, 1.78, z, 0.18, 3.56, 0.22, mat.structural);
  }

  for (const z of [-4.6, -0.52, 3.53]) {
    box(0, 3.39, z - 0.39, 11.24, 0.23, 0.2, mat.structural);
    for (const x of [-2.69, 2.69]) {
      for (const dx of [-0.56, 0.56]) cylinder(x + dx, 3.37, z, 0.014, 0.29, mat.frame);
      box(x, 3.216, z, 1.65, 0.09, 0.24, mat.structural);
      box(x, 3.158, z, 1.57, 0.032, 0.202, new THREE.MeshBasicMaterial({ color: '#f7f6e9' }));
    }
  }

  box(-0.65, 2.15, -7.075, 5.57, 1.62, 0.095, mat.frame);
  panel(-0.65, 2.15, -7.02, 5.43, 1.49, mapped(boardMap(), { roughness: 0.96 }));
  box(-0.65, 1.354, -7.002, 5.56, 0.054, 0.13, mat.frame);
  box(-0.93, 1.394, -6.954, 0.11, 0.025, 0.03, mat.paper);
  box(-0.6, 1.406, -6.96, 0.17, 0.047, 0.064, mat.wood);
  panel(2.63, 2.4, -7.131, 0.82, 0.41, mapped(labelMap('\u5b9e\u9a8c\u5b88\u5219', ['\u7231\u62a4\u5668\u6750', '\u7ed3\u675f\u540e\u6574\u7406\u53f0\u9762'], '#779c91')));
  box(4.43, 1.307, -7.087, 1.47, 2.625, 0.16, mat.brick);
  box(4.43, 1.286, -6.965, 1.29, 2.48, 0.09, mat.door);
  box(4.43, 0.72, -6.912, 1.04, 0.93, 0.028, mat.doorInset);
  box(4.43, 1.921, -6.912, 1.04, 0.83, 0.028, mat.doorInset);
  box(4.75, 1.104, -6.872, 0.2, 0.055, 0.07, mat.brass);
  box(4.69, 1.158, -6.88, 0.061, 0.19, 0.033, mat.brass);

  const contactMap = texture(128, 128, (ctx, w, h) => {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gradient.addColorStop(0, '#24373389');
    gradient.addColorStop(0.5, '#2437334d');
    gradient.addColorStop(1, '#24373300');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  });
  const contact = new THREE.MeshBasicMaterial({ map: contactMap, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
  const groundShadow = (x, z, w, d) => {
    const decal = panel(x, 0.006, z, w, d, contact);
    decal.rotation.x = -Math.PI / 2;
    decal.receiveShadow = false;
  };

  const obstacles = [];
  const obstacle = (x, z, w, d, top) => obstacles.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, top });
  const storageX = -3.77;
  const storageZ = -6.57;
  box(storageX, 0.48, storageZ, 2.22, 0.9, 0.83, mat.panels).castShadow = true;
  box(storageX, 0.948, storageZ, 2.31, 0.072, 0.89, mat.desk).castShadow = true;
  box(storageX, 0.074, storageZ, 2.1, 0.12, 0.73, mat.edge);
  for (const dx of [-0.72, 0, 0.72]) {
    box(storageX + dx, 0.51, storageZ + 0.434, 0.68, 0.71, 0.028, mat.inset);
    box(storageX + dx, 0.73, storageZ + 0.464, 0.19, 0.023, 0.028, mat.steel);
  }
  groundShadow(storageX, storageZ, 2.9, 1.8);
  obstacle(storageX, storageZ, 2.31, 0.89, 0.984);

  function bench(id, x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    scene.add(group);
    const w = 3.21;
    const d = 1.46;
    const topY = 0.965;
    const tabletop = box(0, topY, 0, w, 0.095, d, mat.desk.clone(), group);
    tabletop.name = `${id}-tabletop`;
    tabletop.castShadow = true;
    box(0, 0.905, 0, w - 0.02, 0.042, d - 0.02, mat.edge, group);
    box(0, 1.023, -d / 2 + 0.04, w - 0.04, 0.088, 0.073, mat.rim, group);
    for (const side of [-1, 1]) {
      box(side * (w / 2 - 0.038), 1.019, -0.08, 0.073, 0.08, d - 0.18, mat.rim, group);
      box(side * 1.27, 0.48, 0.018, 0.51, 0.81, 1.23, mat.panels, group).castShadow = true;
      box(side * 1.27, 0.49, 0.644, 0.4, 0.56, 0.027, mat.inset, group);
      box(side * 1.27, 0.722, 0.675, 0.15, 0.024, 0.034, mat.steel, group);
      box(side * 1.27, 0.065, 0.028, 0.45, 0.08, 1.06, mat.edge, group);
    }
    box(0, 0.715, -0.56, 2.25, 0.35, 0.09, mat.inset, group);
    box(0, 0.84, 0.56, 2.14, 0.097, 0.11, mat.edge, group);
    const isPhysics = id === 'physics';
    const label = isPhysics ? '01  \u7269\u7406\u53f0' : '02  \u5316\u5b66\u53f0';
    panel(0, 0.84, 0.619, 0.39, 0.097, mapped(labelMap(label, null, isPhysics ? '#dfad61' : '#7ac2aa', true)), group);

    if (isPhysics) {
      const instrument = box(-0.12, 1.102, -0.39, 0.58, 0.181, 0.33, mat.edge, group);
      instrument.castShadow = true;
      box(-0.12, 1.185, -0.39, 0.575, 0.027, 0.323, mat.blue, group);
      box(-0.175, 1.117, -0.222, 0.31, 0.103, 0.012, mat.paper, group);
      for (const [dx, color] of [[0.061, mat.red], [0.135, mat.black]]) {
        const port = cylinder(dx, 1.07, -0.208, 0.022, 0.027, color, group);
        port.rotation.x = Math.PI / 2;
      }
      box(-0.68, 1.036, -0.28, 0.42, 0.04, 0.241, mat.black, group);
      cylinder(-0.68, 1.075, -0.28, 0.039, 0.057, mat.brass, group);
      tube([[-0.58, 1.035, -0.225], [-0.45, 1.035, -0.01], [-0.17, 1.035, 0.022], [0.061, 1.07, -0.199]], 0.009, mat.red, group);
      tube([[-0.75, 1.038, -0.225], [-0.68, 1.039, 0.077], [-0.12, 1.037, 0.093], [0.135, 1.071, -0.198]], 0.009, mat.black, group);
    } else {
      box(-0.74, 1.017, -0.3, 0.75, 0.02, 0.47, mat.steel, group);
      box(-0.74, 1.028, -0.3, 0.65, 0.014, 0.38, mat.black, group);
      box(-0.74, 1.037, -0.3, 0.52, 0.01, 0.255, mat.edge, group);
      cylinder(-0.74, 1.059, -0.59, 0.049, 0.117, mat.steel, group);
      tube([[-0.74, 1.061, -0.59], [-0.74, 1.47, -0.59], [-0.74, 1.55, -0.552], [-0.74, 1.54, -0.445], [-0.74, 1.455, -0.415]], 0.022, mat.steel, group).castShadow = true;
      box(0.61, 1.055, -0.27, 0.52, 0.068, 0.22, mat.wood, group);
      for (let i = 0; i < 3; i++) {
        const tx = 0.48 + i * 0.117;
        cylinder(tx, 1.185, -0.27, 0.027, 0.2, mat.clearGlass, group);
        cylinder(tx, 1.284, -0.27, 0.031, 0.012, mat.clearGlass, group);
        cylinder(tx, 1.126, -0.27, 0.019, 0.048 + i * 0.021, i === 1 ? mat.blue : mat.molding, group);
      }
    }
    groundShadow(x, z, 4.14, 2.42);
    obstacle(x, z, w, d, topY + 0.095 / 2);
    return { id, tabletop, x, z };
  }

  function stool(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    scene.add(group);
    cylinder(0, 0.478, 0, 0.234, 0.065, mat.wood, group, 24).castShadow = true;
    cylinder(0, 0.432, 0, 0.205, 0.032, mat.edge, group, 24);
    for (const dx of [-1, 1]) {
      for (const dz of [-1, 1]) {
        const leg = box(dx * 0.146, 0.227, dz * 0.146, 0.035, 0.434, 0.035, mat.steel, group);
        leg.rotation.z = dx * 0.125;
        leg.rotation.x = -dz * 0.125;
        box(dx * 0.169, 0.019, dz * 0.169, 0.053, 0.037, 0.053, mat.rubber, group);
      }
    }
    for (const d of [-0.147, 0.147]) box(0, 0.17, d, 0.312, 0.025, 0.025, mat.frame, group);
    groundShadow(x, z, 0.88, 0.72);
    obstacle(x, z, 0.468, 0.468, 0.478 + 0.065 / 2);
  }

  const benches = [bench('physics', -2.55, 0.5), bench('chemistry', 2.55, 0.5)];
  stool(-2.27, 1.67);
  stool(2.27, 1.67);
  return { benches, obstacles };
}
