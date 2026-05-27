document.addEventListener('DOMContentLoaded', async () => {

  /* 🔐 PROTECCIÓN */
  const token = localStorage.getItem('wbills_token');
  if (!token) {
    window.location.href = '/';
    return;
  }

  /* 👤 USER */
  const user = JSON.parse(localStorage.getItem('wbills_user') || '{}');
  const email = user?.email;

  if (!email) {
    window.location.href = '/';
    return;
  }

  if (user?.name) {
    const n = user.name.split(' ')[0];
    document.getElementById('wname').textContent = n;
    document.getElementById('topuser').textContent = 'Hola, ' + n;
    document.getElementById('topav').textContent = n.substring(0, 2).toUpperCase();
  }

  /* 📦 CATEGORÍAS */
  const CATS = [
    { n: 'Alimentación', e: '🍔' },
    { n: 'Transporte', e: '🚌' },
    { n: 'Ocio', e: '🎬' },
    { n: 'Salud', e: '🏥' },
    { n: 'Educación', e: '📚' },
    { n: 'Salario', e: '💼' }
  ];

  let uCats = [...CATS];
  let selCat = null;
  let tipo = null;

  /* 💾 STORAGE (categorías) */
  function saveData() {
    localStorage.setItem('wbills_data', JSON.stringify({ uCats }));
  }

  function loadData() {
    const d = JSON.parse(localStorage.getItem('wbills_data') || '{}');
    if (d.uCats) uCats = d.uCats;
  }

  loadData();

  /* 📅 FECHA */
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('f-fecha').value = today;

  /* 📊 KPIs */
  function upKPIs(ingresos, gastos) {
    document.getElementById('king').textContent =
      '$' + ingresos.toLocaleString('es-CO');

    document.getElementById('kgas').textContent =
      '$' + gastos.toLocaleString('es-CO');

    document.getElementById('kbal').textContent =
      '$' + (ingresos - gastos).toLocaleString('es-CO');
  }

  /* 📊 CALCULAR KPIs */
  function calcKPIs(movements) {
    let ingresos = 0;
    let gastos = 0;

    movements.forEach(m => {
      if (m.type === 'ingreso') ingresos += m.amount;
      else gastos += m.amount;
    });

    return { ingresos, gastos };
  }

  /* 📡 LOAD MOVEMENTS */
  async function loadMovements(email) {
    try {
      const res = await fetch(`/api/movements/${email}`);
      if (!res.ok) throw new Error('Error API movimientos');

      return await res.json();
    } catch (err) {
      console.error('Error cargando movimientos:', err);
      return [];
    }
  }

  /* 📊 INIT DATA */
  const movements = await loadMovements(email);
  const init = calcKPIs(movements);
  upKPIs(init.ingresos, init.gastos);

  /* 🧠 UI */
  function selectTipo(t) {
    tipo = t;

    document.getElementById('btn-ing').className =
      'abtn' + (t === 'ingreso' ? ' active-sel' : '');

    document.getElementById('btn-gas').className =
      'abtn' + (t === 'gasto' ? ' active-sel' : '');

    document.getElementById('form-ttl').textContent =
      t === 'ingreso'
        ? '↑ Registrar Ingreso'
        : '↓ Registrar Gasto';

    document.getElementById('mov-form').classList.add('open');
    document.getElementById('af').className = 'af';
  }

  function fmtMonto(inp) {
    let v = inp.value.replace(/\D/g, '');
    inp.value = v ? '$' + parseInt(v).toLocaleString('es-CO') : '';
  }

  /* 📂 CATEGORÍAS */
  function buildCatSel() {
    const c = document.getElementById('cat-sel');
    c.innerHTML = '';

    uCats.forEach((cat, i) => {
      const d = document.createElement('div');
      d.className = 'cs' + (selCat === i ? ' sel' : '');

      d.innerHTML = `
        <div class="cs-ico">${cat.e}</div>
        <div style="font-size:10px">${cat.n}</div>
      `;

      d.onclick = () => {
        selCat = i;
        buildCatSel();
        document.getElementById('nc-form').classList.remove('open');
      };

      c.appendChild(d);
    });
  }

  buildCatSel();

  function addCat() {
    const n = document.getElementById('nc-name').value.trim();
    const e = document.getElementById('nc-emoji').value.trim() || '🏷️';

    if (!n) return;

    uCats.push({ n, e });
    selCat = uCats.length - 1;

    document.getElementById('nc-name').value = '';
    document.getElementById('nc-emoji').value = '';

    buildCatSel();
    saveData();
  }

  /* 💾 GUARDAR */
  async function guardar() {
    const raw = document
      .getElementById('f-monto')
      .value
      .replace(/\D/g, '');

    const desc = document
      .getElementById('f-desc')
      .value
      .trim();

    const fecha = document
      .getElementById('f-fecha')
      .value;

    const af = document.getElementById('af');

    if (!tipo) {
      af.textContent = '⚠ Selecciona tipo.';
      af.className = 'af err';
      return;
    }

    if (selCat === null) {
      af.textContent = '⚠ Selecciona categoría.';
      af.className = 'af err';
      return;
    }

    if (!raw) {
      af.textContent = '⚠ Ingresa monto.';
      af.className = 'af err';
      return;
    }

    const cat = uCats[selCat];

    const payload = {
      type: tipo,
      amount: parseFloat(raw),
      category: cat.n,
      description: desc,
      user_email: email,
      date: fecha
    };

    try {
      const endpoint =
        tipo === 'ingreso'
          ? '/api/income'
          : '/api/expense';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        af.textContent = '⚠ ' + (data.detail || 'Error al guardar');
        af.className = 'af err';
        return;
      }

      af.textContent = '✓ Guardado correctamente';
      af.className = 'af ok';

      document.getElementById('f-monto').value = '';
      document.getElementById('f-desc').value = '';
      selCat = null;

      buildCatSel();

      /* 🔄 REFRESH KPIs */
      const movements = await loadMovements(email);
      const calc = calcKPIs(movements);
      upKPIs(calc.ingresos, calc.gastos);

    } catch (e) {
      console.error(e);
      af.textContent = '⚠ Error de conexión';
      af.className = 'af err';
    }
  }

  /* 📊 CHART CHECK */
  if (typeof Chart !== 'undefined') {
    console.log('Chart.js OK');
  }

  /* 🌍 GLOBAL */
  window.selectTipo = selectTipo;
  window.guardar = guardar;
  window.addCat = addCat;
  window.fmtMonto = fmtMonto;

});