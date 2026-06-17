// ========== API设置 & AI回复 ==========

// ========== 加载 API 设置 ==========
function loadApiSettings() {
  const apiUrl = localStorage.getItem('apiUrl') || '';
  const apiKey = localStorage.getItem('apiKey') || '';
  const modelName = localStorage.getItem('modelName') || '';
  
  var urlInput = document.getElementById('apiUrlInput');
  var keyInput = document.getElementById('apiKeyInput');
  var modelInput = document.getElementById('modelNameInput');
  
  if (urlInput) urlInput.value = apiUrl;
  if (keyInput) keyInput.value = apiKey;
  if (modelInput) modelInput.value = modelName;
  
  const savedModels = localStorage.getItem('modelList');
  if (savedModels) {
    displayModelList(JSON.parse(savedModels));
  }
}

// ========== 保存 API 设置 ==========
function saveApiSettings() {
  var urlInput = document.getElementById('apiUrlInput');
  var keyInput = document.getElementById('apiKeyInput');
  var modelInput = document.getElementById('modelNameInput');
  
  if (urlInput) localStorage.setItem('apiUrl', urlInput.value.trim());
  if (keyInput) localStorage.setItem('apiKey', keyInput.value.trim());
  if (modelInput) localStorage.setItem('modelName', modelInput.value.trim());
}

// ========== 规范化 URL ==========
function normalizeUrl(baseUrl, path) {
  if (!baseUrl) return '';
  var url = baseUrl.replace(/\/+$/, '');
  var pathClean = path.replace(/^\/+/, '');
  
  // 如果 baseUrl 已经包含 /v1
  if (/\/v1$/.test(url)) {
    return url + '/' + pathClean;
  }
  return url + '/v1/' + pathClean;
}

// ========== 获取模型列表 ==========
async function fetchModelList() {
  var urlInput = document.getElementById('apiUrlInput');
  var keyInput = document.getElementById('apiKeyInput');
  var fetchBtn = document.getElementById('fetchModelsBtn');
  
  if (!urlInput) return;
  
  var apiUrl = urlInput.value.trim();
  var apiKey = keyInput ? keyInput.value.trim() : '';
  
  if (!apiUrl) {
    showToast('获取失败', '请先输入API地址', 'warning');
    return;
  }
  
  if (fetchBtn) {
    fetchBtn.textContent = '获取中...';
    fetchBtn.disabled = true;
  }
  
  var paths = ['models', 'v1/models', '/models', '/v1/models'];
  var success = false;
  var lastError = '';
  
  for (var i = 0; i < paths.length; i++) {
    try {
      var url = normalizeUrl(apiUrl, paths[i]);
      var headers = { 'Content-Type': 'application/json' };
      if (apiKey) {
        headers['Authorization'] = 'Bearer ' + apiKey;
      }
      
      var response = await fetch(url, { headers: headers });
      
      if (response.ok) {
        var data = await response.json();
        var models = [];
        
        if (data.data && Array.isArray(data.data)) {
          for (var j = 0; j < data.data.length; j++) {
            models.push(data.data[j].id);
          }
        } else if (Array.isArray(data)) {
          for (var k = 0; k < data.length; k++) {
            var m = data[k];
            models.push(m.id || m.model || m.name || m);
          }
        } else if (data.models && Array.isArray(data.models)) {
          for (var l = 0; l < data.models.length; l++) {
            var n = data.models[l];
            models.push(n.id || n.name || n);
          }
        }
        
        models = models.filter(Boolean);
        models.sort();
        
        if (models.length > 0) {
          localStorage.setItem('modelList', JSON.stringify(models));
          displayModelList(models);
          showToast('获取成功', '共找到 ' + models.length + ' 个模型', 'success');
          success = true;
          break;
        }
      } else {
        lastError = String(response.status);
      }
    } catch (e) {
      lastError = e.message;
      continue;
    }
  }
  
  if (!success) {
    showToast('获取失败', '无法获取模型列表 (' + lastError + ')', 'error');
  }
  
  if (fetchBtn) {
    fetchBtn.textContent = '获取模型';
    fetchBtn.disabled = false;
  }
}

