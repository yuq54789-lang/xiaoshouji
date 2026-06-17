// ========== 设置页面 & 聊天设置 & 头像设置 ==========

// ========== 全局变量 ==========
var personas = {};
var chatBackgrounds = {};

// ========== 图片压缩函数 ==========
function compressImage(dataUrl, maxSize, callback) {
  var img = new Image();
  img.onload = function() {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    var width = img.width;
    var height = img.height;

    if (width > maxSize || height > maxSize) {
      var ratio = Math.min(maxSize / width, maxSize / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    var compressed = canvas.toDataURL('image/jpeg', 0.8);
    callback(compressed);
  };
  img.src = dataUrl;
}

// ========== 更新头像预览 ==========
function updateAvatarPreview() {
  var myPreview = document.getElementById('myAvatarPreview');
  var contactPreview = document.getElementById('contactAvatarPreview');

  if (myPreview) {
    if (myAvatar) {
      myPreview.style.backgroundImage = 'url(' + myAvatar + ')';
      myPreview.style.backgroundSize = 'cover';
      myPreview.style.backgroundPosition = 'center';
      myPreview.textContent = '';
    } else {
      myPreview.style.backgroundImage = '';
      myPreview.style.backgroundSize = '';
      myPreview.textContent = '我';
    }
  }

  if (contactPreview && currentChat) {
    if (contactAvatars && contactAvatars[currentChat]) {
      contactPreview.style.backgroundImage = 'url(' + contactAvatars[currentChat] + ')';
      contactPreview.style.backgroundSize = 'cover';
      contactPreview.style.backgroundPosition = 'center';
      contactPreview.textContent = '';
    } else {
      contactPreview.style.backgroundImage = '';
      contactPreview.style.backgroundSize = '';
      contactPreview.textContent = '对';
    }
  }
}

// ========== 更新聊天列表头像 ==========
function updateChatListAvatar(name, avatarUrl) {
  var chatItems = document.querySelectorAll('.chat-item');
  for (var i = 0; i < chatItems.length; i++) {
    var item = chatItems[i];
    var chatName = item.querySelector('.chat-name');
    if (chatName && chatName.textContent === name) {
      var avatarEl = item.querySelector('.chat-avatar');
      if (avatarEl) {
        if (avatarUrl) {
          avatarEl.style.backgroundImage = 'url(' + avatarUrl + ')';
          avatarEl.style.backgroundSize = 'cover';
          avatarEl.style.backgroundPosition = 'center';
          avatarEl.textContent = '';
        } else {
          avatarEl.style.backgroundImage = '';
          avatarEl.style.backgroundSize = '';
          avatarEl.textContent = name.charAt(0);
        }
      }
      break;
    }
  }
}

// ========== 更新聊天列表名称 ==========
function updateChatListName(oldName, newName) {
  var chatItems = document.querySelectorAll('.chat-item');
  for (var i = 0; i < chatItems.length; i++) {
    var item = chatItems[i];
    var chatName = item.querySelector('.chat-name');
    if (chatName && chatName.textContent === oldName) {
      chatName.textContent = newName;
      var avatarEl = item.querySelector('.chat-avatar');
      if (avatarEl && avatarEl.textContent === oldName.charAt(0)) {
        avatarEl.textContent = newName.charAt(0);
      }
      break;
    }
  }
}

// ========== 应用聊天背景 ==========
function applyChatBackground(name, url) {
  var chatDetailPage = document.getElementById('chatDetailPage');
  if (currentChat === name && chatDetailPage) {
    if (url) {
      chatDetailPage.style.backgroundImage = 'url(' + url + ')';
      chatDetailPage.style.backgroundSize = 'cover';
      chatDetailPage.style.backgroundPosition = 'center';
    } else {
      chatDetailPage.style.backgroundImage = '';
      chatDetailPage.style.backgroundSize = '';
    }
  }
}

// ========== 处理文件选择（优化版：实时预览 + 压缩） ==========
function handleFileSelect(fileInput, previewEl, setAvatarFn) {
  if (!fileInput) return;

  fileInput.addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;

    // 显示加载状态
    if (previewEl) {
      previewEl.textContent = '⏳';
      previewEl.style.backgroundImage = '';
      previewEl.style.backgroundSize = '';
    }

    var reader = new FileReader();
    reader.onload = function(event) {
      var dataUrl = event.target.result;

      compressImage(dataUrl, 200, function(compressedUrl) {
        if (typeof setAvatarFn === 'function') {
          setAvatarFn(compressedUrl);
        }

        if (previewEl) {
          previewEl.style.backgroundImage = 'url(' + compressedUrl + ')';
          previewEl.style.backgroundSize = 'cover';
          previewEl.style.backgroundPosition = 'center';
          previewEl.textContent = '';
        }

        if (fileInput.id === 'contactAvatarFileInput' && currentChat) {
          updateChatListAvatar(currentChat, compressedUrl);
          if (typeof renderMessages === 'function') {
            renderMessages(currentChat);
          }
        }

        if (fileInput.id === 'myAvatarFileInput') {
          if (typeof renderMessages === 'function' && currentChat) {
            renderMessages(currentChat);
          }
        }

        if (typeof saveSettings === 'function') {
          saveSettings();
        }

        console.log('[头像] 已更新:', fileInput.id);
      });
    };
    reader.readAsDataURL(file);
  });
}

