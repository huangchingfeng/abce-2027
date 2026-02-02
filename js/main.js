// ===== ABCE Main JavaScript =====

document.addEventListener('DOMContentLoaded', function() {
  // Initialize i18n
  window.i18n.initLanguage();

  // Language switcher
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.i18n.switchLanguage(btn.dataset.lang);
    });
  });

  // Mobile menu
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const header = document.querySelector('.header');

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      let mobileNav = document.querySelector('.mobile-nav');

      if (!mobileNav) {
        // Create mobile nav
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
            // Update all lang buttons
            document.querySelectorAll('.lang-btn').forEach(b => {
              b.classList.toggle('active', b.dataset.lang === btn.dataset.lang);
            });
          });
        });
      }

      mobileNav.classList.toggle('active');
    });
  }

  // Close mobile menu on link click
  document.querySelectorAll('.mobile-nav .nav-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelector('.mobile-nav')?.classList.remove('active');
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Header scroll effect
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    } else {
      header.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
    }

    lastScroll = currentScroll;
  });

  // Matchmaking Form
  const matchmakingForm = document.getElementById('matchmakingForm');
  if (matchmakingForm) {
    matchmakingForm.addEventListener('submit', handleMatchmakingSubmit);
  }

  // Booth Form
  const boothForm = document.getElementById('boothForm');
  if (boothForm) {
    boothForm.addEventListener('submit', handleBoothSubmit);
  }

  // Modal close buttons
  document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
      });
    });
  });

  // Scroll animations
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

  document.querySelectorAll('.stat-card, .feature-card, .gallery-item').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });
});

// Handle Matchmaking Form Submit
function handleMatchmakingSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  // Validate checkboxes
  const targetIndustries = formData.getAll('targetIndustries');
  if (targetIndustries.length === 0) {
    alert(window.i18n.getCurrentLang() === 'zh'
      ? '請至少選擇一個想媒合的產業'
      : 'Please select at least one industry to match');
    return;
  }

  // Collect form data
  const data = {
    name: formData.get('name'),
    company: formData.get('company'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    country: formData.get('country'),
    industry: formData.get('industry'),
    targetIndustries: targetIndustries,
    description: formData.get('description'),
    attendedBefore: formData.get('attendedBefore') === 'yes',
    language: window.i18n.getCurrentLang(),
    submittedAt: new Date().toISOString()
  };

  console.log('Matchmaking submission:', data);

  // Show result modal
  showMatchmakingResult(targetIndustries);

  // Reset form
  form.reset();
}

// Show Matchmaking Result
function showMatchmakingResult(targetIndustries) {
  const modal = document.getElementById('matchmakingResult');
  const statsContainer = document.getElementById('resultStats');

  // Generate stats HTML
  let statsHTML = '';
  targetIndustries.forEach(code => {
    const stat = window.i18n.getIndustryStat(code);
    if (stat) {
      statsHTML += `
        <div class="result-stat-item">
          <span class="result-stat-label">
            <span>${getIndustryIcon(code)}</span>
            <span>${stat.name}</span>
          </span>
          <span class="result-stat-value">${stat.count} ${window.i18n.t('result.companies') || '家企業'}</span>
        </div>
      `;
    }
  });

  statsContainer.innerHTML = statsHTML;
  modal.classList.add('active');
}

// Get industry icon
function getIndustryIcon(code) {
  const icons = {
    FOOD: '🍽️',
    TECH: '💻',
    MANUFACTURING: '🏭',
    FINANCE: '🏦',
    REAL_ESTATE: '🏢',
    RETAIL: '🛒',
    MEDICAL: '🏥',
    EDUCATION: '📚',
    MARKETING: '📢',
    LEGAL: '⚖️',
    LOGISTICS: '🚚',
    TOURISM: '✈️',
    CONSTRUCTION: '🏗️',
    BEAUTY: '💇',
    PROFESSIONAL: '💼',
    OTHER: '📋'
  };
  return icons[code] || '📋';
}

// Close modal
function closeModal() {
  document.getElementById('matchmakingResult').classList.remove('active');
}

// Handle Booth Form Submit
function handleBoothSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  // Collect form data
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

  // Show success modal
  document.getElementById('boothSuccess').classList.add('active');

  // Reset form
  form.reset();
}

// Close booth modal
function closeBoothModal() {
  document.getElementById('boothSuccess').classList.remove('active');
}

// Make functions globally available
window.closeModal = closeModal;
window.closeBoothModal = closeBoothModal;
