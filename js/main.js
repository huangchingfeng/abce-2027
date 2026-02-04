// ===== ABCE 2027 Main JavaScript =====

// ===== Backend API Configuration =====
const ABCE_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbwNQN3D0vvnluWDIxsUXUssRV2p12FiVnoP_4hYEABS711V6jj_DE5xhDQ9DA59oQ6N/exec'
};

// 發送資料到後台
async function sendToBackend(data) {
  if (!ABCE_CONFIG.API_URL) {
    console.log('Backend not configured, data logged only:', data);
    return { success: false, message: 'Backend not configured' };
  }

  try {
    await fetch(ABCE_CONFIG.API_URL, {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script 需要 no-cors 模式
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    console.log('Data sent to backend:', data);
    return { success: true };
  } catch (error) {
    console.error('Failed to send to backend:', error);
    return { success: false, error: error.message };
  }
}

// JSONP 請求（用於獲取 AI 分析結果）
function fetchJSONP(url, callbackName) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('JSONP request timeout'));
    }, 30000); // 30 秒超時

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    function cleanup() {
      clearTimeout(timeout);
      delete window[callbackName];
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    }

    script.src = url;
    script.onerror = () => {
      cleanup();
      reject(new Error('JSONP request failed'));
    };

    document.head.appendChild(script);
  });
}

// 獲取 AI 媒合分析
async function getAIMatchmakingAnalysis(userData) {
  if (!ABCE_CONFIG.API_URL) {
    return null;
  }

  const callbackName = 'aiMatchCallback_' + Date.now();
  const params = new URLSearchParams({
    action: 'analyzeMatchmaking',
    callback: callbackName,
    name: userData.name || '',
    company: userData.company || '',
    resourceNeeded: (userData.resourceNeeded || []).join(','),
    resourceDetails: encodeURIComponent(JSON.stringify(userData.resourceDetails || {})),
    targetIndustries: (userData.targetIndustries || []).join(','),
    industryDetails: encodeURIComponent(JSON.stringify(userData.industryDetails || {})),
    freeDescription: userData.freeDescription || ''
  });

  const url = `${ABCE_CONFIG.API_URL}?${params.toString()}`;

  try {
    const result = await fetchJSONP(url, callbackName);
    console.log('AI Analysis result:', result);
    return result;
  } catch (error) {
    console.error('AI Analysis error:', error);
    return null;
  }
}

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
          updateMobileLangDisplay();
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
  // Desktop language switcher
  const desktopSwitcher = document.querySelector('.header .language-switcher.desktop-only');
  if (desktopSwitcher) {
    desktopSwitcher.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.i18n.switchLanguage(btn.dataset.lang);
        updateMobileLangDisplay();
      });
    });
  }

  // Mobile language button & popup
  const mobileLangBtn = document.getElementById('mobileLangBtn');
  const mobileLangPopup = document.getElementById('mobileLangPopup');

  if (mobileLangBtn && mobileLangPopup) {
    // Create overlay if not exists
    let overlay = document.querySelector('.mobile-lang-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'mobile-lang-overlay';
      document.body.appendChild(overlay);
    }

    // Open popup
    mobileLangBtn.addEventListener('click', () => {
      mobileLangPopup.classList.add('active');
      overlay.classList.add('active');
    });

    // Close popup
    const closePopup = () => {
      mobileLangPopup.classList.remove('active');
      overlay.classList.remove('active');
    };

    // Close button
    const closeBtn = mobileLangPopup.querySelector('.mobile-lang-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closePopup);
    }

    // Click overlay to close
    overlay.addEventListener('click', closePopup);

    // Language options
    mobileLangPopup.querySelectorAll('.mobile-lang-option').forEach(option => {
      option.addEventListener('click', () => {
        const lang = option.dataset.lang;
        window.i18n.switchLanguage(lang);

        // Update active state
        mobileLangPopup.querySelectorAll('.mobile-lang-option').forEach(opt => {
          opt.classList.toggle('active', opt.dataset.lang === lang);
        });

        updateMobileLangDisplay();
        closePopup();
      });
    });

    // Initialize display
    updateMobileLangDisplay();
  }
}

