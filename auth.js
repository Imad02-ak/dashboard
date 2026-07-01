(function () {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const languageStorageKey = "maintflow.authLanguage";
  const authTranslations = {
    fr: {
      documentTitleLogin: "IncaMaint - Connexion",
      documentTitleRegister: "IncaMaint - Inscription",
      pageAria: "Authentification IncaMaint",
      brandAria: "Présentation IncaMaint",
      logoAria: "IncaMaint accueil",
      languageAria: "Choisir la langue",
      brandSubtitle: "Plateforme intelligente de gestion de maintenance",
      features: [
        "Gérez tous vos actifs en un seul endroit",
        "Planifiez, suivez et optimisez vos opérations",
        "Optimisez vos ressources et vos coûts",
        "Suivez vos performances en temps réel",
      ],
      brandFooter: "Optimisez votre maintenance avec IncaMaint.",
      loginKicker: "Espace utilisateur",
      loginTitle: "Connexion",
      loginSubtitle: "Connectez-vous à votre espace IncaMaint",
      email: "Adresse e-mail",
      emailPlaceholder: "nom@entreprise.com",
      password: "Mot de passe",
      passwordPlaceholder: "Votre mot de passe",
      remember: "Se souvenir de moi",
      forgot: "Mot de passe oublié ?",
      loginButton: "Se connecter",
      noAccount: "Vous n'avez pas de compte ?",
      createAccount: "Créer un compte",
      registerKicker: "Nouvel accès",
      registerTitle: "Créer un compte",
      registerSubtitle: "Rejoignez votre plateforme IncaMaint",
      firstName: "Prénom",
      firstNamePlaceholder: "Prénom",
      lastName: "Nom",
      lastNamePlaceholder: "Nom",
      birthDate: "Date de naissance",
      passwordNewPlaceholder: "8 caractères minimum",
      confirmation: "Confirmation",
      confirmationPlaceholder: "Confirmer le mot de passe",
      createCompany: "Créer une nouvelle entreprise",
      companyCode: "Code entreprise",
      companyCodePlaceholder: "Ex : MF-8A7X2P",
      companyMiniTitle: "Entreprise",
      companyInfo: "Informations de l'entreprise",
      newBadge: "Nouvelle",
      uploadLogo: "Logo entreprise",
      uploadHint: "PNG, JPG ou WEBP.",
      companyName: "Nom entreprise",
      companyNamePlaceholder: "IncaMaint Industrie",
      wilaya: "Wilaya",
      wilayaPlaceholder: "Alger",
      daira: "Daïra",
      dairaPlaceholder: "Daïra",
      commune: "Commune",
      communePlaceholder: "Commune",
      companyCreatedAt: "Date de création",
      phone: "Téléphone",
      phonePlaceholder: "+213 000 00 00 00",
      address: "Adresse",
      addressPlaceholder: "Adresse complète",
      website: "Site web",
      websitePlaceholder: "https://entreprise.com",
      registerButton: "Créer mon compte",
      haveAccount: "Vous avez déjà un compte ?",
      signIn: "Se connecter",
      showPassword: "Afficher le mot de passe",
      hidePassword: "Masquer le mot de passe",
      required: "{field} est requis.",
      invalidEmail: "Veuillez saisir une adresse e-mail valide.",
      invalidUrl: "Veuillez saisir une URL valide.",
      minLength: "Minimum {count} caractères.",
      passwordMismatch: "Les mots de passe ne correspondent pas.",
      fixFields: "Veuillez corriger les champs signalés.",
      loginSuccess: "Connexion validée. Redirection vers le tableau de bord...",
      registerSuccess: "Compte prêt à être créé. Redirection vers la connexion...",
      invalidCredentials: "Adresse e-mail ou mot de passe incorrect.",
      accountPending:
        "Votre compte est en attente de validation par l'administrateur.",
      accountRejected: "Votre demande d'inscription a été refusée.",
      emailAlreadyUsed: "Cette adresse e-mail est déjà utilisée.",
      invalidCompanyCode: "Code entreprise introuvable.",
      registerPendingSuccess:
        "Inscription enregistrée. Un administrateur doit valider votre accès.",
      welcomeTitle: "Bienvenue !",
      welcomeText:
        "Votre entreprise a été créée avec succès. Votre code entreprise est :",
      welcomeHint:
        "Conservez ce code. Partagez-le uniquement avec les collaborateurs autorisés.",
      copyCode: "Copier le code",
      close: "Fermer",
      codeCopied: "Code copié dans le presse-papiers.",
      authUnavailable: "Le service d'authentification est indisponible.",
    },
    en: {
      documentTitleLogin: "IncaMaint - Login",
      documentTitleRegister: "IncaMaint - Sign up",
      pageAria: "IncaMaint authentication",
      brandAria: "IncaMaint overview",
      logoAria: "IncaMaint home",
      languageAria: "Choose language",
      brandSubtitle: "Smart maintenance management platform",
      features: [
        "Manage all your assets in one place",
        "Plan, track, and optimize your operations",
        "Optimize your resources and costs",
        "Track your performance in real time",
      ],
      brandFooter: "Optimize your maintenance with IncaMaint.",
      loginKicker: "User area",
      loginTitle: "Login",
      loginSubtitle: "Sign in to your IncaMaint workspace",
      email: "Email address",
      emailPlaceholder: "name@company.com",
      password: "Password",
      passwordPlaceholder: "Your password",
      remember: "Remember me",
      forgot: "Forgot password?",
      loginButton: "Sign in",
      noAccount: "Don't have an account?",
      createAccount: "Create an account",
      registerKicker: "New access",
      registerTitle: "Create an account",
      registerSubtitle: "Join your IncaMaint platform",
      firstName: "First name",
      firstNamePlaceholder: "First name",
      lastName: "Last name",
      lastNamePlaceholder: "Last name",
      birthDate: "Date of birth",
      passwordNewPlaceholder: "8 characters minimum",
      confirmation: "Confirmation",
      confirmationPlaceholder: "Confirm password",
      createCompany: "Create a new company",
      companyCode: "Company code",
      companyCodePlaceholder: "Ex: MF-8A7X2P",
      companyMiniTitle: "Company",
      companyInfo: "Company information",
      newBadge: "New",
      uploadLogo: "Company logo",
      uploadHint: "PNG, JPG, or WEBP.",
      companyName: "Company name",
      companyNamePlaceholder: "IncaMaint Industry",
      wilaya: "Wilaya",
      wilayaPlaceholder: "Algiers",
      daira: "District",
      dairaPlaceholder: "District",
      commune: "Municipality",
      communePlaceholder: "Municipality",
      companyCreatedAt: "Creation date",
      phone: "Phone",
      phonePlaceholder: "+213 000 00 00 00",
      address: "Address",
      addressPlaceholder: "Full address",
      website: "Website",
      websitePlaceholder: "https://company.com",
      registerButton: "Create my account",
      haveAccount: "Already have an account?",
      signIn: "Sign in",
      showPassword: "Show password",
      hidePassword: "Hide password",
      required: "{field} is required.",
      invalidEmail: "Please enter a valid email address.",
      invalidUrl: "Please enter a valid URL.",
      minLength: "Minimum {count} characters.",
      passwordMismatch: "Passwords do not match.",
      fixFields: "Please correct the highlighted fields.",
      loginSuccess: "Login validated. Redirecting to the dashboard...",
      registerSuccess: "Account ready to be created. Redirecting to login...",
      invalidCredentials: "Incorrect email address or password.",
      accountPending: "Your account is pending approval by an administrator.",
      accountRejected: "Your registration request was rejected.",
      emailAlreadyUsed: "This email address is already in use.",
      invalidCompanyCode: "Company code not found.",
      registerPendingSuccess:
        "Registration saved. An administrator must approve your access.",
      welcomeTitle: "Welcome!",
      welcomeText: "Your company was created successfully. Your company code is:",
      welcomeHint:
        "Keep this code safe. Share it only with authorized collaborators.",
      copyCode: "Copy code",
      close: "Close",
      codeCopied: "Code copied to clipboard.",
      authUnavailable: "The authentication service is unavailable.",
    },
  };

  function getAuthLanguage() {
    return localStorage.getItem(languageStorageKey) === "en" ? "en" : "fr";
  }

  function translate(key, replacements = {}) {
    let value = authTranslations[getAuthLanguage()][key] || authTranslations.fr[key] || "";
    Object.entries(replacements).forEach(([name, replacement]) => {
      value = value.replace(`{${name}}`, String(replacement));
    });
    return value;
  }

  function setText(selector, value, root = document) {
    const element = root.querySelector(selector);
    if (element) element.textContent = value;
  }

  function setPlaceholder(selector, value, root = document) {
    const element = root.querySelector(selector);
    if (element) element.placeholder = value;
  }

  function applyAuthTranslations() {
    const lang = getAuthLanguage();
    const text = authTranslations[lang];
    const isRegister = Boolean(document.getElementById("registerForm"));
    document.documentElement.lang = lang === "en" ? "en" : "fr";
    document.title = isRegister ? text.documentTitleRegister : text.documentTitleLogin;
    document.querySelector(".auth-layout")?.setAttribute("aria-label", text.pageAria);
    document.querySelector(".auth-brand-panel")?.setAttribute("aria-label", text.brandAria);
    document.querySelector(".auth-logo")?.setAttribute("aria-label", text.logoAria);

    const languageSelect = document.getElementById("authLanguageSelect");
    if (languageSelect) {
      languageSelect.value = lang;
      languageSelect.setAttribute("aria-label", text.languageAria);
    }

    setText(".auth-brand-copy p", text.brandSubtitle);
    document.querySelectorAll(".auth-feature-card span").forEach((item, index) => {
      item.textContent = text.features[index] || "";
    });
    setText(".auth-brand-footer", text.brandFooter);

    if (document.getElementById("loginForm")) {
      setText(".auth-kicker", text.loginKicker);
      setText(".auth-card-head h2", text.loginTitle);
      setText(".auth-card-head p", text.loginSubtitle);
      setText("label[for='loginEmail']", text.email);
      setPlaceholder("#loginEmail", text.emailPlaceholder);
      setText("label[for='loginPassword']", text.password);
      setPlaceholder("#loginPassword", text.passwordPlaceholder);
      setText("label[for='rememberMe'] span", text.remember);
      const forgotLink = document.querySelector(".auth-form-row .auth-link");
      if (forgotLink) {
        forgotLink.textContent = text.forgot;
        forgotLink.setAttribute("aria-label", text.forgot);
      }
      setText(".auth-submit span", text.loginButton);
      const switchEl = document.querySelector(".auth-switch");
      if (switchEl) {
        switchEl.innerHTML = `${text.noAccount} <a class="auth-link" href="register.html">${text.createAccount}</a>`;
      }
    }

    if (isRegister) {
      setText(".auth-kicker", text.registerKicker);
      setText(".auth-card-head h2", text.registerTitle);
      setText(".auth-card-head p", text.registerSubtitle);
      setText("label[for='firstName']", text.firstName);
      setPlaceholder("#firstName", text.firstNamePlaceholder);
      setText("label[for='lastName']", text.lastName);
      setPlaceholder("#lastName", text.lastNamePlaceholder);
      setText("label[for='birthDate']", text.birthDate);
      setText("label[for='registerEmail']", text.email);
      setPlaceholder("#registerEmail", text.emailPlaceholder);
      setText("label[for='registerPassword']", text.password);
      setPlaceholder("#registerPassword", text.passwordNewPlaceholder);
      setText("label[for='confirmPassword']", text.confirmation);
      setPlaceholder("#confirmPassword", text.confirmationPlaceholder);
      setText("label[for='createCompany'] span", text.createCompany);
      setText("label[for='companyCode']", text.companyCode);
      setPlaceholder("#companyCode", text.companyCodePlaceholder);
      setText(".card-mini-title", text.companyMiniTitle);
      setText("#companyInfoTitle", text.companyInfo);
      const badge = document.querySelector(".auth-section-badge");
      if (badge) badge.lastChild.textContent = ` ${text.newBadge}`;
      setText(".auth-upload-btn span", text.uploadLogo);
      setText(".auth-field-hint", text.uploadHint);
      setText("label[for='companyName']", text.companyName);
      setPlaceholder("#companyName", text.companyNamePlaceholder);
      setText("label[for='wilaya']", text.wilaya);
      setPlaceholder("#wilaya", text.wilayaPlaceholder);
      setText("label[for='daira']", text.daira);
      setPlaceholder("#daira", text.dairaPlaceholder);
      setText("label[for='commune']", text.commune);
      setPlaceholder("#commune", text.communePlaceholder);
      setText("label[for='companyCreatedAt']", text.companyCreatedAt);
      setText("label[for='companyPhone']", text.phone);
      setPlaceholder("#companyPhone", text.phonePlaceholder);
      setText("label[for='companyAddress']", text.address);
      setPlaceholder("#companyAddress", text.addressPlaceholder);
      setText("label[for='companyWebsite']", text.website);
      setPlaceholder("#companyWebsite", text.websitePlaceholder);
      setText(".auth-submit span", text.registerButton);
      const switchEl = document.querySelector(".auth-switch");
      if (switchEl) {
        switchEl.innerHTML = `${text.haveAccount} <a class="auth-link" href="login.html">${text.signIn}</a>`;
      }
    }

    document.querySelectorAll("[data-password-toggle]").forEach((button) => {
      const input = button.parentElement?.querySelector("input");
      const isVisible = input?.type === "text";
      button.setAttribute("aria-label", isVisible ? text.hidePassword : text.showPassword);
    });
  }

  function initAuthLanguageSelector() {
    const languageSelect = document.getElementById("authLanguageSelect");
    if (!languageSelect) return;
    languageSelect.value = getAuthLanguage();
    languageSelect.addEventListener("change", function () {
      localStorage.setItem(languageStorageKey, this.value === "en" ? "en" : "fr");
      applyAuthTranslations();
      document.querySelectorAll("input, textarea").forEach(clearError);
      document.querySelectorAll(".auth-status").forEach((status) => {
        status.textContent = "";
        status.classList.remove("is-visible", "is-error");
      });
    });
  }

  function getField(input) {
    return input.closest("[data-field]");
  }

  function getErrorEl(input) {
    return getField(input)?.querySelector(".auth-error");
  }

  function setError(input, message) {
    const field = getField(input);
    const error = getErrorEl(input);
    if (!field || !error) return;

    field.classList.toggle("has-error", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
    error.textContent = message || "";
  }

  function clearError(input) {
    setError(input, "");
  }

  function isVisibleInput(input) {
    return !input.disabled && input.offsetParent !== null;
  }

  function getRequiredMessage(input) {
    const label = getField(input)?.querySelector("label")?.textContent?.trim() || "Ce champ";
    return translate("required", { field: label });
  }

  function validateInput(input, form) {
    if (!isVisibleInput(input)) {
      clearError(input);
      return true;
    }

    const value = input.value.trim();
    if (input.required && !value) {
      setError(input, getRequiredMessage(input));
      return false;
    }

    if (input.type === "email" && value && !emailPattern.test(value)) {
      setError(input, translate("invalidEmail"));
      return false;
    }

    if (input.type === "url" && value) {
      try {
        new URL(value);
      } catch (error) {
        setError(input, translate("invalidUrl"));
        return false;
      }
    }

    if (input.minLength > 0 && value && value.length < input.minLength) {
      setError(input, translate("minLength", { count: input.minLength }));
      return false;
    }

    if (input.name === "confirmPassword") {
      const password = form.querySelector("input[name='password']");
      if (password && value !== password.value) {
        setError(input, translate("passwordMismatch"));
        return false;
      }
    }

    clearError(input);
    return true;
  }

  function setStatus(form, message, isError) {
    const status = form.querySelector(".auth-status");
    if (!status) return;
    status.textContent = message || "";
    status.classList.toggle("is-visible", Boolean(message));
    status.classList.toggle("is-error", Boolean(isError));
  }

  function validateForm(form) {
    const inputs = Array.from(form.querySelectorAll("input, textarea"));
    const valid = inputs.every((input) => validateInput(input, form));
    const firstError = form.querySelector(".has-error input, .has-error textarea");
    if (firstError) firstError.focus();
    return valid;
  }

  function initPasswordToggles(root) {
    root.querySelectorAll("[data-password-toggle]").forEach((button) => {
      button.addEventListener("click", function () {
        const input = button.parentElement.querySelector("input");
        if (!input) return;

        const shouldShow = input.type === "password";
        input.type = shouldShow ? "text" : "password";
        button.setAttribute("aria-pressed", shouldShow ? "true" : "false");
        button.setAttribute(
          "aria-label",
          shouldShow ? translate("hidePassword") : translate("showPassword"),
        );
        button.querySelector("i")?.classList.toggle("fa-eye", !shouldShow);
        button.querySelector("i")?.classList.toggle("fa-eye-slash", shouldShow);
      });
    });
  }

  function initLiveValidation(form) {
    form.querySelectorAll("input, textarea").forEach((input) => {
      input.addEventListener("input", function () {
        if (getField(input)?.classList.contains("has-error")) {
          validateInput(input, form);
        }
      });

      input.addEventListener("blur", function () {
        validateInput(input, form);
      });
    });
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result || ""));
      };
      reader.onerror = function () {
        reject(new Error("FILE_READ_ERROR"));
      };
      reader.readAsDataURL(file);
    });
  }

  function getAuthApi() {
    return window.MaintFlowAuth || null;
  }

  function setSubmitLoading(form, isLoading) {
    const button = form.querySelector(".auth-submit");
    if (!button) return;
    button.disabled = isLoading;
    button.classList.toggle("is-loading", isLoading);
  }

  function showWelcomePopup(companyCode, onClose) {
    let root = document.getElementById("authWelcomeRoot");
    if (!root) {
      root = document.createElement("div");
      root.id = "authWelcomeRoot";
      document.body.appendChild(root);
    }

    root.innerHTML = `
      <div class="auth-welcome-overlay" role="presentation">
        <div class="auth-welcome-modal" role="dialog" aria-modal="true" aria-labelledby="authWelcomeTitle">
          <div class="auth-welcome-icon"><i class="fa-solid fa-building-circle-check"></i></div>
          <h2 id="authWelcomeTitle">${translate("welcomeTitle")}</h2>
          <p>${translate("welcomeText")}</p>
          <div class="auth-welcome-code" id="authWelcomeCode">${companyCode}</div>
          <p class="auth-welcome-hint">${translate("welcomeHint")}</p>
          <div class="auth-welcome-actions">
            <button class="btn btn-outline" type="button" id="authWelcomeCopyBtn">
              <i class="fa-regular fa-copy"></i>
              <span>${translate("copyCode")}</span>
            </button>
            <button class="btn btn-primary" type="button" id="authWelcomeCloseBtn">
              <i class="fa-solid fa-check"></i>
              <span>${translate("close")}</span>
            </button>
          </div>
          <p class="auth-welcome-copy-status" id="authWelcomeCopyStatus" aria-live="polite"></p>
        </div>
      </div>
    `;

    const copyBtn = root.querySelector("#authWelcomeCopyBtn");
    const closeBtn = root.querySelector("#authWelcomeCloseBtn");
    const copyStatus = root.querySelector("#authWelcomeCopyStatus");

    copyBtn?.addEventListener("click", async function () {
      try {
        await navigator.clipboard.writeText(companyCode);
        if (copyStatus) copyStatus.textContent = translate("codeCopied");
      } catch (_error) {
        const range = document.createRange();
        const codeEl = root.querySelector("#authWelcomeCode");
        if (codeEl) {
          range.selectNodeContents(codeEl);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          document.execCommand("copy");
          selection?.removeAllRanges();
          if (copyStatus) copyStatus.textContent = translate("codeCopied");
        }
      }
    });

    closeBtn?.addEventListener("click", function () {
      root.innerHTML = "";
      if (typeof onClose === "function") onClose();
    });
  }

  async function handleLoginSubmit(form) {
    const auth = getAuthApi();
    if (!auth) {
      setStatus(form, translate("authUnavailable"), true);
      return;
    }

    const email = form.querySelector("#loginEmail")?.value || "";
    const password = form.querySelector("#loginPassword")?.value || "";
    const user = auth.getUserByEmail(email);

    if (!user) {
      auth.appendAuditLog({
        action: "Connexion refusée",
        module: "Authentification",
        user: email,
        detail: "Adresse e-mail inconnue.",
      });
      setStatus(form, translate("invalidCredentials"), true);
      return;
    }

    if (user.status === auth.USER_STATUS.PENDING) {
      setStatus(form, translate("accountPending"), true);
      return;
    }

    if (user.status === auth.USER_STATUS.REJECTED) {
      setStatus(form, translate("accountRejected"), true);
      return;
    }

    const passwordValid = await auth.verifyPassword(password, user);
    if (!passwordValid || user.status !== auth.USER_STATUS.ACTIVE) {
      auth.appendAuditLog({
        action: "Connexion refusée",
        module: "Authentification",
        user: user.fullName || user.email,
        userId: user.id,
        companyId: user.companyId,
        detail: "Mot de passe incorrect ou compte inactif.",
      });
      setStatus(form, translate("invalidCredentials"), true);
      return;
    }

    await auth.createSessionForUser(user, { language: getAuthLanguage() });
    auth.appendAuditLog({
      action: "Connexion",
      module: "Authentification",
      user: user.fullName || user.email,
      userId: user.id,
      companyId: user.companyId,
      detail: "Connexion réussie.",
    });

    setStatus(form, translate("loginSuccess"), false);
    window.setTimeout(() => {
      window.location.href = "index.html";
    }, 650);
  }

  async function handleRegisterSubmit(form) {
    const auth = getAuthApi();
    if (!auth) {
      setStatus(form, translate("authUnavailable"), true);
      return;
    }

    const createCompanyChecked = Boolean(
      form.querySelector("#createCompany")?.checked,
    );
    const firstName = form.querySelector("#firstName")?.value.trim() || "";
    const lastName = form.querySelector("#lastName")?.value.trim() || "";
    const email = form.querySelector("#registerEmail")?.value.trim() || "";
    const password = form.querySelector("#registerPassword")?.value || "";

    if (auth.emailExists(email)) {
      setError(form.querySelector("#registerEmail"), translate("emailAlreadyUsed"));
      setStatus(form, translate("fixFields"), true);
      return;
    }

    const passwordCreds = await auth.createPasswordHash(password);

    if (createCompanyChecked) {
      let logoData = "";
      const logoFile = form.querySelector("#companyLogo")?.files?.[0];
      if (logoFile) {
        logoData = await readFileAsDataUrl(logoFile);
      }

      const company = auth.addCompany({
        companyName: form.querySelector("#companyName")?.value.trim() || "",
        activity: "",
        country: form.querySelector("#wilaya")?.value.trim() || "",
        city: form.querySelector("#commune")?.value.trim() || "",
        wilaya: form.querySelector("#wilaya")?.value.trim() || "",
        daira: form.querySelector("#daira")?.value.trim() || "",
        commune: form.querySelector("#commune")?.value.trim() || "",
        address: form.querySelector("#companyAddress")?.value.trim() || "",
        phone: form.querySelector("#companyPhone")?.value.trim() || "",
        website: form.querySelector("#companyWebsite")?.value.trim() || "",
        logo: logoData,
      });

      auth.syncCompanyToEnterpriseProfile(company);

      const adminUser = auth.addUser({
        companyId: company.id,
        firstName,
        lastName,
        email,
        ...passwordCreds,
        role: auth.ROLES.ADMINISTRATOR,
        status: auth.USER_STATUS.ACTIVE,
        companyCode: company.companyCode,
        username: email.split("@")[0],
        functionTitle: auth.toLegacyRole(auth.ROLES.ADMINISTRATOR),
        language: getAuthLanguage(),
      });

      auth.syncUsersToAdministrationState();
      auth.appendAuditLog({
        action: "Création entreprise",
        module: "Authentification",
        user: adminUser.fullName,
        userId: adminUser.id,
        companyId: company.id,
        company: company.companyName,
        record: company.companyCode,
        detail: `Entreprise ${company.companyName} créée.`,
      });
      auth.appendAuditLog({
        action: "Création utilisateur",
        module: "Authentification",
        user: adminUser.fullName,
        userId: adminUser.id,
        companyId: company.id,
        record: adminUser.email,
        detail: "Compte administrateur créé.",
      });

      await auth.createSessionForUser(adminUser, { language: getAuthLanguage() });
      auth.appendAuditLog({
        action: "Connexion",
        module: "Authentification",
        user: adminUser.fullName,
        userId: adminUser.id,
        companyId: company.id,
        detail: "Connexion automatique après création d'entreprise.",
      });

      setSubmitLoading(form, false);
      showWelcomePopup(company.companyCode, function () {
        window.location.href = "index.html";
      });
      return;
    }

    const companyCode = form.querySelector("#companyCode")?.value.trim() || "";
    const company = auth.getCompanyByCode(companyCode);
    if (!company) {
      setError(form.querySelector("#companyCode"), translate("invalidCompanyCode"));
      setStatus(form, translate("fixFields"), true);
      return;
    }

    const pendingUser = auth.addUser({
      companyId: company.id,
      firstName,
      lastName,
      email,
      ...passwordCreds,
      role: null,
      status: auth.USER_STATUS.PENDING,
      companyCode: company.companyCode,
      username: email.split("@")[0],
      language: getAuthLanguage(),
    });

    auth.syncUsersToAdministrationState();
    auth.appendAuditLog({
      action: "Création utilisateur",
      module: "Authentification",
      user: pendingUser.fullName,
      userId: pendingUser.id,
      companyId: company.id,
      company: company.companyName,
      record: pendingUser.email,
      detail: "Inscription en attente de validation.",
    });

    setStatus(form, translate("registerPendingSuccess"), false);
    window.setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);
  }

  function initLoginForm() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    initLiveValidation(form);
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      setStatus(form, "", false);

      if (!validateForm(form)) {
        setStatus(form, translate("fixFields"), true);
        return;
      }

      setSubmitLoading(form, true);
      try {
        await handleLoginSubmit(form);
      } catch (_error) {
        setStatus(form, translate("authUnavailable"), true);
      } finally {
        setSubmitLoading(form, false);
      }
    });
  }

  function setCompanyMode(form, createCompany) {
    const codeField = document.getElementById("companyCodeField");
    const companyCard = document.getElementById("companyInfoCard");
    const companyInputs = Array.from(companyCard?.querySelectorAll("input, textarea") || []);
    const companyCode = document.getElementById("companyCode");

    codeField?.classList.toggle("is-hidden", createCompany);
    companyCard?.classList.toggle("is-hidden", !createCompany);

    if (companyCode) {
      companyCode.required = !createCompany;
      if (createCompany) clearError(companyCode);
    }

    companyInputs.forEach((input) => {
      if (input.type !== "file") input.required = createCompany && ["companyName", "wilaya", "daira", "commune", "companyCreatedAt", "companyPhone", "companyAddress"].includes(input.name);
      if (!createCompany) clearError(input);
    });

    setStatus(form, "", false);
  }

  function initLogoPreview() {
    const input = document.getElementById("companyLogo");
    const preview = document.getElementById("companyLogoPreview");
    const icon = document.querySelector(".auth-upload-preview i");
    if (!input || !preview) return;

    input.addEventListener("change", function () {
      const file = input.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function () {
        preview.src = String(reader.result || "");
        preview.hidden = false;
        if (icon) icon.hidden = true;
      };
      reader.readAsDataURL(file);
    });
  }

  function initRegisterForm() {
    const form = document.getElementById("registerForm");
    const createCompany = document.getElementById("createCompany");
    if (!form) return;

    initLiveValidation(form);
    initLogoPreview();

    if (createCompany) {
      setCompanyMode(form, createCompany.checked);
      createCompany.addEventListener("change", function () {
        setCompanyMode(form, createCompany.checked);
      });
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      setStatus(form, "", false);

      if (!validateForm(form)) {
        setStatus(form, translate("fixFields"), true);
        return;
      }

      setSubmitLoading(form, true);
      try {
        await handleRegisterSubmit(form);
      } catch (error) {
        if (error?.message === "DUPLICATE_EMAIL") {
          setError(form.querySelector("#registerEmail"), translate("emailAlreadyUsed"));
          setStatus(form, translate("fixFields"), true);
        } else {
          setStatus(form, translate("authUnavailable"), true);
        }
      } finally {
        setSubmitLoading(form, false);
      }
    });
  }

  function bootAuthPages() {
    const auth = getAuthApi();
    if (auth) {
      auth.initializeAuthData();
      if (auth.redirectIfAuthenticated()) return;
    }

    applyAuthTranslations();
    initAuthLanguageSelector();
    initPasswordToggles(document);
    initLoginForm();
    initRegisterForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootAuthPages);
  } else {
    bootAuthPages();
  }
})();
