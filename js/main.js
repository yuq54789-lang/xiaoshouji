// ========== 主入口 & 时间更新 ==========

function updateTime() {
  var now = new Date();
  var hours = String(now.getHours()).padStart(2, '0');
  var minutes = String(now.getMinutes()).padStart(2, '0');
  var month = now.getMonth() + 1;
  var day = now.getDate();
  var weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  var weekday = weekdays[now.getDay()];

  var timeEl = document.getElementById('currentTime');
  var dateEl = document.getElementById('currentDate');
  var statusBarTime = document.getElementById('statusBarTime');

  if (timeEl) timeEl.textContent = hours + ':' + minutes;
  if (dateEl) dateEl.textContent = month + '月' + day + '日 ' + weekday;
  if (statusBarTime) {
    var homeContent = document.getElementById('homeContent');
    if (homeContent && homeContent.style.display !== 'none') {
      statusBarTime.textContent = hours + ':' + minutes;
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('[应用] 启动中...');

  // ===== 注册 Service Worker =====
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('[PWA] Service Worker 注册成功:', registration.scope);
      })
      .catch(function(error) {
        console.log('[PWA] Service Worker 注册失败:', error);
      });
  }

  updateTime();
  setInterval(updateTime, 1000);

  if (typeof loadSettings === 'function') {
    loadSettings();
    console.log('[应用] 设置已加载');
  }

  if (typeof loadChatData === 'function') {
    chatData = loadChatData();
    console.log('[应用] 聊天数据已加载，共 ' + Object.keys(chatData).length + ' 个联系人');
  }

  if (typeof renderChatList === 'function') {
    renderChatList();
    console.log('[应用] 聊天列表已渲染');
  }

  if (typeof initNavigation === 'function') {
    initNavigation();
    console.log('[应用] 导航已初始化');
  }

  if (typeof initSettings === 'function') {
    initSettings();
    console.log('[应用] 设置已初始化');
  }

  if (typeof initApiSettings === 'function') {
    initApiSettings();
    console.log('[应用] API设置已初始化');
  }

  if (typeof initBeautifySettings === 'function') {
    initBeautifySettings();
    console.log('[应用] 美化设置已初始化');
  }

  // ===== 初始化长期记忆 =====
  if (typeof initLongTermMemory === 'function') {
    initLongTermMemory();
    console.log('[应用] 长期记忆已初始化');
  }

  if (typeof loadBeautifySettings === 'function') {
    var beautifyData = loadBeautifySettings();
    if (beautifyData) {
      if (typeof applyThemeCss === 'function') {
        applyThemeCss(beautifyData.themeCss);
      }
      if (typeof applyBubbleCss === 'function') {
        applyBubbleCss(beautifyData.bubbleCss);
      }
      if (typeof applyFontUrl === 'function') {
        applyFontUrl(beautifyData.fontUrl);
      }
      console.log('[应用] 美化设置已应用');
    }
  }

  var chatInput = document.getElementById('chatInput');
  var sendBtn = document.getElementById('sendBtn');
  var replyBtn = document.getElementById('replyBtn');

  if (sendBtn) {
    sendBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (typeof sendMessage === 'function') sendMessage();
    });
    console.log('[应用] 发送按钮已绑定');
  }

  if (chatInput) {
    chatInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (typeof sendMessage === 'function') sendMessage();
      }
    });
    console.log('[应用] 输入框已绑定');
  }

  if (replyBtn) {
    replyBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (!currentChat) {
        if (typeof showToast === 'function') {
          showToast('提示', '请先进入一个聊天', 'warning');
        }
        return;
      }
      if (typeof callAIResponse === 'function') {
        callAIResponse(currentChat);
      } else {
        console.error('[应用] 未找到 callAIResponse 函数，请确保 api.js 已正确加载。');
        if (typeof showToast === 'function') {
          showToast('错误', 'AI功能未初始化，请检查API设置', 'error');
        }
      }
    });
    console.log('[应用] AI回复按钮已绑定');
  }

  var apiUrl = localStorage.getItem('apiUrl');
  var modelName = localStorage.getItem('modelName');
  if (!apiUrl || !modelName) {
    console.warn('[应用] API设置不完整，请前往设置页面配置');
  } else {
    console.log('[应用] API已配置: ' + apiUrl);
  }

  console.log('[应用] 🚀 启动完成！');
});

function initApiSettings() {
  var settingsPage = document.getElementById('settingsPage');
  var apiSettingsPage = document.getElementById('apiSettingsPage');
  var statusBarTime = document.getElementById('statusBarTime');

  var apiSettingItem = document.getElementById('apiSettingItem');
  if (apiSettingItem) {
    apiSettingItem.addEventListener('click', function() {
      if (settingsPage) settingsPage.style.display = 'none';
      if (apiSettingsPage) apiSettingsPage.style.display = 'flex';
      if (statusBarTime) statusBarTime.textContent = 'API设置';
      if (typeof loadApiSettings === 'function') loadApiSettings();
    });
  }

  var apiSettingsBackBtn = document.getElementById('apiSettingsBackBtn');
  if (apiSettingsBackBtn) {
    apiSettingsBackBtn.addEventListener('click', function() {
      if (apiSettingsPage) apiSettingsPage.style.display = 'none';
      if (settingsPage) settingsPage.style.display = 'flex';
      if (statusBarTime) statusBarTime.textContent = '设置';
    });
  }

  var apiSettingsSaveBtn = document.getElementById('apiSettingsSaveBtn');
  if (apiSettingsSaveBtn) {
    apiSettingsSaveBtn.addEventListener('click', function() {
      if (typeof saveApiSettings === 'function') saveApiSettings();
      if (apiSettingsPage) apiSettingsPage.style.display = 'none';
      if (settingsPage) settingsPage.style.display = 'flex';
      if (statusBarTime) statusBarTime.textContent = '设置';
      if (typeof showToast === 'function') {
        showToast('保存成功', 'API设置已保存', 'success');
      }
    });
  }

  // ===== 获取聊天模型列表 =====
  var fetchChatBtn = document.getElementById('fetchChatModelsBtn');
  if (fetchChatBtn) {
    fetchChatBtn.addEventListener('click', function() {
      if (typeof fetchChatModels === 'function') fetchChatModels();
    });
  }

  // ===== 获取记忆模型列表 =====
  var fetchMemoryBtn = document.getElementById('fetchMemoryModelsBtn');
  if (fetchMemoryBtn) {
    fetchMemoryBtn.addEventListener('click', function() {
      if (typeof fetchMemoryModels === 'function') fetchMemoryModels();
    });
  }

  // ===== 绑定预设事件 =====
  if (typeof bindApiPresetEvents === 'function') {
    bindApiPresetEvents();
  }

  console.log('[API设置] 已初始化');
}

window.updateTime = updateTime;
window.initApiSettings = initApiSettings;