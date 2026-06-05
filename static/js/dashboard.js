/* ─────────────────────────────────────────────────────────────
   dashboard.js — WBill$
   Arquitectura: estado global + init() al cargar
───────────────────────────────────────────────────────────── */

/* ── ESTADO GLOBAL ──────────────────────────────────────── */
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const CATS_DEFAULT = [
  { n:'Alimentación', e:'🍔' }, { n:'Transporte', e:'🚌' },
  { n:'Ocio',         e:'🎬' }, { n:'Salud',      e:'🏥' },
  { n:'Educación',    e:'📚' }, { n:'Salario',     e:'💼' }
];

const EMOJI_GROUPS = [
  { label:'💰 Finanzas',   emojis:['💰','💵','💳','🏦','📈','📉','💸','🪙','💹','🤑'] },
  { label:'🍔 Comida',     emojis:['🍔','🍕','🌮','🍜','🥗','🍱','☕','🧃','🍺','🛒'] },
  { label:'🚌 Transporte', emojis:['🚌','🚗','✈️','🛵','🚲','⛽','🚕','🚇','🛺','🚢'] },
  { label:'🏠 Hogar',      emojis:['🏠','🛋️','🔧','💡','🧹','🪴','🛏️','🚿','📦','🔑'] },
  { label:'🎬 Ocio',       emojis:['🎬','🎮','🎵','📚','🎨','🏋️','⚽','🎭','🎲','🎤'] },
  { label:'🏥 Salud',      emojis:['🏥','💊','🩺','🧘','🏃','💉','🦷','👓','🩹','🧬'] },
  { label:'👗 Ropa',       emojis:['👗','👟','👜','💄','🧣','🎩','💎','👔','🕶️','👒'] },
  { label:'📱 Tecnología', emojis:['📱','💻','🖥️','🎧','📷','⌚','🖨️','🔋','🕹️','📡'] },
  { label:'📚 Educación',  emojis:['📚','🎓','✏️','📐','🔬','🏫','📖','📝','🧪','🗂️'] },
  { label:'🐾 Mascotas',   emojis:['🐾','🐶','🐱','🐟','🦜','🐹','🐰','🦎','🐴','🐕'] },
];

let uCats          = [...CATS_DEFAULT];
let selCat         = null;
let tipo           = null;
let allMovements   = [];
let activeCatFilter= null;
let selectedEmoji  = '🏷️';
let chartInstances = {};
let currentUser    = null;

/* ── GUARDAR / CARGAR CATEGORÍAS ────────────────────────── */
function saveData() { localStorage.setItem('wbills_cats', JSON.stringify(uCats)); }
function loadData() {
  const d = JSON.parse(localStorage.getItem('wbills_cats') || 'null');
  if (d) uCats = d;
}

/* ── PROTECCIÓN bfcache ─────────────────────────────────── */
window.addEventListener('pageshow', function() {
  if (!localStorage.getItem('wbills_token')) {
    window.location.replace('/');
  }
});

/* ══════════════════════════════════════════════════════════
   FUNCIONES GLOBALES — accesibles desde onclick en el HTML
══════════════════════════════════════════════════════════ */

function selectTipo(t) {
  tipo = t;
  document.getElementById('btn-ing').className =
    'abtn' + (t === 'ingreso' ? ' active-sel' : '');
  document.getElementById('btn-gas').className =
    'abtn' + (t === 'gasto'   ? ' active-sel' : '');
  document.getElementById('form-ttl').textContent =
    t === 'ingreso' ? '↑ Registrar Ingreso' : '↓ Registrar Gasto';
  document.getElementById('mov-form').classList.add('open');
  document.getElementById('af').className = 'af';
  buildCatSel();
}

function fmtMonto(inp) {
  let v = inp.value.replace(/\D/g, '');
  inp.value = v ? '$' + parseInt(v).toLocaleString('es-CO') : '';
}

function toggleAll() {
  document.getElementById('all-p').classList.toggle('open');
}

function toggleProfile(e) {
  e.stopPropagation();
  document.getElementById('prof-dropdown').classList.toggle('open');
}

function goAccount() {
  document.getElementById('prof-dropdown').classList.remove('open');
  document.getElementById('account-modal').style.display = 'flex';
}

function closeAccount() {
  document.getElementById('account-modal').style.display = 'none';
}

