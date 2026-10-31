const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');
const SECRET_FILE = path.join(DATA_DIR, 'secret.key');
const COOKIE = 'cs_session';
const SESSION_MS = 2 * 60 * 60 * 1000; // 2 ghante

// Login ki rok. Test ke liye LOCK_MS ko 3 * 60 * 1000 kar sakte ho, phir wapis 15 * 60 * 1000
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

fs.mkdirSync(DATA_DIR, { recursive: true });

// ---------- secret (session par signature lagane ke liye) ----------
let secret = null;
function getSecret() {
  if (secret) return secret;
  if (process.env.SESSION_SECRET) {
    secret = process.env.SESSION_SECRET;
  } else if (fs.existsSync(SECRET_FILE)) {
    secret = fs.readFileSync(SECRET_FILE, 'utf8').trim();
  } else {
    secret = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(SECRET_FILE, secret);
  }
  return secret;
}

// ---------- password hashing ----------
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return salt + ':' + hash;
}

function verifyPassword(password, stored) {
  if (typeof password !== 'string' || password.length > 200) return false;
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  const real = Buffer.from(hash, 'hex');
  return real.length === test.length && crypto.timingSafeEqual(test, real);
}

function saveAdmin(username, password) {
  fs.writeFileSync(
    ADMIN_FILE,
    JSON.stringify({ username, hash: hashPassword(password) }, null, 2)
  );
}

let envAdmin = null;
function loadAdmin() {
  // Hosting par: username aur password environment variables se aate hain
  if (process.env.ADMIN_USER && process.env.ADMIN_PASS) {
    if (!envAdmin) {
      envAdmin = { username: process.env.ADMIN_USER, hash: hashPassword(process.env.ADMIN_PASS) };
    }
    return envAdmin;
  }
  if (!fs.existsSync(ADMIN_FILE)) return null;
  try { return JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8')); } catch { return null; }
}

// ---------- session token ----------
function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  return body + '.' + sig;
}

function verifyToken(token) {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!p.exp || p.exp < Date.now()) return null;
    return p;
  } catch { return null; }
}

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

function currentAdmin(req) {
  return verifyToken(readCookie(req, COOKIE));
}

// ---------- login rate limit (lock + countdown) ----------
const attempts = new Map(); // ip -> { count, first, lockedUntil }

function lockSeconds(ip) {
  const a = attempts.get(ip);
  if (!a) return 0;
  const now = Date.now();
  if (a.lockedUntil) {
    if (a.lockedUntil > now) return Math.ceil((a.lockedUntil - now) / 1000);
    attempts.delete(ip);
    return 0;
  }
  if (now - a.first > LOCK_MS) attempts.delete(ip);
  return 0;
}

function recordFail(ip) {
  const a = attempts.get(ip) || { count: 0, first: Date.now(), lockedUntil: 0 };
  a.count++;
  if (a.count >= MAX_ATTEMPTS) a.lockedUntil = Date.now() + LOCK_MS;
  attempts.set(ip, a);
  return Math.max(0, MAX_ATTEMPTS - a.count);
}

function sendLocked(res, seconds) {
  res.setHeader('Retry-After', String(seconds));
  return res.status(429).json({
    error: 'Too many failed attempts',
    retryAfter: seconds,
  });
}

// ---------- express handlers ----------
function login(req, res) {
  const ip = req.ip;

  const wait = lockSeconds(ip);
  if (wait > 0) return sendLocked(res, wait);

  const admin = loadAdmin();
  if (!admin) return res.status(503).json({ error: 'Admin account is not set up yet' });

  const { username, password } = req.body || {};
  const okUser = typeof username === 'string' && username === admin.username;
  const okPass = verifyPassword(password, admin.hash);
  if (!(okUser && okPass)) {
    const left = recordFail(ip);
    if (left === 0) return sendLocked(res, Math.ceil(LOCK_MS / 1000));
    return res.status(401).json({ error: 'Wrong username or password', attemptsLeft: left });
  }

  attempts.delete(ip);
  const token = sign({ u: admin.username, exp: Date.now() + SESSION_MS });
   const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie',
    `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}${secure}`);
  res.json({ ok: true, username: admin.username });
}

function lockStatus(req, res) {
  const wait = lockSeconds(req.ip);
  res.json({ locked: wait > 0, retryAfter: wait });
}

function logout(req, res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
  res.json({ ok: true });
}

function me(req, res) {
  const s = currentAdmin(req);
  res.json(s ? { admin: true, username: s.u } : { admin: false });
}

function requireAdmin(req, res, next) {
  if (!currentAdmin(req)) return res.status(401).json({ error: 'Admin login required' });
  next();
}

// Doosri website se aane wali badalne wali requests block karta hai
function sameOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== req.get('host')) throw new Error('cross');
    } catch {
      return res.status(403).json({ error: 'Cross-site request blocked' });
    }
  }
  next();
}

module.exports = { saveAdmin, login, lockStatus, logout, me, requireAdmin, sameOrigin };