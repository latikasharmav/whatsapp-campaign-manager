// Global state
let currentPage = 'dashboard';
let groups = [];
let charts = {};

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const adminPanel = document.getElementById('adminPanel');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const toast = document.getElementById('toast');
const loadingOverlay = document.getElementById('loadingOverlay');
const groupModal = document.getElementById('groupModal');

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  setupEventListeners();
  loadChartLibrary();
});

// Check authentication
async function checkAuth() {
  try {
    const response = await fetch('/admin/check-auth');
    const data = await response.json();

    if (data.authenticated) {
      showAdminPanel();
      loadDashboard();
    } else {
      showLoginScreen();
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    showLoginScreen();
  }
}

// Show/Hide screens
function showLoginScreen() {
  loginScreen.style.display = 'flex';
  adminPanel.style.display = 'none';
}

function showAdminPanel() {
  loginScreen.style.display = 'none';
  adminPanel.style.display = 'flex';
}

// Setup event listeners
function setupEventListeners() {
  // Login form
  loginForm.addEventListener('submit', handleLogin);

  // Logout button
  logoutBtn.addEventListener('click', handleLogout);

  // Navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = e.currentTarget.getAttribute('data-page');
      navigateTo(page);
    });
  });

  // Dashboard refresh
  document.getElementById('refreshStats')?.addEventListener('click', loadDashboard);

  // Groups management
  document.getElementById('addGroupBtn')?.addEventListener('click', () => openGroupModal());

  // Group form
  document.getElementById('groupForm')?.addEventListener('submit', handleGroupSubmit);

  // Modal close
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  // Click outside modal to close
  groupModal?.addEventListener('click', (e) => {
    if (e.target === groupModal) closeModal();
  });

  // QR Code generation
  document.getElementById('generateQR')?.addEventListener('click', generateQRCode);
  document.getElementById('downloadQR')?.addEventListener('click', downloadQRCode);

  // Export data
  document.getElementById('exportData')?.addEventListener('click', exportData);
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();

  const password = document.getElementById('password').value;

  try {
    showLoading();
    const response = await fetch('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await response.json();

    if (data.success) {
      showAdminPanel();
      loadDashboard();
      showToast('Login successful!', 'success');
    } else {
      loginError.textContent = 'Invalid password';
      loginError.style.display = 'block';
    }
  } catch (error) {
    console.error('Login error:', error);
    loginError.textContent = 'Login failed. Please try again.';
    loginError.style.display = 'block';
  } finally {
    hideLoading();
  }
}

// Handle logout
async function handleLogout() {
  try {
    await fetch('/admin/logout', { method: 'POST' });
    showLoginScreen();
    loginForm.reset();
    loginError.style.display = 'none';
    showToast('Logged out successfully', 'success');
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Navigate to page
function navigateTo(page) {
  currentPage = page;

  // Update navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-page') === page) {
      link.classList.add('active');
    }
  });

  // Show page
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
  });

  const targetPage = document.getElementById(`${page}Page`);
  if (targetPage) {
    targetPage.classList.add('active');
  }

  // Load page data
  switch (page) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'groups':
      loadGroups();
      break;
    case 'analytics':
      loadAnalytics();
      break;
    case 'qrcode':
      // QR code page doesn't need to load data
      break;
  }
}

// Load dashboard
async function loadDashboard() {
  try {
    const response = await fetch('/admin/stats');
    const data = await response.json();

    updateDashboardStats(data.stats);
    updateRecentScans(data.recentScans);
  } catch (error) {
    console.error('Failed to load dashboard:', error);
    showToast('Failed to load dashboard data', 'error');
  }
}

// Update dashboard stats
function updateDashboardStats(stats) {
  document.getElementById('totalGroups').textContent = stats.totalGroups;
  document.getElementById('activeGroups').textContent = stats.activeGroups;
  document.getElementById('totalCapacity').textContent = stats.totalCapacity.toLocaleString();
  document.getElementById('currentMembers').textContent = stats.currentMembers.toLocaleString();
  document.getElementById('fillRate').textContent = `${stats.fillRate}%`;
  document.getElementById('totalScans').textContent = stats.totalScans.toLocaleString();
  document.getElementById('uniqueIPs').textContent = stats.uniqueIPs.toLocaleString();

  // Update progress bar
  const fillProgress = document.getElementById('fillProgress');
  if (fillProgress) {
    fillProgress.style.width = `${stats.fillRate}%`;
  }
}

