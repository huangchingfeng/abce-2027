// ===== ABCE 2027 Main JavaScript =====

document.addEventListener('DOMContentLoaded', function() {
  // Initialize i18n
  window.i18n.initLanguage();

  // Initialize all modules
  initCountdown();
  initScrollAnimations();
  initHeaderScroll();
  initMobileMenu();
  initSmoothScroll();
  initForms();
  initModals();
  initLanguageSwitcher();
  initCounterAnimation();
});

// ===== Countdown Timer =====
function initCountdown() {
  const eventDate = new Date('2027-01-15T09:00:00+08:00').getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = eventDate - now;

    if (distance < 0) {
      document.getElementById('countdown').innerHTML = '<p style="color: var(--color-gold);">Event Started!</p>';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((distance % (1000 * 60)) / 1000);

    const daysEl = document.getElementById('countdown-days');
    const hoursEl = document.getElementById('countdown-hours');
    const minsEl = document.getElementById('countdown-mins');
    const secsEl = document.getElementById('countdown-secs');

    if (daysEl) daysEl.textContent = String(days).padStart(3, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minsEl) minsEl.textContent = String(mins).padStart(2, '0');
    if (secsEl) secsEl.textContent = String(secs).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// ===== Counter Animation =====
function initCounterAnimation() {
  const counters = document.querySelectorAll('.stat-number[data-count]');

  const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
        animateCounter(entry.target);
        entry.target.classList.add('counted');
      }
    });
  }, observerOptions);

  counters.forEach(counter => counterObserver.observe(counter));
}

function animateCounter(element) {
  const target = parseInt(element.getAttribute('data-count'));
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;

  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = formatNumber(Math.floor(current)) + '+';
  }, 16);
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ===== Scroll Animations =====
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ===== Header Scroll Effect =====
function initHeaderScroll() {
  const header = document.querySelector('.header');

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// ===== Mobile Menu =====
function initMobileMenu() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const header = document.querySelector('.header');

  if (!mobileMenuBtn) return;

  mobileMenuBtn.addEventListener('click', () => {
    let mobileNav = document.querySelector('.mobile-nav');

    if (!mobileNav) {
      mobileNav = document.createElement('div');
      mobileNav.className = 'mobile-nav';
      mobileNav.innerHTML = `
        <a href="#matchmaking" class="nav-link" data-i18n="nav.matchmaking">${window.i18n.t('nav.matchmaking')}</a>
        <a href="#booth" class="nav-link" data-i18n="nav.booth">${window.i18n.t('nav.booth')}</a>
        <a href="#gallery" class="nav-link" data-i18n="nav.gallery">${window.i18n.t('nav.gallery')}</a>
        <div class="language-switcher">
          <button class="lang-btn ${window.i18n.getCurrentLang() === 'zh' ? 'active' : ''}" data-lang="zh">繁中</button>
          <button class="lang-btn ${window.i18n.getCurrentLang() === 'en' ? 'active' : ''}" data-lang="en">EN</button>
          <button class="lang-btn ${window.i18n.getCurrentLang() === 'ja' ? 'active' : ''}" data-lang="ja">日本語</button>
          <button class="lang-btn ${window.i18n.getCurrentLang() === 'ko' ? 'active' : ''}" data-lang="ko">한국어</button>
        </div>
      `;
      header.after(mobileNav);

      // Add event listeners to mobile nav
      mobileNav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          mobileNav.classList.remove('active');
        });
      });

      mobileNav.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          window.i18n.switchLanguage(btn.dataset.lang);
          document.querySelectorAll('.lang-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.lang === btn.dataset.lang);
          });
        });
      });
    }

    mobileNav.classList.toggle('active');
  });
}

// ===== Smooth Scroll =====
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Close mobile menu if open
        const mobileNav = document.querySelector('.mobile-nav');
        if (mobileNav) mobileNav.classList.remove('active');
      }
    });
  });
}

// ===== Language Switcher =====
function initLanguageSwitcher() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.i18n.switchLanguage(btn.dataset.lang);
    });
  });
}

