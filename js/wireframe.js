/* =========================================================
   wireframe.js
   Procedural 3D wireframe "tower" rendered with Three.js.
   White lines on transparent background — architectural nod.
========================================================= */
(function () {
  const canvas = document.getElementById('wireframeCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 4, 26);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const group = new THREE.Group();
  scene.add(group);

  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
  const lineMatDim = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 });

  // ---- Build a procedural stacked "tower" of floor-plate wireframes ----
  const floors = 14;
  const floorHeight = 1.15;
  const baseSize = 5.2;
  const towerHeight = floors * floorHeight;

  function floorGeometry(size) {
    const half = size / 2;
    const pts = [
      new THREE.Vector3(-half, 0, -half),
      new THREE.Vector3(half, 0, -half),
      new THREE.Vector3(half, 0, half),
      new THREE.Vector3(-half, 0, half),
      new THREE.Vector3(-half, 0, -half),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }

  for (let i = 0; i <= floors; i++) {
    const t = i / floors;
    const size = baseSize * (1 - t * 0.35); // slight taper toward top
    const geo = floorGeometry(size);
    const line = new THREE.Line(geo, i % 4 === 0 ? lineMat : lineMatDim);
    line.position.y = i * floorHeight - towerHeight / 2;
    group.add(line);
  }

  // vertical columns (corners)
  const cornersBottom = [
    [-baseSize / 2, -baseSize / 2],
    [baseSize / 2, -baseSize / 2],
    [baseSize / 2, baseSize / 2],
    [-baseSize / 2, baseSize / 2],
  ];
  cornersBottom.forEach(([x, z]) => {
    const topTaper = baseSize * 0.65;
    const xTop = (x / (baseSize / 2)) * (topTaper / 2);
    const zTop = (z / (baseSize / 2)) * (topTaper / 2);
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, -towerHeight / 2, z),
      new THREE.Vector3(xTop, towerHeight / 2, zTop),
    ]);
    group.add(new THREE.Line(geo, lineMat));
  });

  // roof structure — simple pyramidal line accents
  const apex = new THREE.Vector3(0, towerHeight / 2 + 2.2, 0);
  cornersBottom.forEach(([x, z]) => {
    const topTaper = baseSize * 0.65;
    const xTop = (x / (baseSize / 2)) * (topTaper / 2);
    const zTop = (z / (baseSize / 2)) * (topTaper / 2);
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(xTop, towerHeight / 2, zTop),
      apex,
    ]);
    group.add(new THREE.Line(geo, lineMat));
  });

  group.rotation.y = Math.PI / 6;
  group.position.y = -1.5;

  // ---- ground grid, subtle ----
  const grid = new THREE.GridHelper(40, 20, 0x555555, 0x1a1a1a);
  grid.position.y = -towerHeight / 2 - 1.5;
  grid.material.transparent = true;
  grid.material.opacity = 0.25;
  scene.add(grid);

  // ---- interaction: gentle parallax on mouse ----
  let targetRotY = group.rotation.y;
  let targetRotX = 0;
  window.addEventListener('mousemove', (e) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    targetRotY = Math.PI / 6 + nx * 0.25;
    targetRotX = ny * 0.08;
  });

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', resize);

  let raf;
  function animate() {
    raf = requestAnimationFrame(animate);
    group.rotation.y += (targetRotY - group.rotation.y) * 0.04;
    group.rotation.x += (targetRotX - group.rotation.x) * 0.04;
    group.rotation.y += 0.0009; // slow autonomous spin
    renderer.render(scene, camera);
  }
  animate();

  // pause rendering when hero out of view (perf)
  const heroEl = document.getElementById('hero');
  if ('IntersectionObserver' in window && heroEl) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          cancelAnimationFrame(raf);
        } else {
          animate();
        }
      });
    }, { threshold: 0.01 });
    io.observe(heroEl);
  }
})();