function doLogout() {
  localStorage.removeItem('wbills_token');
  localStorage.removeItem('wbills_user');
  localStorage.removeItem('wbills_cats');
  fetch('/api/logout', { method: 'POST' }).finally(() => {
    window.location.replace('/');
  });
}

function closeSave() {
  document.getElementById('save-ov').classList.remove('show');
}

/* ── CATEGORÍAS FORMULARIO ──────────────────────────────── */
function buildCatSel() {
  const c = document.getElementById('cat-sel');
  if (!c) return;
  c.innerHTML = '';
  uCats.forEach((cat, i) => {
    const d = document.createElement('div');
    d.className = 'cs' + (selCat === i ? ' sel' : '');
    d.innerHTML = `<div class="cs-ico">${cat.e}</div><div style="font-size:10px">${cat.n}</div>`;
    d.onclick = () => {
      selCat = i;
      buildCatSel();
      document.getElementById('nc-form').classList.remove('open');
    };
    c.appendChild(d);
  });
}

function addCat() {
  const n = document.getElementById('nc-name').value.trim();
  const e = document.getElementById('nc-emoji').value.trim() || '🏷️';
  if (!n) return;
  uCats.push({ n, e });
  selCat = uCats.length - 1;
  document.getElementById('nc-name').value  = '';
  document.getElementById('nc-emoji').value = '';
  buildCatSel();
  saveData();
}

/* ── MODAL NUEVA CATEGORÍA ──────────────────────────────── */
function openCatModal() {
  selectedEmoji = '🏷️';
  document.getElementById('new-cat-name').value = '';
  document.getElementById('new-cat-preview').textContent = '🏷️';
  document.getElementById('new-cat-err').textContent = '';
  renderEmojiPicker();
  document.getElementById('cat-modal').style.display = 'flex';
}

function closeCatModal() {
  document.getElementById('cat-modal').style.display = 'none';
}

function renderEmojiPicker() {
  const container = document.getElementById('emoji-picker');
  if (!container) return;
  container.innerHTML = '';
  EMOJI_GROUPS.forEach(group => {
    const groupEl = document.createElement('div');
    groupEl.style.cssText = 'margin-bottom:10px';
    const labelEl = document.createElement('div');
    labelEl.textContent = group.label;
    labelEl.style.cssText =
      'font-size:10px;color:var(--mut);text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;';
    groupEl.appendChild(labelEl);
    const rowEl = document.createElement('div');
    rowEl.style.cssText = 'display:flex;flex-wrap:wrap;gap:5px;';
    group.emojis.forEach(emoji => {
      const btn = document.createElement('button');
      btn.textContent = emoji;
      const sel = selectedEmoji === emoji;
      btn.style.cssText =
        `width:34px;height:34px;border-radius:8px;font-size:18px;cursor:pointer;
         display:flex;align-items:center;justify-content:center;transition:all .15s;
         border:1.5px solid ${sel ? 'var(--gold)' : 'transparent'};
         background:${sel ? 'rgba(201,168,76,.15)' : 'var(--s2)'};`;
      btn.onclick = () => {
        selectedEmoji = emoji;
        document.getElementById('new-cat-preview').textContent = emoji;
        renderEmojiPicker();
      };
      rowEl.appendChild(btn);
    });
    groupEl.appendChild(rowEl);
    container.appendChild(groupEl);
  });
}

function saveNewCat() {
  const name = document.getElementById('new-cat-name').value.trim();
  const err  = document.getElementById('new-cat-err');
  if (!name) { err.textContent = '⚠ Escribe un nombre.'; return; }
  if (uCats.some(c => c.n.toLowerCase() === name.toLowerCase())) {
    err.textContent = '⚠ Ya existe esa categoría.'; return;
  }
  uCats.push({ n: name, e: selectedEmoji });
  saveData();
  buildCatSel();
  buildCatsGrid(allMovements);
  closeCatModal();
}