// ========== 显示聊天背景弹窗 ==========
function showBackgroundAlert() {
  var overlay = document.createElement('div');
  overlay.className = 'alert-overlay';

  var dialog = document.createElement('div');
  dialog.className = 'alert-dialog';
  dialog.style.width = '300px';
  dialog.innerHTML = `
    <div class="alert-title">聊天背景</div>
    <div style="padding: 0 16px 10px 16px; text-align: center;">
      <div id="bgPreview" style="width: 100%; height: 150px; border-radius: 10px; background: #e9e9ed; display: flex; align-items: center; justify-content: center; background-size: cover; background-position: center; margin-bottom: 10px;">
        <span style="color: rgba(0,0,0,0.3);">预览</span>
      </div>
      <button class="avatar-action-btn" id="bgFileBtn" style="width: 100%; margin-bottom: 8px;">📁 从相册选择</button>
      <input type="file" id="bgFileInput" accept="image/*" style="display: none;">
      <input type="text" id="bgUrlInput" placeholder="或输入图片URL" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.15); background: rgba(0,0,0,0.04); font-size: 14px; outline: none; box-sizing: border-box;">
    </div>
    <div class="alert-buttons">
      <button class="alert-btn cancel" id="bgCancelBtn">取消</button>
      <button class="alert-btn confirm" id="bgApplyBtn">应用</button>
    </div>
  `;

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  var bgPreview = document.getElementById('bgPreview');
  var bgUrlInput = document.getElementById('bgUrlInput');

  if (chatBackgrounds && chatBackgrounds[currentChat]) {
    bgPreview.style.backgroundImage = 'url(' + chatBackgrounds[currentChat] + ')';
    bgPreview.style.backgroundSize = 'cover';
    bgPreview.style.backgroundPosition = 'center';
    bgPreview.innerHTML = '';
    bgUrlInput.value = chatBackgrounds[currentChat];
  }

  function close() {
    overlay.remove();
  }

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) close();
  });

  var cancelBtn = document.getElementById('bgCancelBtn');
  if (cancelBtn) cancelBtn.addEventListener('click', close);

  var fileBtn = document.getElementById('bgFileBtn');
  var fileInput = document.getElementById('bgFileInput');
  if (fileBtn && fileInput) {
    fileBtn.addEventListener('click', function() {
      fileInput.click();
    });

    fileInput.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (file) {
        bgPreview.innerHTML = '⏳ 加载中...';
        bgPreview.style.backgroundImage = '';

        var reader = new FileReader();
        reader.onload = function(event) {
          var dataUrl = event.target.result;
          compressImage(dataUrl, 800, function(compressedUrl) {
            bgPreview.style.backgroundImage = 'url(' + compressedUrl + ')';
            bgPreview.style.backgroundSize = 'cover';
            bgPreview.style.backgroundPosition = 'center';
            bgPreview.innerHTML = '';
            bgUrlInput.value = compressedUrl;
          });
        };
        reader.readAsDataURL(file);
      }
    });
  }

  var applyBtn = document.getElementById('bgApplyBtn');
  if (applyBtn) {
    applyBtn.addEventListener('click', function() {
      var url = bgUrlInput.value.trim();
      var imgUrl = '';

      if (url) {
        imgUrl = url;
      } else if (bgPreview.style.backgroundImage && bgPreview.style.backgroundImage !== 'none') {
        var match = bgPreview.style.backgroundImage.match(/url\(["']?([^"']*)["']?\)/);
        if (match && match[1]) {
          imgUrl = match[1];
        }
      }

      if (imgUrl) {
        var chatDetailPage = document.getElementById('chatDetailPage');
        if (chatDetailPage) {
          chatDetailPage.style.backgroundImage = '';
          chatDetailPage.style.backgroundColor = '#f2f2f7';
        }

        var preloadImg = new Image();
        preloadImg.onload = function() {
          chatBackgrounds[currentChat] = imgUrl;
          applyChatBackground(currentChat, imgUrl);
          saveSettings();
          close();
          if (typeof showToast === 'function') {
            showToast('已应用', '聊天背景已更新', 'success');
          }
        };
        preloadImg.onerror = function() {
          chatBackgrounds[currentChat] = imgUrl;
          applyChatBackground(currentChat, imgUrl);
          saveSettings();
          close();
          if (typeof showToast === 'function') {
            showToast('已应用', '聊天背景已更新', 'success');
          }
        };
        preloadImg.src = imgUrl;
      } else {
        if (typeof showToast === 'function') {
          showToast('提示', '请选择或输入图片', 'warning');
        }
      }
    });
  }
}

