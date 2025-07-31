// العنوان الأساسي للـ API
const API_BASE_URL = 'http://localhost:3000/api';

// ==== وظائف التخزين =====
function getCurrentUser() {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
}
function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}
function clearCurrentUser() {
  localStorage.removeItem('currentUser');
}
function getToken() {
  return localStorage.getItem('token') || null;
}
function setToken(token) {
  localStorage.setItem('token', token);
}
function clearToken() {
  localStorage.removeItem('token');
}

// ==== عناصر DOM =====
const authSection = document.getElementById('auth-section');
const dashboard = document.getElementById('dashboard');
const usernameEl = document.getElementById('username');

// نماذج المصادقة
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// أزرار التبديل بين النماذج
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');

// التحكم في لوحة التحكم
const logoutBtn = document.getElementById('logout-btn');
const projectsContainer = document.getElementById('projects-container');

// عنصر شريط البحث
const searchInput = document.getElementById('search-input');
const searchLoading = document.getElementById('search-loading'); // الرسالة أثناء البحث

// قائمة المشاريع المحملة بالكامل
let allProjects = [];

// عناصر النافذة المنبثقة للمشروع
const openProjectModalBtn = document.getElementById('open-project-modal');
const projectModal = document.getElementById('project-modal');
const closeProjectModalBtn = document.getElementById('close-project-modal');
const projectForm = document.getElementById('project-form');

// ==== وظائف الواجهة =====
function showAuth() {
  authSection.classList.remove('hidden');
  dashboard.classList.add('hidden');
}

function showDashboard(user) {
  authSection.classList.add('hidden');
  dashboard.classList.remove('hidden');
  usernameEl.textContent = user.name;
  loadProjects();
}

function init() {
  const user = getCurrentUser();
  if (user) {
    showDashboard(user);
  } else {
    showAuth();
  }
}

// ==== أحداث المصادقة =====
if (loginForm) {
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const phone = document.getElementById('login-phone').value.trim();
    const password = document.getElementById('login-password').value;
    if (!phone || !password) {
      alert('يرجى إدخال رقم الهاتف وكلمة المرور');
      return;
    }
    fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    })
      .then(res => {
        if (!res.ok) return res.json().then(data => Promise.reject(data));
        return res.json();
      })
      .then(data => {
        setToken(data.token);
        setCurrentUser(data.user);
        loginForm.reset();
        showDashboard(data.user);
      })
      .catch(err => {
        alert(err.error || err.message || 'فشل تسجيل الدخول');
      });
  });
}

if (registerForm) {
  registerForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    if (!name || !phone || !password) {
      alert('يرجى ملء جميع الحقول');
      return;
    }
    // إرسال طلب التسجيل
    fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, password })
    })
      .then(res => {
        if (!res.ok) return res.json().then(data => Promise.reject(data));
        return res.json();
      })
      .then(() => {
        // تسجيل الدخول مباشرة بعد التسجيل
        return fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password })
        });
      })
      .then(res => {
        if (!res.ok) return res.json().then(data => Promise.reject(data));
        return res.json();
      })
      .then(data => {
        setToken(data.token);
        setCurrentUser(data.user);
        registerForm.reset();
        showDashboard(data.user);
      })
      .catch(err => {
        alert(err.message || 'تعذر إتمام التسجيل');
      });
  });
}

// تبديل بين التسجيل وتسجيل الدخول
if (showRegisterLink) {
  showRegisterLink.addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('login-card').classList.add('hidden');
    document.getElementById('register-card').classList.remove('hidden');
  });
}
if (showLoginLink) {
  showLoginLink.addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('register-card').classList.add('hidden');
    document.getElementById('login-card').classList.remove('hidden');
  });
}

// تسجيل الخروج
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    clearCurrentUser();
    clearToken();
    showAuth();
  });
}

// ==== نافذة إضافة مشروع =====
if (openProjectModalBtn) {
  openProjectModalBtn.addEventListener('click', () => {
    projectModal.classList.remove('hidden');
  });
}
if (closeProjectModalBtn) {
  closeProjectModalBtn.addEventListener('click', () => {
    projectModal.classList.add('hidden');
    projectForm.reset();
  });
}

