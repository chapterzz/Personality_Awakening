const MBTI = [
  'INTJ',
  'INTP',
  'ENTJ',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISFJ',
  'ESTJ',
  'ESFJ',
  'ISTP',
  'ISFP',
  'ESTP',
  'ESFP',
];
const SPRITES = [
  { label: '曦光领航', full: '曦光领航精灵', color: 'var(--chart-1)' },
  { label: '月影探索', full: '月影探索精灵', color: 'var(--chart-2)' },
];
const DATA = [
  { type: 'INFP', sprite: '月影探索精灵', count: 10 },
  { type: 'INFJ', sprite: '月影探索精灵', count: 7 },
  { type: 'INTJ', sprite: '月影探索精灵', count: 5 },
  { type: 'INTP', sprite: '月影探索精灵', count: 4 },
  { type: 'ISTJ', sprite: '月影探索精灵', count: 3 },
  { type: 'ISFJ', sprite: '月影探索精灵', count: 3 },
  { type: 'ISTP', sprite: '月影探索精灵', count: 2 },
  { type: 'ISFP', sprite: '月影探索精灵', count: 2 },
  { type: 'ENFP', sprite: '曦光领航精灵', count: 8 },
  { type: 'ENFJ', sprite: '曦光领航精灵', count: 6 },
  { type: 'ENTJ', sprite: '曦光领航精灵', count: 5 },
  { type: 'ENTP', sprite: '曦光领航精灵', count: 4 },
  { type: 'ESTJ', sprite: '曦光领航精灵', count: 3 },
  { type: 'ESFJ', sprite: '曦光领航精灵', count: 3 },
  { type: 'ESTP', sprite: '曦光领航精灵', count: 2 },
  { type: 'ESFP', sprite: '曦光领航精灵', count: 2 },
];
const LEGENDS = [
  { id: 'L-A', title: '渐变条（推荐）', desc: '底部单行：少 — 渐变 — 多' },
  { id: 'L-B', title: '双色分行图例', desc: '曦光、月影各一行 mini 渐变' },
  { id: 'L-C', title: '阶梯色块', desc: '0 / 低 / 中 / 高 四档' },
  { id: 'L-D', title: '图标 + 文字', desc: '仅标注两只精灵颜色' },
];
const HLS = [
  { id: 'H-A', title: '外环描边 ring', desc: '整列 2px chart-3', cls: 'hl-ring' },
  { id: 'H-B', title: '列顶色带', desc: '列顶 3px 紫色边框', cls: 'hl-border-top' },
  { id: 'H-C', title: '列背景淡染', desc: '22% chart-3 底色', cls: 'hl-column-bg' },
  { id: 'H-D', title: '外发光 glow', desc: '柔和紫色光晕', cls: 'hl-glow' },
  { id: 'H-E', title: '描边+发光', desc: 'ring+glow', cls: 'hl-combo' },
  { id: 'H-F', title: '仅表头', desc: '表头加粗+下划线', cls: 'hl-underline' },
];
let selL = 'L-A',
  selH = 'H-A';
