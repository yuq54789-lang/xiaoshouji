// ========== 设置页面 & 聊天设置 & 头像设置 ==========

// ========== 全局变量 ==========
var personas = {};
var userPersonas = {};
var chatBackgrounds = {};
var shortTermWindow = 10;
var streamEnabled = true;

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

// ========== 处理文件选择 ==========
function handleFileSelect(fileInput, previewEl, setAvatarFn) {
  if (!fileInput) return;

  fileInput.addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;

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

// ========== 加载设置 ==========
function loadSettings() {
  try {
    var saved = localStorage.getItem('appSettings');
    if (saved) {
      var data = JSON.parse(saved);
      pinnedChats = data.pinnedChats || [];
      myAvatar = data.myAvatar || '';
      contactAvatars = data.contactAvatars || {};
      personas = data.personas || {};
      userPersonas = data.userPersonas || {};
      chatBackgrounds = data.chatBackgrounds || {};
      shortTermWindow = data.shortTermWindow || 10;
      streamEnabled = data.streamEnabled !== undefined ? data.streamEnabled : true;
      return;
    }
  } catch (e) {
    console.error('加载设置失败', e);
  }
  pinnedChats = [];
  myAvatar = '';
  contactAvatars = {};
  personas = {};
  userPersonas = {};
  chatBackgrounds = {};
  shortTermWindow = 10;
  streamEnabled = true;
}

// ========== 保存设置 ==========
function saveSettings() {
  var data = {
    pinnedChats: pinnedChats,
    myAvatar: myAvatar,
    contactAvatars: contactAvatars,
    personas: personas,
    userPersonas: userPersonas,
    chatBackgrounds: chatBackgrounds,
    shortTermWindow: shortTermWindow,
    streamEnabled: streamEnabled
  };
  localStorage.setItem('appSettings', JSON.stringify(data));
}

// ========== 估算 Token ==========
function estimateTokens(text) {
  if (!text) return 0;
  var chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  var others = text.length - chineseChars;
  return Math.ceil(chineseChars * 1.3 + others * 0.4);
}

// ========== 更新短期记忆计数 ==========
function updateShortTermCount() {
  var el = document.getElementById('shortTermCount');
  if (!el || !currentChat) return;
  var history = chatData[currentChat] || [];
  var windowSize = shortTermWindow || 10;
  var count = Math.min(history.length, windowSize);
  el.textContent = '当前 ' + count + ' 条';
}

// ========== 计算并更新 Token 统计 ==========
function updateTokenStats() {
  var userInputEl = document.getElementById('tokenUserInput');
  if (!userInputEl) return;

  if (!currentChat) {
    userInputEl.textContent = '0';
    document.getElementById('tokenShortTerm').textContent = '0';
    document.getElementById('tokenLongTerm').textContent = '0';
    document.getElementById('tokenWorldbook').textContent = '0';
    document.getElementById('tokenGrandTotal').textContent = '0';
    document.getElementById('tokenTotalDisplay').textContent = '总计 0';
    document.getElementById('tokenUserInputBar').style.width = '0%';
    document.getElementById('tokenShortTermBar').style.width = '0%';
    document.getElementById('tokenLongTermBar').style.width = '0%';
    document.getElementById('tokenWorldbookBar').style.width = '0%';
    return;
  }

  // 1. 用户输入
  var chatInput = document.getElementById('chatInput');
  var userInputText = chatInput ? chatInput.value.trim() : '';
  var userInputTokens = estimateTokens(userInputText);

  // 2. 短期记忆
  var history = chatData[currentChat] || [];
  var windowSize = shortTermWindow || 10;
  var shortMemories = history.slice(-windowSize);
  var shortText = shortMemories.map(function(m) { return m.text; }).join('\n');
  var shortTokens = estimateTokens(shortText);

  // 3. 长期记忆
  var longMemories = [];
  if (typeof getMemories === 'function') {
    longMemories = getMemories(currentChat) || [];
  }
  var longText = longMemories.join('\n');
  var longTokens = estimateTokens(longText);

  // 4. 世界书
  var worldbookText = '';
  if (typeof getMountedWorldbooks === 'function') {
    var mountedBooks = getMountedWorldbooks(currentChat) || [];
    worldbookText = mountedBooks.map(function(b) { return b.name + '\n' + b.content; }).join('\n');
  }
  var worldbookTokens = estimateTokens(worldbookText);

  var total = userInputTokens + shortTokens + longTokens + worldbookTokens;

  document.getElementById('tokenUserInput').textContent = userInputTokens;
  document.getElementById('tokenShortTerm').textContent = shortTokens;
  document.getElementById('tokenLongTerm').textContent = longTokens;
  document.getElementById('tokenWorldbook').textContent = worldbookTokens;
  document.getElementById('tokenGrandTotal').textContent = total;
  document.getElementById('tokenTotalDisplay').textContent = '总计 ' + total;

  var maxVal = total || 1;
  document.getElementById('tokenUserInputBar').style.width = (userInputTokens / maxVal * 100) + '%';
  document.getElementById('tokenShortTermBar').style.width = (shortTokens / maxVal * 100) + '%';
  document.getElementById('tokenLongTermBar').style.width = (longTokens / maxVal * 100) + '%';
  document.getElementById('tokenWorldbookBar').style.width = (worldbookTokens / maxVal * 100) + '%';
  document.getElementById('tokenGrandTotalBar').style.width = '100%';
}

// ========== 更新聊天管理UI ==========
function updateChatManagementUI() {
  var deleteChatItem = document.getElementById('deleteChatItem');
  var deleteChatNameDisplay = document.getElementById('deleteChatNameDisplay');
  
  if (deleteChatItem) {
    if (window.currentChat && chatData && chatData[window.currentChat]) {
      deleteChatItem.style.display = 'flex';
      if (deleteChatNameDisplay) {
        deleteChatNameDisplay.textContent = window.currentChat;
      }
    } else {
      deleteChatItem.style.display = 'none';
    }
  }
}

// ========== 监听聊天切换 ==========
function updateSettingsOnChatChange() {
  if (typeof updateChatManagementUI === 'function') {
    updateChatManagementUI();
  }
}

// ========== 备份与恢复 ==========

// ========== 导出所有数据 ==========
function exportAllData() {
  try {
    var exportData = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      chatData: chatData || {},
      settings: {
        pinnedChats: pinnedChats || [],
        myAvatar: myAvatar || '',
        contactAvatars: contactAvatars || {},
        personas: personas || {},
        userPersonas: userPersonas || {},
        chatBackgrounds: chatBackgrounds || {},
        shortTermWindow: shortTermWindow || 10,
        streamEnabled: streamEnabled !== undefined ? streamEnabled : true
      },
      memories: {}
    };

    if (typeof getAllMemories === 'function') {
      exportData.memories = getAllMemories() || {};
    } else if (typeof getMemories === 'function') {
      var allMemories = {};
      var contactNames = Object.keys(chatData || {});
      for (var i = 0; i < contactNames.length; i++) {
        var name = contactNames[i];
        var mems = getMemories(name);
        if (mems && mems.length > 0) {
          allMemories[name] = mems;
        }
      }
      exportData.memories = allMemories;
    }

    if (typeof getAllWorldbooks === 'function') {
      exportData.worldbooks = getAllWorldbooks() || {};
    } else if (typeof getWorldbooks === 'function') {
      exportData.worldbooks = getWorldbooks() || {};
    }

    if (typeof loadBeautifySettings === 'function') {
      var beautifyData = loadBeautifySettings();
      if (beautifyData) {
        exportData.beautify = beautifyData;
      }
    }

    exportData.api = {
      apiUrl: localStorage.getItem('apiUrl') || '',
      modelName: localStorage.getItem('modelName') || '',
      memoryApiUrl: localStorage.getItem('memoryApiUrl') || '',
      memoryModel: localStorage.getItem('memoryModel') || ''
    };

    var jsonStr = JSON.stringify(exportData, null, 2);
    var blob = new Blob([jsonStr], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    
    var link = document.createElement('a');
    link.href = url;
    var dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.download = '聊天备份_' + dateStr + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (typeof showToast === 'function') {
      showToast('导出成功', '备份文件已下载', 'success');
    }
  } catch (error) {
    console.error('导出失败:', error);
    if (typeof showToast === 'function') {
      showToast('导出失败', error.message || '请稍后重试', 'error');
    }
  }
}

// ========== 导入备份数据 ==========
function importAllData(file) {
  if (!file) {
    if (typeof showToast === 'function') {
      showToast('提示', '请选择备份文件', 'warning');
    }
    return;
  }

  if (!confirm('导入将覆盖当前所有数据，确认继续吗？')) {
    return;
  }

  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = JSON.parse(e.target.result);

      if (!data.chatData || typeof data.chatData !== 'object') {
        throw new Error('无效的备份文件：缺少聊天数据');
      }

      if (data.chatData) {
        for (var key in chatData) {
          delete chatData[key];
        }
        for (var key in data.chatData) {
          chatData[key] = data.chatData[key];
        }
        saveChatData();
      }

      if (data.settings) {
        if (data.settings.pinnedChats) pinnedChats = data.settings.pinnedChats;
        if (data.settings.myAvatar) myAvatar = data.settings.myAvatar;
        if (data.settings.contactAvatars) contactAvatars = data.settings.contactAvatars;
        if (data.settings.personas) personas = data.settings.personas;
        if (data.settings.userPersonas) userPersonas = data.settings.userPersonas;
        if (data.settings.chatBackgrounds) chatBackgrounds = data.settings.chatBackgrounds;
        if (data.settings.shortTermWindow) shortTermWindow = data.settings.shortTermWindow;
        if (data.settings.streamEnabled !== undefined) streamEnabled = data.settings.streamEnabled;
        saveSettings();
      }

      if (data.memories && typeof importMemories === 'function') {
        importMemories(data.memories);
      } else if (data.memories && typeof saveMemory === 'function') {
        for (var contact in data.memories) {
          if (data.memories.hasOwnProperty(contact)) {
            var mems = data.memories[contact];
            for (var i = 0; i < mems.length; i++) {
              saveMemory(contact, mems[i]);
            }
          }
        }
      }

      if (data.worldbooks && typeof importWorldbooks === 'function') {
        importWorldbooks(data.worldbooks);
      } else if (data.worldbooks && typeof saveWorldbook === 'function') {
        for (var wbName in data.worldbooks) {
          if (data.worldbooks.hasOwnProperty(wbName)) {
            saveWorldbook(wbName, data.worldbooks[wbName]);
          }
        }
      }

      if (data.beautify && typeof saveBeautifySettings === 'function') {
        saveBeautifySettings(data.beautify);
        if (typeof applyThemeCss === 'function' && data.beautify.themeCss) {
          applyThemeCss(data.beautify.themeCss);
        }
        if (typeof applyBubbleCss === 'function' && data.beautify.bubbleCss) {
          applyBubbleCss(data.beautify.bubbleCss);
        }
        if (typeof applyFontUrl === 'function' && data.beautify.fontUrl) {
          applyFontUrl(data.beautify.fontUrl);
        }
      }

      if (data.api) {
        if (data.api.apiUrl) localStorage.setItem('apiUrl', data.api.apiUrl);
        if (data.api.modelName) localStorage.setItem('modelName', data.api.modelName);
        if (data.api.memoryApiUrl) localStorage.setItem('memoryApiUrl', data.api.memoryApiUrl);
        if (data.api.memoryModel) localStorage.setItem('memoryModel', data.api.memoryModel);
      }

      if (typeof renderChatList === 'function') {
        renderChatList();
      }

      if (window.currentChat && typeof renderMessages === 'function') {
        renderMessages(window.currentChat);
      }

      if (typeof showToast === 'function') {
        showToast('导入成功', '数据已恢复', 'success');
      }
    } catch (error) {
      console.error('导入失败:', error);
      if (typeof showToast === 'function') {
        showToast('导入失败', error.message || '请检查备份文件是否有效', 'error');
      }
    }
  };

  reader.onerror = function() {
    if (typeof showToast === 'function') {
      showToast('读取失败', '无法读取文件', 'error');
    }
  };

  reader.readAsText(file);
}

