// ========== 聊天数据 & 核心逻辑 ==========
// ========== 生成消息ID ==========
function generateMessageId() {
  return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

// ========== 全局变量 ==========
var currentChat = '';
var pinnedChats = [];

// ========== 加载/保存聊天数据 ==========
function loadChatData() {
  var saved = localStorage.getItem('chatData');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('解析聊天数据失败', e);
    }
  }
  return {
    '张三': [
      { type: 'received', text: '你好，明天见面吗？' },
      { type: 'sent', text: '好的，明天见' }
    ],
    '李四': [
      { type: 'received', text: '文件发你了' },
      { type: 'sent', text: '收到，谢谢' }
    ],
    '王五': [
      { type: 'received', text: '项目进度怎么样了？' },
      { type: 'sent', text: '好的，收到' }
    ],
    '赵六': [
      { type: 'received', text: '在吗？' }
    ]
  };
}

var chatData = loadChatData();

function saveChatData() {
  localStorage.setItem('chatData', JSON.stringify(chatData));
}

// ========== 加载/保存设置 ==========
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

// ========== 渲染聊天列表 ==========
function renderChatList() {
  var chatList = document.getElementById('chatList');
  if (!chatList) return;
  
  chatList.innerHTML = '';
  
  var names = Object.keys(chatData);
  names.sort(function(a, b) {
    var isPinnedA = pinnedChats.includes(a);
    var isPinnedB = pinnedChats.includes(b);
    if (isPinnedA && !isPinnedB) return -1;
    if (!isPinnedA && isPinnedB) return 1;
    return 0;
  });
  
  names.forEach(function(name) {
    var messages = chatData[name] || [];
    var lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    var preview = lastMsg ? lastMsg.text : '新对话';
    var time = lastMsg ? getTimeLabel() : '现在';
    
    var colors = ['#5e5ce6', '#ff9f0a', '#32d74b', '#ff375f', '#0a84ff', '#ff6b6b'];
    var colorIndex = name.length % colors.length;
    var color = colors[colorIndex];
    
    var item = document.createElement('div');
    item.className = 'chat-item';
    item.dataset.name = name;
    
    var avatarUrl = contactAvatars[name] || '';
    var avatarContent = '';
    if (avatarUrl) {
      avatarContent = 'style="background-image: url(' + avatarUrl + '); background-size: cover; background-position: center;"';
    } else {
      avatarContent = 'style="background: ' + color + ';"';
    }
    
    item.innerHTML = `
      <div class="chat-avatar" ${avatarContent}>${avatarUrl ? '' : name.charAt(0)}</div>
      <div class="chat-info">
        <div class="chat-name">${name}</div>
        <div class="chat-preview">${preview}</div>
      </div>
      <div class="chat-time">${time}</div>
    `;
    
    item.addEventListener('click', function() {
      var contactName = this.dataset.name;
      if (typeof openChat === 'function') {
        openChat(contactName);
      }
    });
    
    chatList.appendChild(item);
  });
}

function getTimeLabel() {
  var now = new Date();
  var h = String(now.getHours()).padStart(2, '0');
  var m = String(now.getMinutes()).padStart(2, '0');
  return h + ':' + m;
}

// ========== 更新聊天列表预览 ==========
function updateChatListPreview(name, text) {
  var chatList = document.getElementById('chatList');
  if (!chatList) return;
  
  var items = chatList.querySelectorAll('.chat-item');
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var nameEl = item.querySelector('.chat-name');
    if (nameEl && nameEl.textContent === name) {
      var previewEl = item.querySelector('.chat-preview');
      var timeEl = item.querySelector('.chat-time');
      if (previewEl) previewEl.textContent = text;
      if (timeEl) timeEl.textContent = getTimeLabel();
      break;
    }
  }
}

function sortChatList() {
  renderChatList();
}

// ========== 打开聊天 ==========
function openChat(name) {
  var homeContent = document.getElementById('homeContent');
  var chatPage = document.getElementById('chatPage');
  var chatDetailPage = document.getElementById('chatDetailPage');
  var statusBarTime = document.getElementById('statusBarTime');
  
  if (homeContent) homeContent.style.display = 'none';
  if (chatPage) chatPage.style.display = 'none';
  if (chatDetailPage) chatDetailPage.style.display = 'flex';
  if (statusBarTime) statusBarTime.textContent = name;
  
  // ⭐ 清除红点
  if (typeof clearBadge === 'function') {
    clearBadge(name);
  }
  
  if (typeof renderMessages === 'function') {
    renderMessages(name);
  }
  
  if (typeof updateSettingsOnChatChange === 'function') {
    updateSettingsOnChatChange();
  }
}