function cnt(t, s) {
  const r = DATA.find((d) => d.type === t && d.sprite === s);
  return r ? r.count : 0;
}
function mx() {
  return Math.max(1, ...DATA.map((d) => d.count));
}
function cellBg(c, n, m) {
  const p = n === 0 ? 8 : Math.round(25 + (75 * n) / m);
  return 'color-mix(in srgb,' + c + ' ' + p + '%,transparent)';
}
function leg(id) {
  const xi = 'var(--chart-1)',
    yu = 'var(--chart-2)';
  if (id === 'L-B')
    return (
      '<div class="legend legend-dual"><div class="row"><span style="width:4em">曦光</span><div class="mini-bar" style="background:linear-gradient(90deg,color-mix(in srgb,' +
      xi +
      ' 15%,transparent),' +
      xi +
      ')"></div><span>少→多</span></div><div class="row"><span style="width:4em">月影</span><div class="mini-bar" style="background:linear-gradient(90deg,color-mix(in srgb,' +
      yu +
      ' 15%,transparent),' +
      yu +
      ')"></div><span>少→多</span></div></div>'
    );
  if (id === 'L-C') {
    const lb = ['0', '低', '中', '高'];
    const st = [0, 0.25, 0.55, 1];
    let h = '<div class="legend legend-steps">';
    st.forEach((t, i) => {
      const p = t === 0 ? 8 : Math.round(25 + 75 * t);
      h +=
        '<div class="step" style="background:color-mix(in srgb,' +
        xi +
        ' ' +
        p +
        '%,transparent)">' +
        lb[i] +
        '</div>';
    });
    return h + '<span style="color:var(--muted-foreground)">人数密度</span></div>';
  }
  if (id === 'L-D')
    return (
      '<div class="legend legend-icon"><span><i class="swatch" style="background:' +
      xi +
      '"></i>曦光(E)</span><span><i class="swatch" style="background:' +
      yu +
      '"></i>月影(I)</span><span style="color:var(--muted-foreground)">越深人越多</span></div>'
    );
  return (
    '<div class="legend legend-gradient"><span>少</span><div class="bar" style="background:linear-gradient(90deg,color-mix(in srgb,' +
    xi +
    ' 12%,transparent),' +
    xi +
    ')"></div><span>多</span></div>'
  );
}
function draw(el, o) {
  const hl = o.hl || '',
    max = mx();
  let g = '<div></div>';
  MBTI.forEach((t) => {
    g += '<div class="col-head' + (t === hl ? ' hl' : '') + '">' + t + '</div>';
  });
  SPRITES.forEach((sp) => {
    g += '<div class="row-label">' + sp.label + '</div>';
    MBTI.forEach((t) => {
      const n = cnt(t, sp.full);
      g +=
        '<div class="cell' +
        (t === hl ? ' hl-col' : '') +
        '" style="background:' +
        cellBg(sp.color, n, max) +
        '" title="' +
        t +
        ' ' +
        sp.full +
        ': ' +
        n +
        '">' +
        (n > 0 ? n : '') +
        '</div>';
    });
  });
  const hint = hl
    ? '<p class="heatmap-sub">高亮为你的类型：<strong style="color:var(--chart-3)">' +
      hl +
      '</strong></p>'
    : o.noHint
      ? ''
      : '<p class="heatmap-sub">切换顶部模拟类型</p>';
  el.innerHTML =
    '<h4 style="margin:0 0 .5rem">类型 × 精灵热力图</h4>' +
    hint +
    '<div class="heatmap-scroll"><div class="heatmap-grid ' +
    (o.cls || '') +
    '" style="grid-template-columns:auto repeat(16,minmax(32px,1fr))">' +
    g +
    '</div></div>' +
    (o.noLeg ? '' : leg(o.leg || selL));
}
function bind(id, items, g) {
  const r = document.getElementById(id);
  r.innerHTML = items
    .map((o) => {
      const s = (g === 'legend' ? selL : selH) === o.id;
      return (
        '<label class="option-card' +
        (s ? ' selected' : '') +
        '" data-id="' +
        o.id +
        '" data-g="' +
        g +
        '"><input type="radio"' +
        (s ? ' checked' : '') +
        '/><span class="opt-id">' +
        o.id +
        '</span> ' +
        o.title +
        '<div class="opt-desc">' +
        o.desc +
        '</div></label>'
      );
    })
    .join('');
  r.querySelectorAll('.option-card').forEach((c) => {
    c.onclick = () => {
      const i = c.dataset.id;
      if (c.dataset.g === 'legend') selL = i;
      else selH = i;
      refresh();
    };
  });
}
function refresh() {
  const hl = document.getElementById('highlightType').value;
  const h = HLS.find((x) => x.id === selH);
  draw(document.getElementById('main-demo'), { hl, cls: h ? h.cls : 'hl-ring', leg: selL });
  const prev = document.getElementById('highlight-previews');
  prev.innerHTML = '';
  HLS.forEach((opt) => {
    const b = document.createElement('div');
    b.className = 'card preview-mini';
    b.innerHTML = '<h5>' + opt.id + ' ' + opt.title + '</h5>';
    const inner = document.createElement('div');
    b.appendChild(inner);
    draw(inner, { hl, cls: opt.cls, noLeg: true, noHint: true });
    prev.appendChild(b);
  });
  const lg = LEGENDS.find((l) => l.id === selL),
    hi = HLS.find((x) => x.id === selH);
  document.getElementById('out').innerHTML =
    '<strong>批准时：</strong><br/>图例 <code>' +
    selL +
    '</code> ' +
    (lg ? lg.title : '') +
    '<br/>高亮 <code>' +
    selH +
    '</code> ' +
    (hi ? hi.title : '') +
    '<br/>示例：批准，图例 ' +
    selL +
    '，高亮 ' +
    selH;
  bind('legend-pick', LEGENDS, 'legend');
  bind('highlight-pick', HLS, 'highlight');
}
document.getElementById('theme').onchange = (e) =>
  document.documentElement.classList.toggle('dark', e.target.value === 'dark');
document.getElementById('viewport').onchange = (e) =>
  document.getElementById('app').classList.toggle('narrow', e.target.value === 'narrow');
document.getElementById('highlightType').onchange = refresh;
refresh();