/* ── GUARDAR MOVIMIENTO ─────────────────────────────────── */
async function guardar() {
  const raw   = document.getElementById('f-monto').value.replace(/\D/g, '');
  const desc  = document.getElementById('f-desc').value.trim();
  const fecha = document.getElementById('f-fecha').value;
  const af    = document.getElementById('af');

  if (!tipo)         { af.textContent = '⚠ Selecciona tipo.';      af.className = 'af err'; return; }
  if (selCat === null){ af.textContent = '⚠ Selecciona categoría.'; af.className = 'af err'; return; }
  if (!raw)          { af.textContent = '⚠ Ingresa monto.';        af.className = 'af err'; return; }

  const cat      = uCats[selCat];
  const endpoint = tipo === 'ingreso' ? '/api/income' : '/api/expense';
  const payload  = {
    type: tipo, amount: parseFloat(raw),
    category: cat.n, description: desc,
    user_email: currentUser.email, date: fecha
  };

  try {
    const res  = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      af.textContent = '⚠ ' + (data.detail || 'Error al guardar');
      af.className   = 'af err';
      return;
    }

    af.textContent = '✓ Guardado correctamente';
    af.className   = 'af ok';
    document.getElementById('f-monto').value = '';
    document.getElementById('f-desc').value  = '';
    selCat = null;
    buildCatSel();
    await loadMovementsUI();

  } catch (e) {
    console.error(e);
    af.textContent = '⚠ Error de conexión';
    af.className   = 'af err';
  }
}

/* ── KPIs ───────────────────────────────────────────────── */
function upKPIs(ingresos, gastos) {
  const bal = ingresos - gastos;
  document.getElementById('king').textContent = '$' + ingresos.toLocaleString('es-CO');
  document.getElementById('kgas').textContent = '$' + gastos.toLocaleString('es-CO');
  const kbalEl = document.getElementById('kbal');
  kbalEl.textContent = (bal < 0 ? '-$' : '$') + Math.abs(bal).toLocaleString('es-CO');
  kbalEl.style.color = bal < 0 ? 'var(--red)' : '';
}

function calcKPIs(movements) {
  let ingresos = 0, gastos = 0;
  movements.forEach(m => {
    if      (m.type === 'ingreso') ingresos += Number(m.amount);
    else if (m.type === 'gasto')   gastos   += Number(m.amount);
  });
  return { ingresos, gastos };
}

/* ── CARGAR MOVIMIENTOS ─────────────────────────────────── */
async function loadMovements() {
  try {
    const res = await fetch(`/api/movements/${encodeURIComponent(currentUser.email)}`);
    if (!res.ok) throw new Error('API error ' + res.status);
    return await res.json();
  } catch (err) {
    console.error('Error cargando movimientos:', err);
    return [];
  }
}