// ========== 渲染消息 ==========
function renderMessages(name) {
  currentChat = name;
  window.currentChat = name;
  
  var chatDetailTitle = document.getElementById('chatDetailTitle');
  var chatMessages = document.getElementById('chatMessages');
  var chatDetailPage = document.getElementById('chatDetailPage');
  
  if (chatDetailTitle) chatDetailTitle.textContent = name;
  if (chatMessages) chatMessages.innerHTML = '';
  
  if (chatBackgrounds && chatBackgrounds[name]) {
    chatDetailPage.style.backgroundImage = 'url(' + chatBackgrounds[name] + ')';
    chatDetailPage.style.backgroundSize = 'cover';
    chatDetailPage.style.backgroundPosition = 'center';
  } else {
    chatDetailPage.style.backgroundImage = '';
    chatDetailPage.style.backgroundSize = '';
  }
  
  var messages = chatData[name] || [];
  messages.forEach(function(msg, index) {
    appendMessageToContainer(chatMessages, msg, name);
  });
  
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  if (typeof updateShortTermCount === 'function') updateShortTermCount();
  if (typeof updateTokenStats === 'function') updateTokenStats();
  
  if (typeof updateSettingsOnChatChange === 'function') {
    updateSettingsOnChatChange();
  }
}

// ========== 追加消息到容器（支持换行） ==========
function appendMessageToContainer(container, msg, name) {
  if (!container) return;
  
  var msgContainer = document.createElement('div');
  msgContainer.style.display = 'flex';
  msgContainer.style.alignItems = 'flex-end';
  msgContainer.style.gap = '8px';
  msgContainer.style.marginBottom = '8px';
  msgContainer.style.opacity = '0';
  
  if (msg.type === 'sent') {
    msgContainer.style.justifyContent = 'flex-end';
    
    var msgEl = document.createElement('div');
    msgEl.className = 'message sent';
    msgEl.innerHTML = msg.text.replace(/\n/g, '<br>');
    msgContainer.appendChild(msgEl);
    
    var avatar = createAvatar('sent');
    msgContainer.appendChild(avatar);
    
    container.appendChild(msgContainer);
    animateMessage(msgContainer, 'sent');
    
  } else if (msg.type === 'received') {
    msgContainer.style.justifyContent = 'flex-start';
    
    var avatar = createAvatar('received', name);
    msgContainer.appendChild(avatar);
    
    var msgEl = document.createElement('div');
    msgEl.className = 'message received';
    msgEl.innerHTML = msg.text.replace(/\n/g, '<br>');
    msgContainer.appendChild(msgEl);
    
    container.appendChild(msgContainer);
    animateMessage(msgContainer, 'received');
  }
}

// ========== 创建头像 ==========
function createAvatar(type, name) {
  var avatar = document.createElement('div');
  avatar.style.cssText = 'width:30px;height:30px;border-radius:50%;background-size:cover;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;color:white;';
  
  if (type === 'sent') {
    avatar.style.background = '#0a84ff';
    if (myAvatar) {
      avatar.style.backgroundImage = 'url(' + myAvatar + ')';
      avatar.style.backgroundSize = 'cover';
    } else {
      avatar.textContent = '我';
    }
  } else {
    avatar.style.background = '#5e5ce6';
    if (contactAvatars && contactAvatars[name]) {
      avatar.style.backgroundImage = 'url(' + contactAvatars[name] + ')';
      avatar.style.backgroundSize = 'cover';
    } else {
      avatar.textContent = name ? name.charAt(0) : '?';
    }
  }
  return avatar;
}

// ========== 动画 ==========
function animateMessage(element, type) {
  element.style.opacity = '0';
  
  var transform = 'translateY(10px) scale(0.95)';
  if (type === 'sent') {
    transform = 'translateX(20px) scale(0.9)';
  } else if (type === 'received') {
    transform = 'translateX(-20px) scale(0.9)';
  }
  element.style.transform = transform;
  element.style.transition = 'opacity 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      element.style.opacity = '1';
      element.style.transform = 'translateX(0) translateY(0) scale(1)';
    });
  });
}

// ========== 渲染单条消息（供 api.js 调用） ==========
function renderSingleMessage(name, text, type, container) {
  if (!container) {
    container = document.getElementById('chatMessages');
    if (!container) return;
  }

  var msgContainer = document.createElement('div');
  msgContainer.style.cssText = 'display:flex; align-items:flex-end; gap:8px; margin-bottom:8px;';
  msgContainer.style.justifyContent = type === 'sent' ? 'flex-end' : 'flex-start';

  if (type === 'received') {
    var avatar = document.createElement('div');
    avatar.style.cssText = 'width:30px;height:30px;border-radius:50%;background:#5e5ce6;background-size:cover;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;color:white;';
    if (contactAvatars && contactAvatars[name]) {
      avatar.style.backgroundImage = 'url(' + contactAvatars[name] + ')';
      avatar.style.backgroundSize = 'cover';
    } else {
      avatar.textContent = name.charAt(0);
    }
    msgContainer.appendChild(avatar);
  }

  var msgEl = document.createElement('div');
  msgEl.className = 'message ' + type;
  msgEl.innerHTML = text.replace(/\n/g, '<br>');
  msgContainer.appendChild(msgEl);

  if (type === 'sent') {
    var myAvatarEl = document.createElement('div');
    myAvatarEl.style.cssText = 'width:30px;height:30px;border-radius:50%;background:#0a84ff;background-size:cover;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;color:white;';
    if (myAvatar) {
      myAvatarEl.style.backgroundImage = 'url(' + myAvatar + ')';
      myAvatarEl.style.backgroundSize = 'cover';
    } else {
      myAvatarEl.textContent = '我';
    }
    msgContainer.appendChild(myAvatarEl);
  }

  container.appendChild(msgContainer);
  animateMessage(msgContainer, type);
}