// ========== 选择备份文件 ==========
function selectBackupFile() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(e) {
    var file = e.target.files[0];
    if (file) {
      importAllData(file);
    }
  };
  input.click();
}

// ========== 自动备份 ==========
var autoBackupEnabled = false;
var autoBackupInterval = null;

function toggleAutoBackup(enabled) {
  autoBackupEnabled = enabled;
  localStorage.setItem('autoBackupEnabled', JSON.stringify(enabled));
  
  if (enabled) {
    if (autoBackupInterval) {
      clearInterval(autoBackupInterval);
    }
    autoBackupInterval = setInterval(function() {
      autoBackup();
    }, 24 * 60 * 60 * 1000);
    if (typeof showToast === 'function') {
      showToast('已开启', '自动备份已开启（每24小时）', 'success');
    }
  } else {
    if (autoBackupInterval) {
      clearInterval(autoBackupInterval);
      autoBackupInterval = null;
    }
    if (typeof showToast === 'function') {
      showToast('已关闭', '自动备份已关闭', 'info');
    }
  }
}

function autoBackup() {
  try {
    var exportData = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      chatData: chatData || {},
      settings: {
        pinnedChats: pinnedChats || [],
        myAvatar: myAvatar || '',
        contactAvatars: contactAvatars || {},
        personas: personas || {},
        userPersonas: userPersonas || {},
        chatBackgrounds: chatBackgrounds || {},
        shortTermWindow: shortTermWindow || 10,
        streamEnabled: streamEnabled !== undefined ? streamEnabled : true
      },
      memories: {}
    };

    if (typeof getAllMemories === 'function') {
      exportData.memories = getAllMemories() || {};
    }

    if (typeof getAllWorldbooks === 'function') {
      exportData.worldbooks = getAllWorldbooks() || {};
    }

    localStorage.setItem('autoBackupData', JSON.stringify(exportData));
    localStorage.setItem('lastAutoBackup', new Date().toISOString());
    console.log('[自动备份] 备份完成');
  } catch (error) {
    console.error('[自动备份] 失败:', error);
  }
}