// ========== 初始化设置 ==========
function initSettings() {
  var settingsPage = document.getElementById('settingsPage');
  var chatSettingsPage = document.getElementById('chatSettingsPage');
  var avatarSettingsPage = document.getElementById('avatarSettingsPage');
  var homeContent = document.getElementById('homeContent');
  var chatDetailPage = document.getElementById('chatDetailPage');
  var statusBarTime = document.getElementById('statusBarTime');

  var settingsBackBtn = document.getElementById('settingsBackBtn');
  if (settingsBackBtn) {
    settingsBackBtn.addEventListener('click', function() {
      if (settingsPage) settingsPage.style.display = 'none';
      if (homeContent) homeContent.style.display = 'flex';
      if (typeof showDock === 'function') showDock();
      if (statusBarTime) statusBarTime.textContent = '9:41';
    });
  }

  var detailMenuBtn = document.getElementById('detailMenuBtn');
  if (detailMenuBtn) {
    detailMenuBtn.addEventListener('click', function() {
      var pinSwitch = document.getElementById('pinSwitch');
      var nicknameValue = document.getElementById('nicknameValue');
      var personaTextarea = document.getElementById('personaTextarea');

      if (pinSwitch) pinSwitch.checked = pinnedChats.includes(currentChat);
      if (nicknameValue) nicknameValue.textContent = currentChat;
      if (personaTextarea) {
        personaTextarea.value = (personas && personas[currentChat]) ? personas[currentChat] : '';
      }

      if (chatDetailPage) chatDetailPage.style.display = 'none';
      if (chatSettingsPage) chatSettingsPage.style.display = 'flex';
      if (statusBarTime) statusBarTime.textContent = '聊天设置';
    });
  }

  var chatSettingsBackBtn = document.getElementById('chatSettingsBackBtn');
  if (chatSettingsBackBtn) {
    chatSettingsBackBtn.addEventListener('click', function() {
      if (chatSettingsPage) chatSettingsPage.style.display = 'none';
      if (chatDetailPage) chatDetailPage.style.display = 'flex';
      if (statusBarTime) statusBarTime.textContent = currentChat;
    });
  }

  var chatSettingsSaveBtn = document.getElementById('chatSettingsSaveBtn');
  if (chatSettingsSaveBtn) {
    chatSettingsSaveBtn.addEventListener('click', function() {
      var muteSwitch = document.getElementById('muteSwitch');
      var pinSwitch = document.getElementById('pinSwitch');
      var personaTextarea = document.getElementById('personaTextarea');

      var isMuted = muteSwitch ? muteSwitch.checked : false;
      var isPinned = pinSwitch ? pinSwitch.checked : false;
      var personaText = personaTextarea ? personaTextarea.value.trim() : '';

      if (personaText) {
        personas[currentChat] = personaText;
      } else {
        delete personas[currentChat];
      }

      if (isPinned && !pinnedChats.includes(currentChat)) {
        pinnedChats.push(currentChat);
      } else if (!isPinned && pinnedChats.includes(currentChat)) {
        pinnedChats = pinnedChats.filter(function(name) {
          return name !== currentChat;
        });
      }

      saveSettings();

      if (typeof sortChatList === 'function') sortChatList();

      if (chatSettingsPage) chatSettingsPage.style.display = 'none';
      if (chatDetailPage) chatDetailPage.style.display = 'flex';
      if (statusBarTime) statusBarTime.textContent = currentChat;
    });
  }

  var bgSettingItem = document.getElementById('chatBackgroundSettingItem');
  if (bgSettingItem) {
    bgSettingItem.addEventListener('click', function() {
      showBackgroundAlert();
    });
  }

  var nicknameSettingItem = document.getElementById('nicknameSettingItem');
  if (nicknameSettingItem) {
    nicknameSettingItem.addEventListener('click', function() {
      if (typeof showAlert !== 'function') {
        console.error('showAlert 未定义');
        return;
      }

      showAlert('修改昵称', '请输入新昵称', function(newName) {
        if (!newName || newName === currentChat) return;

        var oldName = currentChat;

        chatData[newName] = chatData[oldName] || [];
        delete chatData[oldName];

        if (contactAvatars && contactAvatars[oldName]) {
          contactAvatars[newName] = contactAvatars[oldName];
          delete contactAvatars[oldName];
        }

        if (personas && personas[oldName]) {
          personas[newName] = personas[oldName];
          delete personas[oldName];
        }

        if (chatBackgrounds && chatBackgrounds[oldName]) {
          chatBackgrounds[newName] = chatBackgrounds[oldName];
          delete chatBackgrounds[oldName];
        }

        if (pinnedChats.includes(oldName)) {
          pinnedChats = pinnedChats.filter(function(n) {
            return n !== oldName;
          });
          pinnedChats.push(newName);
        }

        saveChatData();
        saveSettings();

        updateChatListName(oldName, newName);

        currentChat = newName;
        window.currentChat = newName;

        var chatDetailTitle = document.getElementById('chatDetailTitle');
        var nicknameValue = document.getElementById('nicknameValue');
        var statusBarTime = document.getElementById('statusBarTime');

        if (chatDetailTitle) chatDetailTitle.textContent = newName;
        if (nicknameValue) nicknameValue.textContent = newName;
        if (statusBarTime) statusBarTime.textContent = newName;

        if (typeof renderMessages === 'function') renderMessages(newName);
      });
    });
  }

  var clearChatItem = document.getElementById('clearChatItem');
  if (clearChatItem) {
    clearChatItem.addEventListener('click', function() {
      if (confirm('确认清空与「' + currentChat + '」的所有聊天记录吗？')) {
        if (chatData[currentChat]) {
          chatData[currentChat] = [];
          saveChatData();
          if (typeof renderMessages === 'function') renderMessages(currentChat);
          if (typeof sortChatList === 'function') sortChatList();
          if (typeof showToast === 'function') {
            showToast('已清空', '聊天记录已清空', 'info');
          }
        }
      }
    });
  }

  var avatarSettingItem = document.getElementById('avatarSettingItem');
  if (avatarSettingItem) {
    avatarSettingItem.addEventListener('click', function() {
      if (chatSettingsPage) chatSettingsPage.style.display = 'none';
      if (avatarSettingsPage) avatarSettingsPage.style.display = 'flex';
      if (statusBarTime) statusBarTime.textContent = '头像设置';
      updateAvatarPreview();
    });
  }

  var avatarBackBtn = document.getElementById('avatarBackBtn');
  if (avatarBackBtn) {
    avatarBackBtn.addEventListener('click', function() {
      if (avatarSettingsPage) avatarSettingsPage.style.display = 'none';
      if (chatSettingsPage) chatSettingsPage.style.display = 'flex';
      if (statusBarTime) statusBarTime.textContent = '聊天设置';
    });
  }

  var avatarSaveBtn = document.getElementById('avatarSaveBtn');
  if (avatarSaveBtn) {
    avatarSaveBtn.addEventListener('click', function() {
      if (avatarSettingsPage) avatarSettingsPage.style.display = 'none';
      if (chatSettingsPage) chatSettingsPage.style.display = 'flex';
      if (statusBarTime) statusBarTime.textContent = '聊天设置';
    });
  }

  var uploadMyBtn = document.getElementById('uploadMyAvatarBtn');
  var myFileInput = document.getElementById('myAvatarFileInput');
  var myPreview = document.getElementById('myAvatarPreview');
  if (uploadMyBtn && myFileInput) {
    uploadMyBtn.addEventListener('click', function() {
      myFileInput.click();
    });
    handleFileSelect(myFileInput, myPreview, function(url) {
      myAvatar = url;
      saveSettings();
    });
  }

  var applyMyBtn = document.getElementById('applyMyAvatarBtn');
  var myUrlInput = document.getElementById('myAvatarUrlInput');
  if (applyMyBtn && myUrlInput) {
    applyMyBtn.addEventListener('click', function() {
      var url = myUrlInput.value.trim();
      if (url) {
        myAvatar = url;
        saveSettings();
        updateAvatarPreview();
        if (typeof renderMessages === 'function' && currentChat) {
          renderMessages(currentChat);
        }
        if (typeof showToast === 'function') {
          showToast('已更新', '我的头像已更新', 'success');
        }
      }
    });
  }

  var uploadContactBtn = document.getElementById('uploadContactAvatarBtn');
  var contactFileInput = document.getElementById('contactAvatarFileInput');
  var contactPreview = document.getElementById('contactAvatarPreview');
  if (uploadContactBtn && contactFileInput) {
    uploadContactBtn.addEventListener('click', function() {
      contactFileInput.click();
    });
    handleFileSelect(contactFileInput, contactPreview, function(url) {
      if (currentChat) {
        contactAvatars[currentChat] = url;
        saveSettings();
        updateChatListAvatar(currentChat, url);
        if (typeof renderMessages === 'function') {
          renderMessages(currentChat);
        }
      }
    });
  }

  var applyContactBtn = document.getElementById('applyContactAvatarBtn');
  var contactUrlInput = document.getElementById('contactAvatarUrlInput');
  if (applyContactBtn && contactUrlInput) {
    applyContactBtn.addEventListener('click', function() {
      var url = contactUrlInput.value.trim();
      if (url && currentChat) {
        contactAvatars[currentChat] = url;
        saveSettings();
        updateAvatarPreview();
        updateChatListAvatar(currentChat, url);
        if (typeof renderMessages === 'function') {
          renderMessages(currentChat);
        }
        if (typeof showToast === 'function') {
          showToast('已更新', '对方头像已更新', 'success');
        }
      }
    });
  }
}

// ========== 暴露全局 ==========
window.personas = personas;
window.chatBackgrounds = chatBackgrounds;
window.initSettings = initSettings;
window.updateAvatarPreview = updateAvatarPreview;
window.updateChatListAvatar = updateChatListAvatar;
window.updateChatListName = updateChatListName;
window.applyChatBackground = applyChatBackground;
window.handleFileSelect = handleFileSelect;
window.showBackgroundAlert = showBackgroundAlert;
window.compressImage = compressImage;