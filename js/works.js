/* =========================================================
   works.js
   Awwwards-style highlights: cover grid + full drawing viewer.
========================================================= */
(function () {
  const WORKS = [
    {
      id: 'grid',
      title: 'Reinterpreting the Grid',
      kicker: 'Discrete Aggregation',
      meta: '2023.01 - 2024.12 · Individual · Grasshopper / WASP',
      desc: '用重新解读的四合院单元，生成可生长的多户社区。从基本构件出发，靠 WASP 做从小到大的离散聚合。',
      pages: ['p03.jpg', 'p04.jpg', 'p05.jpg', 'p06.jpg', 'p07.jpg', 'p08.jpg'],
    },
    {
      id: 'massing',
      title: 'Massing Production',
      kicker: 'A 3D Sketchbook',
      meta: '2024.08 - 2024.09 · Group · JavaScript / AR',
      desc: '在平板上画平面，实时长出三维体量，再把模型叠到实体场地里看。缩短概念阶段在二维和三维之间的来回。',
      pages: ['p09.jpg', 'p10.jpg', 'p11.jpg', 'p12.jpg', 'p13.jpg'],
    },
    {
      id: 'press',
      title: 'Press Here',
      kicker: 'Interactive Tactile Book',
      meta: 'Spring 2023 · Group · Arduino / UX',
      desc: '给视障儿童的触觉书：摸到形象会出声，摸到盲文会朗读。旁边的 App 让家长和老师跟着一起读。',
      pages: ['p14.jpg', 'p15.jpg', 'p16.jpg', 'p17.jpg', 'p18.jpg'],
    },
    {
      id: 'bodyblock',
      title: 'Bodyblock',
      kicker: 'AR Application for ADHD',
      meta: 'Other work · XR / Movement',
      desc: '把拉班动作分析和 XR 放在一起，做成面向 ADHD 的身体感知实验。用运动提醒人注意空间和自己。',
      pages: ['p19.jpg', 'p20.jpg', 'p21.jpg', 'p22.jpg'],
    },
  ];

  const viewer = document.getElementById('workViewer');
  if (!viewer) return;

  const titleEl = document.getElementById('viewerTitle');
  const kickerEl = document.getElementById('viewerKicker');
  const metaEl = document.getElementById('viewerMeta');
  const descEl = document.getElementById('viewerDesc');
  const pagesEl = document.getElementById('viewerPages');
  const indexEl = document.getElementById('viewerIndex');
  let current = 0;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function openWork(id) {
    const idx = WORKS.findIndex((w) => w.id === id);
    if (idx < 0) return;
    current = idx;
    render();
    viewer.hidden = false;
    document.body.style.overflow = 'hidden';
    viewer.scrollTop = 0;
    document.getElementById('viewerClose').focus();
  }

  function closeWork() {
    viewer.hidden = true;
    document.body.style.overflow = '';
  }

  function render() {
    const work = WORKS[current];
    titleEl.textContent = work.title;
    kickerEl.textContent = work.kicker;
    metaEl.textContent = work.meta;
    descEl.textContent = work.desc;
    indexEl.textContent = `${pad(current + 1)} / ${pad(WORKS.length)}`;
    pagesEl.innerHTML = work.pages
      .map((file, i) => `<img src="assets/works/${file}" alt="${work.title} drawing ${i + 1}" width="2550" height="1650">`)
      .join('');
  }

  document.querySelectorAll('.work-card').forEach((card) => {
    card.addEventListener('click', () => openWork(card.dataset.work));
  });

  document.getElementById('viewerClose').addEventListener('click', closeWork);
  document.getElementById('viewerPrev').addEventListener('click', () => {
    current = (current - 1 + WORKS.length) % WORKS.length;
    render();
    viewer.scrollTop = 0;
  });
  document.getElementById('viewerNext').addEventListener('click', () => {
    current = (current + 1) % WORKS.length;
    render();
    viewer.scrollTop = 0;
  });

  document.addEventListener('keydown', (e) => {
    if (viewer.hidden) return;
    if (e.key === 'Escape') closeWork();
    if (e.key === 'ArrowLeft') document.getElementById('viewerPrev').click();
    if (e.key === 'ArrowRight') document.getElementById('viewerNext').click();
  });
})();
