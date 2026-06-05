/* ─────────────────────────────────────────────────────────────
   login.js  —  W Wheels / WBill$
───────────────────────────────────────────────────────────── */

// Limpiar sesión al llegar al login
localStorage.removeItem('wbills_token');
localStorage.removeItem('wbills_user');

// Re-habilitar botones por si quedaron bloqueados (ej: back del navegador)
window.addEventListener('pageshow', function() {
  const btnLogin = document.getElementById('btn-login');
  const btnReg   = document.getElementById('btn-reg');
  if (btnLogin) {
    btnLogin.disabled = false;
    document.getElementById('login-spin').style.display = 'none';
    document.getElementById('login-txt').style.display  = 'inline';
  }
  if (btnReg) {
    btnReg.disabled = false;
    document.getElementById('reg-spin').style.display = 'none';
    document.getElementById('reg-txt').style.display  = 'inline';
  }
});

const DEMO = {
  email: 'ejemplo1',
  password: 'ejemplo1',
  name: 'Usuario Demo'
};

function goDemo() {
  localStorage.setItem('wbills_token', 'demo-token-wbills');
  localStorage.setItem('wbills_user', JSON.stringify({
    name: DEMO.name,
    email: DEMO.email
  }));
  window.location.href = '/dashboard';
}

function switchTab(t) {
  document.querySelectorAll('.tab').forEach((el, i) =>
    el.classList.toggle(
      'active',
      (t === 'login' && i === 0) || (t === 'registro' && i === 1)
    )
  );
  document.getElementById('form-login').style.display =
    t === 'login' ? 'flex' : 'none';
  document.getElementById('form-registro').style.display =
    t === 'registro' ? 'flex' : 'none';
  hideAlert();
}

function showAlert(m, t = 'err') {
  const el = document.getElementById('alert');
  el.textContent = (t === 'err' ? '⚠ ' : '✓ ') + m;
  el.className = 'alert show ' + t;
}

function hideAlert() {
  document.getElementById('alert').className = 'alert';
}

function setLoad(btnId, spinId, txtId, loading) {
  const btn  = document.getElementById(btnId);
  const spin = document.getElementById(spinId);
  const txt  = document.getElementById(txtId);
  if (btn)  btn.disabled            = loading;
  if (spin) spin.style.display      = loading ? 'block' : 'none';
  if (txt)  txt.style.display       = loading ? 'none'  : 'inline';
}

/* ── LOGIN ───────────────────────────────────────────────── */

async function doLogin() {
  const emailEl = document.getElementById('l-email');
  const passEl  = document.getElementById('l-pass');
  const email   = emailEl.value.trim();
  const pass    = passEl.value;

  if (!email || !pass) return showAlert('Por favor completa todos los campos.');

  hideAlert();
  setLoad('btn-login', 'login-spin', 'login-txt', true);

  try {
    const res  = await fetch('/api/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password: pass })
    });
    const data = await res.json();

    if (res.ok) {
      emailEl.value = '';
      passEl.value  = '';
      localStorage.setItem('wbills_token', data.access_token);
      localStorage.setItem('wbills_user',  JSON.stringify(data.user));
      showAlert('Bienvenido, ' + data.user.name + '!', 'ok');
      setTimeout(() => { window.location.href = '/dashboard'; }, 900);
      return; // no ejecutar el finally-reset todavía
    }

    if      (res.status === 401) showAlert('Contraseña incorrecta.');
    else if (res.status === 404) showAlert('Usuario no encontrado.');
    else if (res.status === 400) showAlert(data.detail);
    else                         showAlert('Error inesperado.');

  } catch (e) {
    console.error(e);
    showAlert('Error de conexión con el servidor.');
  } finally {
    setLoad('btn-login', 'login-spin', 'login-txt', false);
  }
}

/* ── REGISTRO ────────────────────────────────────────────── */

async function doReg() {
  const name  = document.getElementById('r-name').value.trim();
  const email = document.getElementById('r-email').value.trim();
  const pass  = document.getElementById('r-pass').value;
  const pass2 = document.getElementById('r-pass2').value;

  if (!name || !email || !pass || !pass2)
    return showAlert('Por favor completa todos los campos.');
  if (pass !== pass2)
    return showAlert('Las contraseñas no coinciden.');

  hideAlert();
  setLoad('btn-reg', 'reg-spin', 'reg-txt', true);

  try {
    const res  = await fetch('/api/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password: pass })
    });
    const data = await res.json();

    if (res.ok) {
      showAlert('Cuenta creada correctamente.', 'ok');
      setTimeout(() => { switchTab('login'); hideAlert(); }, 1400);
    } else if (res.status === 409) {
      showAlert('El correo ya está registrado.');
    } else if (res.status === 400) {
      showAlert(data.detail);
    } else {
      showAlert('No se pudo crear la cuenta.');
    }
  } catch (e) {
    console.error(e);
    showAlert('No se pudo conectar con el servidor.');
  } finally {
    setLoad('btn-reg', 'reg-spin', 'reg-txt', false);
  }
}

/* ── RECUPERAR CONTRASEÑA ────────────────────────────────── */

function openForgot() {
  document.getElementById('forgot-modal').style.display = 'flex';
  document.getElementById('forgot-email').value = '';
  const msg = document.getElementById('forgot-msg');
  msg.textContent = '';
  msg.style.display = 'none';
}

function closeForgot() {
  document.getElementById('forgot-modal').style.display = 'none';
}

async function doForgot() {
  const email = document.getElementById('forgot-email').value.trim();
  const msg   = document.getElementById('forgot-msg');

  if (!email) {
    msg.textContent = '⚠ Ingresa tu correo.';
    msg.style.cssText = 'display:block;color:#E05555;';
    return;
  }

  document.getElementById('forgot-btn').disabled = true;

  try {
    const res  = await fetch('/api/forgot-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email })
    });
    const data = await res.json();

    msg.textContent = '✓ ' + (data.message || 'Revisa tu correo para continuar.');
    msg.style.cssText = 'display:block;color:#4ECDC4;font-size:13px;';
  } catch (e) {
    msg.textContent = '⚠ Error de conexión.';
    msg.style.cssText = 'display:block;color:#E05555;';
  } finally {
    document.getElementById('forgot-btn').disabled = false;
  }
}

/* ── PASSWORD STRENGTH ───────────────────────────────────── */

function checkStr(val) {
  const sw = document.getElementById('sw');
  sw.classList.toggle('show', val.length > 0);

  let sc = 0;
  if (val.length >= 8)          sc++;
  if (/[A-Z]/.test(val))        sc++;
  if (/[0-9]/.test(val))        sc++;
  if (/[^A-Za-z0-9]/.test(val)) sc++;

  const cols = ['#FF6B6B','#FF6B6B','#C9A84C','#4ECDC4'];
  const lbls = ['Muy débil','Débil','Aceptable','Fuerte'];

  for (let i = 1; i <= 4; i++) {
    document.getElementById('s' + i).style.background =
      i <= sc ? cols[sc - 1] : 'var(--s2)';
  }
  document.getElementById('slbl').textContent =
    val.length > 0 ? lbls[Math.max(0, sc - 1)] : '';
}

/* ── ENTER KEY ───────────────────────────────────────────── */

document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const tab = document.querySelector('.tab.active').textContent;
    if (tab.includes('sesión')) doLogin();
    else doReg();
  }
});
