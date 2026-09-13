document.addEventListener('DOMContentLoaded', async () => {
  const user = await window.PlatformaAuth.requireAuth('employer');
  if (!user) return;

  const logoutBtn = document.getElementById('logoutBtn');
  const metricsEl = document.getElementById('metrics');
  const expiringEl = document.getElementById('expiringJobs');
  const welcomeHeading = document.getElementById('welcomeHeading');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('nav-menu');
  const header = document.getElementById('header');

  if (welcomeHeading) {
    const firstName = String(user.name || '').trim().split(' ')[0] || 'ekipi';
    welcomeHeading.textContent = `Mirë se erdhe, ${firstName}. Menaxho procesin me qartësi.`;
  }

  window.addEventListener('scroll', () => {
    header?.classList.toggle('header-scrolled', window.scrollY > 24);
  });

  mobileMenuBtn?.addEventListener('click', () => {
    navMenu?.classList.toggle('active');
    const isOpen = navMenu?.classList.contains('active');
    mobileMenuBtn.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
  });

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

  logoutBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    await window.PlatformaAuth.logout();
    window.location.href = 'index.html';
  });

  try {
    const data = await window.PlatformaApi.get('/api/employer/dashboard');
    renderMetrics(metricsEl, data);
    renderExpiringJobs(expiringEl, data.expiringJobs || []);
    renderCompanyPlan();
  } catch (error) {
    renderMetrics(metricsEl, {
      activeJobs: 0,
      newApplications: 0,
      pendingReview: 0
    });
    renderError(expiringEl);
    window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë ngarkimit të dashboard-it.');
    renderCompanyPlan();
  }
});

function renderMetrics(container, data) {
  if (!container) return;

  const cards = [
    {
      icon: 'fa-solid fa-briefcase',
      value: Number(data.activeJobs || 0),
      label: 'Shpallje aktive',
      note: 'Pozitat që janë publike dhe marrin aplikime.'
    },
    {
      icon: 'fa-solid fa-file-signature',
      value: Number(data.newApplications || 0),
      label: 'Aplikime 7 ditët e fundit',
      note: 'Volumi i aplikimeve të reja në javën e fundit.'
    },
    {
      icon: 'fa-regular fa-hourglass-half',
      value: Number(data.pendingReview || 0),
      label: 'Në pritje të rishikimit',
      note: 'Kandidatë që presin vendim nga ekipi juaj.'
    }
  ];

  container.innerHTML = cards.map((card) => `
    <article class="metric-card">
      <div class="metric-icon"><i class="${card.icon}"></i></div>
      <div class="metric-value">${card.value.toLocaleString('sq-AL')}</div>
      <div class="metric-label">${card.label}</div>
      <div class="metric-note">${card.note}</div>
    </article>
  `).join('');
}