// Update mobile language button display
function updateMobileLangDisplay() {
  const mobileLangBtn = document.getElementById('mobileLangBtn');
  const mobileLangPopup = document.getElementById('mobileLangPopup');
  if (!mobileLangBtn) return;

  const currentLang = window.i18n.getCurrentLang();
  const langDisplay = {
    zh: '繁中',
    en: 'EN',
    ja: '日本',
    ko: '한국'
  };

  // Update button display
  const currentLangSpan = mobileLangBtn.querySelector('.current-lang');
  if (currentLangSpan) {
    currentLangSpan.textContent = langDisplay[currentLang] || currentLang.toUpperCase();
  }

  // Update popup active state
  if (mobileLangPopup) {
    mobileLangPopup.querySelectorAll('.mobile-lang-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.lang === currentLang);
    });
  }
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

  // Handle resource checkbox toggle for detail inputs
  const resourceCheckboxes = document.querySelectorAll('#resourceCheckboxes input[type="checkbox"]');
  resourceCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const detailInput = checkbox.closest('.resource-option-item').querySelector('.resource-detail-input');
      if (detailInput) {
        detailInput.style.display = checkbox.checked ? 'block' : 'none';
        if (checkbox.checked) {
          detailInput.focus();
        } else {
          detailInput.value = ''; // 取消勾選時清空輸入
        }
      }
    });
  });

  // Handle industry checkbox toggle for detail inputs
  const industryCheckboxes = document.querySelectorAll('#industryCheckboxes input[type="checkbox"]');
  industryCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const detailInput = checkbox.closest('.resource-option-item').querySelector('.industry-detail-input');
      if (detailInput) {
        detailInput.style.display = checkbox.checked ? 'block' : 'none';
        if (checkbox.checked) {
          detailInput.focus();
        } else {
          detailInput.value = ''; // 取消勾選時清空輸入
        }
      }
    });
  });
}

async function handleMatchmakingSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const submitBtn = form.querySelector('button[type="submit"]');

  const targetIndustries = formData.getAll('targetIndustries');
  const resourceNeeded = formData.getAll('resourceNeeded');
  const freeDescription = (formData.get('freeDescription') || '').trim();

  // 收集每個資源的詳細說明
  const resourceDetails = {};
  resourceNeeded.forEach(resource => {
    const detail = formData.get(`resourceDetail_${resource}`) || '';
    if (detail.trim()) {
      resourceDetails[resource] = detail.trim();
    }
  });

  // 收集每個產業的詳細說明
  const industryDetails = {};
  targetIndustries.forEach(industry => {
    const detail = formData.get(`industryDetail_${industry}`) || '';
    if (detail.trim()) {
      industryDetails[industry] = detail.trim();
    }
  });

  // 至少填寫一項（需要的資源、想媒合的產業、自由描述）
  const hasResource = resourceNeeded.length > 0;
  const hasIndustry = targetIndustries.length > 0;
  const hasDescription = freeDescription.length > 0;

  if (!hasResource && !hasIndustry && !hasDescription) {
    alert(window.i18n.getCurrentLang() === 'zh'
      ? '請至少填寫一項：需要的資源、想媒合的產業、或直接描述您的需求'
      : 'Please fill in at least one: resources needed, industries to match, or describe your needs');
    return;
  }

  const data = {
    type: 'matchmaking',
    name: formData.get('name'),
    company: formData.get('company'),
    contactType: formData.get('contactType'),
    contact: formData.get('contact'),
    resourceNeeded: resourceNeeded,
    resourceDetails: resourceDetails,
    targetIndustries: targetIndustries,
    industryDetails: industryDetails,
    freeDescription: freeDescription,
    language: window.i18n.getCurrentLang(),
    submittedAt: new Date().toISOString()
  };

  console.log('Matchmaking submission:', data);

  // 顯示 loading 狀態
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = window.i18n.getCurrentLang() === 'zh' ? '🤖 AI 分析中...' : '🤖 AI Analyzing...';

  // 發送到後台儲存
  sendToBackend(data);

  // 獲取 AI 分析結果
  const aiResult = await getAIMatchmakingAnalysis(data);

  // 恢復按鈕狀態
  submitBtn.disabled = false;
  submitBtn.textContent = originalBtnText;

  // 顯示結果
  if (aiResult && aiResult.success) {
    showAIMatchmakingResult(aiResult);
  } else if (hasIndustry) {
    // AI 分析失敗時，使用靜態結果
    showMatchmakingResult(targetIndustries);
  } else {
    showMatchmakingResultGeneral();
  }

  form.reset();
  // 隱藏所有資源詳細說明輸入框
  document.querySelectorAll('.resource-detail-input').forEach(input => {
    input.style.display = 'none';
  });
  // 隱藏所有產業詳細說明輸入框
  document.querySelectorAll('.industry-detail-input').forEach(input => {
    input.style.display = 'none';
  });
}

