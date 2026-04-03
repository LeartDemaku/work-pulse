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

  logoutBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    await window.PlatformaAuth.logout();
    window.location.href = 'index.html';
  });

  try {
    const data = await window.PlatformaApi.get('/api/employer/dashboard');
    renderMetrics(metricsEl, data);
    renderExpiringJobs(expiringEl, data.expiringJobs || []);
  } catch (error) {
    renderMetrics(metricsEl, {
      activeJobs: 0,
      newApplications: 0,
      pendingReview: 0
    });
    renderError(expiringEl);
    window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë ngarkimit të dashboard-it.');
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
        <span class="deadline-badge ${urgency.className}">${urgency.label}</span>
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

  // Koment: Statusi i afatit përcaktohet sipas ditëve që kanë mbetur.
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