function restoreAutoBackup() {
  var backupStr = localStorage.getItem('autoBackupData');
  if (!backupStr) {
    if (typeof showToast === 'function') {
      showToast('提示', '没有找到自动备份', 'warning');
    }
    return;
  }

  if (!confirm('恢复自动备份将覆盖当前数据，确认继续吗？')) {
    return;
  }

  try {
    var data = JSON.parse(backupStr);
    
    if (data.chatData) {
      for (var key in chatData) {
        delete chatData[key];
      }
      for (var key in data.chatData) {
        chatData[key] = data.chatData[key];
      }
      saveChatData();
    }

    if (data.settings) {
      if (data.settings.pinnedChats) pinnedChats = data.settings.pinnedChats;
      if (data.settings.myAvatar) myAvatar = data.settings.myAvatar;
      if (data.settings.contactAvatars) contactAvatars = data.settings.contactAvatars;
      if (data.settings.personas) personas = data.settings.personas;
      if (data.settings.userPersonas) userPersonas = data.settings.userPersonas;
      if (data.settings.chatBackgrounds) chatBackgrounds = data.settings.chatBackgrounds;
      if (data.settings.shortTermWindow) shortTermWindow = data.settings.shortTermWindow;
      if (data.settings.streamEnabled !== undefined) streamEnabled = data.settings.streamEnabled;
      saveSettings();
    }

    if (typeof renderChatList === 'function') {
      renderChatList();
    }

    if (window.currentChat && typeof renderMessages === 'function') {
      renderMessages(window.currentChat);
    }

    if (typeof showToast === 'function') {
      showToast('恢复成功', '已从自动备份恢复数据', 'success');
    }
  } catch (error) {
    console.error('恢复自动备份失败:', error);
    if (typeof showToast === 'function') {
      showToast('恢复失败', '备份数据已损坏', 'error');
    }
  }
}

