document.addEventListener('DOMContentLoaded', async () => {
  const user = await window.PlatformaAuth.requireAuth('employer');
  if (!user) return;

  const jobsList = document.getElementById('jobsList');
  const jobsStatusFilter = document.getElementById('jobsStatusFilter');
  const jobsCountNote = document.getElementById('jobsCountNote');
  const addJobForm = document.getElementById('addJobForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const focusCreateJobBtn = document.getElementById('focusCreateJobBtn');
  const createJobPanel = document.getElementById('createJobPanel');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('nav-menu');
  const header = document.getElementById('header');

  const metricTotal = document.getElementById('metricTotal');
  const metricActive = document.getElementById('metricActive');
  const metricPaused = document.getElementById('metricPaused');
  const metricApplications = document.getElementById('metricApplications');

  let allJobs = [];

  // Menaxhim i menusë mobile dhe efektit të header-it gjatë scroll.
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

  focusCreateJobBtn?.addEventListener('click', () => {
    createJobPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('jobTitle')?.focus();
  });

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

  function formatDate(dateString) {
    if (!dateString) return 'Pa afat';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Pa afat';

    return date.toLocaleDateString('sq-AL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function toLabelEmployment(value) {
    const map = {
      full_time: 'Full-time',
      part_time: 'Part-time',
      internship: 'Praktikë',
      contract: 'Me kontratë'
    };
    if (!value || value === '-') return '';
    return map[value] || value;
  }

  function toLabelWorkMode(value) {
    const map = {
      onsite: 'Në zyrë',
      on_site: 'Në zyrë',
      remote: 'Nga shtëpia',
      hybrid: 'Hibrid'
    };
    if (!value || value === '-') return '';
    return map[value] || value;
  }

  function toLabelStatus(value) {
    const map = {
      active: 'Aktive',
      draft: 'Draft',
      paused: 'Në pauzë',
      closed: 'Të mbyllura'
    };
    return map[value] || value || '-';
  }

  function getDeadlineTone(deadlineAt) {
    if (!deadlineAt) return 'safe';
    const now = Date.now();
    const deadline = new Date(deadlineAt).getTime();
    if (Number.isNaN(deadline)) return 'safe';

    const daysLeft = (deadline - now) / (1000 * 60 * 60 * 24);
    if (daysLeft <= 3) return 'danger';
    if (daysLeft <= 7) return 'warn';
    return 'safe';
  }

  function renderEmptyState(message) {
    if (!jobsList) return;
    jobsList.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-briefcase"></i>
        <h3>${escapeHtml(message || 'Nuk u gjetën shpallje')}</h3>
        <p>Krijoni shpalljen e parë për të nisur rekrutimin.</p>
      </div>
    `;
  }

  function updateMetrics(jobs) {
    const total = jobs.length;
    const active = jobs.filter((job) => job.status === 'active').length;
    const paused = jobs.filter((job) => job.status === 'paused').length;
    const applications = jobs.reduce((sum, job) => sum + Number(job.applicationsCount || 0), 0);

    if (metricTotal) metricTotal.textContent = String(total);
    if (metricActive) metricActive.textContent = String(active);
    if (metricPaused) metricPaused.textContent = String(paused);
    if (metricApplications) metricApplications.textContent = String(applications);
  }

  async function updateStatus(jobId, status) {
    try {
      await window.PlatformaApi.patch(`/api/employer/jobs/${jobId}/status`, { status });
      window.PlatformaToast.showToast('success', 'Statusi u përditësua.');
      await loadJobs();
    } catch (error) {
      window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë përditësimit.');
    }
  }

  async function duplicateJob(jobId) {
    try {
      await window.PlatformaApi.post(`/api/employer/jobs/${jobId}/duplicate`, {});
      window.PlatformaToast.showToast('success', 'Shpallja u duplikua.');
      await loadJobs();
    } catch (error) {
      window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë duplikimit.');
    }
  }

  async function deleteJob(jobId) {
    const normalizedId = Number.parseInt(String(jobId || ''), 10);
    if (!Number.isInteger(normalizedId) || normalizedId < 1) {
      window.PlatformaToast.showToast('error', 'ID e shpalljes nuk është valide për fshirje.');
      return;
    }

    const confirmed = window.confirm('A jeni të sigurt që doni ta fshini këtë shpallje? Ky veprim nuk kthehet mbrapa.');
    if (!confirmed) return;

    try {
      await window.PlatformaApi.delete(`/api/employer/jobs/${encodeURIComponent(String(normalizedId))}`);
      window.PlatformaToast.showToast('success', 'Shpallja u fshi me sukses.');
      await loadJobs();
    } catch (error) {
      window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë fshirjes së shpalljes.');
    }
  }

  function attachRowActions() {
    document.querySelectorAll('.status-btn').forEach((btn) => {
      btn.addEventListener('click', () => updateStatus(btn.dataset.id, btn.dataset.status));
    });

    document.querySelectorAll('.duplicate-btn').forEach((btn) => {
      btn.addEventListener('click', () => duplicateJob(btn.dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => deleteJob(btn.dataset.id));
    });
  }

  function renderJobs(jobs) {
    if (!jobsList) return;

    const filter = jobsStatusFilter?.value || 'all';
    const filtered = filter === 'all' ? jobs : jobs.filter((job) => job.status === filter);

    if (jobsCountNote) {
      jobsCountNote.textContent = `${filtered.length} shpallje`;
    }

    if (filtered.length === 0) {
      renderEmptyState(filter === 'all' ? 'Nuk keni ende shpallje' : 'Nuk ka shpallje për këtë status');
      return;
    }

    jobsList.innerHTML = filtered.map((job) => {
      const deadlineTone = getDeadlineTone(job.deadlineAt);
      const loc = job.location && job.location !== '-' ? job.location : null;
      const emp = toLabelEmployment(job.employmentType);
      const mode = toLabelWorkMode(job.workMode);

      const metaParts = [];
      if (loc) metaParts.push(`<span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(loc)}</span>`);
      if (emp) metaParts.push(`<span><i class="fa-solid fa-briefcase"></i> ${escapeHtml(emp)}</span>`);
      if (mode) metaParts.push(`<span><i class="fa-solid fa-display"></i> ${escapeHtml(mode)}</span>`);

      const metaHtml = metaParts.length > 0 ? metaParts.join('') : '<span><i class="fa-solid fa-building"></i> Kompani</span>';

      return `
        <article class="job-card">
          <div class="job-top">
            <div>
              <h3 class="job-title">${escapeHtml(job.title)}</h3>
              <div class="job-meta">
                ${metaHtml}
              </div>
            </div>
            <span class="badge status-${escapeHtml(job.status)}">${escapeHtml(toLabelStatus(job.status))}</span>
          </div>

          <div class="job-bottom">
            <div class="job-stats">
              <span class="stat-pill"><i class="fa-solid fa-hashtag"></i> ID: ${job.id}</span>
              <span class="stat-pill"><i class="fa-solid fa-user-group"></i> Aplikime: ${job.applicationsCount || 0}</span>
              <span class="stat-pill ${deadlineTone}"><i class="fa-regular fa-calendar"></i> Afati: ${escapeHtml(formatDate(job.deadlineAt))}</span>
            </div>

            <div class="job-actions">
              <button class="btn btn-outline status-btn" data-id="${job.id}" data-status="active">Aktivo</button>
              <button class="btn btn-outline status-btn" data-id="${job.id}" data-status="paused">Pauzo</button>
              <button class="btn btn-outline status-btn" data-id="${job.id}" data-status="closed">Mbyll</button>
              <button class="btn btn-primary duplicate-btn" data-id="${job.id}">Dupliko</button>
              <button class="btn btn-outline delete-btn" data-id="${job.id}">Fshij</button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    attachRowActions();
  }

  async function loadJobs() {
    try {
      allJobs = await window.PlatformaApi.get('/api/employer/jobs');
      updateMetrics(allJobs);
      renderJobs(allJobs);
    } catch (error) {
      renderEmptyState('Gabim gjatë ngarkimit të shpalljeve');
      window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë ngarkimit të shpalljeve.');
    }
  }

  addJobForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      title: document.getElementById('jobTitle').value.trim(),
      description: document.getElementById('jobDescription').value.trim(),
      location: document.getElementById('jobLocation').value.trim(),
      positions: Number(document.getElementById('jobPositions').value || 1),
      employmentType: document.getElementById('jobEmploymentType').value,
      experienceLevel: document.getElementById('jobExperienceLevel').value,
      workMode: document.getElementById('jobWorkMode').value,
      status: document.getElementById('jobStatus').value,
      deadlineAt: document.getElementById('jobDeadline').value || null,
      requiredSkills: document.getElementById('jobSkills').value
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
    };

    try {
      await window.PlatformaApi.post('/api/employer/jobs', payload);
      addJobForm.reset();
      document.getElementById('jobLocation').value = 'Prishtinë';
      document.getElementById('jobPositions').value = '1';
      window.PlatformaToast.showToast('success', 'Shpallja u krijua me sukses.');
      await loadJobs();
    } catch (error) {
      window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë krijimit të shpalljes.');
    }
  });

  jobsStatusFilter?.addEventListener('change', () => renderJobs(allJobs));

  try {
    await loadJobs();
  } catch (error) {
    renderEmptyState('Gabim gjatë ngarkimit të shpalljeve');
    window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë ngarkimit të shpalljeve.');
  }
});
