document.addEventListener('DOMContentLoaded', async function () {
    const auth = window.PlatformaAuth;
    const api = window.PlatformaApi;
    const toast = window.PlatformaToast;

    const user = await auth.requireAuth('admin');
    if (!user) return;

    const logoutBtn = document.getElementById('logoutBtn');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('nav-menu');

    mobileMenuBtn?.addEventListener('click', () => {
        navMenu?.classList.toggle('active');
        const isOpen = navMenu?.classList.contains('active');
        mobileMenuBtn.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });

    logoutBtn?.addEventListener('click', async function (e) {
        e.preventDefault();
        await auth.logout();
        window.location.href = 'index.html';
    });

    const kpiGrid = document.getElementById('kpiGrid');
    const usersTableBody = document.getElementById('usersTableBody');
    const reportsTableBody = document.getElementById('reportsTableBody');
    const jobModerationForm = document.getElementById('jobModerationForm');

    async function loadReports() {
        const reportData = await api.get('/api/admin/reports');

        kpiGrid.innerHTML = `
      <div class="kpi"><div class="num">${reportData.totals.totalUsers}</div><div>Përdorues</div></div>
      <div class="kpi"><div class="num">${reportData.totals.totalJobs}</div><div>Shpallje</div></div>  
      <div class="kpi"><div class="num">${reportData.totals.activeJobs}</div><div>Shpallje aktive</div></div>
      <div class="kpi"><div class="num">${reportData.totals.totalApplications}</div><div>Aplikime</div></div>
      <div class="kpi"><div class="num">${reportData.totals.openReports}</div><div>Raporte të hapura</div></div>
    `;
    }

    async function loadUsers() {
        const users = await api.get('/api/admin/users');

        usersTableBody.innerHTML = users.map((u) => `
      <tr>
        <td>${u.id}</td>
        <td>${escapeHtml(u.name)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.role)}</td>
        <td>${escapeHtml(u.status)}</td>
        <td>
          <select data-user-id="${u.id}" class="user-status-select">
            <option value="active" ${u.status === 'active' ? 'selected' : ''}>active</option>
            <option value="suspended" ${u.status === 'suspended' ? 'selected' : ''}>suspended</option>
            <option value="deleted" ${u.status === 'deleted' ? 'selected' : ''}>deleted</option>
          </select>
        </td>
      </tr>
    `).join('');

        document.querySelectorAll('.user-status-select').forEach((el) => {
            el.addEventListener('change', async function () {
                const userId = this.getAttribute('data-user-id');
                try {
                    await api.patch(`/api/admin/users/${userId}/status`, { status: this.value });
                    toast.showToast('success', 'Statusi i përdoruesit u përditësua.');
                } catch (error) {
                    toast.showToast('error', error?.payload?.message || 'Gabim gjatë përditësimit.');
                }
            });
        });
    }

    async function loadReportFlags() {
        const reports = await api.get('/api/admin/report-flags');

        reportsTableBody.innerHTML = reports.map((r) => `
      <tr>
        <td>${r.id}</td>
        <td>${escapeHtml(r.targetType)} #${r.targetId}</td>
        <td>${escapeHtml(r.reason)}</td>
        <td>${escapeHtml(r.status)}</td>
        <td>
          ${r.status === 'open'
                ? `<button class="btn btn-outline resolve-btn" data-report-id="${r.id}">Resolve</button>`
                : '-'}
        </td>
      </tr>
    `).join('');

        document.querySelectorAll('.resolve-btn').forEach((btn) => {
            btn.addEventListener('click', async function () {
                const reportId = this.getAttribute('data-report-id');
                try {
                    await api.post(`/api/admin/report-flags/${reportId}/resolve`, { resolution: 'Resolved by admin panel' });
                    toast.showToast('success', 'Raporti u mbyll me sukses.');
                    await loadReportFlags();
                } catch (error) {
                    toast.showToast('error', error?.payload?.message || 'Gabim gjatë mbylljes së raportit.');
                }
            });
        });
    }

    jobModerationForm?.addEventListener('submit', async function (e) {
        e.preventDefault();

        const id = Number(document.getElementById('moderationJobId').value || 0);
        const status = document.getElementById('moderationStatus').value;

        if (!id) {
            toast.showToast('error', 'Shkruani një Job ID valide.');
            return;
        }

        try {
            await api.patch(`/api/admin/jobs/${id}/moderation-status`, { status });
            toast.showToast('success', 'Statusi i moderimit u aplikua.');
            jobModerationForm.reset();
        } catch (error) {
            toast.showToast('error', error?.payload?.message || 'Gabim gjatë moderimit.');
        }
    });

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    try {
        await Promise.all([loadReports(), loadUsers(), loadReportFlags()]);
    } catch (error) {
        toast.showToast('error', error?.payload?.message || 'Gabim gjatë ngarkimit të panelit admin.');
    }
});
