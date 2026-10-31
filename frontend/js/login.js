const $ = id => document.getElementById(id);

const EYE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.9 17.9A10.4 10.4 0 0 1 12 19C5.5 19 2 12 2 12a18 18 0 0 1 4.1-5.1M9.9 5.2A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2"/><path d="M2 2l20 20"/></svg>';

let lockTimer = null;
let isLocked = false;

// Sirf apni site ke andar wale page par bhejna (open redirect se bachao)
function nextPage() {
  const n = new URLSearchParams(location.search).get('next');
  return n === 'admin.html' ? n : 'admin.html';
}

function showError(msg) {
  const box = $('formError');
  box.textContent = msg;
  box.hidden = !msg;
}

// Seconds ko "15 minutes" jaise lafzon mein badlo (har minute par number badalta hai)
function humanLeft(sec) {
  if (sec <= 60) return 'less than a minute';
  const m = Math.ceil(sec / 60);
  return m + ' minutes';
}

function setFormDisabled(off) {
  ['username', 'password', 'loginBtn', 'showPw'].forEach(id => { $(id).disabled = off; });
  $('loginForm').classList.toggle('is-locked', off);
}

/* ---------- Lock aur live countdown ---------- */
function startLock(seconds) {
  clearInterval(lockTimer);
  isLocked = true;
  showError('');
  setFormDisabled(true);

  const total = seconds;
  const end = Date.now() + seconds * 1000;

  $('lockBox').hidden = false;

  let shown = '';
  const tick = () => {
    const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    const text = humanLeft(left);
    if (text !== shown) {
      $('lockTime').textContent = text;
      shown = text;
    }
    $('lockBar').style.width = (left / total * 100) + '%';
    if (left <= 0) endLock();
  };
  tick();
  lockTimer = setInterval(tick, 1000);
}

function endLock() {
  clearInterval(lockTimer);
  isLocked = false;
  $('lockBox').hidden = true;
  setFormDisabled(false);
  $('password').value = '';
  $('username').focus();
}

async function init() {
  // Pehle se login hai to seedha dashboard
  try {
    const me = await api.me();
    if (me.admin) { location.replace(nextPage()); return; }
  } catch {}

  // Page refresh karne se lock nahi hatta: server se poocho
  try {
    const st = await api.lock();
    if (st.locked) startLock(st.retryAfter);
  } catch {}

  // Eye icon: password dikhao ya chhupao
  $('showPw').addEventListener('click', () => {
    const input = $('password');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    $('showPw').innerHTML = show ? EYE_OFF : EYE;
    $('showPw').setAttribute('aria-pressed', String(show));
    $('showPw').setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    input.focus();
  });

  // Username mein Enter dabane par agle box (password) mein jao
  $('username').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('password').focus();
    }
  });

  $('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    if (isLocked) return;

    const username = $('username').value.trim();
    const password = $('password').value;

    if (!username) {
      showError('Enter your username.');
      $('username').focus();
      return;
    }
    if (!password) {
      showError('Enter your password.');
      $('password').focus();
      return;
    }

    showError('');
    const btn = $('loginBtn');
    btn.classList.add('is-loading');
    btn.disabled = true;
    try {
      await api.login(username, password);
      location.href = nextPage();
    } catch (err) {
      if (err.status === 429) {
        startLock((err.data && err.data.retryAfter) || 900);
      } else {
        let msg = err.message;
        const left = err.data && err.data.attemptsLeft;
        if (typeof left === 'number' && left <= 3) {
          msg += `. ${left} ${left === 1 ? 'attempt' : 'attempts'} left before a temporary lock.`;
        }
        showError(msg);
        $('password').value = '';
        $('password').focus();
      }
    } finally {
      btn.classList.remove('is-loading');
      if (!isLocked) btn.disabled = false;
    }
  });

  if (!isLocked) $('username').focus();
}

document.addEventListener('DOMContentLoaded', init);