document.addEventListener('DOMContentLoaded', async () => {
  const user = await window.PlatformaAuth.requireAuth('job_seeker');
  if (!user) return;

  const applicationsGrid = document.getElementById('applicationsGrid');
  const statsBar = document.getElementById('statsBar');
  const statusFilter = document.getElementById('statusFilter');
  const logoutBtn = document.getElementById('logoutBtn');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('nav-menu');
  const header = document.getElementById('header');

  // Koment: Menyja mobile hapet/mbyllet me ikonë dinamike.
  mobileMenuBtn?.addEventListener('click', () => {
    navMenu?.classList.toggle('active');
    const isOpen = navMenu?.classList.contains('active');
    mobileMenuBtn.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
  });

  // Header Scroll Effect
  window.addEventListener('scroll', () => {
    header?.classList.toggle('header-scrolled', window.scrollY > 24);
  });

  // User Dropdown Logic
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userDropdown');
  const userDisplayName = document.getElementById('userDisplayName');

  if (userDisplayName) {
    userDisplayName.textContent = user.name || 'Kandidat';
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

  const statusConfig = {
    submitted: { label: 'Dërguar', icon: 'fa-paper-plane', color: 'status-submitted' },
    viewed: { label: 'Parë', icon: 'fa-eye', color: 'status-viewed' },
    shortlisted: { label: 'Në listë të shkurtër', icon: 'fa-list-check', color: 'status-shortlisted' },
    interview: { label: 'Intervistë', icon: 'fa-users', color: 'status-interview' },
    offer: { label: 'Ofertë', icon: 'fa-gift', color: 'status-offer' },
    hired: { label: 'Punësuar', icon: 'fa-check-circle', color: 'status-hired' },
    rejected: { label: 'Refuzuar', icon: 'fa-times-circle', color: 'status-rejected' },
    withdrawn: { label: 'Tërhequr', icon: 'fa-undo', color: 'status-withdrawn' }
  };

  const statusOrder = ['submitted', 'viewed', 'shortlisted', 'interview', 'offer', 'hired'];

  function getStatusProgress(status) {
    const index = statusOrder.indexOf(status);
    if (index === -1) return 0;
    return ((index + 1) / statusOrder.length) * 100;
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('sq-AL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('sq-AL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  function getStatusBadge(status) {
    const config = statusConfig[status] || { label: status, icon: 'fa-circle', color: 'status-submitted' };
    return `<span class="status-badge ${config.color}"><i class="fas ${config.icon}"></i> ${config.label}</span>`;
  }

  function renderTimeline(timeline, currentStatus) {
    if (!timeline || timeline.length === 0) {
      return '<div class="timeline-item current"><i class="fas fa-circle"></i> Dërguar</div>';
    }

    return timeline.map((item) => {
      const isCurrent = item.newStatus === currentStatus;
      const date = formatDateTime(item.changedAt);
      const statusLabel = statusConfig[item.newStatus]?.label || item.newStatus;
      return `
        <div class="timeline-item ${isCurrent ? 'current' : ''}">
          <i class="fas fa-circle"></i>
          <span>${escapeHtml(statusLabel)} - ${escapeHtml(date)}</span>
        </div>
      `;
    }).join('');
  }

  function renderProgressBar(status) {
    const progress = getStatusProgress(status);
    const currentIndex = statusOrder.indexOf(status);

    return `
      <div class="progress-labels">
        <span>Dërguar</span>
        <span>${currentIndex >= 4 ? 'Ofertë' : 'Në proces'}</span>
        <span>Punësuar</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
    `;
  }

  function renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-folder-open"></i>
        </div>
        <h3>Nuk keni asnjë aplikim</h3>
        <p>Filloni duke aplikuar për vendet e punës.</p>
        <a href="apply.html" class="btn btn-primary" style="display: inline-flex; margin-top: 16px;">
          <i class="fas fa-search"></i> Kërko vende pune
        </a>
      </div>
    `;
  }

  function renderApplicationCard(app) {
    const canWithdraw = !['interview', 'offer', 'hired', 'withdrawn', 'rejected'].includes(app.status);
    const isWithdrawn = app.status === 'withdrawn';
    const isRejected = app.status === 'rejected';

    return `
      <div class="application-card ${isWithdrawn ? 'withdrawn' : ''}">
        <div class="card-header">
          <div class="job-info">
            <h3 class="job-title">${escapeHtml(app.jobTitle)}</h3>
            <div class="company-info">
              <span class="company-name">
                <i class="fas fa-building"></i>
                ${escapeHtml(app.company || 'Kompania')}
              </span>
              <div class="meta-info">
                <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(app.location || 'N/A')}</span>
                <span><i class="fas fa-calendar"></i> Afati: ${escapeHtml(formatDate(app.deadlineAt))}</span>
              </div>
            </div>
          </div>
          ${getStatusBadge(app.status)}
        </div>

        <div class="card-body">
          <span class="ref-code">Ref: ${escapeHtml(app.referenceCode || '-')}</span>
          ${!isWithdrawn && !isRejected ? renderProgressBar(app.status) : ''}
          <div class="timeline">
            ${renderTimeline(app.timeline, app.status)}
          </div>
        </div>

        <div class="card-footer">
          <span class="applied-date">
            <i class="fas fa-clock"></i>
            Aplikuar më: ${formatDateTime(app.appliedAt)}
          </span>
          <div class="card-actions">
            ${canWithdraw ? `
              <button class="btn-withdraw withdraw-btn" data-id="${app.id}">
                <i class="fas fa-undo"></i> Tërhiq aplikimin
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  function updateStats(apps) {
    const total = apps.length;
    const active = apps.filter((a) => !['withdrawn', 'rejected', 'hired'].includes(a.status)).length;
    const interviews = apps.filter((a) => a.status === 'interview').length;
    const offers = apps.filter((a) => a.status === 'offer').length;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('activeCount').textContent = active;
    document.getElementById('interviewCount').textContent = interviews;
    document.getElementById('offerCount').textContent = offers;

    statsBar.style.display = total === 0 ? 'none' : 'grid';
  }

  async function loadApplications() {
    try {
      const status = statusFilter.value;
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      const apps = await window.PlatformaApi.get(`/api/jobseeker/applications${query}`);

      updateStats(apps);

      if (!apps || apps.length === 0) {
        applicationsGrid.innerHTML = renderEmptyState();
        return;
      }

      applicationsGrid.innerHTML = apps.map(renderApplicationCard).join('');

      document.querySelectorAll('.withdraw-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm('A jeni të sigurt që doni të tërhiqni këtë aplikim?')) return;

          try {
            await window.PlatformaApi.patch(`/api/jobseeker/applications/${btn.dataset.id}/withdraw`, {});
            window.PlatformaToast.showToast('success', 'Aplikimi u tërhoq me sukses.');
            await loadApplications();
          } catch (error) {
            window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë tërheqjes së aplikimit.');
          }
        });
      });
    } catch (error) {
      console.error(error);
      applicationsGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon" style="color: #dc2626;">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <h3>Patëm një problem</h3>
          <p>Nuk mundëm të ngarkojmë aplikimet tuaja. Ju lutemi provoni përsëri.</p>
          <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 16px;">
            <i class="fas fa-rotate-right"></i> Provo përsëri
          </button>
        </div>
      `;
      window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë ngarkimit të aplikimeve.');
    }
  }

  statusFilter?.addEventListener('change', loadApplications);

  await loadApplications();
});
