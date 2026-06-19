// ========== API设置 & AI回复 ==========

// ========== 加载 API 设置 ==========
function loadApiSettings() {
  var apiUrl = localStorage.getItem('apiUrl') || '';
  var apiKey = localStorage.getItem('apiKey') || '';
  var modelName = localStorage.getItem('modelName') || '';

  document.getElementById('apiUrlInput').value = apiUrl;
  document.getElementById('apiKeyInput').value = apiKey;
  document.getElementById('modelNameInput').value = modelName;

  var memoryApiUrl = localStorage.getItem('memoryApiUrl') || '';
  var memoryApiKey = localStorage.getItem('memoryApiKey') || '';
  var memoryModel = localStorage.getItem('memoryModel') || '';

  document.getElementById('memoryApiUrlInput').value = memoryApiUrl;
  document.getElementById('memoryApiKeyInput').value = memoryApiKey;
  document.getElementById('memoryModelInput').value = memoryModel;

  var chatModels = localStorage.getItem('chatModelList');
  if (chatModels) {
    var chatListEl = document.getElementById('chatModelList');
    var chatSection = document.getElementById('chatModelListSection');
    var chatInput = document.getElementById('modelNameInput');
    displayChatModelList(JSON.parse(chatModels), chatInput, chatListEl, chatSection);
  }

  var memoryModels = localStorage.getItem('memoryModelList');
  if (memoryModels) {
    var memoryListEl = document.getElementById('memoryModelList');
    var memorySection = document.getElementById('memoryModelListSection');
    var memoryInput = document.getElementById('memoryModelInput');
    displayChatModelList(JSON.parse(memoryModels), memoryInput, memoryListEl, memorySection);
  }

  loadApiPresetList('apiPresets', 'apiPresetSelect');
  loadApiPresetList('memoryApiPresets', 'memoryApiPresetSelect');
}

// ========== 保存 API 设置 ==========
function saveApiSettings() {
  localStorage.setItem('apiUrl', document.getElementById('apiUrlInput').value.trim());
  localStorage.setItem('apiKey', document.getElementById('apiKeyInput').value.trim());
  localStorage.setItem('modelName', document.getElementById('modelNameInput').value.trim());

  localStorage.setItem('memoryApiUrl', document.getElementById('memoryApiUrlInput').value.trim());
  localStorage.setItem('memoryApiKey', document.getElementById('memoryApiKeyInput').value.trim());
  localStorage.setItem('memoryModel', document.getElementById('memoryModelInput').value.trim());
}

// ========== 规范化 URL ==========
function normalizeUrl(baseUrl, path) {
  if (!baseUrl) return '';
  var url = baseUrl.replace(/\/+$/, '');
  var pathClean = path.replace(/^\/+/, '');

  if (/\/v1$/.test(url)) {
    return url + '/' + pathClean;
  }
  return url + '/v1/' + pathClean;
}

// ========== 获取当前时间字符串 ==========
function getCurrentTimeStr() {
  var now = new Date();
  var year = now.getFullYear();
  var month = String(now.getMonth() + 1).padStart(2, '0');
  var day = String(now.getDate()).padStart(2, '0');
  var hours = String(now.getHours()).padStart(2, '0');
  var minutes = String(now.getMinutes()).padStart(2, '0');
  var weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  var weekday = weekdays[now.getDay()];

  var timeDesc = '';
  var h = now.getHours();
  if (h >= 5 && h < 8) timeDesc = '早晨';
  else if (h >= 8 && h < 12) timeDesc = '上午';
  else if (h >= 12 && h < 14) timeDesc = '中午';
  else if (h >= 14 && h < 18) timeDesc = '下午';
  else if (h >= 18 && h < 21) timeDesc = '傍晚';
  else if (h >= 21 && h < 24) timeDesc = '夜晚';
  else timeDesc = '凌晨';

  return year + '年' + month + '月' + day + '日 ' + timeDesc + ' ' + hours + ':' + minutes + ' ' + weekday;
}

