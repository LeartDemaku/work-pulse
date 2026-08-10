/**
 * Theme Manager
 * Handles Light/Dark mode switching and persistence
 */
const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        this.addUIElements();
        this.observeNavChanges();
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.updateToggleButton(theme);

        // Dispatch event for other components that might need to react
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    },

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },

    addUIElements() {
        this.addThemeToggle();
        this.addIdentifikimButton();
        this.addVendePuneButton();
    },

    addThemeToggle() {
        // 1. Add to desktop nav buttons
        const navButtons = document.querySelector('.nav-buttons');
        if (navButtons && !document.getElementById('themeToggle')) {
            const toggleBtn = this.createToggleButton('themeToggle', 'theme-toggle-btn');
            navButtons.prepend(toggleBtn);
        }

        // 2. Add to mobile menu
        const navMenu = document.getElementById('nav-menu');
        if (navMenu && !document.getElementById('mobileThemeToggle')) {
            const listItem = document.createElement('li');
            listItem.className = 'mobile-theme-item';
            const toggleBtn = this.createToggleButton('mobileThemeToggle', 'theme-toggle-btn mobile-menu-toggle');

            listItem.appendChild(toggleBtn);
            navMenu.appendChild(listItem);
        }
    },

    addIdentifikimButton() {
        const navMenu = document.getElementById('nav-menu');
        if (!navMenu) return;

        // Check if user is already logged in or if link exists
        const isLoggedIn = !!document.getElementById('userMenuBtn') || !!document.querySelector('.user-dropdown');
        if (isLoggedIn) return;

        const exists = navMenu.querySelector('a[href*="signin.html"]');
        if (exists) return;

        if (document.getElementById('mobileIdentifikim')) return;

        const li = document.createElement('li');
        li.id = 'mobileIdentifikim';
        li.className = 'mobile-theme-item';

        const a = document.createElement('a');
        a.href = 'signin.html';
        a.className = 'btn btn-outline';
        a.innerHTML = '<i class="fas fa-sign-in-alt"></i> Identifikim';
        a.style.width = '100%';
        a.style.margin = '8px 12px 0';
        a.style.justifyContent = 'center';

        li.appendChild(a);

        // Insert before Vende Pune or end
        const vendePune = document.getElementById('mobileVendePune');
        if (vendePune) {
            vendePune.before(li);
        } else {
            navMenu.appendChild(li);
        }
    },

    addVendePuneButton() {
        const navMenu = document.getElementById('nav-menu');
        if (!navMenu) return;

        // Check if a link to apply.html already exists (avoids duplicates on dashboard pages)
        const exists = navMenu.querySelector('a[href*="apply.html"]');
        if (exists) return;

        if (document.getElementById('mobileVendePune')) return;

        const li = document.createElement('li');
        li.id = 'mobileVendePune';
        li.className = 'mobile-theme-item';

        const a = document.createElement('a');
        a.href = 'apply.html';
        a.className = 'btn btn-primary';
        a.innerHTML = '<i class="fas fa-briefcase"></i> Vende punë';
        a.style.width = '100%';
        a.style.margin = '8px 12px';
        a.style.justifyContent = 'center';

        li.appendChild(a);

        // Try to find "Kontakt" to insert after
        const navItems = Array.from(navMenu.children);
        const contactItem = navItems.find(item => item.innerText.trim().toLowerCase() === 'kontakt');

        if (contactItem) {
            contactItem.after(li);
        } else {
            navMenu.appendChild(li);
        }
    },

    createToggleButton(id, className) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = id;
        toggleBtn.className = className;
        toggleBtn.setAttribute('aria-label', 'Toggle theme');
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        toggleBtn.innerHTML = currentTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        if (currentTheme === 'dark') toggleBtn.classList.add('dark');
        toggleBtn.addEventListener('click', () => this.toggleTheme());
        return toggleBtn;
    },

    updateToggleButton(theme) {
        const buttons = [
            document.getElementById('themeToggle'),
            document.getElementById('mobileThemeToggle')
        ];

        buttons.forEach(btn => {
            if (!btn) return;
            const icon = btn.querySelector('i');
            if (theme === 'dark') {
                icon.className = 'fas fa-sun';
                btn.classList.add('dark');
            } else {
                icon.className = 'fas fa-moon';
                btn.classList.remove('dark');
            }
        });
    },

    observeNavChanges() {
        // Observe both containers for changes (like auth script overwriting innerHTML)
        const targets = [
            document.querySelector('.nav-buttons'),
            document.getElementById('nav-menu')
        ];

        const observer = new MutationObserver(() => {
            this.addUIElements();
        });

        targets.forEach(target => {
            if (target) {
                observer.observe(target, { childList: true });
            }
        });
    }
};

// Initialize as soon as DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
});

// Immediately set theme to avoid flicker
(function () {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();
