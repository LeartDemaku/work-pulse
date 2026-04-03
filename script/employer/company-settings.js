document.addEventListener('DOMContentLoaded', async () => {
  const user = await window.PlatformaAuth.requireAuth('employer');
  if (!user) return;

  const queryParams = new URLSearchParams(window.location.search);
  const verifyState = queryParams.get('verify');

  const form = document.getElementById('companyForm');
  const resendBtn = document.getElementById('resendVerificationBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const resetBtn = document.getElementById('resetCompanyFormBtn');
  const focusProfileBtn = document.getElementById('focusProfileBtn');
  const profilePanel = document.getElementById('companyProfilePanel');

  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('nav-menu');
  const header = document.getElementById('header');

  // Koment: Menyja mobile dhe efekti i header-it gjatë scroll.
  mobileMenuBtn?.addEventListener('click', () => {
    navMenu?.classList.toggle('active');
    const isOpen = navMenu?.classList.contains('active');
    mobileMenuBtn.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
  });

  window.addEventListener('scroll', () => {
    header?.classList.toggle('header-scrolled', window.scrollY > 24);
  });

  // User Dropdown Logic
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userDropdown');
  const userDisplayName = document.getElementById('userDisplayName');

  if (userDisplayName) {
    userDisplayName.textContent = user.name || 'Kompania';
  }

  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('show');
      }
    });
  }

  focusProfileBtn?.addEventListener('click', () => {
    profilePanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('companyName')?.focus();
  });

  logoutBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    await window.PlatformaAuth.logout();
    window.location.href = 'index.html';
  });

  async function loadCompany() {
    const company = await window.PlatformaApi.get('/api/employer/company');

    document.getElementById('companyName').value = company.name || '';
    document.getElementById('companyLegalName').value = company.legal_name || '';
    document.getElementById('companyEmail').value = company.email || '';
    document.getElementById('companyPhone').value = company.phone || '';
    document.getElementById('companyCity').value = company.city || '';
    document.getElementById('companyWebsite').value = company.website || '';
    document.getElementById('companyDescription').value = company.description || '';
    document.getElementById('notificationEmail').value = company.notification_email || company.email || '';

    const badge = document.getElementById('verificationBadge');
    const verified = Number(company.is_verified) === 1;

    badge.className = `verify-badge ${verified ? 'verified' : 'pending'}`;
    badge.innerHTML = verified
      ? '<i class="fa-solid fa-circle-check"></i> E verifikuar'
      : '<i class="fa-solid fa-circle-exclamation"></i> E paverifikuar';
  }

  // Koment: Mesazhi i verifikimit pas klikimit të linkut në email.
  if (verifyState === 'success') {
    window.PlatformaToast.showToast('success', 'Email-i i kompanisë u verifikua me sukses.');
  } else if (verifyState === 'invalid') {
    window.PlatformaToast.showToast('error', 'Linku i verifikimit është i pavlefshëm ose i skaduar.');
  } else if (verifyState === 'missing') {
    window.PlatformaToast.showToast('error', 'Mungon token-i i verifikimit në link.');
  }

  if (verifyState) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      name: document.getElementById('companyName').value.trim(),
      legalName: document.getElementById('companyLegalName').value.trim(),
      email: document.getElementById('companyEmail').value.trim(),
      phone: document.getElementById('companyPhone').value.trim(),
      city: document.getElementById('companyCity').value.trim(),
      website: document.getElementById('companyWebsite').value.trim(),
      description: document.getElementById('companyDescription').value.trim(),
      notificationEmail: document.getElementById('notificationEmail').value.trim()
    };

    try {
      await window.PlatformaApi.put('/api/employer/company', payload);
      window.PlatformaToast.showToast('success', 'Të dhënat e kompanisë u ruajtën me sukses.');
      await loadCompany();
    } catch (error) {
      window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë ruajtjes.');
    }
  });

  resetBtn?.addEventListener('click', async () => {
    try {
      await loadCompany();
      window.PlatformaToast.showToast('success', 'Të dhënat u rikthyen nga serveri.');
    } catch (error) {
      window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë rikthimit të të dhënave.');
    }
  });

  resendBtn?.addEventListener('click', async () => {
    try {
      await window.PlatformaApi.post('/api/auth/resend-verification', {});
      window.PlatformaToast.showToast('success', 'U dërgua email i ri i verifikimit.');
    } catch (error) {
      window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë ridërgimit.');
    }
  });

  try {
    await loadCompany();
  } catch (error) {
    window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë ngarkimit të kompanisë.');
  }
});