// ===== Forms =====
function initForms() {
  const matchmakingForm = document.getElementById('matchmakingForm');
  if (matchmakingForm) {
    matchmakingForm.addEventListener('submit', handleMatchmakingSubmit);
  }

  const boothForm = document.getElementById('boothForm');
  if (boothForm) {
    boothForm.addEventListener('submit', handleBoothSubmit);
  }

  // Handle "Other" checkbox toggle for resource input
  const resourceOtherCheck = document.getElementById('resourceOtherCheck');
  const resourceOtherText = document.getElementById('resourceOtherText');
  if (resourceOtherCheck && resourceOtherText) {
    resourceOtherCheck.addEventListener('change', () => {
      resourceOtherText.style.display = resourceOtherCheck.checked ? 'block' : 'none';
      if (resourceOtherCheck.checked) {
        resourceOtherText.focus();
      }
    });
  }
}

function handleMatchmakingSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  const targetIndustries = formData.getAll('targetIndustries');
  const resourceNeeded = formData.getAll('resourceNeeded');

  if (resourceNeeded.length === 0) {
    alert(window.i18n.getCurrentLang() === 'zh'
      ? '請至少選擇一個需要的資源'
      : 'Please select at least one resource needed');
    return;
  }

  if (targetIndustries.length === 0) {
    alert(window.i18n.getCurrentLang() === 'zh'
      ? '請至少選擇一個想媒合的產業'
      : 'Please select at least one industry to match');
    return;
  }

  const data = {
    name: formData.get('name'),
    company: formData.get('company'),
    contactType: formData.get('contactType'),
    contact: formData.get('contact'),
    resourceNeeded: resourceNeeded,
    resourceOtherText: formData.get('resourceOtherText') || '',
    targetIndustries: targetIndustries,
    language: window.i18n.getCurrentLang(),
    submittedAt: new Date().toISOString()
  };

  console.log('Matchmaking submission:', data);
  showMatchmakingResult(targetIndustries);
  form.reset();
  // Hide the other text input after reset
  const resourceOtherText = document.getElementById('resourceOtherText');
  if (resourceOtherText) resourceOtherText.style.display = 'none';
}

function showMatchmakingResult(targetIndustries) {
  const modal = document.getElementById('matchmakingResult');
  const statsContainer = document.getElementById('resultStats');

  let statsHTML = '';
  targetIndustries.forEach(code => {
    const stat = window.i18n.getIndustryStat(code);
    if (stat) {
      const resourceText = window.i18n.t('result.resourceAvailable') || '位企業主資源';
      statsHTML += `
        <div class="result-stat-item">
          <span class="result-stat-label">
            <span>${stat.name}</span>
          </span>
          <span class="result-stat-value">
            <span class="result-stat-number">${stat.count}</span> ${resourceText}
          </span>
        </div>
      `;
    }
  });

  statsContainer.innerHTML = statsHTML;
  modal.classList.add('active');
}

function handleBoothSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  const data = {
    name: formData.get('name'),
    company: formData.get('company'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    country: formData.get('country'),
    industry: formData.get('industry'),
    companyIntro: formData.get('companyIntro'),
    products: formData.get('products'),
    attendedBefore: formData.get('boothAttendedBefore') === 'yes',
    boothCount: parseInt(formData.get('boothCount')),
    taxId: formData.get('taxId'),
    specialRequest: formData.get('specialRequest'),
    language: window.i18n.getCurrentLang(),
    submittedAt: new Date().toISOString()
  };

  console.log('Booth submission:', data);
  document.getElementById('boothSuccess').classList.add('active');
  form.reset();
}

// ===== Modals =====
function initModals() {
  document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el) {
        document.querySelectorAll('.modal').forEach(modal => {
          modal.classList.remove('active');
        });
      }
    });
  });

  // Close on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
      });
    }
  });
}

function closeModal() {
  document.getElementById('matchmakingResult').classList.remove('active');
}

function closeBoothModal() {
  document.getElementById('boothSuccess').classList.remove('active');
}

// Make functions globally available
window.closeModal = closeModal;
window.closeBoothModal = closeBoothModal;