// ========== 获取聊天模型列表 ==========
async function fetchChatModels() {
  var urlInput = document.getElementById('apiUrlInput');
  var keyInput = document.getElementById('apiKeyInput');
  var fetchBtn = document.getElementById('fetchChatModelsBtn');
  var listSection = document.getElementById('chatModelListSection');
  var listEl = document.getElementById('chatModelList');
  var modelInput = document.getElementById('modelNameInput');

  if (!urlInput) return;

  var apiUrl = urlInput.value.trim();
  var apiKey = keyInput ? keyInput.value.trim() : '';

  if (!apiUrl) {
    showToast('获取失败', '请先输入聊天API地址', 'warning');
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
          localStorage.setItem('chatModelList', JSON.stringify(models));
          displayChatModelList(models, modelInput, listEl, listSection);
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
    fetchBtn.textContent = '🔍 获取模型';
    fetchBtn.disabled = false;
  }
}

// ========== 获取记忆模型列表 ==========
async function fetchMemoryModels() {
  var urlInput = document.getElementById('memoryApiUrlInput');
  var keyInput = document.getElementById('memoryApiKeyInput');
  var fetchBtn = document.getElementById('fetchMemoryModelsBtn');
  var listSection = document.getElementById('memoryModelListSection');
  var listEl = document.getElementById('memoryModelList');
  var modelInput = document.getElementById('memoryModelInput');

  var apiUrl = urlInput ? urlInput.value.trim() : '';
  if (!apiUrl) {
    apiUrl = document.getElementById('apiUrlInput').value.trim();
    if (!apiUrl) {
      showToast('获取失败', '请先输入API地址（聊天或记忆）', 'warning');
      return;
    }
  }

  var apiKey = keyInput ? keyInput.value.trim() : '';
  if (!apiKey) {
    apiKey = document.getElementById('apiKeyInput').value.trim();
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
          localStorage.setItem('memoryModelList', JSON.stringify(models));
          displayChatModelList(models, modelInput, listEl, listSection);
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
    fetchBtn.textContent = '🔍 获取模型';
    fetchBtn.disabled = false;
  }
}

// ========== 显示模型列表（通用） ==========
function displayChatModelList(models, currentModelInput, listEl, listSection) {
  if (!listEl || !listSection) return;

  listEl.innerHTML = '';

  if (models.length === 0) {
    listSection.style.display = 'none';
    return;
  }

  listSection.style.display = 'block';

  for (var i = 0; i < models.length; i++) {
    var model = models[i];
    var item = document.createElement('div');
    item.className = 'model-item';
    if (currentModelInput && model === currentModelInput.value) {
      item.classList.add('selected');
    }
    item.textContent = model;

    (function(modelName) {
      item.addEventListener('click', function() {
        if (currentModelInput) currentModelInput.value = modelName;
        var items = listEl.querySelectorAll('.model-item');
        for (var j = 0; j < items.length; j++) {
          items[j].classList.remove('selected');
        }
        this.classList.add('selected');
      });
    })(model);

    listEl.appendChild(item);
  }
}

// ========== 预设管理 ==========
function loadApiPresetList(storageKey, selectId) {
  var select = document.getElementById(selectId);
  if (!select) return;

  var presets = JSON.parse(localStorage.getItem(storageKey) || '{}');
  var names = Object.keys(presets);

  select.innerHTML = '<option value="">-- 选择预设 --</option>';

  for (var i = 0; i < names.length; i++) {
    var option = document.createElement('option');
    option.value = names[i];
    option.textContent = names[i];
    select.appendChild(option);
  }

  var deleteBtn = select.parentElement.querySelector('.api-preset-delete-btn');
  if (deleteBtn) {
    if (names.length > 0) {
      deleteBtn.classList.add('show');
    } else {
      deleteBtn.classList.remove('show');
    }
  }
}

function saveApiPreset(storageKey, presetName, data) {
  var presets = JSON.parse(localStorage.getItem(storageKey) || '{}');
  presets[presetName] = data;
  localStorage.setItem(storageKey, JSON.stringify(presets));
}

function deleteApiPreset(storageKey, presetName) {
  var presets = JSON.parse(localStorage.getItem(storageKey) || '{}');
  delete presets[presetName];
  localStorage.setItem(storageKey, JSON.stringify(presets));
}