// ========== 显示模型列表 ==========
function displayModelList(models) {
  var section = document.getElementById('modelListSection');
  var list = document.getElementById('modelList');
  var currentModel = document.getElementById('modelNameInput');
  
  if (!section || !list) return;
  
  list.innerHTML = '';
  
  if (models.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  
  for (var i = 0; i < models.length; i++) {
    var model = models[i];
    var item = document.createElement('div');
    item.className = 'model-item';
    if (currentModel && model === currentModel.value) {
      item.classList.add('selected');
    }
    item.textContent = model;
    
    (function(modelName) {
      item.addEventListener('click', function() {
        var input = document.getElementById('modelNameInput');
        if (input) input.value = modelName;
        var items = list.querySelectorAll('.model-item');
        for (var j = 0; j < items.length; j++) {
          items[j].classList.remove('selected');
        }
        this.classList.add('selected');
      });
    })(model);
    
    list.appendChild(item);
  }
}

// ========== AI 对话主控函数 ==========
async function callAIResponse(name) {
  // 安全拦截
  if (!name || typeof name !== 'string' || name.trim() === '' || name === 'undefined') {
    console.warn('[安全拦截] 拦截到一次不带名字的非法 AI 调用，已静默处理。');
    return;
  }
  
  var apiUrl = localStorage.getItem('apiUrl');
  var apiKey = localStorage.getItem('apiKey');
  var modelName = localStorage.getItem('modelName');
  var persona = (typeof personas !== 'undefined' && personas[name]) ? personas[name] : '';
  
  if (!apiUrl || !modelName) {
    showToast('无法回复', '请先在设置中配置API', 'warning');
    return;
  }
  
  var isUserLookingAtThisChat = (window.currentChat === name && document.getElementById('chatMessages'));
  
  var chatDetailTitle = document.getElementById('chatDetailTitle');
  var statusBarTime = document.getElementById('statusBarTime');
  var originalTitle = name;
  
  if (isUserLookingAtThisChat) {
    originalTitle = chatDetailTitle ? chatDetailTitle.textContent || name : name;
    if (chatDetailTitle) chatDetailTitle.textContent = '对方正在输入...';
    if (statusBarTime) statusBarTime.textContent = '对方正在输入...';
    
    var oldIndicator = document.getElementById('typingIndicator');
    if (oldIndicator) oldIndicator.remove();
    renderTypingIndicator(name);
  }
  
  // ========== 构建上下文 ==========
  var messages = [];
  
  if (persona) {
    messages.push({ role: 'system', content: persona });
  }
  
  var history = chatData[name] || [];
  var recent = history.slice(-6);
  for (var i = 0; i < recent.length; i++) {
    var msg = recent[i];
    messages.push({
      role: msg.type === 'sent' ? 'user' : 'assistant',
      content: msg.text
    });
  }
  
  // 如果没有任何消息，静默退出
  if (messages.length === 0 || (messages.length === 1 && messages[0].role === 'system')) {
    if (history.length > 0) {
      var lastMsg = history[history.length - 1];
      messages.push({
        role: lastMsg.type === 'sent' ? 'user' : 'assistant',
        content: lastMsg.text
      });
    } else {
      console.log('[静默拦截] 会话 ' + name + ' 当前没有可回复的历史文本');
      var indicator = document.getElementById('typingIndicator');
      if (indicator) indicator.remove();
      if (chatDetailTitle && isUserLookingAtThisChat) chatDetailTitle.textContent = originalTitle;
      return;
    }
  }
  
  try {
    var url = normalizeUrl(apiUrl, 'chat/completions');
    var headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = 'Bearer ' + apiKey;
    
    var response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: modelName,
        messages: messages,
        stream: false
      })
    });
    
    if (isUserLookingAtThisChat) {
      var indicator2 = document.getElementById('typingIndicator');
      if (indicator2) indicator2.remove();
    }
    
    if (!response.ok) {
      var errorMessage = '请求失败 (' + response.status + ')';
      try {
        var errorData = await response.json();
        if (errorData && errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
        }
      } catch (jsonErr) {
        try {
          var textError = await response.text();
          if (textError) errorMessage = textError.substring(0, 100);
        } catch (e) {}
      }
      throw new Error(errorMessage);
    }
    
    var data = await response.json();
    var replyText = data.choices[0].message.content;
    
    // 写入本地数据
    if (!chatData[name]) chatData[name] = [];
    chatData[name].push({ type: 'received', text: replyText });
    
    if (typeof saveChatData === 'function') saveChatData();
    if (typeof updateChatListPreview === 'function') updateChatListPreview(name, replyText);
    
    // 更新 UI
    if (window.currentChat === name && document.getElementById('chatMessages')) {
      appendSingleMessageToUI(name, replyText);
      if (chatDetailTitle) chatDetailTitle.textContent = originalTitle;
      if (statusBarTime) statusBarTime.textContent = originalTitle;
    }
    
  } catch (error) {
    if (window.currentChat === name && document.getElementById('chatMessages')) {
      var indicator3 = document.getElementById('typingIndicator');
      if (indicator3) indicator3.remove();
      if (chatDetailTitle) chatDetailTitle.textContent = originalTitle;
      if (statusBarTime) statusBarTime.textContent = originalTitle;
      showToast('AI回复失败', error.message, 'error');
    }
    console.error('AI对话通道请求失败:', error);
  }
}

