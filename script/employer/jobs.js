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

  mobileMenuBtn?.addEventListener('click', () => {
    navMenu?.classList.toggle('active');
    const isOpen = navMenu?.classList.contains('active');
    mobileMenuBtn.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
  });

  window.addEventListener('scroll', () => {
    header?.classList.toggle('header-scrolled', window.scrollY > 24);
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

  focusCreateJobBtn?.addEventListener('click', () => {
    createJobPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('jobTitle')?.focus();
  });

  logoutBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    await window.PlatformaAuth.logout();
    window.location.href = 'index.html';
  });

  function renderJobPlanBadge() {
    const container = document.getElementById('activePlanJobBadge');
    if (!container) return;

    const raw = localStorage.getItem('activeCompanyPlan');
    let plan = null;
    if (raw) {
      try {
        plan = JSON.parse(raw);
      } catch (_e) {}
    }

    if (plan) {
      container.innerHTML = `
        <div style="background: var(--primary-tint); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Paketa Aktive për këtë Shpallje</div>
            <div style="font-size: 0.95rem; font-weight: 800; color: var(--text-main);">${escapeHtml(plan.planTitle)} (${escapeHtml(plan.price)}) • <span style="color: var(--success);"><i class="fa-solid fa-circle-check"></i> ${escapeHtml(plan.status || 'Aktiv')}</span></div>
          </div>
          <a href="pricing.html" class="btn btn-outline" style="font-size: 0.8rem; padding: 5px 12px;">Ndrysho Paketën</a>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="background: var(--bg-body); border: 1px dashed var(--border-color); border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-main);">Dëshironi dukshmëri maksimale apo promovim në rrjete sociale?</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Zgjidhni Paketën Premium ose Abonimin Mujor për të marrë aplikime më shpejt.</div>
          </div>
          <a href="pricing.html" class="btn btn-primary" style="font-size: 0.8rem; padding: 6px 14px;">Zgjidh Paketën</a>
        </div>
      `;
    }
  }

  renderJobPlanBadge();

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

  function editJob(id) {
    openEditModal(id);
  }

  function resetJobForm() {
    addJobForm.reset();
    const editingInput = document.getElementById('editingJobId');
    if (editingInput) editingInput.value = '';

    const locEl = document.getElementById('jobLocation');
    if (locEl) locEl.value = 'Prishtinë';

    const posEl = document.getElementById('jobPositions');
    if (posEl) posEl.value = '1';

    const submitBtn = document.getElementById('submitJobBtn');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Publiko shpalljen';
    }

    const cancelBtn = document.getElementById('cancelEditJobBtn');
    if (cancelBtn) {
      cancelBtn.style.display = 'none';
    }

    const preview = document.getElementById('jobDescriptionPreview');
    const textarea = document.getElementById('jobDescription');
    const toggleBtn = document.getElementById('toggleDescPreview');
    if (preview && textarea) {
      preview.style.display = 'none';
      textarea.style.display = 'block';
    }
    if (toggleBtn) {
      toggleBtn.classList.remove('active');
      toggleBtn.innerHTML = '<i class="fa-solid fa-eye"></i> Parapamje';
    }
  }

  function attachRowActions() {
    document.querySelectorAll('.status-btn').forEach((btn) => {
      btn.addEventListener('click', () => updateStatus(btn.dataset.id, btn.dataset.status));
    });

    document.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => editJob(btn.dataset.id));
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
              <button class="btn btn-outline edit-btn" data-id="${job.id}"><i class="fa-solid fa-pen-to-square"></i> Edito</button>
              <button class="btn btn-primary duplicate-btn" data-id="${job.id}">Dupliko</button>
              <button class="btn btn-outline delete-btn" data-id="${job.id}">Fshij</button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    attachRowActions();
  }

  function formatJobDescription(raw) {
    if (!raw || !String(raw).trim()) {
      return '<p class="job-desc-paragraph">Nuk ka përshkrim të detajuar për këtë pozitë.</p>';
    }

    const trimmed = String(raw).trim();
    const hasHtml = /<(p|br|div|ul|ol|li|strong|b|em|h[1-6])\b[^>]*>/i.test(trimmed);
    if (hasHtml) {
      return trimmed
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
        .replace(/on\w+\s*=\s*'[^']*'/gi, '')
        .replace(/javascript:/gi, '');
    }

    const normalized = trimmed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n');

    const headingKeywordsRegex = /^(detyrat|përgjegjësitë|pergjegjesite|kualifikimet|kriteret|kërkesat|kerkesat|çfarë ofrojmë|cfare ofrojme|çfarë ofron|cfare ofron|përfitimet|perfitimet|benefitet|si të aplikoni|si te aplikoni|mënyra e aplikimit|menyra e aplikimit|rreth nesh|rreth kompanisë|rreth kompanise|rreth rolit|përshkrimi i rolit|pershkrimi i rolit|responsibilities|key responsibilities|additional responsibilities|requirements|qualifications|your profile|profile|what we offer|how to apply|about us|about the role)\b/i;

    const isHeadingLine = (line) => {
      const l = line.trim();
      if (!l) return false;
      if (l.length > 90) return false;
      if (headingKeywordsRegex.test(l)) return true;
      if (l.endsWith(':') || l.endsWith('?')) {
        if (!l.includes('.') && l.length <= 80) return true;
      }
      return false;
    };

    const isBulletLine = (line) => {
      const l = line.trim();
      return /^[-*•–—›»]\s+/.test(l) || /^\d+[\.\)]\s+/.test(l);
    };

    const cleanBulletText = (line) => {
      return line.trim().replace(/^[-*•–—›»]\s+/, '').replace(/^\d+[\.\)]\s+/, '');
    };

    const linkify = (text) => {
      return text.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="job-desc-link">$1</a>');
    };

    let html = '';
    let inList = false;
    let inListSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        continue;
      }

      if (isHeadingLine(line)) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        const lower = line.toLowerCase();
        const isParagraphHeading = lower.includes('si të aplikoni') || lower.includes('si te aplikoni') || lower.includes('how to apply') || lower.includes('about the role') || lower.includes('rreth rolit') || lower.includes('rreth nesh');
        inListSection = !isParagraphHeading;
        const cleanTitle = line.replace(/[:]$/, '');
        html += `<div class="job-desc-heading"><i class="fa-solid fa-circle-check"></i><span>${escapeHtml(cleanTitle)}</span></div>`;
        continue;
      }

      if (isBulletLine(line)) {
        if (!inList) {
          html += '<ul class="job-desc-list">';
          inList = true;
        }
        html += `<li><span class="bullet-dot"></span><span class="bullet-text">${linkify(escapeHtml(cleanBulletText(line)))}</span></li>`;
        continue;
      }

      if (inListSection) {
        if (line.length < 250 && !line.endsWith(':')) {
          if (!inList) {
            html += '<ul class="job-desc-list">';
            inList = true;
          }
          html += `<li><span class="bullet-dot"></span><span class="bullet-text">${linkify(escapeHtml(line))}</span></li>`;
          continue;
        } else {
          inListSection = false;
        }
      }

      if (inList) {
        html += '</ul>';
        inList = false;
      }
      inListSection = false;
      html += `<p class="job-desc-paragraph">${linkify(escapeHtml(line))}</p>`;
    }

    if (inList) {
      html += '</ul>';
    }

    return html;
  }

  const descTextarea = document.getElementById('jobDescription');
  const descPreview = document.getElementById('jobDescriptionPreview');
  const togglePreviewBtn = document.getElementById('toggleDescPreview');

  document.querySelectorAll('.btn-tool[data-tool]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!descTextarea) return;
      const tool = btn.dataset.tool;
      let snippet = '';

      if (tool === 'detyrat') {
        snippet = '\n\nDetyrat dhe përgjegjësitë\n• ';
      } else if (tool === 'kualifikimet') {
        snippet = '\n\nKualifikimet dhe kriteret e kërkuara\n• ';
      } else if (tool === 'ofron') {
        snippet = '\n\nÇfarë ofrojmë\n• ';
      } else if (tool === 'aplikimi') {
        snippet = '\n\nSi të aplikoni?\n';
      } else if (tool === 'bullet') {
        snippet = '\n• ';
      }

      const start = descTextarea.selectionStart;
      const end = descTextarea.selectionEnd;
      const text = descTextarea.value;
      descTextarea.value = text.substring(0, start) + snippet + text.substring(end);
      descTextarea.focus();
      descTextarea.selectionStart = descTextarea.selectionEnd = start + snippet.length;

      if (descPreview && descPreview.style.display !== 'none') {
        descPreview.innerHTML = formatJobDescription(descTextarea.value);
      }
    });
  });

  togglePreviewBtn?.addEventListener('click', () => {
    if (!descTextarea || !descPreview) return;
    const isShowing = descPreview.style.display !== 'none';
    if (isShowing) {
      descPreview.style.display = 'none';
      descTextarea.style.display = 'block';
      togglePreviewBtn.classList.remove('active');
      togglePreviewBtn.innerHTML = '<i class="fa-solid fa-eye"></i> Parapamje';
    } else {
      descPreview.innerHTML = formatJobDescription(descTextarea.value);
      descPreview.style.display = 'block';
      descTextarea.style.display = 'none';
      togglePreviewBtn.classList.add('active');
      togglePreviewBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Edito Tekstin';
    }
  });

  const cancelEditBtn = document.getElementById('cancelEditJobBtn');
  cancelEditBtn?.addEventListener('click', () => {
    resetJobForm();
  });

  const editJobModal = document.getElementById('editJobModal');
  const closeEditModalBtn = document.getElementById('closeEditModalBtn');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalEditJobForm = document.getElementById('modalEditJobForm');

  async function openEditModal(id) {
    let job = allJobs.find((j) => String(j.id) === String(id)) || {};
    try {
      const empJob = await window.PlatformaApi.get(`/api/employer/jobs/${encodeURIComponent(id)}`);
      if (empJob && empJob.id) {
        job = { ...job, ...empJob };
      }
    } catch (_e) {}

    if (!job.description) {
      try {
        const publicJob = await window.PlatformaApi.get(`/api/jobs/${encodeURIComponent(id)}`);
        if (publicJob && publicJob.id) {
          job = { ...job, ...publicJob };
        }
      } catch (_e2) {}
    }

    if (!job || !job.id || !editJobModal) return;

    const idInput = document.getElementById('modalEditingJobId');
    if (idInput) idInput.value = String(job.id);

    const sub = document.getElementById('modalJobSubtitle');
    if (sub) sub.textContent = `ID #${job.id} • ${job.company || job.companyName || ''}`;

    const titleEl = document.getElementById('modalJobTitle');
    if (titleEl) titleEl.value = job.title || '';

    const locEl = document.getElementById('modalJobLocation');
    if (locEl) locEl.value = job.location || 'Prishtinë';

    const posEl = document.getElementById('modalJobPositions');
    if (posEl) posEl.value = job.positions || 1;

    const empEl = document.getElementById('modalJobEmploymentType');
    if (empEl) empEl.value = job.employmentType || 'full_time';

    const expEl = document.getElementById('modalJobExperienceLevel');
    if (expEl) expEl.value = job.experienceLevel || 'entry';

    const modeEl = document.getElementById('modalJobWorkMode');
    if (modeEl) modeEl.value = job.workMode || 'onsite';

    const statusEl = document.getElementById('modalJobStatus');
    if (statusEl) statusEl.value = job.status || 'active';

    const deadlineEl = document.getElementById('modalJobDeadline');
    if (deadlineEl) deadlineEl.value = job.deadlineAt ? String(job.deadlineAt).slice(0, 10) : '';

    const skillsEl = document.getElementById('modalJobSkills');
    if (skillsEl) {
      if (Array.isArray(job.requiredSkills)) {
        skillsEl.value = job.requiredSkills.join(', ');
      } else if (typeof job.requiredSkills === 'string') {
        skillsEl.value = job.requiredSkills;
      } else if (typeof job.requiredSkillsJson === 'string') {
        try {
          const parsed = JSON.parse(job.requiredSkillsJson);
          skillsEl.value = Array.isArray(parsed) ? parsed.join(', ') : job.requiredSkillsJson;
        } catch (_err) {
          skillsEl.value = job.requiredSkillsJson;
        }
      } else {
        skillsEl.value = '';
      }
    }

    const descEl = document.getElementById('modalJobDescription');
    if (descEl) descEl.value = job.description || '';

    const preview = document.getElementById('modalJobDescriptionPreview');
    const textarea = document.getElementById('modalJobDescription');
    const toggleBtn = document.getElementById('modalToggleDescPreview');
    if (preview && textarea) {
      preview.style.display = 'none';
      textarea.style.display = 'block';
    }
    if (toggleBtn) {
      toggleBtn.classList.remove('active');
      toggleBtn.innerHTML = '<i class="fa-solid fa-eye"></i> Parapamje';
    }

    const modalBody = editJobModal.querySelector('.modal-body');
    if (modalBody) {
      modalBody.scrollTop = 0;
    }

    editJobModal.style.display = 'flex';
    requestAnimationFrame(() => {
      editJobModal.classList.add('active');
    });
  }

  function closeEditModal() {
    if (!editJobModal) return;
    editJobModal.classList.remove('active');
    setTimeout(() => {
      editJobModal.style.display = 'none';
    }, 300);
  }

  closeEditModalBtn?.addEventListener('click', closeEditModal);
  modalCloseBtn?.addEventListener('click', closeEditModal);
  editJobModal?.addEventListener('click', (e) => {
    if (e.target === editJobModal) {
      closeEditModal();
    }
  });

  document.querySelectorAll('.btn-tool[data-modal-tool]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const textarea = document.getElementById('modalJobDescription');
      const preview = document.getElementById('modalJobDescriptionPreview');
      if (!textarea) return;
      const tool = btn.dataset.modalTool;
      let snippet = '';

      if (tool === 'detyrat') {
        snippet = '\n\nDetyrat dhe përgjegjësitë\n• ';
      } else if (tool === 'kualifikimet') {
        snippet = '\n\nKualifikimet dhe kriteret e kërkuara\n• ';
      } else if (tool === 'ofron') {
        snippet = '\n\nÇfarë ofrojmë\n• ';
      } else if (tool === 'aplikimi') {
        snippet = '\n\nSi të aplikoni?\n';
      } else if (tool === 'bullet') {
        snippet = '\n• ';
      }

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      textarea.value = text.substring(0, start) + snippet + text.substring(end);
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + snippet.length;

      if (preview && preview.style.display !== 'none') {
        preview.innerHTML = formatJobDescription(textarea.value);
      }
    });
  });

  const modalTogglePreview = document.getElementById('modalToggleDescPreview');
  modalTogglePreview?.addEventListener('click', () => {
    const textarea = document.getElementById('modalJobDescription');
    const preview = document.getElementById('modalJobDescriptionPreview');
    if (!textarea || !preview) return;

    const isShowing = preview.style.display !== 'none';
    if (isShowing) {
      preview.style.display = 'none';
      textarea.style.display = 'block';
      modalTogglePreview.classList.remove('active');
      modalTogglePreview.innerHTML = '<i class="fa-solid fa-eye"></i> Parapamje';
    } else {
      preview.innerHTML = formatJobDescription(textarea.value);
      preview.style.display = 'block';
      textarea.style.display = 'none';
      modalTogglePreview.classList.add('active');
      modalTogglePreview.innerHTML = '<i class="fa-solid fa-pen"></i> Edito Tekstin';
    }
  });

  modalEditJobForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('modalEditingJobId')?.value;
    if (!id) return;

    const submitBtn = document.getElementById('modalSubmitBtn');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Duke ruajtur...';
    }

    const payload = {
      title: document.getElementById('modalJobTitle').value.trim(),
      description: document.getElementById('modalJobDescription').value.trim(),
      location: document.getElementById('modalJobLocation').value.trim(),
      positions: Number(document.getElementById('modalJobPositions').value || 1),
      employmentType: document.getElementById('modalJobEmploymentType').value,
      experienceLevel: document.getElementById('modalJobExperienceLevel').value,
      workMode: document.getElementById('modalJobWorkMode').value,
      status: document.getElementById('modalJobStatus').value,
      deadlineAt: document.getElementById('modalJobDeadline').value || null,
      requiredSkills: document.getElementById('modalJobSkills').value
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
    };

    try {
      await window.PlatformaApi.put(`/api/employer/jobs/${encodeURIComponent(id)}`, payload);
      window.PlatformaToast.showToast('success', 'Shpallja u përditësua me sukses.');
      closeEditModal();
      await loadJobs();
    } catch (error) {
      window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë modifikimit të shpalljes.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  });

  async function loadJobs() {
    try {
      allJobs = await window.PlatformaApi.get('/api/employer/jobs');
      updateMetrics(allJobs);
      renderJobs(allJobs);

      const urlParams = new URLSearchParams(window.location.search);
      const editId = urlParams.get('edit');
      if (editId) {
        await openEditModal(editId);
      }
    } catch (error) {
      renderEmptyState('Gabim gjatë ngarkimit të shpalljeve');
      window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë ngarkimit të shpalljeve.');
    }
  }

  addJobForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const editingId = document.getElementById('editingJobId')?.value;

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
      if (editingId) {
        await window.PlatformaApi.put(`/api/employer/jobs/${encodeURIComponent(editingId)}`, payload);
        window.PlatformaToast.showToast('success', 'Shpallja u përditësua me sukses.');
      } else {
        await window.PlatformaApi.post('/api/employer/jobs', payload);
        window.PlatformaToast.showToast('success', 'Shpallja u krijua me sukses.');
      }
      resetJobForm();
      await loadJobs();
    } catch (error) {
      window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë ruajtjes së shpalljes.');
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