function loadApiPreset(storageKey, presetName) {
  var presets = JSON.parse(localStorage.getItem(storageKey) || '{}');
  return presets[presetName] || null;
}

// ========== 预设选择事件绑定 ==========
function bindApiPresetEvents() {
  var chatSelect = document.getElementById('apiPresetSelect');
  if (chatSelect) {
    chatSelect.addEventListener('change', function() {
      var name = this.value;
      if (!name) return;
      var preset = loadApiPreset('apiPresets', name);
      if (preset) {
        document.getElementById('apiUrlInput').value = preset.apiUrl || '';
        document.getElementById('apiKeyInput').value = preset.apiKey || '';
        document.getElementById('modelNameInput').value = preset.modelName || '';
        if (typeof showToast === 'function') {
          showToast('已加载', '聊天预设「' + name + '」已加载', 'success');
        }
      }
    });
  }

  var memorySelect = document.getElementById('memoryApiPresetSelect');
  if (memorySelect) {
    memorySelect.addEventListener('change', function() {
      var name = this.value;
      if (!name) return;
      var preset = loadApiPreset('memoryApiPresets', name);
      if (preset) {
        document.getElementById('memoryApiUrlInput').value = preset.apiUrl || '';
        document.getElementById('memoryApiKeyInput').value = preset.apiKey || '';
        document.getElementById('memoryModelInput').value = preset.modelName || '';
        if (typeof showToast === 'function') {
          showToast('已加载', '记忆预设「' + name + '」已加载', 'success');
        }
      }
    });
  }

  var chatSaveBtn = document.getElementById('saveApiPresetBtn');
  if (chatSaveBtn) {
    chatSaveBtn.addEventListener('click', function() {
      var nameInput = document.getElementById('apiPresetNameInput');
      var name = nameInput ? nameInput.value.trim() : '';
      if (!name) {
        if (typeof showToast === 'function') showToast('提示', '请输入预设名称', 'warning');
        return;
      }
      var data = {
        apiUrl: document.getElementById('apiUrlInput').value.trim(),
        apiKey: document.getElementById('apiKeyInput').value.trim(),
        modelName: document.getElementById('modelNameInput').value.trim()
      };
      saveApiPreset('apiPresets', name, data);
      loadApiPresetList('apiPresets', 'apiPresetSelect');
      if (nameInput) nameInput.value = '';
      if (typeof showToast === 'function') showToast('保存成功', '聊天预设「' + name + '」已保存', 'success');
    });
  }

  var memorySaveBtn = document.getElementById('saveMemoryApiPresetBtn');
  if (memorySaveBtn) {
    memorySaveBtn.addEventListener('click', function() {
      var nameInput = document.getElementById('memoryApiPresetNameInput');
      var name = nameInput ? nameInput.value.trim() : '';
      if (!name) {
        if (typeof showToast === 'function') showToast('提示', '请输入预设名称', 'warning');
        return;
      }
      var data = {
        apiUrl: document.getElementById('memoryApiUrlInput').value.trim(),
        apiKey: document.getElementById('memoryApiKeyInput').value.trim(),
        modelName: document.getElementById('memoryModelInput').value.trim()
      };
      saveApiPreset('memoryApiPresets', name, data);
      loadApiPresetList('memoryApiPresets', 'memoryApiPresetSelect');
      if (nameInput) nameInput.value = '';
      if (typeof showToast === 'function') showToast('保存成功', '记忆预设「' + name + '」已保存', 'success');
    });
  }

  var chatDeleteBtn = document.getElementById('deleteApiPresetBtn');
  if (chatDeleteBtn) {
    chatDeleteBtn.addEventListener('click', function() {
      var select = document.getElementById('apiPresetSelect');
      var name = select ? select.value : '';
      if (!name) {
        if (typeof showToast === 'function') showToast('提示', '请先选择要删除的预设', 'warning');
        return;
      }
      if (confirm('确认删除聊天预设「' + name + '」吗？')) {
        deleteApiPreset('apiPresets', name);
        loadApiPresetList('apiPresets', 'apiPresetSelect');
        if (typeof showToast === 'function') showToast('已删除', '预设「' + name + '」已删除', 'info');
      }
    });
  }

  var memoryDeleteBtn = document.getElementById('deleteMemoryApiPresetBtn');
  if (memoryDeleteBtn) {
    memoryDeleteBtn.addEventListener('click', function() {
      var select = document.getElementById('memoryApiPresetSelect');
      var name = select ? select.value : '';
      if (!name) {
        if (typeof showToast === 'function') showToast('提示', '请先选择要删除的预设', 'warning');
        return;
      }
      if (confirm('确认删除记忆预设「' + name + '」吗？')) {
        deleteApiPreset('memoryApiPresets', name);
        loadApiPresetList('memoryApiPresets', 'memoryApiPresetSelect');
        if (typeof showToast === 'function') showToast('已删除', '预设「' + name + '」已删除', 'info');
      }
    });
  }
}

