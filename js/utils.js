// ========== 工具函数 ==========

// ========== 共享变量 ==========
var myAvatar = '';
var contactAvatars = {};

// ========== iOS风格弹窗 ==========
function showAlert(title, placeholder, callback) {
  var overlay = document.createElement('div');
  overlay.className = 'alert-overlay';

  var dialog = document.createElement('div');
  dialog.className = 'alert-dialog';
  dialog.innerHTML = `
    <div class="alert-title">${title}</div>
    <input type="text" class="alert-input" placeholder="${placeholder}" autofocus>
    <div class="alert-buttons">
      <button class="alert-btn cancel">取消</button>
      <button class="alert-btn confirm">确定</button>
    </div>
  `;

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  var input = dialog.querySelector('.alert-input');
  var cancelBtn = dialog.querySelector('.cancel');
  var confirmBtn = dialog.querySelector('.confirm');

  function close() {
    overlay.remove();
  }

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      close();
    }
  });

  cancelBtn.addEventListener('click', close);

  confirmBtn.addEventListener('click', function() {
    var value = input.value.trim();
    close();
    if (callback) callback(value);
  });

  input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      var value = input.value.trim();
      close();
      if (callback) callback(value);
    }
  });

  setTimeout(function() {
    input.focus();
  }, 100);
}

// ========== Toast 提示 ==========
function showToast(title, message, type) {
  var overlay = document.createElement('div');
  overlay.className = 'alert-overlay';

  var colors = {
    success: { bg: '#32d74b', icon: '✓' },
    error: { bg: '#ff375f', icon: '✗' },
    warning: { bg: '#ff9f0a', icon: '!' },
    info: { bg: '#007AFF', icon: 'ℹ' }
  };

  var color = colors[type] || colors.info;

  var dialog = document.createElement('div');
  dialog.className = 'alert-dialog';
  dialog.style.width = '270px';
  dialog.style.textAlign = 'center';
  dialog.innerHTML = `
    <div style="padding: 24px 16px 16px 16px;">
      <div style="width: 50px; height: 50px; border-radius: 50%; background: ${color.bg}; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto; font-size: 24px; color: white;">${color.icon}</div>
      <div class="alert-title" style="padding: 0;">${title}</div>
      ${message ? '<div style="font-size: 14px; color: rgba(0,0,0,0.5); margin-top: 6px;">' + message + '</div>' : ''}
    </div>
    <div class="alert-buttons" style="border-top: 1px solid rgba(0,0,0,0.1);">
      <button class="alert-btn confirm" id="toastOkBtn" style="border-right: none;">确定</button>
    </div>
  `;

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  function close() {
    overlay.remove();
  }

  document.getElementById('toastOkBtn').addEventListener('click', close);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) close();
  });

  setTimeout(close, 3000);
}

// ========== 隐藏/显示 Dock ==========
function hideDock() {
  var dock = document.getElementById('dock');
  var homeIndicator = document.getElementById('homeIndicator');
  if (dock) dock.style.display = 'none';
  if (homeIndicator) homeIndicator.style.display = 'none';
}

function showDock() {
  var dock = document.getElementById('dock');
  var homeIndicator = document.getElementById('homeIndicator');
  if (dock) dock.style.display = 'flex';
  if (homeIndicator) homeIndicator.style.display = 'block';
}

// ========== 暴露全局 ==========
window.showAlert = showAlert;
window.showToast = showToast;
window.hideDock = hideDock;
window.showDock = showDock;
window.myAvatar = myAvatar;
window.contactAvatars = contactAvatars;