function renderExpiringJobs(container, jobs) {
  if (!container) return;

  if (!Array.isArray(jobs) || jobs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-calendar-check"></i>
        <h3>Asnjë afat kritik për momentin</h3>
        <p>Nuk ka shpallje që skadojnë brenda 7 ditëve të ardhshme.</p>
        <a href="employer-jobs.html" class="btn btn-outline" style="margin-top: 12px;">
          Menaxho shpalljet
        </a>
      </div>
    `;
    return;
  }

  container.innerHTML = jobs.map((job) => {
    const safeTitle = escapeHtml(job.title || 'Pa titull');
    const deadline = formatDeadline(job.deadlineAt);
    const urgency = getUrgency(job.deadlineAt);

    return `
      <article class="job-item">
        <div>
          <div class="job-title">${safeTitle}</div>
          <div class="job-meta">Afati: ${deadline}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="deadline-badge ${urgency.className}">${urgency.label}</span>
          <a href="employer-jobs.html?edit=${job.id}" class="btn btn-outline" style="font-size: 0.76rem; padding: 4px 10px;" title="Modifiko këtë shpallje"><i class="fa-solid fa-pen-to-square"></i> Edito</a>
        </div>
      </article>
    `;
  }).join('');
}

function renderError(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <h3>Nuk u ngarkuan të dhënat</h3>
      <p>Provo rifreskimin e faqes ose hyr përsëri.</p>
    </div>
  `;
}

function formatDeadline(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('sq-AL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function getUrgency(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return {
      label: 'Pa afat',
      className: 'safe'
    };
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const now = new Date();
  const daysLeft = Math.ceil((date.getTime() - now.getTime()) / dayMs);

  if (daysLeft <= 1) {
    return {
      label: daysLeft < 0 ? 'Ka skaduar' : 'Skadon sot',
      className: 'danger'
    };
  }

  if (daysLeft <= 3) {
    return {
      label: `Skadon për ${daysLeft} ditë`,
      className: 'warn'
    };
  }

  return {
    label: `Skadon për ${daysLeft} ditë`,
    className: 'safe'
  };
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function renderCompanyPlan() {
  const container = document.getElementById('companyPlanSection');
  if (!container) return;

  const raw = localStorage.getItem('activeCompanyPlan');
  let plan = null;
  if (raw) {
    try {
      plan = JSON.parse(raw);
    } catch (_e) {}
  }

  if (plan) {
    const isMonthly = plan.planId === 'subscription' || plan.planId === 'enterprise';
    const quotaText = isMonthly 
      ? (plan.planId === 'enterprise' ? 'Oferta pa limit (Integrim API)' : 'Deri në 10 oferta të aktivizuara në çdo kohë')
      : '1 ofertë pune standarde (30 ditë)';

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 14px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--primary-tint); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
            <i class="fa-solid fa-crown"></i>
          </div>
          <div>
            <h2 style="font-family: 'Sora', sans-serif; font-size: 1.15rem; margin-bottom: 2px;">${escapeHtml(plan.planTitle)}</h2>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-muted);">
              <span>ID: <strong>${escapeHtml(plan.orderId || '-')}</strong></span>
              <span>•</span>
              <span style="color: var(--success); font-weight: 700;"><i class="fa-solid fa-circle-check"></i> ${escapeHtml(plan.status || 'Aktiv')}</span>
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <a href="pricing.html" class="btn btn-outline" style="font-size: 0.84rem; padding: 7px 14px;">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Ndrysho Paketën
          </a>
          <a href="employer-jobs.html" class="btn btn-primary" style="font-size: 0.84rem; padding: 7px 14px;">
            <i class="fa-solid fa-plus"></i> Posto Punë
          </a>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
        <div style="background: var(--bg-body); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 14px;">
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 2px;">ÇMIMI & MODELI</div>
          <div style="font-size: 1.05rem; font-weight: 800; color: var(--text-main);">${escapeHtml(plan.price)} <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-muted);">${escapeHtml(plan.period || '')}</span></div>
        </div>
        <div style="background: var(--bg-body); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 14px;">
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 2px;">KUOTA E SHPALLJEVE</div>
          <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-main);">${quotaText}</div>
        </div>
        <div style="background: var(--bg-body); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 14px;">
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 2px;">AKTIVIZUAR MË</div>
          <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-main);">${escapeHtml(plan.activatedAt || '-')}</div>
        </div>
        <div style="background: var(--bg-body); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 14px;">
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 2px;">METODA E PAGESËS</div>
          <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-main);">${escapeHtml((plan.paymentMethod || 'card').toUpperCase())}</div>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: var(--primary-tint); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
            <i class="fa-solid fa-briefcase"></i>
          </div>
          <div>
            <h3 style="font-family: 'Sora', sans-serif; font-size: 1.05rem; margin-bottom: 2px;">Zgjidhni paketën e shpalljeve për kompaninë</h3>
            <p style="font-size: 0.88rem; color: var(--text-muted); margin: 0;">Paketat fillojnë nga 30€ për ofertë të vetme deri në abonime mujore për rekrutim të rregullt.</p>
          </div>
        </div>
        <a href="pricing.html" class="btn btn-primary" style="padding: 10px 20px; font-weight: 700;">
          <i class="fa-solid fa-tags"></i> Shiko Çmimet & Paketat
        </a>
      </div>
    `;
  }
}