// ========== 请求纯净AI ==========
async function requestPureAI(customPrompt) {
  var apiUrl = localStorage.getItem('apiUrl');
  var apiKey = localStorage.getItem('apiKey');
  var modelName = localStorage.getItem('modelName');

  if (!apiUrl || !modelName) return '';

  try {
    var url = normalizeUrl(apiUrl, 'chat/completions');
    var headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = 'Bearer ' + apiKey;

    var response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: customPrompt }],
        stream: false
      })
    });

    if (response.ok) {
      var data = await response.json();
      return data.choices[0].message.content;
    }
  } catch (error) {
    console.error('请求失败:', error);
  }
  return '';
}

// ========== 请求记忆AI ==========
async function requestMemoryAI(customPrompt) {
  var apiUrl = localStorage.getItem('memoryApiUrl') || localStorage.getItem('apiUrl');
  var apiKey = localStorage.getItem('memoryApiKey') || localStorage.getItem('apiKey');
  var modelName = localStorage.getItem('memoryModel') || localStorage.getItem('modelName');

  if (!apiUrl || !modelName) {
    console.warn('[记忆API] 未配置，请检查设置');
    return '';
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
        messages: [{ role: 'user', content: customPrompt }],
        stream: false
      })
    });

    if (response.ok) {
      var data = await response.json();
      return data.choices[0].message.content;
    } else {
      console.warn('[记忆API] 请求失败:', response.status);
      return '';
    }
  } catch (error) {
    console.error('[记忆API] 请求异常:', error);
    return '';
  }
}

