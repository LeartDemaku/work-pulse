document.addEventListener('DOMContentLoaded', async function () {
  const auth = window.PlatformaAuth;
  const toast = window.PlatformaToast;

  const alreadyLogged = await auth.me();
  if (alreadyLogged) {
    redirectByRole(alreadyLogged);
    return;
  }

  const header = document.getElementById('header');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('nav-menu');
  const tabs = document.querySelectorAll('.tab-toggle');
  const loginPane = document.getElementById('loginPane');
  const signupPane = document.getElementById('signupPane');
  const loginMessage = document.getElementById('loginMessage');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const forgotPasswordModal = document.getElementById('forgotPasswordModal');
  const forgotPasswordCloseBtn = document.getElementById('forgotPasswordCloseBtn');
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  const forgotPasswordEmail = document.getElementById('forgotPasswordEmail');

  window.addEventListener('scroll', function () {
    header?.classList.toggle('header-scrolled', window.scrollY > 50);
  });

  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', function () {
      navMenu.classList.toggle('active');
      mobileMenuBtn.innerHTML = navMenu.classList.contains('active') ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });
  }

  function showLoginMessage(type, text) {
    if (!loginMessage) return;
    loginMessage.className = 'login-message ' + type;
    loginMessage.textContent = text;
    loginMessage.style.display = 'block';
    toast.showToast(type === 'success' ? 'success' : 'error', text);
  }

  function setTab(tab) {
    tabs.forEach(function (tabBtn) {
      tabBtn.classList.toggle('active', tabBtn.getAttribute('data-tab') === tab);
    });

    if (tab === 'login') {
      loginPane.style.display = 'block';
      signupPane.style.display = 'none';
    } else {
      loginPane.style.display = 'none';
      signupPane.style.display = 'block';
    }

    if (loginMessage) {
      loginMessage.style.display = 'none';
    }
  }

  tabs.forEach(function (tabBtn) {
    tabBtn.addEventListener('click', function () {
      setTab(this.getAttribute('data-tab'));
    });
  });

  const goToSignupInline = document.getElementById('goToSignupInline');
  const goToLoginInline = document.getElementById('goToLoginInline');

  goToSignupInline?.addEventListener('click', function (e) {
    e.preventDefault();
    setTab('signup');
  });

  goToLoginInline?.addEventListener('click', function (e) {
    e.preventDefault();
    setTab('login');
  });

  function getSelectedRole() {
    const selected = document.querySelector('input[name="signupRole"]:checked');
    return selected ? selected.value : 'job_seeker';
  }

  function updateRoleFields() {
    const role = getSelectedRole();
    const employerFields = document.getElementById('employerFields');
    const companyName = document.getElementById('signupCompanyName');
    const companyEmail = document.getElementById('signupCompanyEmail');

    if (role === 'employer') {
      employerFields.style.display = 'block';
      companyName.setAttribute('required', 'required');
      companyEmail.setAttribute('required', 'required');
    } else {
      employerFields.style.display = 'none';
      companyName.removeAttribute('required');
      companyEmail.removeAttribute('required');
    }

    document.querySelectorAll('.role-card').forEach((card) => {
      card.classList.toggle('active', card.getAttribute('data-role') === role);
    });
  }

  document.querySelectorAll('.role-card').forEach((card) => {
    card.addEventListener('click', function () {
      const radio = this.querySelector('input[type="radio"]');
      radio.checked = true;
      updateRoleFields();
    });
  });

  document.querySelectorAll('input[name="signupRole"]').forEach((radio) => {
    radio.addEventListener('change', updateRoleFields);
  });

  updateRoleFields();

  updateRoleFields();

  const queryParams = new URLSearchParams(window.location.search);

  if (queryParams.get('tab') === 'signup') {
    setTab('signup');
  }

  const verifyState = queryParams.get('verify');
  if (verifyState === 'success') {
    showLoginMessage('success', 'Email-i i kompanisë u verifikua me sukses. Mund të publikoni shpallje.');
  } else if (verifyState === 'invalid') {
    showLoginMessage('error', 'Linku i verifikimit është i pavlefshëm ose i skaduar.');
  } else if (verifyState === 'missing') {
    showLoginMessage('error', 'Mungon token-i i verifikimit në link.');
  }

  if (verifyState) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  function openForgotPasswordModal() {
    if (!forgotPasswordModal) return;
    forgotPasswordModal.classList.add('open');
    forgotPasswordModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => forgotPasswordEmail?.focus(), 40);
  }

  function closeForgotPasswordModal() {
    if (!forgotPasswordModal) return;
    forgotPasswordModal.classList.remove('open');
    forgotPasswordModal.setAttribute('aria-hidden', 'true');
  }

  forgotPasswordLink?.addEventListener('click', (e) => {
    e.preventDefault();
    openForgotPasswordModal();
  });

  forgotPasswordCloseBtn?.addEventListener('click', closeForgotPasswordModal);

  forgotPasswordModal?.addEventListener('click', (e) => {
    const target = e.target;
    if (target?.classList?.contains('auth-modal-backdrop')) {
      closeForgotPasswordModal();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && forgotPasswordModal?.classList.contains('open')) {
      closeForgotPasswordModal();
    }
  });

  forgotPasswordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = forgotPasswordEmail?.value?.trim() || '';

    if (!email) {
      showLoginMessage('error', 'Shkruani email-in tuaj.');
      return;
    }

    try {
      await window.PlatformaApi.post('/api/auth/forgot-password', { email });
      closeForgotPasswordModal();
      forgotPasswordForm.reset();
      showLoginMessage('success', 'Nëse email-i ekziston, do të merrni linkun për rivendosje.');
    } catch (error) {
      showLoginMessage('error', error?.payload?.message || 'Gabim gjatë dërgimit të linkut.');
    }
  });

  const loginForm = document.getElementById('loginForm');
  loginForm?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      showLoginMessage('error', 'Ju lutemi plotësoni të gjitha fushat.');
      return;
    }

    try {
      const user = await auth.login(email, password);
      showLoginMessage('success', 'Hyrja u realizua me sukses.');
      setTimeout(() => redirectByRole(user), 700);
    } catch (error) {
      showLoginMessage('error', error?.payload?.message || 'Email ose fjalëkalim i gabuar.');
    }
  });

  const signupForm = document.getElementById('signupForm');
  signupForm?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const role = getSelectedRole();
    const payload = {
      role,
      name: document.getElementById('signupName').value.trim(),
      phone: document.getElementById('signupPhone').value.trim(),
      email: document.getElementById('signupEmail').value.trim(),
      password: document.getElementById('signupPassword').value,
      companyName: document.getElementById('signupCompanyName').value.trim(),
      companyEmail: document.getElementById('signupCompanyEmail').value.trim(),
      businessNumber: document.getElementById('signupBusinessNumber').value.trim(),
      website: document.getElementById('signupCompanyWebsite').value.trim()
    };

    const confirmPassword = document.getElementById('signupPasswordConfirm').value;
    const privacyAccepted = document.getElementById('signupPrivacy').checked;

    if (!payload.name || !payload.phone || !payload.email || !payload.password) {
      showLoginMessage('error', 'Ju lutemi plotësoni fushat e detyrueshme.');
      return;
    }

    if (payload.password !== confirmPassword) {
      showLoginMessage('error', 'Fjalëkalimet nuk përputhen.');
      return;
    }

    if (!privacyAccepted) {
      showLoginMessage('error', 'Duhet të pranoni kushtet dhe politikën e privatësisë.');
      return;
    }

    if (role === 'employer' && (!payload.companyName || !payload.companyEmail)) {
      showLoginMessage('error', 'Plotësoni të dhënat e kompanisë.');
      return;
    }

    try {
      const user = await auth.register(payload);
      showLoginMessage(
        'success',
        role === 'employer'
          ? 'Llogaria e kompanisë u krijua. Verifikoni email-in për të publikuar shpallje.'
          : 'Llogaria u krijua me sukses.'
      );

      setTimeout(() => redirectByRole(user), 900);
    } catch (error) {
      showLoginMessage('error', error?.payload?.message || 'Gabim gjatë regjistrimit.');
    }
  });

  function buildGooglePayload(baseCredential, sourceTab) {
    const role = sourceTab === 'signup' ? getSelectedRole() : 'job_seeker';
    const payload = {
      role,
      ...baseCredential
    };

    payload.name = document.getElementById('signupName')?.value.trim() || '';
    payload.phone = document.getElementById('signupPhone')?.value.trim() || '';

    if (role === 'employer') {
      payload.companyName = document.getElementById('signupCompanyName')?.value.trim() || '';
      payload.companyEmail = document.getElementById('signupCompanyEmail')?.value.trim() || '';
      payload.businessNumber = document.getElementById('signupBusinessNumber')?.value.trim() || '';
      payload.website = document.getElementById('signupCompanyWebsite')?.value.trim() || '';
    }

    return payload;
  }

  async function handleGoogleAuthSuccess(sourceTab, credentialPayload = {}) {
    const payload = buildGooglePayload(credentialPayload, sourceTab);

    if (sourceTab === 'signup' && payload.role === 'employer' && (!payload.companyName || !payload.companyEmail)) {
      showLoginMessage('error', 'Për Google si employer, plotësoni emrin dhe email-in e kompanisë.');
      return;
    }

    try {
      const data = await window.PlatformaApi.post('/api/auth/google', payload);
      const user = data?.user || data;
      showLoginMessage('success', 'Autentikimi me Google u realizua me sukses.');
      setTimeout(() => redirectByRole(user), 700);
    } catch (error) {
      showLoginMessage('error', error?.payload?.message || 'Google login dështoi.');
    }
  }

  async function handleGoogleCredential(response, sourceTab) {
    const idToken = String(response?.credential || '').trim();
    if (!idToken) {
      showLoginMessage('error', 'Google credential mungon. Provoni përsëri.');
      return;
    }

    await handleGoogleAuthSuccess(sourceTab, { idToken });
  }

  async function handleGoogleAccessToken(accessToken, sourceTab) {
    const token = String(accessToken || '').trim();
    if (!token) {
      showLoginMessage('error', 'Google access token mungon. Provoni përsëri.');
      return;
    }

    await handleGoogleAuthSuccess(sourceTab, { accessToken: token });
  }

  async function waitForGoogleSdk(maxWaitMs = 7000) {
    const startedAt = Date.now();

    return new Promise((resolve) => {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          resolve(true);
          return;
        }

        if (Date.now() - startedAt > maxWaitMs) {
          clearInterval(timer);
          resolve(false);
        }
      }, 120);
    });
  }

  async function initGoogleAuth() {
    const loginBlock = document.getElementById('googleLoginBlock');
    const signupBlock = document.getElementById('googleSignupBlock');
    const loginBrandBtn = document.getElementById('googleLoginBrandBtn');
    const signupBrandBtn = document.getElementById('googleSignupBrandBtn');
    const loginContainer = document.getElementById('googleLoginButton');
    const signupContainer = document.getElementById('googleSignupButton');

    if (!loginBlock && !signupBlock) {
      return;
    }

    const setGoogleUnavailable = (message) => {
      if (loginBrandBtn) {
        loginBrandBtn.disabled = true;
        loginBrandBtn.title = message;
      }
      if (signupBrandBtn) {
        signupBrandBtn.disabled = true;
        signupBrandBtn.title = message;
      }

      const loginNote = loginBlock?.querySelector('.oauth-note');
      if (loginNote) {
        loginNote.textContent = message;
      }

      const signupNote = signupBlock?.querySelector('.oauth-note');
      if (signupNote) {
        signupNote.textContent = message;
      }
    };

    let config = null;
    try {
      config = await window.PlatformaApi.get('/api/auth/google/config');
    } catch (_error) {
      config = { enabled: false };
    }

    if (!config?.enabled || !config?.clientId) {
      setGoogleUnavailable('Google hyrja nuk është konfiguruar ende nga administratori.');
      return;
    }

    const sdkReady = await waitForGoogleSdk();
    if (!sdkReady) {
      setGoogleUnavailable('Google SDK nuk u ngarkua. Kontrolloni rrjetin dhe rifreskoni faqen.');
      return;
    }

    let googleIntentTab = 'login';
    let googleTokenClient = null;

    window.google.accounts.id.initialize({
      client_id: config.clientId,
      callback: (googleResponse) => {
        const sourceTab = googleIntentTab || (signupPane.style.display === 'none' ? 'login' : 'signup');
        googleIntentTab = 'login';
        handleGoogleCredential(googleResponse, sourceTab);
      },
      auto_select: false,
      ux_mode: 'popup'
    });

    if (window.google.accounts.oauth2?.initTokenClient) {
      googleTokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: config.clientId,
        scope: 'openid email profile',
        error_callback: (err) => {
          if (err?.type === 'origin_mismatch' || String(err).includes('origin')) {
            showLoginMessage('error', 'Google Auth origin_mismatch: Shtoni ' + window.location.origin + ' tek Authorized JavaScript origins ne Google Cloud Console.');
          } else {
            showLoginMessage('error', 'Google popup u mbyll ose dështoi.');
          }
        },
        callback: (tokenResponse) => {
          const sourceTab = googleIntentTab || (signupPane.style.display === 'none' ? 'login' : 'signup');
          googleIntentTab = 'login';

          if (tokenResponse?.error) {
            if (tokenResponse.error === 'origin_mismatch' || tokenResponse.error_description?.includes('origin')) {
              showLoginMessage('error', 'Google Auth origin_mismatch: Shtoni ' + window.location.origin + ' tek Authorized JavaScript origins ne Google Cloud Console.');
            } else {
              showLoginMessage('error', 'Google popup u mbyll ose dështoi. Provoni përsëri.');
            }
            return;
          }

          handleGoogleAccessToken(tokenResponse?.access_token, sourceTab);
        }
      });
    }

    const hiddenButtonConfig = {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      logo_alignment: 'left',
      width: 320,
      text: 'continue_with'
    };

    if (loginContainer) {
      window.google.accounts.id.renderButton(loginContainer, hiddenButtonConfig);
    }

    if (signupContainer) {
      window.google.accounts.id.renderButton(signupContainer, hiddenButtonConfig);
    }

    const clickNativeGoogleButton = (container) => {
      if (!container) return false;

      const nativeButton = container.querySelector('div[role="button"], [tabindex="0"], iframe');
      if (nativeButton && typeof nativeButton.click === 'function') {
        nativeButton.click();
        return true;
      }

      if (typeof container.click === 'function') {
        container.click();
        return true;
      }

      return false;
    };

    function startGoogleFlow(sourceTab) {
      googleIntentTab = sourceTab;
      setTab(sourceTab === 'signup' ? 'signup' : 'login');

      try {
        const targetContainer = sourceTab === 'signup' ? signupContainer : loginContainer;
        if (clickNativeGoogleButton(targetContainer)) {
          return;
        }

        if (googleTokenClient) {
          googleTokenClient.requestAccessToken({ prompt: 'select_account' });
          return;
        }

        window.google.accounts.id.prompt();
      } catch (_error) {
        showLoginMessage('error', 'Google autentikimi nuk mund të niset për momentin.');
      }
    }

    loginBrandBtn?.addEventListener('click', () => startGoogleFlow('login'));
    signupBrandBtn?.addEventListener('click', () => startGoogleFlow('signup'));
  }

  await initGoogleAuth();

  function redirectByRole(user) {
    if (user.role === 'employer') {
      window.location.href = 'employer-dashboard.html';
      return;
    }

    if (user.role === 'admin') {
      window.location.href = 'admin.html';
      return;
    }

    window.location.href = 'jobseeker-dashboard.html';
  }
});