// ========== 获取备份信息 ==========
function getBackupInfo() {
  var lastBackup = localStorage.getItem('lastAutoBackup');
  if (lastBackup) {
    var date = new Date(lastBackup);
    return '上次备份: ' + date.toLocaleString();
  }
  return '暂无备份';
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
      var userPersonaTextarea = document.getElementById('userPersonaTextarea');
      var shortTermInput = document.getElementById('shortTermWindowInput');
      var streamToggle = document.getElementById('streamToggle');

      if (pinSwitch) pinSwitch.checked = pinnedChats.includes(currentChat);
      if (nicknameValue) nicknameValue.textContent = currentChat;
      if (personaTextarea) {
        personaTextarea.value = (personas && personas[currentChat]) ? personas[currentChat] : '';
      }
      if (userPersonaTextarea) {
        userPersonaTextarea.value = (userPersonas && userPersonas[currentChat]) ? userPersonas[currentChat] : '';
      }
      if (shortTermInput) {
        shortTermInput.value = shortTermWindow || 10;
      }
      if (streamToggle) {
        streamToggle.checked = streamEnabled !== undefined ? streamEnabled : true;
      }

      updateShortTermCount();
      updateChatManagementUI();

      if (chatDetailPage) chatDetailPage.style.display = 'none';
      if (chatSettingsPage) chatSettingsPage.style.display = 'flex';
      if (statusBarTime) statusBarTime.textContent = '聊天设置';

      if (typeof renderMountWorldbookList === 'function') {
        renderMountWorldbookList();
      }
      if (typeof updateMountCount === 'function') {
        updateMountCount();
      }

      updateTokenStats();
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
      var userPersonaTextarea = document.getElementById('userPersonaTextarea');
      var shortTermInput = document.getElementById('shortTermWindowInput');
      var streamToggle = document.getElementById('streamToggle');

      var isMuted = muteSwitch ? muteSwitch.checked : false;
      var isPinned = pinSwitch ? pinSwitch.checked : false;
      var personaText = personaTextarea ? personaTextarea.value.trim() : '';
      var userPersonaText = userPersonaTextarea ? userPersonaTextarea.value.trim() : '';

      if (personaText) {
        personas[currentChat] = personaText;
      } else {
        delete personas[currentChat];
      }

      if (userPersonaText) {
        userPersonas[currentChat] = userPersonaText;
      } else {
        delete userPersonas[currentChat];
      }

      if (isPinned && !pinnedChats.includes(currentChat)) {
        pinnedChats.push(currentChat);
      } else if (!isPinned && pinnedChats.includes(currentChat)) {
        pinnedChats = pinnedChats.filter(function(name) {
          return name !== currentChat;
        });
      }

      if (shortTermInput) {
        var val = parseInt(shortTermInput.value);
        if (val >= 2 && val <= 300) {
          shortTermWindow = val;
          updateShortTermCount();
        } else {
          shortTermInput.value = shortTermWindow || 10;
        }
      }

      if (streamToggle) {
        streamEnabled = streamToggle.checked;
      }

      saveSettings();

      if (typeof sortChatList === 'function') sortChatList();

      if (chatSettingsPage) chatSettingsPage.style.display = 'none';
      if (chatDetailPage) chatDetailPage.style.display = 'flex';
      if (statusBarTime) statusBarTime.textContent = currentChat;

      updateTokenStats();
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

        if (userPersonas && userPersonas[oldName]) {
          userPersonas[newName] = userPersonas[oldName];
          delete userPersonas[oldName];
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

  // ===== 清空聊天记录 =====
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

  // ===== 删除当前聊天 =====
  var deleteChatConfirmBtn = document.getElementById('deleteChatConfirmBtn');
  if (deleteChatConfirmBtn) {
    deleteChatConfirmBtn.addEventListener('click', function() {
      if (!currentChat || !chatData[currentChat]) {
        if (typeof showToast === 'function') {
          showToast('提示', '没有可删除的聊天', 'warning');
        }
        return;
      }

      if (!confirm('确认删除与「' + currentChat + '」的所有聊天记录吗？\n此操作不可恢复！')) {
        return;
      }

      try {
        var deletedName = currentChat;

        delete chatData[currentChat];
        saveChatData();

        var pinIndex = pinnedChats.indexOf(currentChat);
        if (pinIndex !== -1) {
          pinnedChats.splice(pinIndex, 1);
          saveSettings();
        }

        if (contactAvatars && contactAvatars[currentChat]) {
          delete contactAvatars[currentChat];
        }
        if (personas && personas[currentChat]) {
          delete personas[currentChat];
        }
        if (userPersonas && userPersonas[currentChat]) {
          delete userPersonas[currentChat];
        }
        if (chatBackgrounds && chatBackgrounds[currentChat]) {
          delete chatBackgrounds[currentChat];
        }
        saveSettings();

        if (typeof deleteMemories === 'function') {
          deleteMemories(currentChat);
        }

        var homeContent = document.getElementById('homeContent');
        var chatPage = document.getElementById('chatPage');
        var chatDetailPage = document.getElementById('chatDetailPage');
        var chatSettingsPage = document.getElementById('chatSettingsPage');
        var statusBarTime = document.getElementById('statusBarTime');
        
        if (homeContent) homeContent.style.display = 'none';
        if (chatDetailPage) chatDetailPage.style.display = 'none';
        if (chatSettingsPage) chatSettingsPage.style.display = 'none';
        if (chatPage) chatPage.style.display = 'flex';
        
        if (statusBarTime) {
          var now = new Date();
          var h = String(now.getHours()).padStart(2, '0');
          var m = String(now.getMinutes()).padStart(2, '0');
          statusBarTime.textContent = h + ':' + m;
        }
        window.currentChat = '';
        
        if (typeof renderChatList === 'function') {
          renderChatList();
        }

        if (typeof showToast === 'function') {
          showToast('已删除', '已删除与「' + deletedName + '」的聊天', 'success');
        }
      } catch (error) {
        console.error('删除失败:', error);
        if (typeof showToast === 'function') {
          showToast('删除失败', '请稍后重试', 'error');
        }
      }
    });
  }

  // ===== 头像设置 =====
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

  if (typeof renderMountWorldbookList === 'function') {
    renderMountWorldbookList();
  }
  if (typeof updateMountCount === 'function') {
    updateMountCount();
  }

  var toggleBtn = document.getElementById('worldbookToggleBtn');
  var mountList = document.getElementById('mountWorldbookList');
  if (toggleBtn && mountList) {
    toggleBtn.addEventListener('click', function() {
      var isOpen = mountList.style.display !== 'none';
      mountList.style.display = isOpen ? 'none' : 'block';
      this.textContent = isOpen ? '▶' : '▼';
      if (!isOpen && typeof renderMountWorldbookList === 'function') {
        renderMountWorldbookList();
      }
    });
  }

  // ============================================================
  //  ⭐ 备份与恢复 - 在桌面设置页面
  // ============================================================

  // 找到备份与恢复的 settings-item，给它添加点击展开事件
  var backupSettingsItem = document.getElementById('backupSettingsItem');
  if (backupSettingsItem) {
    // 移除原有的点击事件（如果有）
    var newBackupItem = backupSettingsItem.cloneNode(true);
    backupSettingsItem.parentNode.replaceChild(newBackupItem, backupSettingsItem);
    
    newBackupItem.addEventListener('click', function(e) {
      // 如果点击的是按钮或复选框，不处理
      if (e.target.closest('button') || e.target.closest('input')) return;
      
      // 展开/收起备份面板
      var panel = document.getElementById('backupPanel');
      if (panel) {
        var isOpen = panel.style.display !== 'none';
        panel.style.display = isOpen ? 'none' : 'block';
        var arrow = this.querySelector('.settings-arrow');
        if (arrow) {
          arrow.textContent = isOpen ? '›' : '▼';
        }
      }
    });
  }

  // 创建备份面板（如果不存在）
  if (!document.getElementById('backupPanel')) {
    var settingsList = document.querySelector('.settings-list');
    if (settingsList) {
      var panel = document.createElement('div');
      panel.id = 'backupPanel';
      panel.className = 'settings-item';
      panel.style.cssText = 'flex-direction: column; align-items: flex-start; gap: 8px; cursor: default; padding: 12px 16px; display: none; background: rgba(0,0,0,0.02); border-radius: 0 0 12px 12px; margin-top: -4px;';
      panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span style="font-size: 13px; color: #8e8e93;">💾 备份操作</span>
          <span style="font-size: 11px; color: #8e8e93;" id="backupInfo">${getBackupInfo()}</span>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; width: 100%;">
          <button class="backup-btn" id="exportBackupBtn" style="
            flex: 1;
            min-width: 80px;
            padding: 8px 12px;
            border-radius: 8px;
            border: none;
            background: #0a84ff;
            color: white;
            font-size: 13px;
            cursor: pointer;
            transition: opacity 0.2s;
          ">📤 导出备份</button>
          <button class="backup-btn" id="importBackupBtn" style="
            flex: 1;
            min-width: 80px;
            padding: 8px 12px;
            border-radius: 8px;
            border: none;
            background: #32d74b;
            color: white;
            font-size: 13px;
            cursor: pointer;
            transition: opacity 0.2s;
          ">📥 导入备份</button>
          <button class="backup-btn" id="restoreAutoBackupBtn" style="
            flex: 1;
            min-width: 80px;
            padding: 8px 12px;
            border-radius: 8px;
            border: none;
            background: #ff9f0a;
            color: white;
            font-size: 13px;
            cursor: pointer;
            transition: opacity 0.2s;
          ">↩️ 恢复自动备份</button>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; width: 100%; margin-top: 4px;">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer;">
            <input type="checkbox" id="autoBackupToggle" ${localStorage.getItem('autoBackupEnabled') === 'true' ? 'checked' : ''}>
            开启自动备份
          </label>
          <span style="font-size: 11px; color: #8e8e93;">（每24小时自动保存）</span>
        </div>
        <div style="font-size: 11px; color: rgba(0,0,0,0.3); margin-top: 2px;">⚠️ 导入将覆盖当前所有数据，请先导出备份</div>
      `;
      
      // 插入到 backupSettingsItem 后面
      var backupItem = document.getElementById('backupSettingsItem');
      if (backupItem && backupItem.parentNode) {
        backupItem.parentNode.insertBefore(panel, backupItem.nextSibling);
      } else {
        settingsList.appendChild(panel);
      }
      
      // ===== 绑定备份按钮事件 =====
      var exportBtn = document.getElementById('exportBackupBtn');
      if (exportBtn) {
        exportBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          if (typeof exportAllData === 'function') {
            exportAllData();
          }
        });
      }
      
      var importBtn = document.getElementById('importBackupBtn');
      if (importBtn) {
        importBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          if (typeof selectBackupFile === 'function') {
            selectBackupFile();
          }
        });
      }
      
      var restoreBtn = document.getElementById('restoreAutoBackupBtn');
      if (restoreBtn) {
        restoreBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          if (typeof restoreAutoBackup === 'function') {
            restoreAutoBackup();
          }
        });
      }
      
      var autoToggle = document.getElementById('autoBackupToggle');
      if (autoToggle) {
        autoToggle.addEventListener('change', function(e) {
          e.stopPropagation();
          if (typeof toggleAutoBackup === 'function') {
            toggleAutoBackup(this.checked);
          }
        });
      }
      
      // 定时更新备份信息
      setInterval(function() {
        var infoEl = document.getElementById('backupInfo');
        if (infoEl && typeof getBackupInfo === 'function') {
          infoEl.textContent = getBackupInfo();
        }
      }, 60000);
    }
  }

  updateShortTermCount();
  updateTokenStats();
  updateChatManagementUI();

  console.log('[设置] 已初始化');
}

// ========== 暴露全局 ==========
window.personas = personas;
window.userPersonas = userPersonas;
window.chatBackgrounds = chatBackgrounds;
window.shortTermWindow = shortTermWindow;
window.streamEnabled = streamEnabled;
window.initSettings = initSettings;
window.loadSettings = loadSettings;
window.saveSettings = saveSettings;
window.updateAvatarPreview = updateAvatarPreview;
window.updateChatListAvatar = updateChatListAvatar;
window.updateChatListName = updateChatListName;
window.applyChatBackground = applyChatBackground;
window.handleFileSelect = handleFileSelect;
window.showBackgroundAlert = showBackgroundAlert;
window.compressImage = compressImage;
window.updateShortTermCount = updateShortTermCount;
window.updateTokenStats = updateTokenStats;
window.estimateTokens = estimateTokens;
window.updateChatManagementUI = updateChatManagementUI;
window.updateSettingsOnChatChange = updateSettingsOnChatChange;
window.exportAllData = exportAllData;
window.importAllData = importAllData;
window.selectBackupFile = selectBackupFile;
window.toggleAutoBackup = toggleAutoBackup;
window.autoBackup = autoBackup;
window.restoreAutoBackup = restoreAutoBackup;
window.getBackupInfo = getBackupInfo;