// ============================================================
//  AI 对话主控函数（直接用 appendMessageToContainer）
// ============================================================
async function callAIResponse(name) {
  if (!name || typeof name !== 'string' || name.trim() === '' || name === 'undefined') {
    console.warn('[安全拦截] 拦截到一次不带名字的非法 AI 调用，已静默处理。');
    return;
  }

  var apiUrl = localStorage.getItem('apiUrl');
  var apiKey = localStorage.getItem('apiKey');
  var modelName = localStorage.getItem('modelName');
  var persona = (typeof personas !== 'undefined' && personas[name]) ? personas[name] : '';
  var userPersona = (typeof userPersonas !== 'undefined' && userPersonas[name]) ? userPersonas[name] : '';

  if (!apiUrl || !modelName) {
    showToast('无法回复', '请先在设置中配置API', 'warning');
    return;
  }

  var isUserLookingAtThisChat = (window.currentChat === name && document.getElementById('chatMessages'));

  var chatDetailTitle = document.getElementById('chatDetailTitle');
  var statusBarTime = document.getElementById('statusBarTime');
  var originalTitle = name;

  function restoreHeader() {
    if (chatDetailTitle) {
      chatDetailTitle.textContent = originalTitle;
      chatDetailTitle.classList.remove('typing');
    }
    if (statusBarTime) statusBarTime.textContent = originalTitle;
  }

  if (isUserLookingAtThisChat) {
    originalTitle = chatDetailTitle ? chatDetailTitle.textContent || name : name;
    if (chatDetailTitle) {
      chatDetailTitle.textContent = '对方正在输入中...';
      chatDetailTitle.classList.add('typing');
    }
    if (statusBarTime) statusBarTime.textContent = '对方正在输入中...';
  }

  // ========== 构建消息 ==========
  var messages = [];
  var systemContent = '';

  systemContent += '【时间感知】当前时间是 ' + getCurrentTimeStr() + '。请记住这个时间，所有对话都以这个时间为准。\n\n';

  if (persona) {
    systemContent += '你的角色设定：' + persona + '\n\n';
  }

  if (userPersona) {
    systemContent += '用户的设定：' + userPersona + '\n\n';
  }

  if (typeof getMountedWorldbooks === 'function') {
    var mountedBooks = getMountedWorldbooks(name);
    if (mountedBooks.length > 0) {
      systemContent += '【世界书设定】\n';
      for (var i = 0; i < mountedBooks.length; i++) {
        systemContent += '--- ' + mountedBooks[i].name + ' ---\n';
        systemContent += mountedBooks[i].content + '\n\n';
      }
    }
  }

  if (typeof getMemories === 'function') {
    var memories = getMemories(name);
    if (memories.length > 0) {
      systemContent += '【长期记忆】\n';
      for (var i = 0; i < memories.length; i++) {
        systemContent += '- ' + memories[i] + '\n';
      }
      systemContent += '\n';
    }
  }

  if (systemContent.trim()) {
    messages.push({ role: 'system', content: systemContent.trim() });
  }

  var history = chatData[name] || [];
  var windowSize = (typeof shortTermWindow !== 'undefined' && shortTermWindow) ? shortTermWindow : 10;
  var recent = history.slice(-windowSize);
  for (var i = 0; i < recent.length; i++) {
    var msg = recent[i];
    if (msg.type === 'system') continue;
    messages.push({
      role: msg.type === 'sent' ? 'user' : 'assistant',
      content: msg.text
    });
  }

  if (messages.length === 0 || (messages.length === 1 && messages[0].role === 'system') || (messages.length === 2 && messages[1] && messages[1].role === 'system')) {
    if (history.length > 0) {
      var lastMsg = history[history.length - 1];
      if (lastMsg.type !== 'system') {
        messages.push({
          role: lastMsg.type === 'sent' ? 'user' : 'assistant',
          content: lastMsg.text
        });
      }
    } else {
      console.log('[静默拦截] 会话 ' + name + ' 当前没有可回复的历史文本');
      restoreHeader();
      return;
    }
  }

  var isStream = (typeof streamEnabled !== 'undefined') ? streamEnabled : true;

  try {
    var url = normalizeUrl(apiUrl, 'chat/completions');
    var headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = 'Bearer ' + apiKey;

    var requestBody = {
      model: modelName,
      messages: messages,
      stream: isStream
    };

    var response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

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
      restoreHeader();
      throw new Error(errorMessage);
    }

    // ===== 流式输出 =====
    if (isStream) {
      var reader = response.body.getReader();
      var decoder = new TextDecoder();
      var fullText = '';
      var chatMessages = document.getElementById('chatMessages');

      while (true) {
        var chunk = await reader.read();
        if (chunk.done) break;

        var text = decoder.decode(chunk.value);
        var lines = text.split('\n');

        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].trim();
          if (line.startsWith('data: ')) {
            var data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              var json = JSON.parse(data);
              var content = json.choices[0].delta.content;
              if (content) {
                fullText += content;
              }
            } catch (e) {}
          }
        }
      }

      // 分割回复
      var splitLines = fullText.split('\n').filter(function(line) { return line.trim() });
      if (splitLines.length === 0 && fullText.trim()) {
        splitLines = [fullText.trim()];
      }

      // 保存到 chatData
      if (!chatData[name]) chatData[name] = [];
      var startIndex = chatData[name].length;
      for (var i = 0; i < splitLines.length; i++) {
        chatData[name].push({
          id: 'msg_' + Date.now() + '_' + i,
          type: 'received',
          text: splitLines[i],
          timestamp: Date.now()
        });
      }
      if (typeof saveChatData === 'function') saveChatData();
      if (typeof updateChatListPreview === 'function') updateChatListPreview(name, fullText);

      // ⭐ 判断是否在当前聊天页面
      var chatDetailPage = document.getElementById('chatDetailPage');
      var isInChat = (window.currentChat === name && chatDetailPage && chatDetailPage.style.display !== 'none');

      if (isInChat) {
        // 在当前聊天页面 → 逐条显示
        var chatMessages = document.getElementById('chatMessages');
        for (var i = 0; i < splitLines.length; i++) {
          (function(index) {
            setTimeout(function() {
              var msgIndex = startIndex + index;
              if (chatData[name] && chatData[name][msgIndex]) {
                if (typeof appendMessageToContainer === 'function') {
                  appendMessageToContainer(chatMessages, chatData[name][msgIndex], name);
                }
                chatMessages.scrollTop = chatMessages.scrollHeight;
              }
            }, index * 1500);
          })(i);
        }
        var totalDelay = splitLines.length * 1500 + 300;
        setTimeout(function() {
          restoreHeader();
        }, totalDelay);
      } else {
        // ⭐ 不在当前聊天页面 → 显示红点
        if (typeof showBadge === 'function') {
          showBadge(name);
        }
        restoreHeader();
      }

      if (typeof autoSummarize === 'function') {
        autoSummarize(name);
      }

    } else {
      // ===== 非流式输出 =====
      var data = await response.json();
      var replyText = data.choices[0].message.content;

      // 分割回复
      var splitLines = replyText.split('\n').filter(function(line) { return line.trim() });
      if (splitLines.length === 0 && replyText.trim()) {
        splitLines = [replyText.trim()];
      }

      // 保存到 chatData
      if (!chatData[name]) chatData[name] = [];
      var startIndex = chatData[name].length;
      for (var i = 0; i < splitLines.length; i++) {
        chatData[name].push({
          id: 'msg_' + Date.now() + '_' + i,
          type: 'received',
          text: splitLines[i],
          timestamp: Date.now()
        });
      }
      if (typeof saveChatData === 'function') saveChatData();
      if (typeof updateChatListPreview === 'function') updateChatListPreview(name, replyText);

      // ⭐ 判断是否在当前聊天页面
      var chatDetailPage = document.getElementById('chatDetailPage');
      var isInChat = (window.currentChat === name && chatDetailPage && chatDetailPage.style.display !== 'none');

      if (isInChat) {
        // 在当前聊天页面 → 逐条显示
        var chatMessages = document.getElementById('chatMessages');
        for (var i = 0; i < splitLines.length; i++) {
          (function(index) {
            setTimeout(function() {
              var msgIndex = startIndex + index;
              if (chatData[name] && chatData[name][msgIndex]) {
                if (typeof appendMessageToContainer === 'function') {
                  appendMessageToContainer(chatMessages, chatData[name][msgIndex], name);
                }
                chatMessages.scrollTop = chatMessages.scrollHeight;
              }
            }, index * 1500);
          })(i);
        }
        var totalDelay = splitLines.length * 1500 + 300;
        setTimeout(function() {
          restoreHeader();
        }, totalDelay);
      } else {
        // ⭐ 不在当前聊天页面 → 显示红点
        if (typeof showBadge === 'function') {
          showBadge(name);
        }
        restoreHeader();
      }

      if (typeof autoSummarize === 'function') {
        autoSummarize(name);
      }
    }

  } catch (error) {
    if (window.currentChat === name && document.getElementById('chatMessages')) {
      restoreHeader();
      showToast('AI回复失败', error.message, 'error');
    }
    console.error('AI对话通道请求失败:', error);
  }
}

// ========== 暴露全局 ==========
window.callAIResponse = callAIResponse;
window.loadApiSettings = loadApiSettings;
window.saveApiSettings = saveApiSettings;
window.fetchChatModels = fetchChatModels;
window.fetchMemoryModels = fetchMemoryModels;
window.displayChatModelList = displayChatModelList;
window.normalizeUrl = normalizeUrl;
window.requestPureAI = requestPureAI;
window.requestMemoryAI = requestMemoryAI;
window.loadApiPresetList = loadApiPresetList;
window.saveApiPreset = saveApiPreset;
window.deleteApiPreset = deleteApiPreset;
window.loadApiPreset = loadApiPreset;
window.bindApiPresetEvents = bindApiPresetEvents;
window.getCurrentTimeStr = getCurrentTimeStr;