document.addEventListener('DOMContentLoaded', async function () {
  const api = window.PlatformaApi;
  const auth = window.PlatformaAuth;
  const toast = window.PlatformaToast;

  const jobsGrid = document.querySelector('.jobs-grid');
  const jobsListContainer = document.getElementById('jobsListContainer');
  const formContainer = document.getElementById('formContainer');
  const backBtn = document.getElementById('backToJobs');
  const dynamicTitle = document.getElementById('dynamicJobTitle');
  const form = document.getElementById('applicationForm');
  const searchInput = document.getElementById('jobSearch');
  const categoryTags = document.querySelectorAll('.categories-tags .tag');
  const maxCvSizeBytes = 5 * 1024 * 1024;
  const allowedCvMimeTypes = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]);
  const allowedCvExtensions = /\.(pdf|doc|docx)$/i;

  let allJobs = [];
  let currentCategory = 'all';
  let currentSearch = '';
  let currentUser = await auth.me();

  const categoryKeywords = {
    software: ['developer', 'zhvillues', 'software', 'frontend', 'backend', 'devops', 'qa', 'engineer', 'tik', 'ict', 'programmer', 'java', 'react', 'node', 'full stack', 'net', 'c#'],
    dizajn: ['dizajn', 'designer', 'ui', 'ux', 'grafik', 'brand', 'art', 'creative', 'adobe', 'photoshop'],
    marketing: ['marketing', 'seo', 'social', 'content', 'media', 'copywriter', 'digital'],
    finance: ['finance', 'financ', 'accountant', 'analist', 'bank', 'ekonomist', 'audit'],
    admin: ['admin', 'administrator', 'hr', 'support', 'office', 'secretary', 'assistant', 'burime', 'human'],
    health: ['mjek', 'infermier', 'doctor', 'nurse', 'pharmacy', 'farmacist', 'dentist', 'shëndetësi', 'mjekësi', 'laborant'],
    education: ['mësues', 'profesor', 'teacher', 'arsim', 'edukator', 'education', 'trajnues', 'pedagog']
  };

  function getJobCategory(title) {
    const lower = String(title || '').toLowerCase();
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((keyword) => lower.includes(keyword))) {
        return category;
      }
    }
    return 'other';
  }

  function renderJobs(jobs) {
    jobsGrid.innerHTML = '';

    if (!jobs.length) {
      jobsGrid.innerHTML = `
        <div class="job-card" style="border-style: dashed; border-color: #cbd5e1; background-color: #f8fafc;">
          <div class="job-company"><i class="fas fa-building"></i> <span>Kosovo Company</span></div>
          <h3 class="job-title">Nuk ka pozita të lira në këtë kategori</h3>
          <div class="job-info">
            <div class="info-item"><i class="fas fa-users"></i> <span>0 vende</span></div>
            <div class="info-item"><i class="fas fa-map-marker-alt"></i> <span>Kosovë</span></div>
          </div>
          <div class="job-info" style="margin-top:-12px;">
            <div class="info-item"><i class="fas fa-clock"></i> <span>Full-Time</span></div>
            <div class="info-item"><i class="fas fa-euro-sign"></i> <span>-</span></div>
          </div>
          <button class="btn btn-outline btn-block" disabled style="cursor: not-allowed; opacity: 0.6; background-color: #e2e8f0; border-color: #cbd5e1; color: #94a3b8;">
            Apliko tani <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      `;
      return;
    }

    jobs.forEach((job) => {
      const card = document.createElement('div');
      card.className = 'job-card';
      card.setAttribute('data-category', getJobCategory(job.title));

      const salary = (job.salaryMin || job.salaryMax)
        ? `${job.salaryMin || '?'} - ${job.salaryMax || '?'} ${job.currency || 'EUR'}`
        : 'Sipas marreveshjes';

      card.innerHTML = `
        ${job.isNew ? '<div class="job-badge">E re</div>' : ''}
        <div class="job-company"><i class="fas fa-building"></i> <span>${escapeHtml(job.companyName || job.company || 'Kompani')}</span></div>
        <h3 class="job-title">${escapeHtml(job.title)}</h3>
        <div class="job-info">
          <div class="info-item"><i class="fas fa-users"></i> <span>${job.positions || 1} vende</span></div>
          <div class="info-item"><i class="fas fa-map-marker-alt"></i> <span>${escapeHtml(job.location || 'Kosove')}</span></div>
        </div>
        <div class="job-info" style="margin-top:-12px;">
          <div class="info-item"><i class="fas fa-clock"></i> <span>${escapeHtml(job.employmentType || 'full_time')}</span></div>
          <div class="info-item"><i class="fas fa-euro-sign"></i> <span>${escapeHtml(salary)}</span></div>
        </div>
        <button class="btn btn-outline btn-block apply-trigger" data-job-id="${job.id}">
          Apliko tani <i class="fas fa-arrow-right"></i>
        </button>
      `;

      jobsGrid.appendChild(card);
    });

    attachApplyListeners();
  }

  function filterJobs() {
    let filtered = [...allJobs];

    if (currentCategory !== 'all') {
      filtered = filtered.filter((job) => getJobCategory(job.title) === currentCategory);
    }

    if (currentSearch.trim()) {
      const s = currentSearch.toLowerCase();
      filtered = filtered.filter((job) =>
        String(job.title || '').toLowerCase().includes(s) ||
        String(job.company || '').toLowerCase().includes(s) ||
        String(job.location || '').toLowerCase().includes(s)
      );
    }

    renderJobs(filtered);
  }

  categoryTags.forEach((tag) => {
    tag.addEventListener('click', function () {
      categoryTags.forEach((t) => t.classList.remove('active'));
      this.classList.add('active');

      const text = this.textContent.trim().toLowerCase();
      if (text.includes('gjitha')) currentCategory = 'all';
      else if (text.includes('tik')) currentCategory = 'software';
      else if (text.includes('dizajn')) currentCategory = 'dizajn';
      else if (text.includes('marketing')) currentCategory = 'marketing';
      else if (text.includes('financ')) currentCategory = 'finance';
      else if (text.includes('administrat')) currentCategory = 'admin';
      else if (text.includes('shëndetësi')) currentCategory = 'health';
      else if (text.includes('edukacion') || text.includes('edukim')) currentCategory = 'education';
      else currentCategory = 'all';

      filterJobs();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      currentSearch = this.value;
      filterJobs();
    });
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

  function attachApplyListeners() {
    document.querySelectorAll('.apply-trigger').forEach((btn) => {
      btn.addEventListener('click', function () {
        const jobId = Number(this.getAttribute('data-job-id'));
        const job = allJobs.find((j) => Number(j.id) === jobId);

        if (!job) return;

        dynamicTitle.innerText = `Aplikoni per: ${job.title}`;
        form.dataset.currentJobId = String(jobId);
        form.dataset.currentJobTitle = job.title;

        const descriptionContainer = document.getElementById('jobDescriptionContent');
        if (descriptionContainer) {
          descriptionContainer.innerHTML = formatJobDescription(job.description);
        }

        let ownerBanner = document.getElementById('employerJobEditBanner');
        if (currentUser && currentUser.role === 'employer') {
          if (!ownerBanner) {
            ownerBanner = document.createElement('div');
            ownerBanner.id = 'employerJobEditBanner';
            const descSection = document.querySelector('.job-description-section');
            if (descSection) {
              descSection.parentNode.insertBefore(ownerBanner, descSection);
            }
          }
          ownerBanner.innerHTML = `
            <div style="background: var(--primary-tint); border: 1px solid var(--primary); border-radius: 14px; padding: 16px 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
              <div>
                <div style="font-weight: 700; color: var(--text-main); font-size: 1rem;"><i class="fa-solid fa-pen-to-square" style="color: var(--primary); margin-right: 8px;"></i> Dëshironi të modifikoni këtë shpallje?</div>
                <div style="font-size: 0.86rem; color: var(--text-muted); margin-top: 2px;">Nëse keni nevojë të përmirësoni përshkrimin, kërkesat apo kriteret, mund ta bëni menjëherë nga paneli juaj.</div>
              </div>
              <a href="employer-jobs.html?edit=${job.id}" class="btn btn-primary" style="font-size: 0.88rem; padding: 8px 18px;"><i class="fa-solid fa-pen"></i> Edito Shpalljen</a>
            </div>
          `;
          ownerBanner.style.display = 'block';
        } else if (ownerBanner) {
          ownerBanner.style.display = 'none';
        }

        if (currentUser && currentUser.role === 'job_seeker') {
          prefillFromProfile().catch(() => null);
        }

        jobsListContainer.style.display = 'none';
        formContainer.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  async function prefillFromProfile() {
    try {
      const profile = await api.get('/api/jobseeker/profile');
      if (profile.city) {
        document.getElementById('city').value = profile.city;
      }
    } catch (_error) {}
  }

  try {
    const jobs = await api.get('/api/jobs');
    allJobs = jobs;
    renderJobs(jobs);
  } catch (_error) {
    jobsGrid.innerHTML = '<p class="error-text">Nuk mund te ngarkohen shpalljet per momentin.</p>';
  }

  if (backBtn) {
    backBtn.addEventListener('click', function () {
      formContainer.style.display = 'none';
      jobsListContainer.style.display = 'block';
      form.reset();
      document.getElementById('fileName').textContent = '';
      document.getElementById('successMessage').style.display = 'none';
      document.getElementById('errorMessage').style.display = 'none';
    });
  }

  const fileUpload = document.getElementById('fileUpload');
  const fileInput = document.getElementById('cv');
  const fileNameDisplay = document.getElementById('fileName');

  function validateCvFile(file) {
    if (!file) {
      return null;
    }

    const hasAllowedMime = !file.type || allowedCvMimeTypes.has(file.type);
    const hasAllowedExtension = allowedCvExtensions.test(file.name || '');

    if (!hasAllowedMime && !hasAllowedExtension) {
      return 'Lejohen vetem skedare PDF ose DOC/DOCX.';
    }

    if (file.size > maxCvSizeBytes) {
      return 'CV-ja duhet te jete maksimumi 5MB.';
    }

    return null;
  }

  if (fileUpload && fileInput) {
    fileUpload.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const selectedFile = fileInput.files[0];
      const cvError = validateCvFile(selectedFile);

      if (cvError) {
        fileInput.value = '';
        fileNameDisplay.textContent = '';
        toast.showToast('error', cvError);
        return;
      }

      fileNameDisplay.textContent = selectedFile ? selectedFile.name : '';
    });
  }

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      currentUser = await auth.me();
      if (!currentUser || currentUser.role !== 'job_seeker') {
        toast.showToast('error', 'Duhet te kyceni si job seeker per te aplikuar.');
        setTimeout(() => { window.location.href = 'signin.html'; }, 900);
        return;
      }

      const fullName = document.getElementById('fullName').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const city = document.getElementById('city').value.trim();
      const coverLetter = document.getElementById('coverLetter')?.value?.trim() || '';
      const jobId = Number(form.dataset.currentJobId || 0);
      const cvFile = fileInput?.files?.[0] || null;

      if (!jobId || !fullName || !email || !phone || !city) {
        document.getElementById('errorMessage').style.display = 'block';
        toast.showToast('error', 'Plotesoni fushat e detyrueshme.');
        return;
      }

      const cvError = validateCvFile(cvFile);
      if (cvError) {
        document.getElementById('errorMessage').style.display = 'block';
        toast.showToast('error', cvError);
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Duke derguar...';

      try {
        const payload = new FormData();
        payload.append('jobId', String(jobId));
        payload.append('fullName', fullName);
        payload.append('email', email);
        payload.append('phone', phone);
        payload.append('city', city);
        payload.append('coverLetter', coverLetter);

        if (cvFile) {
          payload.append('cv', cvFile);
        }

        const response = await api.post('/api/applications', payload);

        document.getElementById('errorMessage').style.display = 'none';
        const successEl = document.getElementById('successMessage');
        successEl.style.display = 'block';
        successEl.innerHTML = `<i class="fas fa-check-circle"></i> Aplikimi u dergua! Referenca: <strong>${response.referenceCode}</strong>`;
        toast.showToast('success', 'Aplikimi u dergua me sukses.');
      } catch (error) {
        const errEl = document.getElementById('errorMessage');
        errEl.style.display = 'block';
        errEl.textContent = error?.payload?.message || 'Gabim gjate aplikimit. Provoni perseri.';
        toast.showToast('error', error?.payload?.message || 'Gabim gjate aplikimit.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }
});