function fmtDate(raw) {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

function renderHistory(movements) {
  const list = document.getElementById('tx-list');
  if (!movements.length) {
    list.innerHTML = `<div style="text-align:center;color:var(--mut);font-size:12px;padding:20px 0">
      Sin movimientos registrados.</div>`;
    return;
  }
  const catEmoji = {};
  uCats.forEach(c => { catEmoji[c.n.toLowerCase()] = c.e; });

  list.innerHTML = movements.slice(0, 20).map(m => {
    const isIng  = m.type === 'ingreso';
    const emoji  = catEmoji[(m.category||'').toLowerCase()] || (isIng ? '💼' : '💸');
    const sign   = isIng ? '+' : '-';
    const cls    = isIng ? 'pos' : 'neg';
    const amount = Number(m.amount).toLocaleString('es-CO');
    return `
      <div class="tx" data-cat="${m.category||''}">
        <div class="tico" style="background:rgba(${isIng?'78,205,196':'224,85,85'},.08)">${emoji}</div>
        <div class="ti">
          <div class="tn">${m.description || m.category || '—'}</div>
          <div class="tc2">${m.category || ''}</div>
        </div>
        <div class="ta">
          <div class="tam ${cls}">${sign}$${amount}</div>
          <div class="td">${fmtDate(m.date)}</div>
        </div>
      </div>`;
  }).join('');
}

async function loadMovementsUI() {
  allMovements = await loadMovements();
  const { ingresos, gastos } = calcKPIs(allMovements);
  upKPIs(ingresos, gastos);
  renderHistory(allMovements);
  buildCatsGrid(allMovements);
  buildCharts(allMovements);
}

/* ── GRID CATEGORÍAS ────────────────────────────────────── */
function buildCatsGrid(movements) {
  const grid = document.getElementById('cats-g');
  const list = document.getElementById('all-list');
  if (!grid) return;
  grid.innerHTML = '';
  list.innerHTML = '';

  uCats.forEach(cat => {
    const total = movements
      .filter(m => m.category === cat.n && m.type === 'gasto')
      .reduce((s, m) => s + Number(m.amount), 0);
    const d = document.createElement('div');
    d.className = 'cat-c' + (activeCatFilter === cat.n ? ' sel-c' : '');
    d.innerHTML = `
      <div class="cat-ico2">${cat.e}</div>
      <div class="cat-nm2">${cat.n}</div>
      <div style="font-size:10px;color:var(--gold);margin-top:3px">
        ${total > 0 ? '-$' + total.toLocaleString('es-CO') : ''}
      </div>`;
    d.onclick = () => filterByCat(cat.n, movements);
    grid.appendChild(d);
  });

  // Botón añadir
  const addCard = document.createElement('div');
  addCard.className = 'cat-c cat-add-btn';
  addCard.innerHTML = `<div class="cat-ico2">＋</div><div class="cat-nm2">Nueva</div>`;
  addCard.onclick = openCatModal;
  grid.appendChild(addCard);

  uCats.forEach(cat => {
    const chip = document.createElement('div');
    chip.style.cssText =
      'padding:5px 10px;background:var(--s2);border-radius:20px;' +
      'font-size:11px;cursor:pointer;border:1px solid var(--bd);color:var(--mut);';
    chip.textContent = cat.e + ' ' + cat.n;
    chip.onclick = () => filterByCat(cat.n, movements);
    list.appendChild(chip);
  });
}

function filterByCat(catName, movements) {
  activeCatFilter = activeCatFilter === catName ? null : catName;
  buildCatsGrid(movements);
  const filtered = activeCatFilter
    ? movements.filter(m => m.category === activeCatFilter)
    : movements;
  renderHistory(filtered);
  const ch = document.getElementById('cat-h');
  if (activeCatFilter) {
    document.getElementById('ch-ttl').textContent =
      '📂 ' + activeCatFilter + ' — ' + filtered.length + ' movimientos';
    document.getElementById('ch-list').innerHTML = filtered.length
      ? filtered.map(m => {
          const isIng = m.type === 'ingreso';
          return `<div style="display:flex;justify-content:space-between;
            font-size:12px;padding:4px 0;border-bottom:1px solid var(--bd)">
            <span>${m.description || '—'}</span>
            <span style="color:${isIng?'var(--green)':'var(--red)'}">
              ${isIng?'+':'-'}$${Number(m.amount).toLocaleString('es-CO')}
            </span></div>`;
        }).join('')
      : '<div style="color:var(--mut);font-size:12px">Sin movimientos.</div>';
    ch.classList.add('open');
  } else {
    ch.classList.remove('open');
  }
}

/* ── GRÁFICAS ───────────────────────────────────────────── */
function buildCharts(movements) {
  buildBarChart(movements);
  buildDoughnutChart(movements);
}

function destroyChart(id) {
  if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
}

function buildBarChart(movements) {
  const barAreas = document.getElementById('bar-areas');
  const tabsBar  = document.getElementById('tabs-bar');
  barAreas.innerHTML = '';
  tabsBar.innerHTML  = '';

  if (!movements.length) {
    barAreas.innerHTML = '<div style="color:var(--mut);font-size:12px;text-align:center;padding:16px">Sin datos aún.</div>';
    return;
  }

  const byMonth = {};
  movements.forEach(m => {
    const key = m.date ? m.date.substring(0,7) : 'N/A';
    if (!byMonth[key]) byMonth[key] = { ingreso:0, gasto:0 };
    if      (m.type === 'ingreso') byMonth[key].ingreso += Number(m.amount);
    else if (m.type === 'gasto')   byMonth[key].gasto   += Number(m.amount);
  });

  const latest = Object.keys(byMonth).sort().slice(-6);
  destroyChart('chart-bar-main');

  const canvas = document.createElement('canvas');
  canvas.id = 'chart-bar-main';
  canvas.style.cssText = 'width:100%;max-height:160px';
  barAreas.appendChild(canvas);

  chartInstances['chart-bar-main'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: latest.map(m => {
        if (m === 'N/A') return 'N/A';
        const [y, mo] = m.split('-');
        return MESES[parseInt(mo)-1]?.substring(0,3) + ' ' + y.substring(2);
      }),
      datasets: [
        { label:'Ingresos', data: latest.map(m => byMonth[m].ingreso),
          backgroundColor:'rgba(78,205,196,.75)', borderRadius:4 },
        { label:'Gastos',   data: latest.map(m => byMonth[m].gasto),
          backgroundColor:'rgba(224,85,85,.75)',  borderRadius:4 },
        { label:'Ahorro',   data: latest.map(m => Math.max(0, byMonth[m].ingreso - byMonth[m].gasto)),
          backgroundColor:'rgba(201,168,76,.75)', borderRadius:4 }
      ]
    },
    options: {
      responsive:true,
      plugins: {
        legend: { display:false },
        tooltip: { callbacks: { label: ctx => ' $' + ctx.parsed.y.toLocaleString('es-CO') } }
      },
      scales: {
        x: { ticks:{ color:'#8B8070', font:{size:9} }, grid:{ color:'rgba(255,255,255,.04)' } },
        y: { ticks:{ color:'#8B8070', font:{size:9},
               callback: v => '$'+(v/1000).toFixed(0)+'k' },
             grid:{ color:'rgba(255,255,255,.04)' } }
      }
    }
  });
}

