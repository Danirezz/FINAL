const DEMO = {
  email: 'ejemplo1',
  password: 'ejemplo1',
  name: 'Usuario Demo'
};

function goDemo() {
  localStorage.setItem('wbills_token', 'demo-token-wbills');

  localStorage.setItem(
    'wbills_user',
    JSON.stringify({
      name: DEMO.name,
      email: DEMO.email
    })
  );

  window.location.href = '/dashboard';
}

function switchTab(t) {

  document
    .querySelectorAll('.tab')
    .forEach((el, i) =>
      el.classList.toggle(
        'active',
        (t === 'login' && i === 0) ||
        (t === 'registro' && i === 1)
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

  el.textContent =
    (t === 'err' ? '⚠ ' : '✓ ') + m;

  el.className = 'alert show ' + t;
}

function hideAlert() {
  document.getElementById('alert').className = 'alert';
}

function setLoad(b, s, t, l) {

  document.getElementById(b).disabled = l;

  document.getElementById(s).style.display =
    l ? 'block' : 'none';

  document.getElementById(t).style.display =
    l ? 'none' : 'inline';
}

/* =========================
   LOGIN
========================= */

async function doLogin() {

  const email =
    document.getElementById('l-email').value.trim();

  const pass =
    document.getElementById('l-pass').value;

  if (!email || !pass) {
    return showAlert(
      'Por favor completa todos los campos.'
    );
  }

  hideAlert();

  setLoad(
    'btn-login',
    'login-spin',
    'login-txt',
    true
  );

  /* DEMO */
  if (
    email === DEMO.email &&
    pass === DEMO.password
  ) {

    localStorage.setItem(
      'wbills_token',
      'demo-token-wbills'
    );

    localStorage.setItem(
      'wbills_user',
      JSON.stringify({
        name: DEMO.name,
        email: DEMO.email
      })
    );

    showAlert(
      'Bienvenido, ' + DEMO.name + '!',
      'ok'
    );

    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 900);

    setLoad(
      'btn-login',
      'login-spin',
      'login-txt',
      false
    );

    return;
  }

  /* API REAL */
  try {

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password: pass
      })
    });

    const data = await res.json();

    console.log(data);

    /* ERROR BACKEND */
    if (data.error) {

      showAlert(data.error);

      setLoad(
        'btn-login',
        'login-spin',
        'login-txt',
        false
      );

      return;
    }

    /* VALIDAR USER */
    if (!data.user) {

      showAlert(
        'Respuesta inválida del servidor.'
      );

      setLoad(
        'btn-login',
        'login-spin',
        'login-txt',
        false
      );

      return;
    }

    /* LOGIN OK */
    localStorage.setItem(
      'wbills_token',
      data.access_token
    );

    localStorage.setItem(
      'wbills_user',
      JSON.stringify(data.user)
    );

    showAlert(
      'Bienvenido, ' + data.user.name + '!',
      'ok'
    );

    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 900);

  } catch (e) {

    console.error(e);

    showAlert(
      'Error de conexión con el servidor.'
    );
  }

  setLoad(
    'btn-login',
    'login-spin',
    'login-txt',
    false
  );
}

/* =========================
   REGISTRO
========================= */

async function doReg() {

  const name =
    document.getElementById('r-name').value.trim();

  const email =
    document.getElementById('r-email').value.trim();

  const pass =
    document.getElementById('r-pass').value;

  const pass2 =
    document.getElementById('r-pass2').value;

  if (!name || !email || !pass || !pass2) {

    return showAlert(
      'Por favor completa todos los campos.'
    );
  }

  if (pass.length < 8) {

    return showAlert(
      'La contraseña debe tener mínimo 8 caracteres.'
    );
  }

  if (pass !== pass2) {

    return showAlert(
      'Las contraseñas no coinciden.'
    );
  }

  hideAlert();

  setLoad(
    'btn-reg',
    'reg-spin',
    'reg-txt',
    true
  );

  try {

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        email,
        password: pass
      })
    });

    const data = await res.json();

    console.log(data);

    /* ERROR BACKEND */
    if (data.error) {

      showAlert(data.error);

      setLoad(
        'btn-reg',
        'reg-spin',
        'reg-txt',
        false
      );

      return;
    }

    /* REGISTRO OK */
    showAlert(
      'Cuenta creada! Inicia sesión ahora.',
      'ok'
    );

    setTimeout(() => {

      switchTab('login');

      hideAlert();

      document.getElementById('l-email').value =
        email;

    }, 1400);

  } catch (e) {

    console.error(e);

    showAlert(
      'No se pudo conectar con el servidor.'
    );
  }

  setLoad(
    'btn-reg',
    'reg-spin',
    'reg-txt',
    false
  );
}

/* =========================
   PASSWORD STRENGTH
========================= */

function checkStr(val) {

  const sw =
    document.getElementById('sw');

  sw.classList.toggle(
    'show',
    val.length > 0
  );

  let sc = 0;

  if (val.length >= 8) sc++;
  if (/[A-Z]/.test(val)) sc++;
  if (/[0-9]/.test(val)) sc++;
  if (/[^A-Za-z0-9]/.test(val)) sc++;

  const cols = [
    '#FF6B6B',
    '#FF6B6B',
    '#C9A84C',
    '#4ECDC4'
  ];

  const lbls = [
    'Muy débil',
    'Débil',
    'Aceptable',
    'Fuerte'
  ];

  for (let i = 1; i <= 4; i++) {

    document.getElementById('s' + i)
      .style.background =
        i <= sc
          ? cols[sc - 1]
          : 'var(--s2)';
  }

  document.getElementById('slbl').textContent =
    val.length > 0
      ? lbls[Math.max(0, sc - 1)]
      : '';
}

/* =========================
   ENTER KEY
========================= */

document.addEventListener('keydown', e => {

  if (e.key === 'Enter') {

    const tab =
      document.querySelector('.tab.active')
      .textContent;

    if (tab.includes('sesión')) {
      doLogin();
    } else {
      doReg();
    }
  }
});