// إرسال نموذج المشروع
if (projectForm) {
  projectForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const title = document.getElementById('project-title').value.trim();
    const description = document.getElementById('project-description').value.trim();
    const target = parseFloat(document.getElementById('project-target').value);
    const ownerName = document.getElementById('project-owner').value.trim();
    const impact = document.getElementById('project-impact').value.trim();
    if (!title || !description || !target || isNaN(target) || target <= 0 || !ownerName) {
      alert('يرجى ملء جميع الحقول بشكل صحيح');
      return;
    }
    const body = {
      title,
      description,
      targetAmount: target,
      impactDescription: impact,
      ownerName
    };
    fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(body)
    })
      .then(res => {
        if (!res.ok) return res.json().then(data => Promise.reject(data));
        return res.json();
      })
      .then(() => {
        projectForm.reset();
        projectModal.classList.add('hidden');
        searchInput.value = '';
        loadProjects();
      })
      .catch(err => {
        alert(err.message || 'تعذر إنشاء المشروع');
      });
  });
}

// ==== تحميل وعرض المشاريع =====
function loadProjects() {
  fetch(`${API_BASE_URL}/projects`)
    .then(res => res.json())
    .then(data => {
      // تخزين جميع المشاريع وعرضها
      allProjects = Array.isArray(data) ? data : [];
      filterProjects();
    })
    .catch(err => {
      console.error(err);
      alert('فشل في جلب المشاريع');
    });
}

function renderProjects(projects) {
  projectsContainer.innerHTML = '';
  if (!projects || projects.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.textContent = 'لا توجد مشاريع حالياً. كن المبادر الأول!';
    projectsContainer.appendChild(emptyMsg);
    return;
  }
  projects.forEach(project => {
    const card = document.createElement('div');
    card.className = 'project-card';
    const percentage = Math.min((project.currentAmount / project.targetAmount) * 100, 100);
    card.innerHTML = `
      <div>
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        ${project.impactDescription ? `<p><strong>الأثر الاجتماعي:</strong> ${project.impactDescription}</p>` : ''}
      </div>
      <div>
        <div class="progress-container">
          <div class="progress-bar" style="width: ${percentage}%"></div>
        </div>
        <div class="project-meta">
          <span><i class="fas fa-user"></i> ${project.ownerName || 'مجهول'}</span>
          <span><i class="fas fa-bullseye"></i> ${project.targetAmount} دج</span>
        </div>
        <p><strong>المبلغ الحالي:</strong> ${project.currentAmount} دج</p>
        <div class="funding-section">
          <input type="number" min="1" step="1" placeholder="مبلغ التمويل" />
          <button class="fund-btn">موّل</button>
        </div>
      </div>
    `;
    // التعامل مع التمويل
    const fundInput = card.querySelector('input');
    const fundBtn = card.querySelector('.fund-btn');
    fundBtn.addEventListener('click', () => {
      const amount = parseFloat(fundInput.value);
      if (!amount || isNaN(amount) || amount <= 0) {
        alert('يرجى إدخال مبلغ صحيح');
        return;
      }
      fetch(`${API_BASE_URL}/fundings/${project.projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ amount })
      })
        .then(res => {
          if (!res.ok) return res.json().then(data => Promise.reject(data));
          return res.json();
        })
        .then(() => {
          if (searchLoading) searchLoading.classList.add('hidden');
          loadProjects();
        })
        .catch(err => {
          alert(err.message || 'تعذر إتمام التمويل');
        });
    });
    projectsContainer.appendChild(card);
  });
}

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', () => {
  init();
  // إضافة مستمع للبحث إذا كان موجوداً
  if (searchInput) {
    // تنفيذ البحث فقط عند الضغط على مفتاح Enter
    searchInput.addEventListener('keypress', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        filterProjects();
      }
    });
  }
});

// تصفية المشاريع وعرض النتائج
function filterProjects() {
  const query = searchInput ? searchInput.value.trim() : '';
  if (!query) {
    renderProjects(allProjects);
    return;
  }

  // إظهار رسالة التحميل وإخفاء النتائج مؤقتًا
  if (searchLoading) searchLoading.classList.remove('hidden');
  projectsContainer.innerHTML = '';

  fetch(`${API_BASE_URL}/projects?search=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      renderProjects(Array.isArray(data) ? data : []);
    })
    .catch(err => {
      console.error(err);
      alert('فشل البحث عن المشاريع');
    })
    .finally(() => {
      if (searchLoading) searchLoading.classList.add('hidden');
    });
}
