// ========== 聊天数据 & 核心逻辑 ==========

// ========== 全局变量 ==========
let currentChat = '';
let pinnedChats = [];

// ========== 加载/保存聊天数据 ==========
function loadChatData() {
  const saved = localStorage.getItem('chatData');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('解析聊天数据失败', e);
    }
  }
  // 默认数据
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

let chatData = loadChatData();

function saveChatData() {
  localStorage.setItem('chatData', JSON.stringify(chatData));
}

// ========== 加载/保存设置 ==========
function loadSettings() {
  try {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      const data = JSON.parse(saved);
      pinnedChats = data.pinnedChats || [];
      myAvatar = data.myAvatar || '';
      contactAvatars = data.contactAvatars || {};
      personas = data.personas || {};
      chatBackgrounds = data.chatBackgrounds || {};
      return;
    }
  } catch (e) {
    console.error('加载设置失败', e);
  }
  pinnedChats = [];
  myAvatar = '';
  contactAvatars = {};
  personas = {};
  chatBackgrounds = {};
}

function saveSettings() {
  const data = {
    pinnedChats: pinnedChats,
    myAvatar: myAvatar,
    contactAvatars: contactAvatars,
    personas: personas,
    chatBackgrounds: chatBackgrounds
  };
  localStorage.setItem('appSettings', JSON.stringify(data));
}

// ========== 渲染聊天列表 ==========
function renderChatList() {
  const chatList = document.getElementById('chatList');
  if (!chatList) return;
  
  chatList.innerHTML = '';
  
  // 按置顶和名称排序
  const names = Object.keys(chatData);
  names.sort(function(a, b) {
    const isPinnedA = pinnedChats.includes(a);
    const isPinnedB = pinnedChats.includes(b);
    if (isPinnedA && !isPinnedB) return -1;
    if (!isPinnedA && isPinnedB) return 1;
    return 0;
  });
  
  names.forEach(function(name) {
    const messages = chatData[name] || [];
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    const preview = lastMsg ? lastMsg.text : '新对话';
    const time = lastMsg ? getTimeLabel() : '现在';
    
    const colors = ['#5e5ce6', '#ff9f0a', '#32d74b', '#ff375f', '#0a84ff', '#ff6b6b'];
    const colorIndex = name.length % colors.length;
    const color = colors[colorIndex];
    
    const item = document.createElement('div');
    item.className = 'chat-item';
    item.dataset.name = name;
    
    const avatarUrl = contactAvatars[name] || '';
    let avatarContent = '';
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
    
    chatList.appendChild(item);
  });
}

function getTimeLabel() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return h + ':' + m;
}

// ========== 更新聊天列表预览 ==========
function updateChatListPreview(name, text) {
  const chatList = document.getElementById('chatList');
  if (!chatList) return;
  
  const items = chatList.querySelectorAll('.chat-item');
  for (var i = 0; i < items.length; i++) {
    const item = items[i];
    const nameEl = item.querySelector('.chat-name');
    if (nameEl && nameEl.textContent === name) {
      const previewEl = item.querySelector('.chat-preview');
      const timeEl = item.querySelector('.chat-time');
      if (previewEl) previewEl.textContent = text;
      if (timeEl) timeEl.textContent = getTimeLabel();
      break;
    }
  }
}

// ========== 排序聊天列表 ==========
function sortChatList() {
  renderChatList();
}

// ========== 渲染消息 ==========
function renderMessages(name) {
  currentChat = name;
  window.currentChat = name;
  
  const chatDetailTitle = document.getElementById('chatDetailTitle');
  const chatMessages = document.getElementById('chatMessages');
  const chatDetailPage = document.getElementById('chatDetailPage');
  
  if (chatDetailTitle) chatDetailTitle.textContent = name;
  if (chatMessages) chatMessages.innerHTML = '';
  
  // 应用聊天背景
  if (chatBackgrounds && chatBackgrounds[name]) {
    chatDetailPage.style.backgroundImage = 'url(' + chatBackgrounds[name] + ')';
    chatDetailPage.style.backgroundSize = 'cover';
    chatDetailPage.style.backgroundPosition = 'center';
  } else {
    chatDetailPage.style.backgroundImage = '';
    chatDetailPage.style.backgroundSize = '';
  }
  
  const messages = chatData[name] || [];
  messages.forEach(function(msg, index) {
    appendMessageToContainer(chatMessages, msg, name);
  });
  
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// ========== 追加单条消息到容器 ==========
function appendMessageToContainer(container, msg, name) {
  if (!container) return;
  
  const msgContainer = document.createElement('div');
  msgContainer.style.display = 'flex';
  msgContainer.style.alignItems = 'flex-end';
  msgContainer.style.gap = '8px';
  msgContainer.style.marginBottom = '8px';
  msgContainer.style.opacity = '0';
  
  if (msg.type === 'sent') {
    msgContainer.style.justifyContent = 'flex-end';
    
    const msgEl = document.createElement('div');
    msgEl.className = 'message sent';
    msgEl.textContent = msg.text;
    msgContainer.appendChild(msgEl);
    
    const avatar = createAvatar('sent');
    msgContainer.appendChild(avatar);
    
    container.appendChild(msgContainer);
    animateMessage(msgContainer, 'sent');
    
  } else if (msg.type === 'received') {
    msgContainer.style.justifyContent = 'flex-start';
    
    const avatar = createAvatar('received', name);
    msgContainer.appendChild(avatar);
    
    const msgEl = document.createElement('div');
    msgEl.className = 'message received';
    msgEl.textContent = msg.text;
    msgContainer.appendChild(msgEl);
    
    container.appendChild(msgContainer);
    animateMessage(msgContainer, 'received');
  }
}

// ========== 创建头像 ==========
function createAvatar(type, name) {
  const avatar = document.createElement('div');
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

// ========== 发送消息 ==========
function sendMessage() {
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  if (!chatInput || !chatMessages) return;
  
  const text = chatInput.value.trim();
  if (!text || !currentChat) {
    // 轻触反馈
    chatInput.style.borderColor = '#ff375f';
    setTimeout(function() {
      chatInput.style.borderColor = '';
    }, 500);
    return;
  }
  
  // 保存消息
  if (!chatData[currentChat]) chatData[currentChat] = [];
  chatData[currentChat].push({ type: 'sent', text: text });
  saveChatData();
  
  // 渲染消息
  appendMessageToContainer(chatMessages, { type: 'sent', text: text }, currentChat);
  
  // 清空输入框
  chatInput.value = '';
  chatMessages.scrollTop = chatMessages.scrollHeight;
  chatInput.focus();
  
  // 更新聊天列表预览
  updateChatListPreview(currentChat, text);
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
window.updateChatListPreview = updateChatListPreview;
window.sortChatList = sortChatList;
window.createAvatar = createAvatar;
window.animateMessage = animateMessage;
window.appendMessageToContainer = appendMessageToContainer;