// ========== 追加单条消息到 UI ==========
function appendSingleMessageToUI(name, text) {
  var chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  
  var replyContainer = document.createElement('div');
  replyContainer.style.cssText = 'display:flex; align-items:flex-end; gap:8px; justify-content:flex-start; margin-bottom:8px;';
  
  var contactAvatar = document.createElement('div');
  contactAvatar.style.cssText = 'width:30px;height:30px;border-radius:50%;background:#5e5ce6;background-size:cover;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;color:white;';
  
  if (contactAvatars && contactAvatars[name]) {
    contactAvatar.style.backgroundImage = 'url(' + contactAvatars[name] + ')';
    contactAvatar.style.backgroundSize = 'cover';
  } else {
    contactAvatar.textContent = name.charAt(0);
  }
  replyContainer.appendChild(contactAvatar);
  
  var replyEl = document.createElement('div');
  replyEl.className = 'message received';
  replyEl.textContent = text;
  replyContainer.appendChild(replyEl);
  
  chatMessages.appendChild(replyContainer);
  animateMessage(replyContainer, 'received');
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ========== 渲染打字指示器 ==========
function renderTypingIndicator(name) {
  var chatMessages = document.getElementById('chatMessages');
  if (!chatMessages || document.getElementById('typingIndicator')) return;
  
  var typingContainer = document.createElement('div');
  typingContainer.style.cssText = 'display:flex; align-items:flex-end; gap:8px; justify-content:flex-start; margin-bottom:8px;';
  typingContainer.id = 'typingIndicator';
  
  var typingAvatar = document.createElement('div');
  typingAvatar.style.cssText = 'width:30px;height:30px;border-radius:50%;background:#5e5ce6;display:flex;align-items:center;justify-content:center;font-size:12px;color:white;flex-shrink:0;background-size:cover;';
  
  if (contactAvatars && contactAvatars[name]) {
    typingAvatar.style.backgroundImage = 'url(' + contactAvatars[name] + ')';
    typingAvatar.style.backgroundSize = 'cover';
  } else {
    typingAvatar.textContent = name.charAt(0);
  }
  typingContainer.appendChild(typingAvatar);
  
  var typingDots = document.createElement('div');
  typingDots.className = 'message received';
  typingDots.style.padding = '12px 18px';
  typingDots.innerHTML = '<span class="typing-dot">●</span><span class="typing-dot">●</span><span class="typing-dot">●</span>';
  typingContainer.appendChild(typingDots);
  
  chatMessages.appendChild(typingContainer);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ========== 预设管理 ==========
function savePreset() {
  var urlInput = document.getElementById('apiUrlInput');
  var keyInput = document.getElementById('apiKeyInput');
  var modelInput = document.getElementById('modelNameInput');
  
  if (!urlInput) return;
  var apiUrl = urlInput.value.trim();
  if (!apiUrl) {
    showToast('保存失败', '请先输入API地址', 'warning');
    return;
  }
  
  showAlert('保存预设', '请输入预设名称', function(presetName) {
    if (!presetName) return;
    
    var presets = JSON.parse(localStorage.getItem('apiPresets') || '{}');
    presets[presetName] = {
      apiUrl: apiUrl,
      apiKey: keyInput ? keyInput.value.trim() : '',
      modelName: modelInput ? modelInput.value.trim() : ''
    };
    localStorage.setItem('apiPresets', JSON.stringify(presets));
    loadPresetList();
    showToast('保存成功', '预设「' + presetName + '」已保存', 'success');
  });
}

function loadPresetList() {
  var presets = JSON.parse(localStorage.getItem('apiPresets') || '{}');
  var presetList = document.getElementById('presetList');
  
  if (!presetList) return;
  presetList.innerHTML = '';
  
  var names = Object.keys(presets);
  
  if (names.length === 0) {
    presetList.innerHTML = '<div style="padding: 16px; text-align: center; color: rgba(0,0,0,0.3); font-size: 14px;">暂无预设</div>';
    return;
  }
  
  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    var preset = presets[name];
    var item = document.createElement('div');
    item.className = 'preset-item';
    item.innerHTML = `
      <div style="flex: 1; min-width: 0;">
        <div class="preset-item-name">${name}</div>
        <div class="preset-item-url">${preset.apiUrl}</div>
      </div>
      <span class="preset-item-delete" data-name="${name}">✕</span>
    `;
    
    (function(presetData, presetName) {
      item.addEventListener('click', function(e) {
        if (e.target.classList.contains('preset-item-delete')) return;
        var urlInput = document.getElementById('apiUrlInput');
        var keyInput = document.getElementById('apiKeyInput');
        var modelInput = document.getElementById('modelNameInput');
        if (urlInput) urlInput.value = presetData.apiUrl;
        if (keyInput) keyInput.value = presetData.apiKey || '';
        if (modelInput) modelInput.value = presetData.modelName || '';
        showToast('加载成功', '已加载预设「' + presetName + '」', 'success');
      });
    })(preset, name);
    
    var deleteBtn = item.querySelector('.preset-item-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var presetName = this.dataset.name;
        delete presets[presetName];
        localStorage.setItem('apiPresets', JSON.stringify(presets));
        loadPresetList();
        showToast('已删除', '预设「' + presetName + '」已删除', 'info');
      });
    }
    
    presetList.appendChild(item);
  }
}

// ========== 暴露全局 ==========
window.callAIResponse = callAIResponse;
window.loadApiSettings = loadApiSettings;
window.saveApiSettings = saveApiSettings;
window.fetchModelList = fetchModelList;
window.displayModelList = displayModelList;
window.savePreset = savePreset;
window.loadPresetList = loadPresetList;
window.normalizeUrl = normalizeUrl;