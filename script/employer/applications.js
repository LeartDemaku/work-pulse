document.addEventListener('DOMContentLoaded', async () => {
  const user = await window.PlatformaAuth.requireAuth('employer');
  if (!user) return;

  const applicationsList = document.getElementById('applicationsList');
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const jobFilter = document.getElementById('jobFilter');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('nav-menu');
  const header = document.getElementById('header');

  const metricTotal = document.getElementById('metricTotal');
  const metricPending = document.getElementById('metricPending');
  const metricInterview = document.getElementById('metricInterview');
  const metricHired = document.getElementById('metricHired');

  let allApplications = [];

  const allowedStatuses = [
    'submitted',
    'viewed',
    'shortlisted',
    'interview',
    'offer',
    'rejected',
    'hired',
    'withdrawn'
  ];

  const statusLabels = {
    submitted: 'Dërguar',
    viewed: 'Parë',
    shortlisted: 'Në listë të shkurtër',
    interview: 'Intervistë',
    offer: 'Ofertë',
    rejected: 'Refuzuar',
    hired: 'Punësuar',
    withdrawn: 'Tërhequr'
  };

  // Koment: Menaxhim i menusë mobile dhe efektit vizual të header-it.
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



  logoutBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    await window.PlatformaAuth.logout();
    window.location.href = 'index.html';
  });

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  function formatDateTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('sq-AL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getVisibleApplications() {
    const query = (searchInput?.value || '').trim().toLowerCase();
    const selectedStatus = statusFilter?.value || 'all';
    const selectedJob = jobFilter?.value || 'all';

    return allApplications.filter((app) => {
      const statusOk = selectedStatus === 'all' || app.status === selectedStatus;
      const jobOk = selectedJob === 'all' || String(app.jobId) === selectedJob;
      const searchTarget = `${app.referenceCode || ''} ${app.fullName || ''} ${app.jobTitle || ''} ${app.email || ''}`.toLowerCase();
      const searchOk = !query || searchTarget.includes(query);

      return statusOk && jobOk && searchOk;
    });
  }

  function updateMetrics(applications) {
    metricTotal.textContent = String(applications.length);
    metricPending.textContent = String(applications.filter((app) => ['submitted', 'viewed'].includes(app.status)).length);
    metricInterview.textContent = String(applications.filter((app) => app.status === 'interview').length);
    metricHired.textContent = String(applications.filter((app) => app.status === 'hired').length);
  }

  function fillJobFilter(applications) {
    const current = jobFilter.value;
    const uniqueJobs = [];
    const map = new Map();

    applications.forEach((app) => {
      if (!map.has(app.jobId)) {
        map.set(app.jobId, app.jobTitle || app.title || `Pozita #${app.jobId}`);
        uniqueJobs.push({ id: app.jobId, title: map.get(app.jobId) });
      }
    });

    jobFilter.innerHTML = '<option value="all">Të gjitha pozitat</option>'
      + uniqueJobs.map((job) => `<option value="${job.id}">${escapeHtml(job.title)}</option>`).join('');

    if (current && [...jobFilter.options].some((opt) => opt.value === current)) {
      jobFilter.value = current;
    }
  }

  function renderEmptyState(message) {
    applicationsList.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-users-slash"></i>
        <h3>${escapeHtml(message || 'Nuk u gjetën aplikime')}</h3>
        <p>Ndryshoni filtrat ose prisni aplikime të reja.</p>
      </div>
    `;
  }

  function renderApplications() {
    const visible = getVisibleApplications();

    if (visible.length === 0) {
      renderEmptyState('Nuk ka rezultate për filtrat aktualë');
      return;
    }

    applicationsList.innerHTML = visible.map((app) => {
      const cover = app.coverLetter
        ? `<div class="cover-letter">${escapeHtml(app.coverLetter)}</div>`
        : '<div class="cover-letter">Kandidati nuk ka shtuar mesazh motivues.</div>';
      const cvUrl = app.cvDownloadUrl || (app.cvFilePath ? `/api/applications/${app.id}/cv` : null);
      const cvAction = cvUrl
        ? `<a class="btn btn-outline" href="${escapeHtml(cvUrl)}" target="_blank" rel="noopener"><i class="fa-solid fa-file-arrow-down"></i> Shiko CV</a>`
        : '<span class="badge status-withdrawn"><i class="fa-regular fa-file"></i> Pa CV</span>';

      return `
        <article class="application-card">
          <div class="app-top">
            <div>
              <h3 class="candidate-name">${escapeHtml(app.fullName || 'Kandidat')}</h3>
              <div class="app-meta">
                <span><i class="fa-solid fa-hashtag"></i> ${escapeHtml(app.referenceCode || '-')}</span>
                <span><i class="fa-solid fa-briefcase"></i> ${escapeHtml(app.jobTitle || app.title || '-')}</span>
                <span><i class="fa-regular fa-clock"></i> ${escapeHtml(formatDateTime(app.appliedAt))}</span>
              </div>
              <div class="app-meta" style="margin-top: 6px;">
                <span><i class="fa-regular fa-envelope"></i> ${escapeHtml(app.email || '-')}</span>
                <span><i class="fa-solid fa-phone"></i> ${escapeHtml(app.phone || '-')}</span>
                <span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(app.city || '-')}</span>
              </div>
            </div>
            <span class="badge status-${escapeHtml(app.status)}">${escapeHtml(statusLabels[app.status] || app.status)}</span>
          </div>

          <div class="app-body">
            ${cover}

            <div class="app-actions">
              <select class="status-select" data-id="${app.id}">
                ${allowedStatuses.map((status) => `<option value="${status}" ${app.status === status ? 'selected' : ''}>${escapeHtml(statusLabels[status])}</option>`).join('')}
              </select>
              <textarea class="note-input" data-id="${app.id}" placeholder="Shto shënim për këtë kandidat..."></textarea>
              <div class="inline-actions">
                ${cvAction}
                <button class="btn btn-primary save-status-btn" data-id="${app.id}"><i class="fa-solid fa-check"></i> Ruaj statusin</button>
                <button class="btn btn-outline save-note-btn" data-id="${app.id}"><i class="fa-solid fa-note-sticky"></i> Ruaj shënimin</button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    attachCardActions();
  }

  async function saveStatus(applicationId) {
    const statusSelect = document.querySelector(`.status-select[data-id="${applicationId}"]`);
    const noteInput = document.querySelector(`.note-input[data-id="${applicationId}"]`);
    const status = statusSelect?.value;
    const note = (noteInput?.value || '').trim();

    if (!status) return;

    try {
      await window.PlatformaApi.patch(`/api/employer/applications/${applicationId}/status`, {
        status,
        note: note || null
      });

      window.PlatformaToast.showToast('success', 'Statusi i aplikimit u përditësua.');
      await loadApplications();
    } catch (error) {
      window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë përditësimit të statusit.');
    }
  }

  async function saveNote(applicationId) {
    const noteInput = document.querySelector(`.note-input[data-id="${applicationId}"]`);
    const note = (noteInput?.value || '').trim();

    if (!note) {
      window.PlatformaToast.showToast('error', 'Shënimi nuk mund të jetë bosh.');
      return;
    }

    try {
      await window.PlatformaApi.post(`/api/employer/applications/${applicationId}/note`, { note });
      window.PlatformaToast.showToast('success', 'Shënimi u ruajt me sukses.');
      noteInput.value = '';
    } catch (error) {
      window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë ruajtjes së shënimit.');
    }
  }

  function attachCardActions() {
    document.querySelectorAll('.save-status-btn').forEach((btn) => {
      btn.addEventListener('click', () => saveStatus(btn.dataset.id));
    });

    document.querySelectorAll('.save-note-btn').forEach((btn) => {
      btn.addEventListener('click', () => saveNote(btn.dataset.id));
    });
  }

  async function exportCsv() {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/employer/applications/export.csv`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Eksporti dështoi.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'applications.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      window.PlatformaToast.showToast('success', 'Eksporti CSV u shkarkua me sukses.');
    } catch (error) {
      window.PlatformaToast.showToast('error', error?.message || 'Gabim gjatë eksportit CSV.');
    }
  }

  async function loadApplications() {
    allApplications = await window.PlatformaApi.get('/api/employer/applications');
    updateMetrics(allApplications);
    fillJobFilter(allApplications);
    renderApplications();
  }

  function bindFilters() {
    searchInput?.addEventListener('input', renderApplications);
    statusFilter?.addEventListener('change', renderApplications);
    jobFilter?.addEventListener('change', renderApplications);

    resetFiltersBtn?.addEventListener('click', () => {
      searchInput.value = '';
      statusFilter.value = 'all';
      jobFilter.value = 'all';
      renderApplications();
    });
  }

  exportCsvBtn?.addEventListener('click', exportCsv);

  bindFilters();

  try {
    await loadApplications();
  } catch (error) {
    applicationsList.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <h3>Patëm një problem</h3>
        <p>Nuk mundëm të ngarkojmë aplikimet. Ju lutemi provoni përsëri.</p>
      </div>
    `;
    window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë ngarkimit të aplikimeve.');
  }
});