let donTab = 'gasto';   // tab activo de la dona

function switchDonTab(tipo) {
  donTab = tipo;
  // Estilos de tabs
  const gas = document.getElementById('don-tab-gas');
  const ing = document.getElementById('don-tab-ing');
  if (gas && ing) {
    const actStyle = 'padding:4px 12px;border-radius:20px;border:1px solid var(--gold);background:rgba(201,168,76,.12);color:var(--gold);font-size:10px;cursor:pointer;font-family:inherit;font-weight:600;';
    const idlStyle = 'padding:4px 12px;border-radius:20px;border:1px solid var(--bd);background:var(--s2);color:var(--mut);font-size:10px;cursor:pointer;font-family:inherit;';
    gas.style.cssText = tipo === 'gasto'   ? actStyle : idlStyle;
    ing.style.cssText = tipo === 'ingreso' ? actStyle : idlStyle;
  }
  buildDoughnutChart(allMovements);
}

function buildDoughnutChart(movements) {
  const donAreas = document.getElementById('don-areas');
  donAreas.innerHTML = '';
  destroyChart('chart-don-main');

  const filtered = movements.filter(m => m.type === donTab);

  if (!filtered.length) {
    const label = donTab === 'gasto' ? 'gastos' : 'ingresos';
    donAreas.innerHTML = `<div style="color:var(--mut);font-size:12px;text-align:center;padding:16px">Sin ${label} registrados aún.</div>`;
    return;
  }

  // Agrupar por categoría — incluye categorías nuevas que el usuario haya creado
  const bycat = {};
  filtered.forEach(m => {
    const cat = m.category || 'Sin categoría';
    bycat[cat] = (bycat[cat] || 0) + Number(m.amount);
  });

  const labels = Object.keys(bycat).sort((a,b) => bycat[b] - bycat[a]); // mayor a menor
  const values = labels.map(l => bycat[l]);
  const total  = values.reduce((a,b) => a+b, 0);

  // Paleta: gastos en rojos/cálidos, ingresos en verdes/fríos
  const PAL_GAS = ['#E05555','#C9A84C','#FF6B6B','#F472B6','#F97316','#EAB308','#DC2626','#EA580C'];
  const PAL_ING = ['#4ECDC4','#34D399','#60A5FA','#A78BFA','#06B6D4','#10B981','#3B82F6','#8B5CF6'];
  const PAL = donTab === 'gasto' ? PAL_GAS : PAL_ING;

  const wrap = document.createElement('div');
  wrap.className = 'dw';
  donAreas.appendChild(wrap);

  const canvas = document.createElement('canvas');
  canvas.id = 'chart-don-main';
  canvas.style.cssText = 'width:100%;max-height:130px';
  wrap.appendChild(canvas);

  chartInstances['chart-don-main'] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map((_,i) => PAL[i % PAL.length]),
        borderWidth: 1,
        borderColor: '#0d0d0d'
      }]
    },
    options: {
      responsive: true, cutout: '62%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx =>
          ' $' + ctx.parsed.toLocaleString('es-CO') +
          ' (' + ((ctx.parsed / total) * 100).toFixed(1) + '%)'
        }}
      }
    }
  });

  // Leyenda
  const leg = document.createElement('div');
  leg.className = 'dleg';
  labels.forEach((l, i) => {
    const pct = ((bycat[l] / total) * 100).toFixed(1);
    leg.innerHTML += `<div class="dl">
      <div class="dd" style="background:${PAL[i % PAL.length]}"></div>
      <span style="flex:1">${l}</span>
      <span class="dp">$${bycat[l].toLocaleString('es-CO')}</span>
      <span class="dp" style="margin-left:4px">${pct}%</span>
    </div>`;
  });
  wrap.appendChild(leg);
}


