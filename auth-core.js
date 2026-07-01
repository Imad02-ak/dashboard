/**
 * MaintFlow — Auth & multi-tenant data layer (Step 2)
 * Shared between login.html, register.html and index.html / script.js
 */
(function (global) {
  "use strict";

  const AUTH_DATA_VERSION = 1;

  const STORAGE_KEYS = {
    companies: "maintflow.companies",
    users: "maintflow.users",
    session: "maintflow.session",
    rolePermissions: "maintflow.rolePermissions",
    authMeta: "maintflow.authMeta",
    // Legacy keys (read-only migration sources)
    administrationState: "maintflow.administrationState",
    enterpriseProfile: "maintflow.enterpriseProfile",
    connectedUserId: "maintflow.connectedUserId",
  };

  /** @enum {string} */
  const USER_STATUS = {
    ACTIVE: "Active",
    PENDING: "Pending",
    REJECTED: "Rejected",
  };

  /** Canonical role keys (spec) */
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
    ROLES.ADMINISTRATOR,
    ROLES.MAINTENANCE_MANAGER,
    ROLES.MAINTENANCE_TECHNICIAN,
    ROLES.STOREKEEPER,
    ROLES.PURCHASING_OFFICER,
    ROLES.REQUESTER,
    ROLES.VIEWER,
  ];

  /** Maps legacy French role labels used in script.js → canonical keys */
  const LEGACY_ROLE_TO_CANONICAL = {
    Admin: ROLES.ADMINISTRATOR,
    Administrator: ROLES.ADMINISTRATOR,
    "Responsable de maintenance": ROLES.MAINTENANCE_MANAGER,
    Responsable: ROLES.MAINTENANCE_MANAGER,
    "Maintenance Manager": ROLES.MAINTENANCE_MANAGER,
    "Technicien de maintenance": ROLES.MAINTENANCE_TECHNICIAN,
    Technicien: ROLES.MAINTENANCE_TECHNICIAN,
    "Maintenance Technician": ROLES.MAINTENANCE_TECHNICIAN,
    "Gestionnaire de stock": ROLES.STOREKEEPER,
    Magasinier: ROLES.STOREKEEPER,
    Storekeeper: ROLES.STOREKEEPER,
    Acheteur: ROLES.PURCHASING_OFFICER,
    "Purchasing Officer": ROLES.PURCHASING_OFFICER,
    Demandeur: ROLES.REQUESTER,
    Requester: ROLES.REQUESTER,
    Consultant: ROLES.VIEWER,
    Viewer: ROLES.VIEWER,
  };

  /** Maps canonical keys → legacy French labels for script.js compatibility */
  const CANONICAL_TO_LEGACY_ROLE = {
    [ROLES.ADMINISTRATOR]: "Admin",
    [ROLES.MAINTENANCE_MANAGER]: "Responsable de maintenance",
    [ROLES.MAINTENANCE_TECHNICIAN]: "Technicien de maintenance",
    [ROLES.STOREKEEPER]: "Gestionnaire de stock",
    [ROLES.PURCHASING_OFFICER]: "Acheteur",
    [ROLES.REQUESTER]: "Demandeur",
    [ROLES.VIEWER]: "Consultant",
  };

  const PERMISSION_ACTIONS = [
    "view",
    "create",
    "edit",
    "delete",
    "validate",
    "print",
    "export",
  ];

  const PERMISSION_MODULES = [
    "Dashboard",
    "Arborescence",
    "Organisation",
    "Équipements",
    "Organes",
    "Articles",
    "Planification",
    "Interventions",
    "Stock",
    "Achats",
    "Fournisseurs",
    "Administration",
  ];

  /** Maps sidebar page keys (data-page) → permission module names */
  const PAGE_TO_PERMISSION_MODULE = {
    dashboard: "Dashboard",
    arborescence: "Arborescence",
    organisation: "Organisation",
    equipements: "Équipements",
    organe: "Organes",
    articles: "Articles",
    planification: "Planification",
    interventions: "Interventions",
    stock: "Stock",
    achats: "Achats",
    fournisseurs: "Fournisseurs",
    parametres: "Administration",
  };

  const NAV_PAGE_ORDER = [
    "dashboard",
    "arborescence",
    "organisation",
    "equipements",
    "organe",
    "articles",
    "planification",
    "interventions",
    "stock",
    "achats",
    "fournisseurs",
    "parametres",
  ];

  const ALWAYS_ALLOWED_PAGES = new Set(["profil"]);

  const COMPANY_CODE_PREFIX = "MF-";
  const COMPANY_CODE_LENGTH = 6;
  const COMPANY_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  /* ------------------------------------------------------------------ */
  /* Storage helpers                                                     */
  /* ------------------------------------------------------------------ */

  function storageGet(key, defaultValue) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (_error) {
      return defaultValue;
    }
  }

  function storageSet(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (_error) {
      return false;
    }
  }

  function storageRemove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeEmail(email) {
    return String(email || "")
      .trim()
      .toLowerCase();
  }

  function buildFullName(firstName, lastName) {
    return `${String(firstName || "").trim()} ${String(lastName || "").trim()}`.trim();
  }

  function emptyModulePermissions(allFalse) {
    const base = {};
    PERMISSION_MODULES.forEach((moduleName) => {
      base[moduleName] = {};
      PERMISSION_ACTIONS.forEach((action) => {
        base[moduleName][action] = allFalse ? false : false;
      });
    });
    return base;
  }

  function clonePermissions(source) {
    return JSON.parse(JSON.stringify(source || {}));
  }

  function withPrintExport(modulePerms) {
    const next = clonePermissions(modulePerms);
    PERMISSION_MODULES.forEach((moduleName) => {
      const row = next[moduleName] || {};
      if (row.print === undefined) {
        row.print = Boolean(row.view);
      }
      if (row.export === undefined) {
        row.export = Boolean(row.view);
      }
      next[moduleName] = row;
    });
    return next;
  }

  function normalizeLegacyStatus(status) {
    const value = String(status || "").trim();
    const lower = value.toLowerCase();
    if (lower === "actif" || lower === "active") return USER_STATUS.ACTIVE;
    if (lower === "pending" || lower === "en attente") return USER_STATUS.PENDING;
    if (lower === "rejected" || lower === "refusé" || lower === "refuse") {
      return USER_STATUS.REJECTED;
    }
    if (lower === "suspendu" || lower === "suspended") return USER_STATUS.REJECTED;
    return value || USER_STATUS.PENDING;
  }

  function toLegacyStatus(status) {
    if (status === USER_STATUS.ACTIVE) return "Actif";
    if (status === USER_STATUS.PENDING) return "En attente";
    if (status === USER_STATUS.REJECTED) return "Refusé";
    return status;
  }

  function normalizeRole(role) {
    if (!role) return null;
    return LEGACY_ROLE_TO_CANONICAL[role] || role;
  }

  function toLegacyRole(role) {
    if (!role) return null;
    return CANONICAL_TO_LEGACY_ROLE[role] || role;
  }

  /* ------------------------------------------------------------------ */
  /* Permission defaults (spec: 7 roles × 12 modules × 7 actions)       */
  /* ------------------------------------------------------------------ */

  function buildEmptyPermissions() {
    return emptyModulePermissions(true);
  }

  function buildBaseOperationalPermissions() {
    const permissions = buildEmptyPermissions();
    PERMISSION_MODULES.forEach((moduleName) => {
      const isReadOnlyModule =
        moduleName === "Dashboard" || moduleName === "Arborescence";
      permissions[moduleName] = {
        view: true,
        create: !isReadOnlyModule,
        edit: !isReadOnlyModule,
        delete: !isReadOnlyModule,
        validate:
          moduleName === "Planification" ||
          moduleName === "Interventions" ||
          moduleName === "Stock" ||
          moduleName === "Achats",
        print: true,
        export: true,
      };
    });
    return permissions;
  }

  function buildRolePermissionsDefaults() {
    const allTrue = PERMISSION_MODULES.reduce((acc, moduleName) => {
      acc[moduleName] = {
        view: true,
        create: true,
        edit: true,
        delete: true,
        validate:
          moduleName === "Planification" ||
          moduleName === "Interventions" ||
          moduleName === "Stock" ||
          moduleName === "Achats" ||
          moduleName === "Administration",
        print: true,
        export: true,
      };
      return acc;
    }, {});

    const technician = buildEmptyPermissions();
    PERMISSION_MODULES.forEach((moduleName) => {
      technician[moduleName] = {
        view: true,
        create:
          moduleName === "Interventions" || moduleName === "Organisation",
        edit: moduleName === "Interventions",
        delete: false,
        validate: moduleName === "Interventions",
        print: true,
        export: moduleName === "Interventions" || moduleName === "Organisation",
      };
    });

    const storekeeper = buildEmptyPermissions();
    PERMISSION_MODULES.forEach((moduleName) => {
      const allowed =
        moduleName === "Stock" ||
        moduleName === "Achats" ||
        moduleName === "Administration";
      storekeeper[moduleName] = {
        view: allowed,
        create: moduleName === "Stock",
        edit: moduleName === "Stock",
        delete: false,
        validate: moduleName === "Stock" || moduleName === "Achats",
        print: allowed,
        export: moduleName === "Stock",
      };
    });

    const purchaser = buildEmptyPermissions();
    PERMISSION_MODULES.forEach((moduleName) => {
      const allowed =
        moduleName === "Achats" ||
        moduleName === "Fournisseurs" ||
        moduleName === "Administration";
      purchaser[moduleName] = {
        view: allowed,
        create: moduleName === "Achats" || moduleName === "Fournisseurs",
        edit: moduleName === "Achats" || moduleName === "Fournisseurs",
        delete: moduleName === "Fournisseurs",
        validate: moduleName === "Achats",
        print: allowed,
        export: allowed,
      };
    });

    const requester = buildEmptyPermissions();
    PERMISSION_MODULES.forEach((moduleName) => {
      const allowed =
        moduleName === "Dashboard" ||
        moduleName === "Interventions" ||
        moduleName === "Administration";
      requester[moduleName] = {
        view: allowed,
        create: moduleName === "Interventions",
        edit: moduleName === "Interventions",
        delete: false,
        validate: false,
        print: allowed,
        export: false,
      };
    });

    const viewer = buildEmptyPermissions();
    PERMISSION_MODULES.forEach((moduleName) => {
      viewer[moduleName] = {
        view: true,
        create: false,
        edit: false,
        delete: false,
        validate: false,
        print: true,
        export: false,
      };
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

  function mergeRolePermissions(basePermissions, overrides) {
    const next = clonePermissions(basePermissions);
    Object.entries(overrides || {}).forEach(([roleName, moduleMap]) => {
      const canonicalRole = normalizeRole(roleName) || roleName;
      if (!next[canonicalRole]) next[canonicalRole] = {};
      Object.entries(moduleMap || {}).forEach(([moduleName, actions]) => {
        next[canonicalRole][moduleName] = {
          ...(next[canonicalRole][moduleName] || {}),
          ...(actions || {}),
        };
      });
    });
    return next;
  }

  function getRolePermissionsStore() {
    const defaults = buildRolePermissionsDefaults();
    const stored = storageGet(STORAGE_KEYS.rolePermissions, null);
    if (!stored || typeof stored !== "object") {
      return defaults;
    }
    return mergeRolePermissions(defaults, stored);
  }

  function saveRolePermissionsStore(rolePermissions) {
    storageSet(STORAGE_KEYS.rolePermissions, rolePermissions);
  }

  function getRolePermissions(roleName) {
    const canonical = normalizeRole(roleName) || roleName;
    const store = getRolePermissionsStore();
    const permissions = store[canonical] || buildEmptyPermissions();
    return withPrintExport(permissions);
  }

  function hasPermission(roleName, moduleName, action) {
    const permissions = getRolePermissions(roleName);
    return Boolean(permissions[moduleName]?.[action]);
  }

  function getPermissionModuleForPage(pageKey) {
    return PAGE_TO_PERMISSION_MODULE[pageKey] || null;
  }

  function getSessionPermissions() {
    const session = getSession();
    if (session?.permissions && Object.keys(session.permissions).length) {
      return session.permissions;
    }
    if (session?.role) {
      return getRolePermissions(session.role);
    }
    return {};
  }

  function canViewPage(pageKey) {
    if (ALWAYS_ALLOWED_PAGES.has(pageKey)) return true;
    const session = getSession();
    if (!session?.role) return false;

    const moduleName = getPermissionModuleForPage(pageKey);
    if (!moduleName) return true;

    const permissions = getSessionPermissions();
    return Boolean(permissions[moduleName]?.view);
  }

  function canPerformAction(pageKey, action) {
    if (ALWAYS_ALLOWED_PAGES.has(pageKey)) return true;
    const session = getSession();
    if (!session?.role) return false;

    const moduleName = getPermissionModuleForPage(pageKey);
    if (!moduleName) return false;

    const permissions = getSessionPermissions();
    return Boolean(permissions[moduleName]?.[action]);
  }

  function getFirstAllowedPageKey() {
    return NAV_PAGE_ORDER.find((pageKey) => canViewPage(pageKey)) || null;
  }

  /* ------------------------------------------------------------------ */
  /* Company model                                                       */
  /* ------------------------------------------------------------------ */

  function createCompany(input) {
    const now = new Date().toISOString();
    return {
      id: input.id || generateId("co"),
      companyCode: input.companyCode || generateCompanyCode(),
      companyName: String(input.companyName || "").trim(),
      activity: String(input.activity || "").trim(),
      country: String(input.country || input.wilaya || "").trim(),
      city: String(input.city || input.commune || "").trim(),
      address: String(input.address || "").trim(),
      phone: String(input.phone || "").trim(),
      logo: input.logo || "",
      createdAt: input.createdAt || now,
      // Legacy organisation fields preserved for backward compatibility
      wilaya: String(input.wilaya || input.country || "").trim(),
      daira: String(input.daira || "").trim(),
      commune: String(input.commune || input.city || "").trim(),
      website: String(input.website || "").trim(),
    };
  }

  function getCompanies() {
    const list = storageGet(STORAGE_KEYS.companies, []);
    return Array.isArray(list) ? list : [];
  }

  function saveCompanies(companies) {
    storageSet(STORAGE_KEYS.companies, companies);
  }

  function getCompanyById(companyId) {
    return getCompanies().find((company) => company.id === companyId) || null;
  }

  function getCompanyByCode(companyCode) {
    const code = String(companyCode || "")
      .trim()
      .toUpperCase();
    return (
      getCompanies().find(
        (company) =>
          String(company.companyCode || "")
            .trim()
            .toUpperCase() === code,
      ) || null
    );
  }

  function companyCodeExists(companyCode) {
    return Boolean(getCompanyByCode(companyCode));
  }

  function generateCompanyCodeSegment(length) {
    let segment = "";
    for (let index = 0; index < length; index += 1) {
      segment +=
        COMPANY_CODE_ALPHABET[
          Math.floor(Math.random() * COMPANY_CODE_ALPHABET.length)
        ];
    }
    return segment;
  }

  function generateCompanyCode() {
    let code = "";
    let attempts = 0;
    do {
      code = `${COMPANY_CODE_PREFIX}${generateCompanyCodeSegment(COMPANY_CODE_LENGTH)}`;
      attempts += 1;
    } while (companyCodeExists(code) && attempts < 50);
    return code;
  }

  function addCompany(input) {
    const companies = getCompanies();
    const company = createCompany(input);
    if (companyCodeExists(company.companyCode)) {
      throw new Error("DUPLICATE_COMPANY_CODE");
    }
    companies.push(company);
    saveCompanies(companies);
    return company;
  }

  function updateCompany(companyId, patch) {
    const companies = getCompanies();
    const index = companies.findIndex((company) => company.id === companyId);
    if (index === -1) return null;
    companies[index] = {
      ...companies[index],
      ...patch,
      id: companies[index].id,
      companyCode: companies[index].companyCode,
    };
    saveCompanies(companies);
    return companies[index];
  }

  /* ------------------------------------------------------------------ */
  /* User model                                                          */
  /* ------------------------------------------------------------------ */

  function createUser(input) {
    const now = new Date().toISOString();
    const firstName = String(input.firstName || "").trim();
    const lastName = String(input.lastName || "").trim();
    return {
      id: input.id || generateId("usr"),
      companyId: input.companyId || "",
      firstName,
      lastName,
      fullName: input.fullName || buildFullName(firstName, lastName),
      email: normalizeEmail(input.email),
      passwordHash: input.passwordHash || "",
      passwordSalt: input.passwordSalt || "",
      role: input.role ? normalizeRole(input.role) : null,
      status: normalizeLegacyStatus(input.status || USER_STATUS.PENDING),
      avatar: input.avatar || input.photo || "",
      createdAt: input.createdAt || now,
      lastLogin: input.lastLogin || null,
      // Legacy fields kept for Administration module compatibility
      username: input.username || "",
      code: input.code || "",
      functionTitle: input.functionTitle || "",
      phone: input.phone || "",
      unit: input.unit || "",
      division: input.division || "",
      department: input.department || "",
      language: input.language || "fr",
      timezone: input.timezone || "Africa/Algiers",
      companyCode: input.companyCode || "",
      photo: input.avatar || input.photo || "",
      active: input.active !== false,
    };
  }

  function getUsers() {
    const list = storageGet(STORAGE_KEYS.users, []);
    return Array.isArray(list) ? list : [];
  }

  function saveUsers(users) {
    storageSet(STORAGE_KEYS.users, users);
  }

  function getUserById(userId) {
    return getUsers().find((user) => user.id === userId) || null;
  }

  function getUserByEmail(email) {
    const normalized = normalizeEmail(email);
    return getUsers().find((user) => user.email === normalized) || null;
  }

  function emailExists(email, excludeUserId) {
    const normalized = normalizeEmail(email);
    return getUsers().some(
      (user) => user.email === normalized && user.id !== excludeUserId,
    );
  }

  function getUsersByCompany(companyId) {
    return getUsers().filter((user) => user.companyId === companyId);
  }

  function getPendingUsers(companyId) {
    return getUsers().filter(
      (user) =>
        user.status === USER_STATUS.PENDING &&
        (!companyId || user.companyId === companyId),
    );
  }

  function addUser(input) {
    const users = getUsers();
    if (emailExists(input.email)) {
      throw new Error("DUPLICATE_EMAIL");
    }
    const user = createUser(input);
    users.push(user);
    saveUsers(users);
    return user;
  }

  function updateUser(userId, patch) {
    const users = getUsers();
    const index = users.findIndex((user) => user.id === userId);
    if (index === -1) return null;

    if (patch.email && emailExists(patch.email, userId)) {
      throw new Error("DUPLICATE_EMAIL");
    }

    const current = users[index];
    const firstName =
      patch.firstName !== undefined ? patch.firstName : current.firstName;
    const lastName =
      patch.lastName !== undefined ? patch.lastName : current.lastName;

    users[index] = createUser({
      ...current,
      ...patch,
      id: current.id,
      companyId: patch.companyId !== undefined ? patch.companyId : current.companyId,
      firstName,
      lastName,
      fullName: buildFullName(firstName, lastName),
      email: patch.email !== undefined ? patch.email : current.email,
      passwordHash:
        patch.passwordHash !== undefined
          ? patch.passwordHash
          : current.passwordHash,
      passwordSalt:
        patch.passwordSalt !== undefined
          ? patch.passwordSalt
          : current.passwordSalt,
      role:
        patch.role !== undefined
          ? patch.role
            ? normalizeRole(patch.role)
            : null
          : current.role,
      status:
        patch.status !== undefined
          ? normalizeLegacyStatus(patch.status)
          : current.status,
      createdAt: current.createdAt,
    });

    saveUsers(users);
    return users[index];
  }

  function deleteUser(userId) {
    const users = getUsers().filter((user) => user.id !== userId);
    saveUsers(users);
  }

  /* ------------------------------------------------------------------ */
  /* Password hashing (Web Crypto — never store plain text)              */
  /* ------------------------------------------------------------------ */

  function generateSalt() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  async function hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${salt}:${password}`);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  async function createPasswordHash(password) {
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    return { passwordHash, passwordSalt: salt };
  }

  async function verifyPassword(password, user) {
    if (!user?.passwordHash || !user?.passwordSalt) return false;
    const candidate = await hashPassword(password, user.passwordSalt);
    return candidate === user.passwordHash;
  }

  /* ------------------------------------------------------------------ */
  /* Session model                                                       */
  /* ------------------------------------------------------------------ */

  function buildSessionPayload(user, options) {
    if (!user) return null;
    const company = getCompanyById(user.companyId);
    const permissions = user.role ? getRolePermissions(user.role) : {};
    const language =
      options?.language ||
      user.language ||
      localStorage.getItem("maintflow.authLanguage") ||
      "fr";
    const theme = options?.theme || localStorage.getItem("maintflow.theme") || "light";

    return {
      userId: user.id,
      companyId: user.companyId,
      companyCode: company?.companyCode || user.companyCode || "",
      companyName: company?.companyName || "",
      name: user.fullName || buildFullName(user.firstName, user.lastName),
      email: user.email,
      role: user.role,
      permissions,
      language,
      theme,
      loginAt: new Date().toISOString(),
    };
  }

  function getSession() {
    const session = storageGet(STORAGE_KEYS.session, null);
    if (!session || !session.userId) return null;

    const user = getUserById(session.userId);
    if (!user || user.status !== USER_STATUS.ACTIVE) {
      clearSession();
      return null;
    }

    return {
      ...session,
      permissions: user.role
        ? getRolePermissions(user.role)
        : session.permissions || {},
    };
  }

  function saveSession(session) {
    if (!session) {
      clearSession();
      return;
    }
    storageSet(STORAGE_KEYS.session, session);
    storageSet(STORAGE_KEYS.connectedUserId, session.userId);
  }

  function clearSession() {
    storageRemove(STORAGE_KEYS.session);
    storageRemove(STORAGE_KEYS.connectedUserId);
  }

  function isSessionValid() {
    return Boolean(getSession());
  }

  async function createSessionForUser(user, options) {
    const payload = buildSessionPayload(user, options);
    saveSession(payload);
    updateUser(user.id, { lastLogin: new Date().toISOString() });
    syncUsersToAdministrationState();
    return payload;
  }

  function requireAuthForApp() {
    if (!isSessionValid()) {
      if (typeof window !== "undefined") {
        window.location.replace("login.html");
      }
      return false;
    }
    return true;
  }

  function redirectIfAuthenticated() {
    if (isSessionValid()) {
      if (typeof window !== "undefined") {
        window.location.replace("index.html");
      }
      return true;
    }
    return false;
  }

  function performLogout() {
    const session = getSession();
    if (session) {
      appendAuditLog({
        action: "Déconnexion",
        module: "Authentification",
        user: session.name || session.email,
        userId: session.userId,
        companyId: session.companyId,
        detail: "Déconnexion depuis le tableau de bord.",
      });
    }
    clearSession();
    if (typeof window !== "undefined") {
      window.location.href = "login.html";
    }
  }

  /* ------------------------------------------------------------------ */
  /* Audit log helpers (structure for Step 15)                           */
  /* ------------------------------------------------------------------ */

  function createAuditEntry(input) {
    const session = getSession();
    const company =
      getCompanyById(input.companyId || session?.companyId) ||
      getCompanyById(session?.companyId);
    const now = new Date();
    return {
      id: input.id || generateId("log"),
      userId: input.userId || session?.userId || "",
      user:
        input.user ||
        session?.name ||
        session?.email ||
        "Système",
      companyId: input.companyId || session?.companyId || "",
      company: input.company || company?.companyName || "",
      date: input.date || now.toISOString(),
      time: input.time || now.toLocaleTimeString("fr-FR"),
      module: input.module || "Système",
      action: input.action || "Action",
      record: input.record || "",
      detail: input.detail || "",
      before: input.before || "",
      after: input.after || "",
    };
  }

  function appendAuditLog(entry) {
    const adminState = storageGet(STORAGE_KEYS.administrationState, {
      users: [],
      settings: {},
      logs: [],
    });
    const auditEntry = createAuditEntry(entry);
    adminState.logs = [auditEntry, ...(Array.isArray(adminState.logs) ? adminState.logs : [])];
    storageSet(STORAGE_KEYS.administrationState, adminState);
    return auditEntry;
  }

  /* ------------------------------------------------------------------ */
  /* Legacy sync — keeps script.js Administration working during migration */
  /* ------------------------------------------------------------------ */

  function userToLegacyAdminUser(user) {
    const company = getCompanyById(user.companyId);
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username || user.email.split("@")[0] || user.fullName,
      code: user.code || user.id.split("-").slice(-1)[0].toUpperCase(),
      email: user.email,
      role: toLegacyRole(user.role) || user.role || "",
      functionTitle: user.functionTitle || toLegacyRole(user.role) || "",
      phone: user.phone || "",
      unit: user.unit || "",
      division: user.division || "",
      department: user.department || "",
      language: user.language || "fr",
      timezone: user.timezone || "Africa/Algiers",
      status: toLegacyStatus(user.status),
      companyCode: company?.companyCode || user.companyCode || "",
      photo: user.avatar || user.photo || "",
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      active: user.status === USER_STATUS.ACTIVE,
      companyId: user.companyId,
    };
  }

  function syncUsersToAdministrationState() {
    const users = getUsers();
    const adminState = storageGet(STORAGE_KEYS.administrationState, {
      users: [],
      settings: {},
      logs: [],
    });
    adminState.users = users.map(userToLegacyAdminUser);
    storageSet(STORAGE_KEYS.administrationState, adminState);
  }

  function syncCompanyToEnterpriseProfile(company) {
    if (!company) return;
    storageSet(STORAGE_KEYS.enterpriseProfile, {
      name: company.companyName,
      wilaya: company.wilaya || company.country,
      daira: company.daira || "",
      commune: company.commune || company.city,
      phone: company.phone,
      code: company.companyCode,
      logo: company.logo,
      companyId: company.id,
    });

    const adminState = storageGet(STORAGE_KEYS.administrationState, {
      users: [],
      settings: { companyName: "" },
      logs: [],
    });
    adminState.settings = {
      ...(adminState.settings || {}),
      companyName: company.companyName,
      logo: company.logo || adminState.settings?.logo || "",
    };
    storageSet(STORAGE_KEYS.administrationState, adminState);
  }

  function syncRolePermissionsToAdministrationState() {
    const rolePermissions = getRolePermissionsStore();
    const legacyMap = {};
    Object.entries(rolePermissions).forEach(([canonicalRole, modules]) => {
      const legacyRole = toLegacyRole(canonicalRole);
      legacyMap[legacyRole] = withPrintExport(modules);
      legacyMap[canonicalRole] = withPrintExport(modules);
    });

    const adminState = storageGet(STORAGE_KEYS.administrationState, {
      users: [],
      settings: {},
      logs: [],
    });
    adminState.settings = {
      ...(adminState.settings || {}),
      rolePermissions: mergeRolePermissions(
        adminState.settings?.rolePermissions || {},
        legacyMap,
      ),
    };
    storageSet(STORAGE_KEYS.administrationState, adminState);
  }

  /* ------------------------------------------------------------------ */
  /* Migration from legacy localStorage                                  */
  /* ------------------------------------------------------------------ */

  function migrateLegacyEnterpriseProfile() {
    const companies = getCompanies();
    if (companies.length) return companies;

    const profile = storageGet(STORAGE_KEYS.enterpriseProfile, null);
    if (!profile || (!profile.name && !profile.code)) return companies;

    const company = addCompany({
      companyName: profile.name || "IncaMaint Industrie",
      country: profile.wilaya || "",
      city: profile.commune || "",
      wilaya: profile.wilaya || "",
      daira: profile.daira || "",
      commune: profile.commune || "",
      address: profile.address || "",
      phone: profile.phone || "",
      logo: profile.logo || "",
      companyCode: profile.code || generateCompanyCode(),
    });
    syncCompanyToEnterpriseProfile(company);
    return getCompanies();
  }

  function migrateLegacyAdministrationUsers(defaultCompanyId) {
    const existingUsers = getUsers();
    if (existingUsers.length) return existingUsers;

    const adminState = storageGet(STORAGE_KEYS.administrationState, null);
    const legacyUsers = Array.isArray(adminState?.users) ? adminState.users : [];
    if (!legacyUsers.length) return existingUsers;

    const company =
      getCompanyById(defaultCompanyId) || getCompanies()[0] || null;

    legacyUsers.forEach((legacyUser) => {
      try {
        addUser({
          id: legacyUser.id,
          companyId: legacyUser.companyId || company?.id || "",
          firstName: legacyUser.firstName || "",
          lastName: legacyUser.lastName || "",
          email: legacyUser.email || `${legacyUser.username || legacyUser.id}@local.maintflow`,
          role: normalizeRole(legacyUser.role),
          status: normalizeLegacyStatus(legacyUser.status),
          avatar: legacyUser.photo || "",
          username: legacyUser.username || "",
          code: legacyUser.code || "",
          functionTitle: legacyUser.functionTitle || "",
          phone: legacyUser.phone || "",
          unit: legacyUser.unit || "",
          division: legacyUser.division || "",
          department: legacyUser.department || "",
          language: legacyUser.language || "fr",
          timezone: legacyUser.timezone || "Africa/Algiers",
          companyCode: legacyUser.companyCode || company?.companyCode || "",
          createdAt: legacyUser.createdAt,
          lastLogin: legacyUser.lastLogin,
          active: legacyUser.active !== false,
          passwordHash: legacyUser.passwordHash || "",
          passwordSalt: legacyUser.passwordSalt || "",
        });
      } catch (_error) {
        // Skip duplicates during migration
      }
    });

    return getUsers();
  }

  function migrateLegacyRolePermissions() {
    const adminState = storageGet(STORAGE_KEYS.administrationState, null);
    const legacyPermissions = adminState?.settings?.rolePermissions;
    if (!legacyPermissions) {
      saveRolePermissionsStore(getRolePermissionsStore());
      return;
    }

    const canonicalOverrides = {};
    Object.entries(legacyPermissions).forEach(([roleName, modules]) => {
      const canonical = normalizeRole(roleName);
      if (!canonical) return;
      canonicalOverrides[canonical] = withPrintExport(modules);
    });

    saveRolePermissionsStore(
      mergeRolePermissions(buildRolePermissionsDefaults(), canonicalOverrides),
    );
  }

  function initializeAuthData() {
    const meta = storageGet(STORAGE_KEYS.authMeta, { version: 0 });
    if (meta.version >= AUTH_DATA_VERSION && getCompanies().length) {
      syncUsersToAdministrationState();
      syncRolePermissionsToAdministrationState();
      return { migrated: false, companies: getCompanies(), users: getUsers() };
    }

    migrateLegacyEnterpriseProfile();
    const companies = getCompanies();
    const defaultCompanyId = companies[0]?.id || "";
    migrateLegacyAdministrationUsers(defaultCompanyId);
    migrateLegacyRolePermissions();

    syncUsersToAdministrationState();
    if (companies[0]) syncCompanyToEnterpriseProfile(companies[0]);
    syncRolePermissionsToAdministrationState();

    storageSet(STORAGE_KEYS.authMeta, {
      version: AUTH_DATA_VERSION,
      initializedAt: new Date().toISOString(),
    });

    return {
      migrated: true,
      companies: getCompanies(),
      users: getUsers(),
    };
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                          */
  /* ------------------------------------------------------------------ */

  const MaintFlowAuth = {
    VERSION: AUTH_DATA_VERSION,
    STORAGE_KEYS,
    USER_STATUS,
    ROLES,
    ROLE_CATALOG,
    LEGACY_ROLE_TO_CANONICAL,
    CANONICAL_TO_LEGACY_ROLE,
    PERMISSION_ACTIONS,
    PERMISSION_MODULES,
    PAGE_TO_PERMISSION_MODULE,
    NAV_PAGE_ORDER,
    getPermissionModuleForPage,
    getSessionPermissions,
    canViewPage,
    canPerformAction,
    getFirstAllowedPageKey,
    // Company
    createCompany,
    getCompanies,
    saveCompanies,
    getCompanyById,
    getCompanyByCode,
    companyCodeExists,
    generateCompanyCode,
    addCompany,
    updateCompany,
    // User
    createUser,
    getUsers,
    saveUsers,
    getUserById,
    getUserByEmail,
    emailExists,
    getUsersByCompany,
    getPendingUsers,
    addUser,
    updateUser,
    deleteUser,
    userToLegacyAdminUser,
    // Permissions
    buildRolePermissionsDefaults,
    getRolePermissionsStore,
    saveRolePermissionsStore,
    getRolePermissions,
    hasPermission,
    mergeRolePermissions,
    normalizeRole,
    toLegacyRole,
    normalizeLegacyStatus,
    toLegacyStatus,
    // Password
    createPasswordHash,
    verifyPassword,
    // Session
    buildSessionPayload,
    getSession,
    saveSession,
    clearSession,
    isSessionValid,
    createSessionForUser,
    requireAuthForApp,
    redirectIfAuthenticated,
    performLogout,
    // Audit
    createAuditEntry,
    appendAuditLog,
    // Migration & sync
    initializeAuthData,
    syncUsersToAdministrationState,
    syncCompanyToEnterpriseProfile,
    syncRolePermissionsToAdministrationState,
    // Utils
    normalizeEmail,
    buildFullName,
    generateId,
  };

  global.MaintFlowAuth = MaintFlowAuth;

  if (typeof document !== "undefined") {
    const boot = function () {
      try {
        MaintFlowAuth.initializeAuthData();
      } catch (error) {
        console.error("[MaintFlowAuth] Initialization failed", error);
      }
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