function showMatchmakingResultGeneral() {
  const modal = document.getElementById('matchmakingResult');
  const statsContainer = document.getElementById('resultStats');

  statsContainer.innerHTML = `
    <div class="result-stat-item">
      <span class="result-stat-label">
        <span>${window.i18n.t('result.totalResources') || '總可用資源'}</span>
      </span>
      <span class="result-stat-value">
        <span class="result-stat-number">2,000+</span> ${window.i18n.t('result.resourceAvailable') || '位企業主資源'}
      </span>
    </div>
  `;
  modal.classList.add('active');
}

// 顯示媒合結果（專業版 - 資源統計展示）
function showAIMatchmakingResult(aiResult) {
  const modal = document.getElementById('matchmakingResult');
  const statsContainer = document.getElementById('resultStats');
  const lang = window.i18n.getCurrentLang();

  // 多語言文字
  const texts = {
    zh: { resourceAvailable: '位企業主', relatedIndustries: '相關產業資源', total: '總資源' },
    en: { resourceAvailable: 'business owners', relatedIndustries: 'Related Industries', total: 'Total Resources' },
    ja: { resourceAvailable: '名の経営者', relatedIndustries: '関連産業', total: '総リソース' },
    ko: { resourceAvailable: '명의 기업주', relatedIndustries: '관련 산업', total: '총 리소스' }
  };
  const t = texts[lang] || texts.en;

  let html = '';

  // 訊息
  html += `<div class="result-message"><p>${aiResult.message || ''}</p></div>`;

  // 說明
  if (aiResult.summary) {
    html += `<div class="result-summary"><p>${aiResult.summary}</p></div>`;
  }

  // 相關產業資源列表
  if (aiResult.relatedResources && aiResult.relatedResources.length > 0) {
    html += `<div class="result-section"><h4>${t.relatedIndustries}</h4><div class="resource-list">`;
    aiResult.relatedResources.forEach(resource => {
      html += `
        <div class="resource-item">
          <div class="resource-header">
            <span class="resource-name">${resource.name}</span>
            <span class="resource-count">${resource.count}+ ${t.resourceAvailable}</span>
          </div>
          <p class="resource-examples">${resource.examples ? resource.examples.join('、') : ''}</p>
        </div>
      `;
    });
    html += `</div></div>`;
  }

  // 總資源數
  html += `
    <div class="result-total">
      <span class="total-label">${t.total}</span>
      <span class="total-number">${aiResult.totalResources || '2,000'}+</span>
      <span class="total-unit">${t.resourceAvailable}</span>
    </div>
  `;

  // 結語
  if (aiResult.closing) {
    html += `<div class="result-closing"><p>${aiResult.closing}</p></div>`;
  }

  statsContainer.innerHTML = html;
  modal.classList.add('active');
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
    type: 'booth',
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

  // 發送到後台
  sendToBackend(data);
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