/* ── CAMBIAR CONTRASEÑA (desde Mi Cuenta) ──────────────── */
function openChangePass() {
  closeAccount();
  document.getElementById('cp-current').value = '';
  document.getElementById('cp-new').value     = '';
  document.getElementById('cp-new2').value    = '';
  document.getElementById('cp-msg').textContent = '';
  document.getElementById('cp-msg').style.color = '';
  document.getElementById('chpass-modal').style.display = 'flex';
}

function closeChangePass() {
  document.getElementById('chpass-modal').style.display = 'none';
}

async function doChangePass() {
  const current = document.getElementById('cp-current').value;
  const npass   = document.getElementById('cp-new').value;
  const npass2  = document.getElementById('cp-new2').value;
  const msg     = document.getElementById('cp-msg');
  const btn     = document.getElementById('cp-btn');

  const showMsg = (txt, ok) => {
    msg.textContent = (ok ? '✓ ' : '⚠ ') + txt;
    msg.style.color = ok ? '#4ECDC4' : '#E05555';
  };

  if (!current || !npass || !npass2) return showMsg('Completa todos los campos.', false);
  if (npass !== npass2)              return showMsg('Las contraseñas nuevas no coinciden.', false);
  if (npass.length < 8)              return showMsg('Mínimo 8 caracteres.', false);
  if (!/[A-Z]/.test(npass))         return showMsg('Necesita al menos una mayúscula.', false);
  if (!/[0-9]/.test(npass))         return showMsg('Necesita al menos un número.', false);

  btn.disabled = true;
  btn.textContent = 'Guardando…';

  try {
    // Verificar contraseña actual haciendo login
    const resLogin = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentUser.email, password: current })
    });

    if (!resLogin.ok) {
      showMsg('Contraseña actual incorrecta.', false);
      return;
    }

    // Generar token y resetear contraseña
    const resForgot = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentUser.email })
    });

    // Como estamos autenticados y ya validamos la contraseña actual,
    // usamos el endpoint interno de reset directo
    const resReset = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:        currentUser.email,
        old_password: current,
        new_password: npass
      })
    });

    const data = await resReset.json();

    if (resReset.ok) {
      showMsg('¡Contraseña actualizada correctamente!', true);
      setTimeout(() => closeChangePass(), 1800);
    } else {
      showMsg(data.detail || 'Error al cambiar contraseña.', false);
    }
  } catch (e) {
    showMsg('Error de conexión.', false);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar';
  }
}

/* ══════════════════════════════════════════════════════════
   INIT — se ejecuta cuando el DOM está listo
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {

  /* Verificar sesión */
  const token = localStorage.getItem('wbills_token');
  if (!token) { window.location.replace('/'); return; }

  currentUser = JSON.parse(localStorage.getItem('wbills_user') || '{}');
  if (!currentUser?.email) { window.location.replace('/'); return; }

  /* Cargar categorías guardadas */
  loadData();

  /* Mes actual */
  const now = new Date();
  document.getElementById('month-label').textContent =
    MESES[now.getMonth()] + ' ' + now.getFullYear();

  /* Fecha por defecto en formulario */
  document.getElementById('f-fecha').value = now.toISOString().split('T')[0];

  /* Datos de perfil */
  const n = currentUser.name.split(' ')[0];
  document.getElementById('wname').textContent    = n;
  document.getElementById('topuser').textContent  = 'Hola, ' + n;
  document.getElementById('topav').textContent    = n.substring(0,2).toUpperCase();
  document.getElementById('pd-name').textContent  = currentUser.name;
  document.getElementById('pd-email').textContent = currentUser.email;
  document.getElementById('ac-name').textContent  = currentUser.name;
  document.getElementById('ac-email').textContent = currentUser.email;

  /* Cerrar dropdown al clic fuera */
  document.addEventListener('click', e => {
    const wrap = document.getElementById('prof-dropdown');
    if (wrap && !e.target.closest('.prof-wrap')) wrap.classList.remove('open');
  });

  /* Cargar movimientos y renderizar todo */
  await loadMovementsUI();
});
