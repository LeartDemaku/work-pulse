document.addEventListener('DOMContentLoaded', async () => {
  const user = await window.PlatformaAuth.requireAuth('job_seeker');
  if (!user) return;

  const header = document.getElementById('header');
  const navMenu = document.getElementById('nav-menu');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  const welcomeHeading = document.getElementById('welcomeHeading');
  const profileForm = document.getElementById('profileForm');
  const profileCompletion = document.getElementById('profileCompletion');
  const completionFill = document.getElementById('completionFill');
  const completionTips = document.getElementById('completionTips');
  const quickMetrics = document.getElementById('quickMetrics');
  const recentApplications = document.getElementById('recentApplications');
  const savedJobs = document.getElementById('savedJobs');
  const recommendedJobs = document.getElementById('recommendedJobs');

  if (welcomeHeading) {
    const firstName = String(user.name || '').trim().split(' ')[0] || 'kandidat';
    welcomeHeading.textContent = `Mirë se erdhe, ${firstName}. Ndërto hapin tënd të radhës në karrierë.`;
  }

  const userDisplayName = document.getElementById('userDisplayName');
  if (userDisplayName) {
    userDisplayName.textContent = user.name || 'Kandidat';
  }

  const userMenuBtn = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userDropdown');

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

  window.addEventListener('scroll', () => {
    header?.classList.toggle('header-scrolled', window.scrollY > 24);
  });

  mobileMenuBtn?.addEventListener('click', () => {
    navMenu?.classList.toggle('active');
    const isOpen = navMenu?.classList.contains('active');
    mobileMenuBtn.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
  });

  logoutBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    await window.PlatformaAuth.logout();
    window.location.href = 'index.html';
  });

  let currentProfile = null;

  profileForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      headline: document.getElementById('profileHeadline').value.trim(),
      city: document.getElementById('profileCity').value.trim(),
      skills: document.getElementById('profileSkills').value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      about: document.getElementById('profileAbout').value.trim()
    };

    try {
      const response = await window.PlatformaApi.put('/api/jobseeker/profile', payload);

      currentProfile = {
        ...(currentProfile || {}),
        ...payload,
        profileCompletion: response.profileCompletion || 0
      };

      renderProfileCompletion(
        profileCompletion,
        completionFill,
        completionTips,
        Number(response.profileCompletion || 0),
        currentProfile
      );

      window.PlatformaToast.showToast('success', 'Profili u përditësua me sukses.');
    } catch (error) {
      window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë ruajtjes së profilit.');
    }
  });

  try {
    const [profile, applications, saved, recommendations] = await Promise.all([
      window.PlatformaApi.get('/api/jobseeker/profile'),
      window.PlatformaApi.get('/api/jobseeker/applications'),
      window.PlatformaApi.get('/api/jobseeker/saved-jobs'),
      window.PlatformaApi.get('/api/jobseeker/recommendations')
    ]);

    currentProfile = profile;

    renderProfileForm(profile);
    renderProfileCompletion(
      profileCompletion,
      completionFill,
      completionTips,
      Number(profile.profileCompletion || 0),
      profile
    );
    renderQuickMetrics(quickMetrics, applications, saved, recommendations);
    renderRecentApplications(recentApplications, applications);
    renderSavedJobs(savedJobs, saved);
    renderRecommendations(recommendedJobs, recommendations);
  } catch (error) {
    renderErrorState(recentApplications, 'Aplikimet');
    renderErrorState(savedJobs, 'Punët e ruajtura');
    renderErrorState(recommendedJobs, 'Rekomandimet');
    window.PlatformaToast.showToast('error', error?.payload?.message || 'Gabim gjatë ngarkimit të dashboard-it.');
  }
});

function renderProfileForm(profile) {
  document.getElementById('profileHeadline').value = profile.headline || '';
  document.getElementById('profileCity').value = profile.city || '';
  document.getElementById('profileSkills').value = (profile.skills || []).join(', ');
  document.getElementById('profileAbout').value = profile.about || '';
}

function renderProfileCompletion(labelEl, fillEl, tipsEl, completion, profile) {
  const clamped = Math.min(Math.max(Number(completion || 0), 0), 100);
  labelEl.textContent = `${clamped}%`;
  fillEl.style.width = `${clamped}%`;

  // Koment: Sugjerimet dalin vetëm për fushat që mungojnë.
  const tips = [];
  if (!profile?.headline) tips.push('Shto titullin profesional.');
  if (!profile?.city) tips.push('Shto qytetin për rezultate më të sakta.');
  if (!Array.isArray(profile?.skills) || profile.skills.length === 0) tips.push('Shto aftësi kryesore (3-5 aftësi).');
  if (!profile?.about) tips.push('Shkruaj një përshkrim të shkurtër për veten.');

  if (!tips.length) {
    tipsEl.innerHTML = '<li>Profili është i kompletuar shumë mirë.</li>';
    return;
  }

  tipsEl.innerHTML = tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join('');
}