// ========== 发送消息 ==========
function sendMessage() {
  var chatInput = document.getElementById('chatInput');
  var chatMessages = document.getElementById('chatMessages');
  if (!chatInput || !chatMessages) return;
  
  var text = chatInput.value.trim();
  if (!text || !currentChat) {
    chatInput.style.borderColor = '#ff375f';
    setTimeout(function() {
      chatInput.style.borderColor = '';
    }, 500);
    return;
  }
  
  if (!chatData[currentChat]) chatData[currentChat] = [];
  chatData[currentChat].push({ type: 'sent', text: text });
  saveChatData();
  
  appendMessageToContainer(chatMessages, { type: 'sent', text: text }, currentChat);
  
  chatInput.value = '';
  chatMessages.scrollTop = chatMessages.scrollHeight;
  chatInput.focus();
  
  updateChatListPreview(currentChat, text);
  
  if (typeof updateShortTermCount === 'function') updateShortTermCount();
  if (typeof updateTokenStats === 'function') updateTokenStats();
}

// ========== 删除联系人 ==========
function deleteContact(name) {
  if (!name || !chatData[name]) {
    if (typeof showToast === 'function') {
      showToast('提示', '联系人不存在', 'warning');
    }
    return;
  }

  if (!confirm('确认删除与「' + name + '」的所有聊天记录吗？\n此操作不可恢复！')) {
    return;
  }

  try {
    var deletedName = name;

    delete chatData[name];
    saveChatData();

    var pinIndex = pinnedChats.indexOf(name);
    if (pinIndex !== -1) {
      pinnedChats.splice(pinIndex, 1);
      saveSettings();
    }

    if (typeof contactAvatars !== 'undefined' && contactAvatars[name]) {
      delete contactAvatars[name];
    }
    if (typeof personas !== 'undefined' && personas[name]) {
      delete personas[name];
    }
    if (typeof userPersonas !== 'undefined' && userPersonas[name]) {
      delete userPersonas[name];
    }
    if (typeof chatBackgrounds !== 'undefined' && chatBackgrounds[name]) {
      delete chatBackgrounds[name];
    }
    saveSettings();

    if (typeof deleteMemories === 'function') {
      deleteMemories(name);
    }

    if (window.currentChat === name) {
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
}

// ========== 红点标记 ==========

// 显示红点
function showBadge(name) {
  var chatList = document.getElementById('chatList');
  if (!chatList) return;
  
  var items = chatList.querySelectorAll('.chat-item');
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var nameEl = item.querySelector('.chat-name');
    if (nameEl && nameEl.textContent === name) {
      var existingBadge = item.querySelector('.badge-dot');
      if (!existingBadge) {
        var badge = document.createElement('span');
        badge.className = 'badge-dot';
        badge.style.cssText = 'width:10px;height:10px;background:#ff375f;border-radius:50%;position:absolute;top:8px;right:8px;border:2px solid #fff;';
        item.style.position = 'relative';
        item.appendChild(badge);
      }
      break;
    }
  }
}

// 清除红点
function clearBadge(name) {
  var chatList = document.getElementById('chatList');
  if (!chatList) return;
  
  var items = chatList.querySelectorAll('.chat-item');
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var nameEl = item.querySelector('.chat-name');
    if (nameEl && nameEl.textContent === name) {
      var badge = item.querySelector('.badge-dot');
      if (badge) badge.remove();
      break;
    }
  }
}

// ========== 暴露全局 ==========
window.chatData = chatData;
window.currentChat = currentChat;
window.pinnedChats = pinnedChats;
window.saveChatData = saveChatData;
window.loadChatData = loadChatData;
window.loadSettings = loadSettings;
window.saveSettings = saveSettings;
window.renderChatList = renderChatList;
window.renderMessages = renderMessages;
window.sendMessage = sendMessage;
window.openChat = openChat;
window.updateChatListPreview = updateChatListPreview;
window.sortChatList = sortChatList;
window.createAvatar = createAvatar;
window.animateMessage = animateMessage;
window.appendMessageToContainer = appendMessageToContainer;
window.renderSingleMessage = renderSingleMessage;
window.generateMessageId = generateMessageId;
window.deleteContact = deleteContact;
window.showBadge = showBadge;
window.clearBadge = clearBadge;