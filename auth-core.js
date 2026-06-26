/**
 * MaintFlow — Auth & multi-tenant data layer (Firebase Edition)
 * Remplace localStorage par Firebase Realtime Database
 */
(function (global) {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Firebase — chargement automatique des SDKs                         */
  /* ------------------------------------------------------------------ */

  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAPLDMt39WS5PxyC-F7LD8CRGcLd1DKHpM",
    authDomain: "maintflow-c84cc.firebaseapp.com",
    databaseURL: "https://maintflow-c84cc-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "maintflow-c84cc",
    storageBucket: "maintflow-c84cc.firebasestorage.app",
    messagingSenderId: "526391421178",
    appId: "1:526391421178:web:f066d3383b5594abcd4143",
  };

  let _db = null;
  let _firebaseReady = false;
  let _firebaseCallbacks = [];

  function onFirebaseReady(cb) {
    if (_firebaseReady) { cb(_db); return; }
    _firebaseCallbacks.push(cb);
  }

  (function loadFirebase() {
    const scripts = [
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js",
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js",
    ];
    let loaded = 0;
    scripts.forEach(function (src) {
      const s = document.createElement("script");
      s.src = src;
      s.onload = function () {
        loaded++;
        if (loaded === scripts.length) {
          firebase.initializeApp(FIREBASE_CONFIG);
          _db = firebase.database();
          _firebaseReady = true;
          _firebaseCallbacks.forEach(function (cb) { cb(_db); });
          _firebaseCallbacks = [];
        }
      };
      document.head.appendChild(s);
    });
  })();

  /* ------------------------------------------------------------------ */
  /* Storage helpers — Firebase + localStorage (cache local)            */
  /* ------------------------------------------------------------------ */

  const _localCache = {};

  function storageGet(key, defaultValue) {
    if (_localCache[key] !== undefined) return _localCache[key];
    try {
      const raw = localStorage.getItem(key);
      const val = raw ? JSON.parse(raw) : defaultValue;
      _localCache[key] = val;
      return val;
    } catch (_) { return defaultValue; }
  }

  function storageSet(key, data) {
    _localCache[key] = data;
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (_) { }
    onFirebaseReady(function (db) {
      const fbKey = key.replace(/\./g, "_");
      db.ref("maintflow/" + fbKey).set(data).catch(function (err) {
        console.warn("[MaintFlowAuth] Firebase write error:", err);
      });
    });
    return true;
  }

  function storageRemove(key) {
    delete _localCache[key];
    try { localStorage.removeItem(key); } catch (_) { }
    onFirebaseReady(function (db) {
      db.ref("maintflow/" + key.replace(/\./g, "_")).remove().catch(function () { });
    });
    return true;
  }

  /* ------------------------------------------------------------------ */
  /* Sync temps réel — appelle onUpdate quand une donnée change         */
  /* ------------------------------------------------------------------ */

  const WATCHED_KEYS = [
    "maintflow.companies",
    "maintflow.users",
    "maintflow.rolePermissions",
    "maintflow.administrationState",
  ];

  function startRealtimeSync(onUpdate) {
    onFirebaseReady(function (db) {
      WATCHED_KEYS.forEach(function (key) {
        db.ref("maintflow/" + key.replace(/\./g, "_")).on("value", function (snapshot) {
          const val = snapshot.val();
          if (val !== null && val !== undefined) {
            _localCache[key] = val;
            try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) { }
            if (typeof onUpdate === "function") onUpdate(key, val);
          }
        });
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Constantes                                                          */
  /* ------------------------------------------------------------------ */

  const AUTH_DATA_VERSION = 1;

  const STORAGE_KEYS = {
    companies: "maintflow.companies",
    users: "maintflow.users",
    session: "maintflow.session",
    rolePermissions: "maintflow.rolePermissions",
    authMeta: "maintflow.authMeta",
    administrationState: "maintflow.administrationState",
    enterpriseProfile: "maintflow.enterpriseProfile",
    connectedUserId: "maintflow.connectedUserId",
  };

  const USER_STATUS = {
    ACTIVE: "Active",
    PENDING: "Pending",
    REJECTED: "Rejected",
  };

  const ROLES = {
    ADMINISTRATOR: "Administrator",
    MAINTENANCE_MANAGER: "Maintenance Manager",
    MAINTENANCE_TECHNICIAN: "Maintenance Technician",
    STOREKEEPER: "Storekeeper",
    PURCHASING_OFFICER: "Purchasing Officer",
    REQUESTER: "Requester",
    VIEWER: "Viewer",
  };

  const ROLE_CATALOG = [
    ROLES.ADMINISTRATOR, ROLES.MAINTENANCE_MANAGER, ROLES.MAINTENANCE_TECHNICIAN,
    ROLES.STOREKEEPER, ROLES.PURCHASING_OFFICER, ROLES.REQUESTER, ROLES.VIEWER,
  ];

  const LEGACY_ROLE_TO_CANONICAL = {
    Admin: ROLES.ADMINISTRATOR, Administrator: ROLES.ADMINISTRATOR,
    "Responsable de maintenance": ROLES.MAINTENANCE_MANAGER,
    Responsable: ROLES.MAINTENANCE_MANAGER,
    "Maintenance Manager": ROLES.MAINTENANCE_MANAGER,
    "Technicien de maintenance": ROLES.MAINTENANCE_TECHNICIAN,
    Technicien: ROLES.MAINTENANCE_TECHNICIAN,
    "Maintenance Technician": ROLES.MAINTENANCE_TECHNICIAN,
    "Gestionnaire de stock": ROLES.STOREKEEPER,
    Magasinier: ROLES.STOREKEEPER, Storekeeper: ROLES.STOREKEEPER,
    Acheteur: ROLES.PURCHASING_OFFICER, "Purchasing Officer": ROLES.PURCHASING_OFFICER,
    Demandeur: ROLES.REQUESTER, Requester: ROLES.REQUESTER,
    Consultant: ROLES.VIEWER, Viewer: ROLES.VIEWER,
  };

  const CANONICAL_TO_LEGACY_ROLE = {
    [ROLES.ADMINISTRATOR]: "Admin",
    [ROLES.MAINTENANCE_MANAGER]: "Responsable de maintenance",
    [ROLES.MAINTENANCE_TECHNICIAN]: "Technicien de maintenance",
    [ROLES.STOREKEEPER]: "Gestionnaire de stock",
    [ROLES.PURCHASING_OFFICER]: "Acheteur",
    [ROLES.REQUESTER]: "Demandeur",
    [ROLES.VIEWER]: "Consultant",
  };

  const PERMISSION_ACTIONS = ["view", "create", "edit", "delete", "validate", "print", "export"];

  const PERMISSION_MODULES = [
    "Dashboard", "Arborescence", "Organisation", "Équipements", "Organes",
    "Articles", "Planification", "Interventions", "Stock", "Achats", "Fournisseurs", "Administration",
  ];

  const PAGE_TO_PERMISSION_MODULE = {
    dashboard: "Dashboard", arborescence: "Arborescence", organisation: "Organisation",
    equipements: "Équipements", organe: "Organes", articles: "Articles",
    planification: "Planification", interventions: "Interventions", stock: "Stock",
    achats: "Achats", fournisseurs: "Fournisseurs", parametres: "Administration",
  };

  const NAV_PAGE_ORDER = [
    "dashboard", "arborescence", "organisation", "equipements", "organe", "articles",
    "planification", "interventions", "stock", "achats", "fournisseurs", "parametres",
  ];

  const ALWAYS_ALLOWED_PAGES = new Set(["profil"]);
  const COMPANY_CODE_PREFIX = "MF-";
  const COMPANY_CODE_LENGTH = 6;
  const COMPANY_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  /* ------------------------------------------------------------------ */
  /* Utils                                                               */
  /* ------------------------------------------------------------------ */

  function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  function normalizeEmail(email) { return String(email || "").trim().toLowerCase(); }
  function buildFullName(fn, ln) { return `${String(fn || "").trim()} ${String(ln || "").trim()}`.trim(); }

  function emptyModulePermissions() {
    const base = {};
    PERMISSION_MODULES.forEach(function (m) {
      base[m] = {};
      PERMISSION_ACTIONS.forEach(function (a) { base[m][a] = false; });
    });
    return base;
  }
  function clonePermissions(s) { return JSON.parse(JSON.stringify(s || {})); }
  function withPrintExport(p) {
    const next = clonePermissions(p);
    PERMISSION_MODULES.forEach(function (m) {
      const row = next[m] || {};
      if (row.print === undefined) row.print = Boolean(row.view);
      if (row.export === undefined) row.export = Boolean(row.view);
      next[m] = row;
    });
    return next;
  }
  function normalizeLegacyStatus(status) {
    const v = String(status || "").trim().toLowerCase();
    if (v === "actif" || v === "active") return USER_STATUS.ACTIVE;
    if (v === "pending" || v === "en attente") return USER_STATUS.PENDING;
    if (v === "rejected" || v === "refusé" || v === "refuse" || v === "suspendu") return USER_STATUS.REJECTED;
    return status || USER_STATUS.PENDING;
  }
  function toLegacyStatus(s) {
    if (s === USER_STATUS.ACTIVE) return "Actif";
    if (s === USER_STATUS.PENDING) return "En attente";
    if (s === USER_STATUS.REJECTED) return "Refusé";
    return s;
  }
  function normalizeRole(role) { if (!role) return null; return LEGACY_ROLE_TO_CANONICAL[role] || role; }
  function toLegacyRole(role) { if (!role) return null; return CANONICAL_TO_LEGACY_ROLE[role] || role; }

  /* ------------------------------------------------------------------ */
  /* Permissions                                                         */
  /* ------------------------------------------------------------------ */

  function buildEmptyPermissions() { return emptyModulePermissions(); }

  function buildBaseOperationalPermissions() {
    const p = buildEmptyPermissions();
    PERMISSION_MODULES.forEach(function (m) {
      const ro = m === "Dashboard" || m === "Arborescence";
      p[m] = {
        view: true, create: !ro, edit: !ro, delete: !ro,
        validate: ["Planification", "Interventions", "Stock", "Achats"].includes(m),
        print: true, export: true
      };
    });
    return p;
  }

  function buildRolePermissionsDefaults() {
    const allTrue = PERMISSION_MODULES.reduce(function (acc, m) {
      acc[m] = {
        view: true, create: true, edit: true, delete: true,
        validate: ["Planification", "Interventions", "Stock", "Achats", "Administration"].includes(m),
        print: true, export: true
      };
      return acc;
    }, {});
    const technician = buildEmptyPermissions();
    PERMISSION_MODULES.forEach(function (m) {
      technician[m] = {
        view: true, create: m === "Interventions" || m === "Organisation",
        edit: m === "Interventions", delete: false, validate: m === "Interventions",
        print: true, export: m === "Interventions" || m === "Organisation"
      };
    });
    const storekeeper = buildEmptyPermissions();
    PERMISSION_MODULES.forEach(function (m) {
      const ok = ["Stock", "Achats", "Administration"].includes(m);
      storekeeper[m] = {
        view: ok, create: m === "Stock", edit: m === "Stock", delete: false,
        validate: m === "Stock" || m === "Achats", print: ok, export: m === "Stock"
      };
    });
    const purchaser = buildEmptyPermissions();
    PERMISSION_MODULES.forEach(function (m) {
      const ok = ["Achats", "Fournisseurs", "Administration"].includes(m);
      purchaser[m] = {
        view: ok, create: m === "Achats" || m === "Fournisseurs",
        edit: m === "Achats" || m === "Fournisseurs", delete: m === "Fournisseurs",
        validate: m === "Achats", print: ok, export: ok
      };
    });
    const requester = buildEmptyPermissions();
    PERMISSION_MODULES.forEach(function (m) {
      const ok = ["Dashboard", "Interventions", "Administration"].includes(m);
      requester[m] = {
        view: ok, create: m === "Interventions", edit: m === "Interventions",
        delete: false, validate: false, print: ok, export: false
      };
    });
    const viewer = buildEmptyPermissions();
    PERMISSION_MODULES.forEach(function (m) {
      viewer[m] = { view: true, create: false, edit: false, delete: false, validate: false, print: true, export: false };
    });
    return {
      [ROLES.ADMINISTRATOR]: allTrue,
      [ROLES.MAINTENANCE_MANAGER]: buildBaseOperationalPermissions(),
      [ROLES.MAINTENANCE_TECHNICIAN]: technician,
      [ROLES.STOREKEEPER]: storekeeper,
      [ROLES.PURCHASING_OFFICER]: purchaser,
      [ROLES.REQUESTER]: requester,
      [ROLES.VIEWER]: viewer,
    };
  }

  function mergeRolePermissions(base, overrides) {
    const next = clonePermissions(base);
    Object.entries(overrides || {}).forEach(function ([role, mods]) {
      const c = normalizeRole(role) || role;
      if (!next[c]) next[c] = {};
      Object.entries(mods || {}).forEach(function ([m, actions]) {
        next[c][m] = { ...(next[c][m] || {}), ...(actions || {}) };
      });
    });
    return next;
  }

  function getRolePermissionsStore() {
    const d = buildRolePermissionsDefaults();
    const s = storageGet(STORAGE_KEYS.rolePermissions, null);
    if (!s || typeof s !== "object") return d;
    return mergeRolePermissions(d, s);
  }
  function saveRolePermissionsStore(p) { storageSet(STORAGE_KEYS.rolePermissions, p); }
  function getRolePermissions(role) {
    const c = normalizeRole(role) || role;
    return withPrintExport(getRolePermissionsStore()[c] || buildEmptyPermissions());
  }
  function hasPermission(role, module, action) { return Boolean(getRolePermissions(role)[module]?.[action]); }
  function getPermissionModuleForPage(pageKey) { return PAGE_TO_PERMISSION_MODULE[pageKey] || null; }
  function getSessionPermissions() {
    const s = getSession();
    if (s?.permissions && Object.keys(s.permissions).length) return s.permissions;
    if (s?.role) return getRolePermissions(s.role);
    return {};
  }
  function canViewPage(pageKey) {
    if (ALWAYS_ALLOWED_PAGES.has(pageKey)) return true;
    const s = getSession(); if (!s?.role) return false;
    const m = getPermissionModuleForPage(pageKey); if (!m) return true;
    return Boolean(getSessionPermissions()[m]?.view);
  }
  function canPerformAction(pageKey, action) {
    if (ALWAYS_ALLOWED_PAGES.has(pageKey)) return true;
    const s = getSession(); if (!s?.role) return false;
    const m = getPermissionModuleForPage(pageKey); if (!m) return false;
    return Boolean(getSessionPermissions()[m]?.[action]);
  }
  function getFirstAllowedPageKey() {
    return NAV_PAGE_ORDER.find(function (p) { return canViewPage(p); }) || null;
  }

  /* ------------------------------------------------------------------ */
  /* Company                                                             */
  /* ------------------------------------------------------------------ */

  function generateCompanyCodeSegment(len) {
    let s = "";
    for (let i = 0; i < len; i++) s += COMPANY_CODE_ALPHABET[Math.floor(Math.random() * COMPANY_CODE_ALPHABET.length)];
    return s;
  }
  function generateCompanyCode() {
    let code = "", attempts = 0;
    do { code = `${COMPANY_CODE_PREFIX}${generateCompanyCodeSegment(COMPANY_CODE_LENGTH)}`; attempts++; }
    while (companyCodeExists(code) && attempts < 50);
    return code;
  }
  function createCompany(input) {
    const now = new Date().toISOString();
    return {
      id: input.id || generateId("co"), companyCode: input.companyCode || generateCompanyCode(),
      companyName: String(input.companyName || "").trim(), activity: String(input.activity || "").trim(),
      country: String(input.country || input.wilaya || "").trim(),
      city: String(input.city || input.commune || "").trim(),
      address: String(input.address || "").trim(), phone: String(input.phone || "").trim(),
      logo: input.logo || "", createdAt: input.createdAt || now,
      wilaya: String(input.wilaya || input.country || "").trim(), daira: String(input.daira || "").trim(),
      commune: String(input.commune || input.city || "").trim(), website: String(input.website || "").trim(),
    };
  }
  function getCompanies() { const l = storageGet(STORAGE_KEYS.companies, []); return Array.isArray(l) ? l : []; }
  function saveCompanies(c) { storageSet(STORAGE_KEYS.companies, c); }
  function getCompanyById(id) { return getCompanies().find(function (c) { return c.id === id; }) || null; }
  function getCompanyByCode(code) {
    const c = String(code || "").trim().toUpperCase();
    return getCompanies().find(function (co) { return String(co.companyCode || "").trim().toUpperCase() === c; }) || null;
  }
  function companyCodeExists(code) { return Boolean(getCompanyByCode(code)); }
  function addCompany(input) {
    const companies = getCompanies(), company = createCompany(input);
    if (companyCodeExists(company.companyCode)) throw new Error("DUPLICATE_COMPANY_CODE");
    companies.push(company); saveCompanies(companies); return company;
  }
  function updateCompany(id, patch) {
    const companies = getCompanies(), idx = companies.findIndex(function (c) { return c.id === id; });
    if (idx === -1) return null;
    companies[idx] = { ...companies[idx], ...patch, id: companies[idx].id, companyCode: companies[idx].companyCode };
    saveCompanies(companies); return companies[idx];
  }

  /* ------------------------------------------------------------------ */
  /* User                                                                */
  /* ------------------------------------------------------------------ */

  function createUser(input) {
    const now = new Date().toISOString();
    const fn = String(input.firstName || "").trim(), ln = String(input.lastName || "").trim();
    return {
      id: input.id || generateId("usr"), companyId: input.companyId || "",
      firstName: fn, lastName: ln, fullName: input.fullName || buildFullName(fn, ln),
      email: normalizeEmail(input.email), passwordHash: input.passwordHash || "", passwordSalt: input.passwordSalt || "",
      role: input.role ? normalizeRole(input.role) : null,
      status: normalizeLegacyStatus(input.status || USER_STATUS.PENDING),
      avatar: input.avatar || input.photo || "", createdAt: input.createdAt || now, lastLogin: input.lastLogin || null,
      username: input.username || "", code: input.code || "", functionTitle: input.functionTitle || "",
      phone: input.phone || "", unit: input.unit || "", division: input.division || "", department: input.department || "",
      language: input.language || "fr", timezone: input.timezone || "Africa/Algiers",
      companyCode: input.companyCode || "", photo: input.avatar || input.photo || "", active: input.active !== false,
    };
  }
  function getUsers() { const l = storageGet(STORAGE_KEYS.users, []); return Array.isArray(l) ? l : []; }
  function saveUsers(u) { storageSet(STORAGE_KEYS.users, u); }
  function getUserById(id) { return getUsers().find(function (u) { return u.id === id; }) || null; }
  function getUserByEmail(email) {
    const n = normalizeEmail(email);
    return getUsers().find(function (u) { return u.email === n; }) || null;
  }
  function emailExists(email, excludeId) {
    const n = normalizeEmail(email);
    return getUsers().some(function (u) { return u.email === n && u.id !== excludeId; });
  }
  function getUsersByCompany(cid) { return getUsers().filter(function (u) { return u.companyId === cid; }); }
  function getPendingUsers(cid) {
    return getUsers().filter(function (u) {
      return u.status === USER_STATUS.PENDING && (!cid || u.companyId === cid);
    });
  }
  function addUser(input) {
    const users = getUsers();
    if (emailExists(input.email)) throw new Error("DUPLICATE_EMAIL");
    const user = createUser(input); users.push(user); saveUsers(users); return user;
  }
  function updateUser(userId, patch) {
    const users = getUsers(), idx = users.findIndex(function (u) { return u.id === userId; });
    if (idx === -1) return null;
    if (patch.email && emailExists(patch.email, userId)) throw new Error("DUPLICATE_EMAIL");
    const cur = users[idx];
    const fn = patch.firstName !== undefined ? patch.firstName : cur.firstName;
    const ln = patch.lastName !== undefined ? patch.lastName : cur.lastName;
    users[idx] = createUser({
      ...cur, ...patch, id: cur.id,
      companyId: patch.companyId !== undefined ? patch.companyId : cur.companyId,
      firstName: fn, lastName: ln, fullName: buildFullName(fn, ln),
      email: patch.email !== undefined ? patch.email : cur.email,
      passwordHash: patch.passwordHash !== undefined ? patch.passwordHash : cur.passwordHash,
      passwordSalt: patch.passwordSalt !== undefined ? patch.passwordSalt : cur.passwordSalt,
      role: patch.role !== undefined ? (patch.role ? normalizeRole(patch.role) : null) : cur.role,
      status: patch.status !== undefined ? normalizeLegacyStatus(patch.status) : cur.status,
      createdAt: cur.createdAt,
    });
    saveUsers(users); return users[idx];
  }
  function deleteUser(id) { saveUsers(getUsers().filter(function (u) { return u.id !== id; })); }

  /* ------------------------------------------------------------------ */
  /* Password                                                            */
  /* ------------------------------------------------------------------ */

  function generateSalt() {
    const b = new Uint8Array(16); crypto.getRandomValues(b);
    return Array.from(b).map(function (x) { return x.toString(16).padStart(2, "0"); }).join("");
  }
  async function hashPassword(password, salt) {
    const data = new TextEncoder().encode(`${salt}:${password}`);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }
  async function createPasswordHash(password) {
    const salt = generateSalt(), passwordHash = await hashPassword(password, salt);
    return { passwordHash, passwordSalt: salt };
  }
  async function verifyPassword(password, user) {
    if (!user?.passwordHash || !user?.passwordSalt) return false;
    return (await hashPassword(password, user.passwordSalt)) === user.passwordHash;
  }

  /* ------------------------------------------------------------------ */
  /* Session                                                             */
  /* ------------------------------------------------------------------ */

  function buildSessionPayload(user, options) {
    if (!user) return null;
    const company = getCompanyById(user.companyId);
    return {
      userId: user.id, companyId: user.companyId,
      companyCode: company?.companyCode || user.companyCode || "",
      companyName: company?.companyName || "",
      name: user.fullName || buildFullName(user.firstName, user.lastName),
      email: user.email, role: user.role,
      permissions: user.role ? getRolePermissions(user.role) : {},
      language: options?.language || user.language || "fr",
      theme: options?.theme || "light",
      loginAt: new Date().toISOString(),
    };
  }
  function getSession() {
    const s = storageGet(STORAGE_KEYS.session, null);
    if (!s || !s.userId) return null;
    const user = getUserById(s.userId);
    if (!user || user.status !== USER_STATUS.ACTIVE) { clearSession(); return null; }
    return { ...s, permissions: user.role ? getRolePermissions(user.role) : s.permissions || {} };
  }
  function saveSession(s) {
    if (!s) { clearSession(); return; }
    storageSet(STORAGE_KEYS.session, s);
    storageSet(STORAGE_KEYS.connectedUserId, s.userId);
  }
  function clearSession() {
    storageRemove(STORAGE_KEYS.session);
    storageRemove(STORAGE_KEYS.connectedUserId);
  }
  function isSessionValid() { return Boolean(getSession()); }
  async function createSessionForUser(user, options) {
    const payload = buildSessionPayload(user, options);
    saveSession(payload);
    updateUser(user.id, { lastLogin: new Date().toISOString() });
    syncUsersToAdministrationState();
    return payload;
  }
  function requireAuthForApp() {
    if (!isSessionValid()) { if (typeof window !== "undefined") window.location.replace("login.html"); return false; }
    return true;
  }
  function redirectIfAuthenticated() {
    if (isSessionValid()) { if (typeof window !== "undefined") window.location.replace("index.html"); return true; }
    return false;
  }
  function performLogout() {
    const s = getSession();
    if (s) appendAuditLog({
      action: "Déconnexion", module: "Authentification",
      user: s.name || s.email, userId: s.userId, companyId: s.companyId,
      detail: "Déconnexion depuis le tableau de bord."
    });
    clearSession();
    if (typeof window !== "undefined") window.location.href = "login.html";
  }

  /* ------------------------------------------------------------------ */
  /* Audit log                                                           */
  /* ------------------------------------------------------------------ */

  function createAuditEntry(input) {
    const s = getSession(), company = getCompanyById(input.companyId || s?.companyId), now = new Date();
    return {
      id: input.id || generateId("log"), userId: input.userId || s?.userId || "",
      user: input.user || s?.name || s?.email || "Système",
      companyId: input.companyId || s?.companyId || "", company: input.company || company?.companyName || "",
      date: input.date || now.toISOString(), time: input.time || now.toLocaleTimeString("fr-FR"),
      module: input.module || "Système", action: input.action || "Action",
      record: input.record || "", detail: input.detail || "", before: input.before || "", after: input.after || "",
    };
  }
  function appendAuditLog(entry) {
    let adminState = storageGet(STORAGE_KEYS.administrationState, null);
    if (!adminState || typeof adminState !== 'object') {
        adminState = { users: [], settings: {}, logs: [] };
    }
    if (!Array.isArray(adminState.logs)) adminState.logs = [];
    const log = createAuditEntry(entry);
    adminState.logs = [log, ...adminState.logs];
    storageSet(STORAGE_KEYS.administrationState, adminState);
    return log;
}

  /* ------------------------------------------------------------------ */
  /* Legacy sync                                                         */
  /* ------------------------------------------------------------------ */

  function userToLegacyAdminUser(user) {
    const company = getCompanyById(user.companyId);
    return {
      id: user.id, firstName: user.firstName, lastName: user.lastName,
      username: user.username || user.email.split("@")[0] || user.fullName,
      code: user.code || user.id.split("-").slice(-1)[0].toUpperCase(),
      email: user.email, role: toLegacyRole(user.role) || user.role || "",
      functionTitle: user.functionTitle || toLegacyRole(user.role) || "",
      phone: user.phone || "", unit: user.unit || "", division: user.division || "", department: user.department || "",
      language: user.language || "fr", timezone: user.timezone || "Africa/Algiers",
      status: toLegacyStatus(user.status), companyCode: company?.companyCode || user.companyCode || "",
      photo: user.avatar || user.photo || "", createdAt: user.createdAt, lastLogin: user.lastLogin,
      active: user.status === USER_STATUS.ACTIVE, companyId: user.companyId,
    };
  }
  function syncUsersToAdministrationState() {
    let adminState = storageGet(STORAGE_KEYS.administrationState, null);
    if (!adminState || typeof adminState !== 'object') {
      adminState = { users: [], settings: {}, logs: [] };
    }
    if (!Array.isArray(adminState.users)) adminState.users = [];
    if (!adminState.settings) adminState.settings = {};
    if (!Array.isArray(adminState.logs)) adminState.logs = [];
    adminState.users = getUsers().map(userToLegacyAdminUser);
    storageSet(STORAGE_KEYS.administrationState, adminState);
  }
  function syncCompanyToEnterpriseProfile(company) {
    if (!company) return;
    storageSet(STORAGE_KEYS.enterpriseProfile, {
      name: company.companyName, wilaya: company.wilaya || company.country,
      daira: company.daira || "", commune: company.commune || company.city,
      phone: company.phone, code: company.companyCode, logo: company.logo, companyId: company.id,
    });
    const adminState = storageGet(STORAGE_KEYS.administrationState, { users: [], settings: { companyName: "" }, logs: [] });
    adminState.settings = { ...(adminState.settings || {}), companyName: company.companyName, logo: company.logo || "" };
    storageSet(STORAGE_KEYS.administrationState, adminState);
  }
  function syncRolePermissionsToAdministrationState() {
    const rp = getRolePermissionsStore(), legacyMap = {};
    Object.entries(rp).forEach(function ([cr, modules]) {
      const lr = toLegacyRole(cr);
      legacyMap[lr] = withPrintExport(modules);
      legacyMap[cr] = withPrintExport(modules);
    });
    const adminState = storageGet(STORAGE_KEYS.administrationState, { users: [], settings: {}, logs: [] });
    adminState.settings = {
      ...(adminState.settings || {}),
      rolePermissions: mergeRolePermissions(adminState.settings?.rolePermissions || {}, legacyMap)
    };
    storageSet(STORAGE_KEYS.administrationState, adminState);
  }

  /* ------------------------------------------------------------------ */
  /* Migration                                                           */
  /* ------------------------------------------------------------------ */

  function migrateLegacyEnterpriseProfile() {
    const companies = getCompanies(); if (companies.length) return companies;
    const profile = storageGet(STORAGE_KEYS.enterpriseProfile, null);
    if (!profile || (!profile.name && !profile.code)) return companies;
    const company = addCompany({
      companyName: profile.name || "MaintFlow Industrie", country: profile.wilaya || "",
      city: profile.commune || "", wilaya: profile.wilaya || "", daira: profile.daira || "",
      commune: profile.commune || "", address: profile.address || "", phone: profile.phone || "",
      logo: profile.logo || "", companyCode: profile.code || generateCompanyCode(),
    });
    syncCompanyToEnterpriseProfile(company);
    return getCompanies();
  }
  function migrateLegacyAdministrationUsers(defaultCompanyId) {
    const existing = getUsers(); if (existing.length) return existing;
    const adminState = storageGet(STORAGE_KEYS.administrationState, null);
    const legacyUsers = Array.isArray(adminState?.users) ? adminState.users : [];
    if (!legacyUsers.length) return existing;
    const company = getCompanyById(defaultCompanyId) || getCompanies()[0] || null;
    legacyUsers.forEach(function (lu) {
      try {
        addUser({
          id: lu.id, companyId: lu.companyId || company?.id || "",
          firstName: lu.firstName || "", lastName: lu.lastName || "",
          email: lu.email || `${lu.username || lu.id}@local.maintflow`,
          role: normalizeRole(lu.role), status: normalizeLegacyStatus(lu.status),
          avatar: lu.photo || "", username: lu.username || "", code: lu.code || "",
          functionTitle: lu.functionTitle || "", phone: lu.phone || "", unit: lu.unit || "",
          division: lu.division || "", department: lu.department || "",
          language: lu.language || "fr", timezone: lu.timezone || "Africa/Algiers",
          companyCode: lu.companyCode || company?.companyCode || "",
          createdAt: lu.createdAt, lastLogin: lu.lastLogin, active: lu.active !== false,
          passwordHash: lu.passwordHash || "", passwordSalt: lu.passwordSalt || ""
        });
      } catch (_) { }
    });
    return getUsers();
  }
  function migrateLegacyRolePermissions() {
    const adminState = storageGet(STORAGE_KEYS.administrationState, null);
    const lp = adminState?.settings?.rolePermissions;
    if (!lp) { saveRolePermissionsStore(getRolePermissionsStore()); return; }
    const co = {};
    Object.entries(lp).forEach(function ([role, modules]) {
      const c = normalizeRole(role); if (!c) return;
      co[c] = withPrintExport(modules);
    });
    saveRolePermissionsStore(mergeRolePermissions(buildRolePermissionsDefaults(), co));
  }
  function initializeAuthData() {
    const meta = storageGet(STORAGE_KEYS.authMeta, { version: 0 });
    if (meta.version >= AUTH_DATA_VERSION && getCompanies().length) {
      syncUsersToAdministrationState(); syncRolePermissionsToAdministrationState();
      return { migrated: false, companies: getCompanies(), users: getUsers() };
    }
    migrateLegacyEnterpriseProfile();
    const companies = getCompanies(), defaultCompanyId = companies[0]?.id || "";
    migrateLegacyAdministrationUsers(defaultCompanyId);
    migrateLegacyRolePermissions();
    syncUsersToAdministrationState();
    if (companies[0]) syncCompanyToEnterpriseProfile(companies[0]);
    syncRolePermissionsToAdministrationState();
    storageSet(STORAGE_KEYS.authMeta, { version: AUTH_DATA_VERSION, initializedAt: new Date().toISOString() });
    return { migrated: true, companies: getCompanies(), users: getUsers() };
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                          */
  /* ------------------------------------------------------------------ */

  const MaintFlowAuth = {
    VERSION: AUTH_DATA_VERSION, STORAGE_KEYS, USER_STATUS, ROLES, ROLE_CATALOG,
    LEGACY_ROLE_TO_CANONICAL, CANONICAL_TO_LEGACY_ROLE,
    PERMISSION_ACTIONS, PERMISSION_MODULES, PAGE_TO_PERMISSION_MODULE, NAV_PAGE_ORDER,
    getPermissionModuleForPage, getSessionPermissions, canViewPage, canPerformAction, getFirstAllowedPageKey,
    createCompany, getCompanies, saveCompanies, getCompanyById, getCompanyByCode,
    companyCodeExists, generateCompanyCode, addCompany, updateCompany,
    createUser, getUsers, saveUsers, getUserById, getUserByEmail, emailExists,
    getUsersByCompany, getPendingUsers, addUser, updateUser, deleteUser, userToLegacyAdminUser,
    buildRolePermissionsDefaults, getRolePermissionsStore, saveRolePermissionsStore,
    getRolePermissions, hasPermission, mergeRolePermissions, normalizeRole, toLegacyRole,
    normalizeLegacyStatus, toLegacyStatus,
    createPasswordHash, verifyPassword,
    buildSessionPayload, getSession, saveSession, clearSession, isSessionValid,
    createSessionForUser, requireAuthForApp, redirectIfAuthenticated, performLogout,
    createAuditEntry, appendAuditLog,
    initializeAuthData, syncUsersToAdministrationState, syncCompanyToEnterpriseProfile,
    syncRolePermissionsToAdministrationState,
    normalizeEmail, buildFullName, generateId,
    startRealtimeSync, onFirebaseReady,
    // Pont storage — utilisé par script.js via MaintFlowAuth.storage
    storage: {
      getItem(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
      },
      setItem(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { }
        // Sync Firebase en parallèle
        onFirebaseReady(function (db) {
          db.ref("maintflow/" + key.replace(/\./g, "_")).set(
            (() => { try { return JSON.parse(value); } catch (_) { return value; } })()
          ).catch(function () { });
        });
      },
      removeItem(key) {
        try { localStorage.removeItem(key); } catch (e) { }
        onFirebaseReady(function (db) {
          db.ref("maintflow/" + key.replace(/\./g, "_")).remove().catch(function () { });
        });
      }
    },
  };

  global.MaintFlowAuth = MaintFlowAuth;

  if (typeof document !== "undefined") {
    const boot = function () {
      setTimeout(function () {
        try { MaintFlowAuth.initializeAuthData(); } catch (e) {
          console.error("[MaintFlowAuth] Init failed", e);
        }
      }, 800); // attendre que Firebase soit prêt
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else { boot(); }
  }

})(typeof window !== "undefined" ? window : globalThis);