function renderQuickMetrics(container, applications, saved, recommendations) {
  const totalApps = applications.length;
  const inProgress = applications.filter((app) => ['submitted', 'reviewing', 'shortlisted', 'interview'].includes(app.status)).length;
  const savedCount = saved.length;
  const recommendationCount = recommendations.length;

  container.innerHTML = `
    <article class="metric-card">
      <div class="metric-icon"><i class="fa-solid fa-file-signature"></i></div>
      <div class="metric-value">${totalApps}</div>
      <div class="metric-label">Aplikime gjithsej</div>
    </article>
    <article class="metric-card">
      <div class="metric-icon"><i class="fa-regular fa-clock"></i></div>
      <div class="metric-value">${inProgress}</div>
      <div class="metric-label">Në proces rishikimi</div>
    </article>
    <article class="metric-card">
      <div class="metric-icon"><i class="fa-solid fa-bookmark"></i></div>
      <div class="metric-value">${savedCount}</div>
      <div class="metric-label">Punë të ruajtura</div>
    </article>
    <article class="metric-card">
      <div class="metric-icon"><i class="fa-solid fa-sparkles"></i></div>
      <div class="metric-value">${recommendationCount}</div>
      <div class="metric-label">Rekomandime aktive</div>
    </article>
  `;
}

function renderRecentApplications(container, applications) {
  const list = applications.slice(0, 5);

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-folder-open"></i>
        <h3>Ende pa aplikime</h3>
        <p>Fillo duke aplikuar në një pozicion që të përshtatet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map((app) => `
    <article class="item-card">
      <div class="item-title">${escapeHtml(app.jobTitle || 'Pa titull')}</div>
      <div class="item-meta">
        <span class="status-badge ${statusClass(app.status)}">${escapeHtml(statusLabel(app.status))}</span>
        <span><i class="fa-regular fa-hashtag"></i> ${escapeHtml(app.referenceCode || '-')}</span>
        <span><i class="fa-regular fa-calendar"></i> ${escapeHtml(formatDate(app.appliedAt))}</span>
      </div>
    </article>
  `).join('');
}

function renderSavedJobs(container, jobs) {
  const list = jobs.slice(0, 5);

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-bookmark"></i>
        <h3>Nuk ke punë të ruajtura</h3>
        <p>Ruaj pozitat interesante për t'u kthyer më vonë.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map((job) => `
    <article class="item-card">
      <div class="item-title">${escapeHtml(job.title || 'Pa titull')}</div>
      <div class="item-meta">
        <span><i class="fa-regular fa-building"></i> ${escapeHtml(job.company || 'Kompani')}</span>
        <span><i class="fa-regular fa-map"></i> ${escapeHtml(job.location || 'Lokacion i panjohur')}</span>
      </div>
    </article>
  `).join('');
}

function renderRecommendations(container, jobs) {
  const list = jobs.slice(0, 8);

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-sparkles"></i>
        <h3>Nuk ka rekomandime për momentin</h3>
        <p>Përditëso aftësitë në profil për rezultate më të mira.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map((job) => `
    <article class="job-card">
      <div class="item-title">${escapeHtml(job.title || 'Pa titull')}</div>
      <div class="job-company">${escapeHtml(job.company || 'Kompani')}</div>
      <div class="item-meta">
        <span><i class="fa-regular fa-map"></i> ${escapeHtml(job.location || 'Lokacion i panjohur')}</span>
      </div>
      ${renderSkillTags(job.requiredSkills)}
    </article>
  `).join('');
}

function renderSkillTags(requiredSkills) {
  if (!Array.isArray(requiredSkills) || !requiredSkills.length) {
    return '';
  }

  const tags = requiredSkills
    .slice(0, 3)
    .map((skill) => `<span class="tag">${escapeHtml(String(skill))}</span>`)
    .join('');

  return `<div class="job-tags">${tags}</div>`;
}

function renderErrorState(container, sectionName) {
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <h3>Nuk u ngarkua seksioni</h3>
      <p>${escapeHtml(sectionName)} nuk mund të ngarkohet për momentin.</p>
    </div>
  `;
}

function statusClass(status) {
  const safe = String(status || '').toLowerCase();
  if (!safe) return 'status-submitted';
  return `status-${safe}`;
}

function statusLabel(status) {
  const map = {
    submitted: 'Dërguar',
    reviewing: 'Në rishikim',
    shortlisted: 'Në listë të ngushtë',
    interview: 'Intervistë',
    rejected: 'Refuzuar',
    withdrawn: 'Tërhequr',
    offer: 'Ofertë',
    hired: 'Punësuar'
  };

  return map[String(status || '').toLowerCase()] || (status || 'I panjohur');
}

function formatDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('sq-AL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}