// Update recent scans
function updateRecentScans(scans) {
  const tbody = document.getElementById('recentScansTable');

  if (!scans || scans.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">No scans yet</td></tr>';
    return;
  }

  tbody.innerHTML = scans.map(scan => {
    const date = new Date(scan.scan_time);
    const timeAgo = getTimeAgo(date);
    const device = scan.user_agent.includes('Mobile') ? '📱 Mobile' : '💻 Desktop';

    return `
      <tr>
        <td>${timeAgo}</td>
        <td>${scan.group_name || 'N/A'}</td>
        <td>${scan.ip_address}</td>
        <td>${device}</td>
      </tr>
    `;
  }).join('');
}

// Load groups
async function loadGroups() {
  try {
    showLoading();
    const response = await fetch('/admin/groups');
    groups = await response.json();

    displayGroups(groups);
  } catch (error) {
    console.error('Failed to load groups:', error);
    showToast('Failed to load groups', 'error');
  } finally {
    hideLoading();
  }
}

// Display groups
function displayGroups(groups) {
  const container = document.getElementById('groupsList');

  if (groups.length === 0) {
    container.innerHTML = '<div class="section"><p class="text-center">No groups yet. Click "Add Group" to create one.</p></div>';
    return;
  }

  container.innerHTML = groups.map(group => {
    const fillPercentage = ((group.current_count / group.capacity) * 100).toFixed(1);
    const isFull = group.current_count >= group.capacity;
    const statusClass = !group.is_active ? 'status-inactive' : isFull ? 'status-full' : 'status-active';
    const statusText = !group.is_active ? 'Inactive' : isFull ? 'Full' : 'Active';

    return `
      <div class="group-card">
        <div class="group-header">
          <div>
            <div class="group-name">${escapeHtml(group.name)}</div>
          </div>
          <span class="group-status ${statusClass}">${statusText}</span>
        </div>

        <div class="group-info">
          <div class="group-info-item">
            <span class="group-info-label">Current Count:</span>
            <span class="group-info-value">${group.current_count}</span>
          </div>
          <div class="group-info-item">
            <span class="group-info-label">Capacity:</span>
            <span class="group-info-value">${group.capacity}</span>
          </div>
          <div class="group-info-item">
            <span class="group-info-label">Created:</span>
            <span class="group-info-value">${formatDate(group.created_at)}</span>
          </div>
        </div>

        <div class="group-progress">
          <div class="group-progress-label">
            <span>Fill Rate</span>
            <span>${fillPercentage}%</span>
          </div>
          <div class="group-progress-bar">
            <div class="group-progress-fill" style="width: ${fillPercentage}%"></div>
          </div>
        </div>

        <div class="group-actions">
          <button class="btn btn-small btn-secondary" onclick="openGroupModal(${group.id})">✏️ Edit</button>
          <button class="btn btn-small ${group.is_active ? 'btn-warning' : 'btn-success'}" onclick="toggleGroup(${group.id})">
            ${group.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
          </button>
          <button class="btn btn-small btn-primary" onclick="resetGroup(${group.id})">🔄 Reset Count</button>
          <button class="btn btn-small btn-danger" onclick="deleteGroup(${group.id})">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

// Open group modal
async function openGroupModal(groupId = null) {
  const modal = document.getElementById('groupModal');
  const modalTitle = document.getElementById('modalTitle');
  const form = document.getElementById('groupForm');

  form.reset();

  if (groupId) {
    // Edit mode
    const group = groups.find(g => g.id === groupId);
    if (group) {
      modalTitle.textContent = 'Edit Group';
      document.getElementById('groupId').value = group.id;
      document.getElementById('groupName').value = group.name;
      document.getElementById('whatsappLink').value = group.whatsapp_link;
      document.getElementById('groupCapacity').value = group.capacity;
      document.getElementById('groupActive').checked = group.is_active === 1;
    }
  } else {
    // Add mode
    modalTitle.textContent = 'Add New Group';
    document.getElementById('groupId').value = '';
    document.getElementById('groupActive').checked = true;
  }

  modal.classList.add('active');
}

// Close modal
function closeModal() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.remove('active');
  });
}

// Handle group submit
async function handleGroupSubmit(e) {
  e.preventDefault();

  const groupId = document.getElementById('groupId').value;
  const name = document.getElementById('groupName').value;
  const whatsappLink = document.getElementById('whatsappLink').value;
  const capacity = parseInt(document.getElementById('groupCapacity').value);
  const isActive = document.getElementById('groupActive').checked;

  try {
    showLoading();

    const url = groupId ? `/admin/groups/${groupId}` : '/admin/groups';
    const method = groupId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, whatsappLink, capacity, isActive })
    });

    const data = await response.json();

    if (data.success || data.id) {
      showToast(groupId ? 'Group updated successfully' : 'Group added successfully', 'success');
      closeModal();
      loadGroups();
    } else {
      showToast(data.error || 'Failed to save group', 'error');
    }
  } catch (error) {
    console.error('Failed to save group:', error);
    showToast('Failed to save group', 'error');
  } finally {
    hideLoading();
  }
}

// Toggle group status
async function toggleGroup(groupId) {
  try {
    showLoading();
    const response = await fetch(`/admin/groups/${groupId}/toggle`, {
      method: 'POST'
    });

    const data = await response.json();

    if (data.success) {
      showToast('Group status updated', 'success');
      loadGroups();
    }
  } catch (error) {
    console.error('Failed to toggle group:', error);
    showToast('Failed to update group status', 'error');
  } finally {
    hideLoading();
  }
}

// Reset group count
async function resetGroup(groupId) {
  if (!confirm('Are you sure you want to reset the count to 0?')) return;

  try {
    showLoading();
    const response = await fetch(`/admin/groups/${groupId}/reset`, {
      method: 'POST'
    });

    const data = await response.json();

    if (data.success) {
      showToast('Group count reset successfully', 'success');
      loadGroups();
    }
  } catch (error) {
    console.error('Failed to reset group:', error);
    showToast('Failed to reset group count', 'error');
  } finally {
    hideLoading();
  }
}

// Delete group
async function deleteGroup(groupId) {
  if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;

  try {
    showLoading();
    const response = await fetch(`/admin/groups/${groupId}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (data.success) {
      showToast('Group deleted successfully', 'success');
      loadGroups();
    }
  } catch (error) {
    console.error('Failed to delete group:', error);
    showToast('Failed to delete group', 'error');
  } finally {
    hideLoading();
  }
}

// Load analytics
async function loadAnalytics() {
  try {
    showLoading();
    const response = await fetch('/admin/analytics');
    const data = await response.json();

    createCharts(data);
  } catch (error) {
    console.error('Failed to load analytics:', error);
    showToast('Failed to load analytics', 'error');
  } finally {
    hideLoading();
  }
}

// Load Chart.js library
function loadChartLibrary() {
  if (typeof Chart === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    document.head.appendChild(script);
  }
}

// Create charts
function createCharts(data) {
  // Wait for Chart.js to load
  if (typeof Chart === 'undefined') {
    setTimeout(() => createCharts(data), 100);
    return;
  }

  // Scans per day chart
  const scansPerDayCtx = document.getElementById('scansPerDayChart');
  if (scansPerDayCtx) {
    if (charts.scansPerDay) charts.scansPerDay.destroy();

    charts.scansPerDay = new Chart(scansPerDayCtx, {
      type: 'bar',
      data: {
        labels: data.scansPerDay.map(d => formatDate(d.date)).reverse(),
        datasets: [{
          label: 'Scans',
          data: data.scansPerDay.map(d => d.count).reverse(),
          backgroundColor: 'rgba(37, 211, 102, 0.7)',
          borderColor: 'rgba(37, 211, 102, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  // Scans per hour chart
  const scansPerHourCtx = document.getElementById('scansPerHourChart');
  if (scansPerHourCtx) {
    if (charts.scansPerHour) charts.scansPerHour.destroy();

    charts.scansPerHour = new Chart(scansPerHourCtx, {
      type: 'line',
      data: {
        labels: data.scansPerHour.map(d => {
          const date = new Date(d.hour);
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }).reverse(),
        datasets: [{
          label: 'Scans',
          data: data.scansPerHour.map(d => d.count).reverse(),
          backgroundColor: 'rgba(18, 140, 126, 0.2)',
          borderColor: 'rgba(18, 140, 126, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  // Top groups chart
  const topGroupsCtx = document.getElementById('topGroupsChart');
  if (topGroupsCtx) {
    if (charts.topGroups) charts.topGroups.destroy();

    charts.topGroups = new Chart(topGroupsCtx, {
      type: 'bar',
      data: {
        labels: data.topGroups.map(g => g.name),
        datasets: [{
          label: 'Scans',
          data: data.topGroups.map(g => g.scan_count),
          backgroundColor: [
            'rgba(37, 211, 102, 0.7)',
            'rgba(18, 140, 126, 0.7)',
            'rgba(37, 211, 102, 0.5)',
            'rgba(18, 140, 126, 0.5)',
            'rgba(37, 211, 102, 0.3)'
          ],
          borderColor: 'rgba(37, 211, 102, 1)',
          borderWidth: 2
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { beginAtZero: true }
        }
      }
    });
  }

  // Device breakdown chart
  const deviceCtx = document.getElementById('deviceChart');
  if (deviceCtx) {
    if (charts.device) charts.device.destroy();

    charts.device = new Chart(deviceCtx, {
      type: 'doughnut',
      data: {
        labels: data.deviceBreakdown.map(d => d.device_type),
        datasets: [{
          data: data.deviceBreakdown.map(d => d.count),
          backgroundColor: [
            'rgba(37, 211, 102, 0.7)',
            'rgba(18, 140, 126, 0.7)'
          ],
          borderColor: [
            'rgba(37, 211, 102, 1)',
            'rgba(18, 140, 126, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
}

// Generate QR Code
async function generateQRCode() {
  const size = document.getElementById('qrSize').value;

  try {
    showLoading();
    const response = await fetch(`/admin/qrcode?size=${size}`);
    const data = await response.json();

    const qrCodeImage = document.getElementById('qrCodeImage');
    const qrCodeUrl = document.getElementById('qrCodeUrl');
    const downloadBtn = document.getElementById('downloadQR');

    qrCodeImage.innerHTML = `<img src="${data.qrCode}" class="qr-image" alt="QR Code">`;
    qrCodeUrl.textContent = data.url;
    downloadBtn.style.display = 'block';
    downloadBtn.setAttribute('data-qr', data.qrCode);

    showToast('QR Code generated successfully', 'success');
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    showToast('Failed to generate QR code', 'error');
  } finally {
    hideLoading();
  }
}

// Download QR Code
function downloadQRCode() {
  const downloadBtn = document.getElementById('downloadQR');
  const qrData = downloadBtn.getAttribute('data-qr');

  if (!qrData) return;

  const link = document.createElement('a');
  link.href = qrData;
  link.download = `whatsapp-qr-${Date.now()}.png`;
  link.click();

  showToast('QR Code downloaded', 'success');
}

// Export data
async function exportData() {
  try {
    showLoading();
    const response = await fetch('/admin/export');
    const data = await response.json();

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `export-${Date.now()}.json`;
    link.click();

    showToast('Data exported successfully', 'success');
  } catch (error) {
    console.error('Failed to export data:', error);
    showToast('Failed to export data', 'error');
  } finally {
    hideLoading();
  }
}

// Utility functions
function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function showLoading() {
  loadingOverlay.style.display = 'flex';
}

function hideLoading() {
  loadingOverlay.style.display = 'none';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}
