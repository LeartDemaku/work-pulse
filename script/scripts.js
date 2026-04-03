document.addEventListener('DOMContentLoaded', async function () {
  const header = document.getElementById('header');
  const navButtons = document.querySelector('.nav-buttons');
  const navMenu = document.getElementById('nav-menu');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');

  function updateHeader() {
    if (header && window.scrollY > 20) {
      header.classList.add('header-scrolled');
    } else if (header) {
      header.classList.remove('header-scrolled');
    }
  }

  updateHeader();
  window.addEventListener('scroll', updateHeader);

  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', function () {
      navMenu.classList.toggle('active');
      mobileMenuBtn.innerHTML = navMenu.classList.contains('active')
        ? '<i class="fas fa-times"></i>'
        : '<i class="fas fa-bars"></i>';
    });
  }

  if (window.PlatformaAuth && navButtons) {
    const user = await window.PlatformaAuth.me();
    if (user) {
      const dashboardLink = user.role === 'employer'
        ? 'employer-dashboard.html'
        : (user.role === 'admin' ? 'admin.html' : 'jobseeker-dashboard.html');

      navButtons.innerHTML = `
        <div class="user-dropdown">
          <button class="user-btn" id="userMenuBtn">
            <span id="userDisplayName">${user.name || 'Përdorues'}</span>
            <i class="fas fa-chevron-down" style="font-size: 0.8em; color: #64748b;"></i>
          </button>
          <div class="dropdown-content" id="userDropdown">
            <a href="${dashboardLink}" class="btn-dashboard-link"><i class="fas fa-th-large"></i> Paneli</a>
            <a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Dil</a>
          </div>
        </div>
      `;

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

      const logoutBtn = document.getElementById('logoutBtn');
      logoutBtn?.addEventListener('click', async function (e) {
        e.preventDefault();
        await window.PlatformaAuth.logout();
        window.location.href = 'index.html';
      });
    }
  }

  // if (window.PlatformaApi) {
  //   try {
  //     const stats = await window.PlatformaApi.get('/api/public/stats');
  //     const statNumbers = document.querySelectorAll('.stats .stat-number');
  //     if (statNumbers.length >= 3) {
  //       statNumbers[0].textContent = `${Number(stats.applicationsThisMonth || 0).toLocaleString()}+`;
  //       statNumbers[1].textContent = `${Number(stats.companies || 0)}+`;
  //       statNumbers[2].textContent = '95%';
  //     }
  //   } catch (_error) {
  //     // Koment: Statistikat dinamike jane opsionale; UI vazhdon me vlerat ekzistuese.
  //   }
  // }

  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('#nav-menu li a');

  if (sections.length && navLinks.length) {
    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - 120) {
          current = section.getAttribute('id');
        }
      });

      navLinks.forEach((link) => {
        const href = link.getAttribute('href') || '';
        link.classList.toggle('active', current && href.includes(`#${current}`));
      });
    });
  }

  const contactForm = document.getElementById('contactForm');
  const overlay = document.getElementById('formOverlay');
  const overlayContent = document.getElementById('overlayContent');
  const closeOverlay = document.getElementById('closeOverlay');

  if (contactForm && overlay && overlayContent) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData.entries());

      overlay.style.display = 'flex';
      overlayContent.innerHTML = '<h3>Duke dërguar mesazhin...</h3><p>Ju lutemi prisni.</p>';

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          overlayContent.innerHTML = `
              <div style="text-align: center;">
                <i class="fas fa-check-circle" style="font-size: 48px; color: #10B981; margin-bottom: 16px;"></i>
                <h3>Mesazhi u dërgua me sukses!</h3>
                <p>Faleminderit që na kontaktuat.</p>
                <button id="closeOverlayDynamic" class="btn btn-primary" style="margin-top: 16px;">Mbyll</button>
              </div>
            `;
          contactForm.reset();
        } else {
          throw new Error(result.message || 'Gabim gjatë dërgimit të mesazhit.');
        }

        document.getElementById('closeOverlayDynamic')?.addEventListener('click', () => {
          overlay.style.display = 'none';
        });

      } catch (error) {
        console.error("Submission Error:", error);

        overlayContent.innerHTML = `
          <div style="text-align: center;">
            <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #EF4444; margin-bottom: 16px;"></i>
            <h3>Gabim gjatë dërgimit</h3>
            <p>${error.message}</p>
            <button id="closeOverlayDynamic" class="btn btn-primary" style="margin-top: 16px;">Mbyll</button>
          </div>
        `;

        document.getElementById('closeOverlayDynamic')?.addEventListener('click', () => {
          overlay.style.display = 'none';
        });
      }
    });
  }

  if (closeOverlay && overlay) {
    closeOverlay.addEventListener('click', () => {
      overlay.style.display = 'none';
    });
  }
  // Scroll Animation Observer
  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        scrollObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.animate-on-scroll').forEach(el => scrollObserver.observe(el));
});
