// ========== 页面切换 & 导航 ==========

function initNavigation() {
  var homeContent = document.getElementById('homeContent');
  var chatPage = document.getElementById('chatPage');
  var chatDetailPage = document.getElementById('chatDetailPage');
  var settingsPage = document.getElementById('settingsPage');
  var statusBarTime = document.getElementById('statusBarTime');

  // ===== 主屏幕应用点击 =====
  var appItems = document.querySelectorAll('.app-item');
  for (var i = 0; i < appItems.length; i++) {
    var item = appItems[i];
    (function(appItem) {
      appItem.addEventListener('click', function(e) {
        var labelEl = this.querySelector('.app-label');
        var label = labelEl ? labelEl.innerText : '应用';
        var dataApp = this.dataset.app;

        this.style.transition = 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        this.style.transform = 'scale(0.85)';
        setTimeout(function() {
          this.style.transform = 'scale(1)';
        }.bind(this), 150);

        // ===== 信息 =====
        if (label === '信息' || dataApp === 'messages') {
          if (homeContent) homeContent.style.display = 'none';
          if (chatPage) chatPage.style.display = 'flex';
          if (typeof hideDock === 'function') hideDock();
          if (statusBarTime) statusBarTime.textContent = '信息';
          if (typeof renderChatList === 'function') renderChatList();
        }

        // ===== 设置 =====
        if (label === '设置' || dataApp === 'settings') {
          if (homeContent) homeContent.style.display = 'none';
          if (settingsPage) settingsPage.style.display = 'flex';
          if (typeof hideDock === 'function') hideDock();
          if (statusBarTime) statusBarTime.textContent = '设置';
        }

        // ===== 美化设置 =====
        if (label === '美化设置' || dataApp === 'beautify') {
          if (homeContent) homeContent.style.display = 'none';
          var beautifyPage = document.getElementById('beautifySettingsPage');
          if (beautifyPage) beautifyPage.style.display = 'flex';
          if (typeof hideDock === 'function') hideDock();
          if (statusBarTime) statusBarTime.textContent = '美化设置';
          if (typeof loadBeautifyToUI === 'function') loadBeautifyToUI();
        }

        // ===== 音乐 =====
        if (label === '音乐' || dataApp === 'music') {
          if (typeof showToast === 'function') {
            showToast('音乐', '音乐功能开发中...', 'info');
          }
        }

        // ===== 备忘录 =====
        if (label === '备忘录' || dataApp === 'notes') {
          if (typeof showToast === 'function') {
            showToast('备忘录', '备忘录功能开发中...', 'info');
          }
        }

        console.log('打开应用：' + label);
      });
    })(item);
  }

  // ===== 聊天列表返回 =====
  var backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      if (chatPage) chatPage.style.display = 'none';
      if (homeContent) homeContent.style.display = 'flex';
      if (typeof showDock === 'function') showDock();
      if (statusBarTime) statusBarTime.textContent = '9:41';
    });
  }

  // ===== 新建消息 =====
  var newMsgBtn = document.getElementById('newMsgBtn');
  if (newMsgBtn) {
    newMsgBtn.addEventListener('click', function() {
      if (typeof showAlert !== 'function') {
        console.error('showAlert 未定义');
        return;
      }

      showAlert('新建信息', '请输入联系人姓名', function(name) {
        if (!name) return;

        var chatList = document.getElementById('chatList');
        if (chatList) {
          var existing = chatList.querySelectorAll('.chat-name');
          for (var i = 0; i < existing.length; i++) {
            if (existing[i].textContent === name) {
              if (typeof showToast === 'function') {
                showToast('提示', '该联系人已存在', 'warning');
              }
              return;
            }
          }
        }

        var colors = ['#5e5ce6', '#ff9f0a', '#32d74b', '#ff375f', '#0a84ff', '#ff6b6b'];
        var randomColor = colors[Math.floor(Math.random() * colors.length)];
        var firstChar = name.charAt(0);

        var chatList = document.getElementById('chatList');
        if (!chatList) return;

        var newChatItem = document.createElement('div');
        newChatItem.className = 'chat-item';
        newChatItem.dataset.name = name;
        newChatItem.innerHTML = `
          <div class="chat-avatar" style="background: ${randomColor};">${firstChar}</div>
          <div class="chat-info">
            <div class="chat-name">${name}</div>
            <div class="chat-preview">新对话</div>
          </div>
          <div class="chat-time">现在</div>
        `;

        chatList.appendChild(newChatItem);

        if (!chatData[name]) chatData[name] = [];
        saveChatData();

        newChatItem.style.opacity = '0';
        newChatItem.style.transform = 'translateX(-20px)';
        newChatItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        requestAnimationFrame(function() {
          newChatItem.style.opacity = '1';
          newChatItem.style.transform = 'translateX(0)';
        });

        if (typeof sortChatList === 'function') sortChatList();
      });
    });
  }

  // ===== 聊天列表项点击（事件委托） =====
  var chatList = document.getElementById('chatList');
  if (chatList) {
    chatList.addEventListener('click', function(e) {
      var chatItem = e.target.closest('.chat-item');
      if (!chatItem) return;

      var nameEl = chatItem.querySelector('.chat-name');
      if (!nameEl) return;
      var name = nameEl.textContent;

      chatItem.style.transition = 'transform 0.1s ease, background 0.1s ease';
      chatItem.style.transform = 'scale(0.98)';
      setTimeout(function() {
        chatItem.style.transform = 'scale(1)';
      }, 100);

      if (chatPage) chatPage.style.display = 'none';
      if (chatDetailPage) chatDetailPage.style.display = 'flex';
      if (statusBarTime) statusBarTime.textContent = name;
      if (typeof renderMessages === 'function') renderMessages(name);
    });
  }

  // ===== 聊天详情返回（修复：退出多选模式） =====
  var chatDetailBackBtn = document.getElementById('chatDetailBackBtn');
  if (chatDetailBackBtn) {
    chatDetailBackBtn.addEventListener('click', function() {
      // 退出多选模式
      if (typeof exitMultiSelectMode === 'function') {
        exitMultiSelectMode();
      }
      if (chatDetailPage) chatDetailPage.style.display = 'none';
      if (chatPage) chatPage.style.display = 'flex';
      if (statusBarTime) statusBarTime.textContent = '信息';
      if (typeof sortChatList === 'function') sortChatList();
    });
  }
}

// ========== 暴露全局 ==========
window.initNavigation = initNavigation;