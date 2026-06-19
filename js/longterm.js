// ========== 长期记忆功能（完整版） ==========

// ========== 存储结构 ==========
// {
//   '张三': {
//     memories: [
//       { id: 'm_xxx', text: 'xxxx年x月x日 xx:xx，我和用户聊了...', createdAt: '2026-06-18 14:30:00' }
//     ],
//     lastSummarizedTurn: 0,
//     totalTurns: 0
//   }
// }

// ========== 配置函数 ==========
function getSummaryInterval() {
  try {
    var saved = localStorage.getItem('summaryInterval');
    if (saved) {
      var val = parseInt(saved);
      if (val >= 2 && val <= 500) return val;
    }
  } catch (e) {}
  return 10;
}

function saveSummaryInterval(val) {
  if (val >= 2 && val <= 500) {
    localStorage.setItem('summaryInterval', String(val));
  }
}

function getAutoSummaryEnabled() {
  try {
    var saved = localStorage.getItem('autoSummaryEnabled');
    if (saved !== null) return saved === 'true';
  } catch (e) {}
  return true;
}

function saveAutoSummaryEnabled(enabled) {
  localStorage.setItem('autoSummaryEnabled', String(enabled));
}

// ========== 加载/保存长期记忆 ==========
function loadLongTermMemory(roleName) {
  try {
    var saved = localStorage.getItem('longTermMemory');
    if (saved) {
      var data = JSON.parse(saved);
      return data[roleName] || { memories: [], lastSummarizedTurn: 0, totalTurns: 0 };
    }
  } catch (e) { console.error('加载长期记忆失败', e); }
  return { memories: [], lastSummarizedTurn: 0, totalTurns: 0 };
}

function saveLongTermMemory(roleName, data) {
  try {
    var saved = localStorage.getItem('longTermMemory');
    var all = saved ? JSON.parse(saved) : {};
    all[roleName] = data;
    localStorage.setItem('longTermMemory', JSON.stringify(all));
  } catch (e) { console.error('保存长期记忆失败', e); }
}

// ========== 记忆操作 ==========
function getMemories(roleName) {
  var data = loadLongTermMemory(roleName);
  return data.memories || [];
}

function generateId() {
  return 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

function addMemory(roleName, text) {
  var data = loadLongTermMemory(roleName);
  if (!data.memories) data.memories = [];
  data.memories.push({
    id: generateId(),
    text: text,
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
  });
  data.totalTurns = (data.totalTurns || 0) + 1;
  saveLongTermMemory(roleName, data);
}

function deleteMemoryById(roleName, id) {
  var data = loadLongTermMemory(roleName);
  if (!data.memories) data.memories = [];
  data.memories = data.memories.filter(function(m) { return m.id !== id; });
  saveLongTermMemory(roleName, data);
  document.querySelectorAll('.alert-overlay').forEach(function(el) { el.remove(); });
  document.body.style.overflow = '';
}

function deleteMemoriesByIds(roleName, ids) {
  var data = loadLongTermMemory(roleName);
  if (!data.memories) data.memories = [];
  data.memories = data.memories.filter(function(m) { return ids.indexOf(m.id) === -1; });
  saveLongTermMemory(roleName, data);
  document.querySelectorAll('.alert-overlay').forEach(function(el) { el.remove(); });
  document.body.style.overflow = '';
}

function clearMemories(roleName) {
  var data = loadLongTermMemory(roleName);
  data.memories = [];
  data.lastSummarizedTurn = 0;
  saveLongTermMemory(roleName, data);
}

function getMemoryCount(roleName) {
  var data = loadLongTermMemory(roleName);
  return (data.memories || []).length;
}

function updateMemoryText(roleName, id, newText) {
  var data = loadLongTermMemory(roleName);
  if (!data.memories) data.memories = [];
  for (var i = 0; i < data.memories.length; i++) {
    if (data.memories[i].id === id) {
      data.memories[i].text = newText;
      break;
    }
  }
  saveLongTermMemory(roleName, data);
}

// ========== 按日期分组 ==========
function groupMemoriesByDate(memories) {
  var groups = {};
  for (var i = 0; i < memories.length; i++) {
    var dateStr = memories[i].createdAt.split(' ')[0];
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(memories[i]);
  }
  var sortedKeys = Object.keys(groups).sort(function(a, b) {
    return b.localeCompare(a);
  });
  var result = {};
  for (var j = 0; j < sortedKeys.length; j++) {
    result[sortedKeys[j]] = groups[sortedKeys[j]];
  }
  return result;
}

// ========== 获取当前时间描述（精确到分钟） ==========
function getTimeDescription() {
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
  
  return year + '年' + month + '月' + day + '日 ' + timeDesc + ' ' + hours + ':' + minutes + '，' + weekday;
}

// ========== 总结提示词模板 ==========
function getSummaryPrompt(dialogStr, roleName) {
  var currentTime = getTimeDescription();
  
  // 从全局获取人设
  var personas = window.personas || {};
  var userPersonas = window.userPersonas || {};
  
  var rolePersona = personas[roleName] || '';
  var userPersona = userPersonas[roleName] || '';
  
  var personaInfo = '';
  if (rolePersona) {
    personaInfo += '我（' + roleName + '）的人设：' + rolePersona + '\n';
  }
  if (userPersona) {
    personaInfo += '用户的人设：' + userPersona + '\n';
  }
  
  return '我是一个人，我的名字是「' + roleName + '」（AI），现在要总结我与（用户人设的名字）的对话。\n' +
    '「我」= ' + roleName + '（AI），「用户」= 与我对话的人。\n' +
    personaInfo +
    '\n请提取3到5个核心事件，用短句列表形式，每条不超过120字，绝对不要废话。\n\n' +
    '对话记录（' + roleName + '=我，用户=对方）：\n' + dialogStr + '\n\n' +
    '请用以下格式输出（只输出一条完整总结）：\n' +
    '"' + currentTime + '，我和（用户人设的名字）……"';
}

// ========== 手动总结 ==========
async function manualSummarize(roleName) {
  if (!roleName) {
    if (typeof showToast === 'function') showToast('提示', '请先进入一个聊天', 'warning');
    return;
  }

  var history = chatData[roleName] || [];
  if (history.length === 0) {
    if (typeof showToast === 'function') showToast('提示', '当前没有聊天记录可总结', 'warning');
    return;
  }

  var recent = history.slice(-50);
  var dialogStr = recent.map(function(msg) {
    return (msg.type === 'sent' ? '用户' : roleName) + ': ' + msg.text;
  }).join('\n');

  var prompt = getSummaryPrompt(dialogStr, roleName);

  if (typeof showToast === 'function') showToast('总结中', '正在生成记忆摘要...', 'info');

  if (typeof window.requestMemoryAI === 'function') {
    try {
      var result = await window.requestMemoryAI(prompt);
      if (result && result.trim()) {
        var data = loadLongTermMemory(roleName);
        if (!data.memories) data.memories = [];
        data.memories.push({
          id: generateId(),
          text: result.trim(),
          createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
        });
        data.totalTurns = (data.totalTurns || 0) + 1;
        saveLongTermMemory(roleName, data);
        renderMemoryLibrary(roleName);
        updateMemoryCount(roleName);
        if (typeof showToast === 'function') showToast('总结完成', '已添加一条记忆摘要', 'success');
      } else {
        if (typeof showToast === 'function') showToast('总结失败', '未生成有效记忆，请重试', 'error');
      }
    } catch (e) {
      console.error('手动总结失败', e);
      if (typeof showToast === 'function') showToast('总结失败', e.message || '未知错误', 'error');
    }
  } else {
    var localSummary = getTimeDescription() + '，我和（用户人设的名字）聊了关于「' + (recent[0]?.text || '未知话题') + '」';
    addMemory(roleName, localSummary);
    renderMemoryLibrary(roleName);
    updateMemoryCount(roleName);
    if (typeof showToast === 'function') showToast('总结完成', '已添加一条记忆摘要', 'success');
  }
}

// ========== 自动总结（按消息条数触发，不重复总结） ==========
async function autoSummarize(roleName) {
  if (!roleName) return;
  if (!getAutoSummaryEnabled()) return;

  var data = loadLongTermMemory(roleName);
  var history = chatData[roleName] || [];
  
  var totalMessages = history.length;
  var lastSummarized = data.lastSummarizedTurn || 0;

  var summaryInterval = getSummaryInterval();
  
  var newMessagesCount = totalMessages - lastSummarized;
  
  if (newMessagesCount < summaryInterval) return;

  var newMessages = history.slice(lastSummarized);
  var dialogStr = newMessages.map(function(msg) {
    return (msg.type === 'sent' ? '用户' : roleName) + ': ' + msg.text;
  }).join('\n');

  var prompt = getSummaryPrompt(dialogStr, roleName);

  console.log('[长期记忆] 自动总结触发，已总结条数:', lastSummarized, '当前总条数:', totalMessages, '新增条数:', newMessagesCount, '间隔:', summaryInterval);

  if (typeof window.requestMemoryAI === 'function') {
    try {
      var result = await window.requestMemoryAI(prompt);
      if (result && result.trim()) {
        var data = loadLongTermMemory(roleName);
        if (!data.memories) data.memories = [];
        data.memories.push({
          id: generateId(),
          text: result.trim(),
          createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
        });
        data.lastSummarizedTurn = totalMessages;
        data.totalTurns = (data.totalTurns || 0) + 1;
        saveLongTermMemory(roleName, data);
        renderMemoryLibrary(roleName);
        updateMemoryCount(roleName);
        console.log('[长期记忆] 自动总结完成');
      }
    } catch (e) {
      console.error('[长期记忆] 自动总结失败:', e);
      data.lastSummarizedTurn = totalMessages;
      saveLongTermMemory(roleName, data);
    }
  }
}

// ========== 精炼记忆 ==========
async function refineMemories(roleName, ids) {
  if (!roleName || !ids || ids.length === 0) {
    if (typeof showToast === 'function') showToast('提示', '请先选择要精炼的记忆', 'warning');
    return;
  }

  var data = loadLongTermMemory(roleName);
  var selected = data.memories.filter(function(m) { return ids.indexOf(m.id) !== -1; });
  if (selected.length === 0) {
    if (typeof showToast === 'function') showToast('提示', '选中的记忆不存在', 'warning');
    return;
  }

  var combinedText = selected.map(function(m) { return m.text; }).join('\n\n---\n\n');
  var currentTime = getTimeDescription();

  var prompt = '我是一个人，我的名字是「' + roleName + '」（AI），现在要精炼我与用户的对话记忆。\n' +
    '「我」= ' + roleName + '（AI），「用户」= 与我对话的人。\n' +
    '请根据以下多条记忆，提取3到5个核心事件，每条不超过120字。\n\n' +
    '多条记忆：\n' + combinedText + '\n\n' +
    '请用以下格式输出（只输出一条完整总结）：\n' +
    '"' + currentTime + '，我和（用户人设里的名字）……"';

  if (typeof showToast === 'function') showToast('精炼中', '正在合并精炼记忆...', 'info');

  if (typeof window.requestMemoryAI === 'function') {
    try {
      var result = await window.requestMemoryAI(prompt);
      if (result && result.trim()) {
        data.memories = data.memories.filter(function(m) { return ids.indexOf(m.id) === -1; });
        data.memories.push({
          id: generateId(),
          text: result.trim(),
          createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
        });
        saveLongTermMemory(roleName, data);
        renderMemoryLibrary(roleName);
        updateMemoryCount(roleName);
        exitMultiSelectMode();
        if (typeof showToast === 'function') showToast('精炼完成', '已合并为一条记忆', 'success');
      } else {
        if (typeof showToast === 'function') showToast('精炼失败', '未生成有效结果，请重试', 'error');
      }
    } catch (e) {
      console.error('精炼失败', e);
      if (typeof showToast === 'function') showToast('精炼失败', e.message || '未知错误', 'error');
    }
  } else {
    if (typeof showToast === 'function') showToast('提示', '需要配置记忆API才能使用精炼功能', 'warning');
  }
}

// ========== 导出TXT ==========
function exportMemoriesToTxt(roleName, ids) {
  if (!roleName || !ids || ids.length === 0) {
    if (typeof showToast === 'function') showToast('提示', '请先选择要导出的记忆', 'warning');
    return;
  }

  var data = loadLongTermMemory(roleName);
  var selected = data.memories.filter(function(m) { return ids.indexOf(m.id) !== -1; });
  if (selected.length === 0) {
    if (typeof showToast === 'function') showToast('提示', '选中的记忆不存在', 'warning');
    return;
  }

  var content = '=== 长期记忆导出 ===\n';
  content += '角色: ' + roleName + '\n';
  content += '导出时间: ' + new Date().toLocaleString('zh-CN', { hour12: false }) + '\n';
  content += '共 ' + selected.length + ' 条记忆\n';
  content += '='.repeat(40) + '\n\n';

  var groups = groupMemoriesByDate(selected);
  var keys = Object.keys(groups);
  for (var i = 0; i < keys.length; i++) {
    content += '📅 ' + keys[i] + '\n';
    var mems = groups[keys[i]];
    for (var j = 0; j < mems.length; j++) {
      content += '  ' + (j + 1) + '. ' + mems[j].text + '\n';
    }
    content += '\n';
  }

  var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = '记忆导出_' + roleName + '_' + new Date().toISOString().slice(0, 10) + '.txt';
  a.click();
  URL.revokeObjectURL(url);

  if (typeof showToast === 'function') showToast('导出成功', '已导出 ' + selected.length + ' 条记忆', 'success');
}

// ========== 多选模式状态 ==========
var isMultiSelectMode = false;
var selectedMemoryIds = [];

function enterMultiSelectMode() {
  isMultiSelectMode = true;
  selectedMemoryIds = [];
  document.getElementById('memoryToolbar').style.display = 'flex';
  document.getElementById('memoryLibrarySelectBtn').textContent = '取消';
  document.getElementById('memoryLibraryClearBtn').style.display = 'block';
  updateMemorySelectionUI();
  renderMemoryLibrary(currentChat);
}

function exitMultiSelectMode() {
  isMultiSelectMode = false;
  selectedMemoryIds = [];
  document.getElementById('memoryToolbar').style.display = 'none';
  document.getElementById('memoryLibrarySelectBtn').textContent = '选择';
  document.getElementById('memoryLibraryClearBtn').style.display = 'none';
  updateMemorySelectionUI();
  renderMemoryLibrary(currentChat);
}

function toggleMemorySelection(id) {
  var idx = selectedMemoryIds.indexOf(id);
  if (idx === -1) {
    selectedMemoryIds.push(id);
  } else {
    selectedMemoryIds.splice(idx, 1);
  }
  updateMemorySelectionUI();
  renderMemoryLibrary(currentChat);
}

function selectAllMemories() {
  var data = loadLongTermMemory(currentChat);
  var memories = data.memories || [];
  selectedMemoryIds = memories.map(function(m) { return m.id; });
  updateMemorySelectionUI();
  renderMemoryLibrary(currentChat);
}

function deselectAllMemories() {
  selectedMemoryIds = [];
  updateMemorySelectionUI();
  renderMemoryLibrary(currentChat);
}

function updateMemorySelectionUI() {
  var countEl = document.getElementById('memorySelectedCount');
  if (countEl) countEl.textContent = '已选 ' + selectedMemoryIds.length + ' 条';
}

// ========== 渲染记忆库页面 ==========
function renderMemoryLibrary(roleName) {
  var container = document.getElementById('memoryLibraryContent');
  if (!container) return;

  if (!roleName) {
    container.innerHTML = '<div class="memory-library-empty">请先进入一个聊天</div>';
    return;
  }

  var data = loadLongTermMemory(roleName);
  var memories = data.memories || [];

  if (memories.length === 0) {
    container.innerHTML = '<div class="memory-library-empty">暂无长期记忆<br><span>点击「手动总结」生成记忆</span></div>';
    return;
  }

  var groups = groupMemoriesByDate(memories);
  var keys = Object.keys(groups);

  var html = '';
  for (var i = 0; i < keys.length; i++) {
    var dateStr = keys[i];
    var items = groups[dateStr];
    var isOpen = true;

    html += '<div class="memory-date-group">';
    html += '<div class="memory-date-header" data-date="' + dateStr + '">';
    html += '  <span class="date-label">📅 ' + dateStr + '</span>';
    html += '  <span style="display:flex; align-items:center; gap:8px;">';
    html += '    <span class="date-count">' + items.length + ' 条</span>';
    html += '    <span class="date-arrow open">▼</span>';
    html += '  </span>';
    html += '</div>';
    html += '<div class="memory-date-body open">';

    for (var j = 0; j < items.length; j++) {
      var mem = items[j];
      var isSelected = selectedMemoryIds.indexOf(mem.id) !== -1;
      var selectClass = isMultiSelectMode ? 'select-mode' : '';
      var checkedAttr = isSelected ? 'checked' : '';

      html += '<div class="memory-item ' + selectClass + '" data-id="' + mem.id + '">';
      html += '  <input type="checkbox" class="memory-checkbox" ' + checkedAttr + ' data-id="' + mem.id + '">';
      html += '  <span class="memory-text">' + mem.text + '</span>';
      html += '  <input type="text" class="memory-edit-input" value="' + mem.text + '">';
      html += '  <div class="memory-actions">';
      html += '    <button class="memory-edit-btn" data-id="' + mem.id + '">✏️</button>';
      html += '    <button class="memory-save-btn" data-id="' + mem.id + '">💾</button>';
      html += '    <button class="memory-cancel-btn" data-id="' + mem.id + '">✕</button>';
      html += '  </div>';
      html += '  <span class="long-press-hint">长按删除</span>';
      html += '</div>';
    }

    html += '</div></div>';
  }

  container.innerHTML = html;

  // ===== 绑定事件 =====

  container.querySelectorAll('.memory-date-header').forEach(function(header) {
    header.addEventListener('click', function() {
      var body = this.nextElementSibling;
      var arrow = this.querySelector('.date-arrow');
      if (body) {
        body.classList.toggle('open');
        if (arrow) arrow.classList.toggle('open');
      }
    });
  });

  container.querySelectorAll('.memory-checkbox').forEach(function(cb) {
    if (isMultiSelectMode) {
      cb.style.display = 'block';
    } else {
      cb.style.display = 'none';
    }
    cb.addEventListener('change', function() {
      var id = this.dataset.id;
      if (this.checked) {
        if (selectedMemoryIds.indexOf(id) === -1) selectedMemoryIds.push(id);
      } else {
        var idx = selectedMemoryIds.indexOf(id);
        if (idx !== -1) selectedMemoryIds.splice(idx, 1);
      }
      updateMemorySelectionUI();
    });
  });

  container.querySelectorAll('.memory-edit-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var item = this.closest('.memory-item');
      var text = item.querySelector('.memory-text');
      var input = item.querySelector('.memory-edit-input');
      var saveBtn = item.querySelector('.memory-save-btn');
      var cancelBtn = item.querySelector('.memory-cancel-btn');
      var editBtn = this;
      if (text) text.style.display = 'none';
      if (input) {
        input.classList.add('show');
        input.style.width = '100%';
        input.focus();
      }
      if (saveBtn) saveBtn.classList.add('show');
      if (cancelBtn) cancelBtn.classList.add('show');
      if (editBtn) editBtn.style.display = 'none';
    });
  });

  container.querySelectorAll('.memory-save-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var item = this.closest('.memory-item');
      var id = item.dataset.id;
      var text = item.querySelector('.memory-text');
      var input = item.querySelector('.memory-edit-input');
      var saveBtn = this;
      var cancelBtn = item.querySelector('.memory-cancel-btn');
      var editBtn = item.querySelector('.memory-edit-btn');
      if (input && input.value.trim()) {
        updateMemoryText(roleName, id, input.value.trim());
        if (text) {
          text.textContent = input.value.trim();
          text.style.display = 'block';
        }
        if (input) input.classList.remove('show');
        if (saveBtn) saveBtn.classList.remove('show');
        if (cancelBtn) cancelBtn.classList.remove('show');
        if (editBtn) editBtn.style.display = 'inline-block';
        if (typeof showToast === 'function') showToast('已更新', '记忆已更新', 'success');
      } else {
        if (typeof showToast === 'function') showToast('提示', '记忆内容不能为空', 'warning');
      }
    });
  });

  container.querySelectorAll('.memory-cancel-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var item = this.closest('.memory-item');
      var text = item.querySelector('.memory-text');
      var input = item.querySelector('.memory-edit-input');
      var saveBtn = item.querySelector('.memory-save-btn');
      var cancelBtn = this;
      var editBtn = item.querySelector('.memory-edit-btn');
      if (text) text.style.display = 'block';
      if (input) input.classList.remove('show');
      if (saveBtn) saveBtn.classList.remove('show');
      if (cancelBtn) cancelBtn.classList.remove('show');
      if (editBtn) editBtn.style.display = 'inline-block';
    });
  });

  if (!isMultiSelectMode) {
    var longPressTimer = null;
    container.querySelectorAll('.memory-item').forEach(function(item) {
      item.addEventListener('mousedown', function(e) {
        longPressTimer = setTimeout(function() {
          var id = item.dataset.id;
          if (confirm('确认删除这条记忆吗？')) {
            deleteMemoryById(roleName, id);
            renderMemoryLibrary(roleName);
            updateMemoryCount(roleName);
            if (typeof showToast === 'function') showToast('已删除', '记忆已删除', 'info');
          }
        }, 600);
      });
      item.addEventListener('mouseup', function() { clearTimeout(longPressTimer); });
      item.addEventListener('mouseleave', function() { clearTimeout(longPressTimer); });
      item.addEventListener('touchstart', function(e) {
        longPressTimer = setTimeout(function() {
          var id = item.dataset.id;
          if (confirm('确认删除这条记忆吗？')) {
            deleteMemoryById(roleName, id);
            renderMemoryLibrary(roleName);
            updateMemoryCount(roleName);
            if (typeof showToast === 'function') showToast('已删除', '记忆已删除', 'info');
          }
        }, 600);
      });
      item.addEventListener('touchend', function() { clearTimeout(longPressTimer); });
      item.addEventListener('touchmove', function() { clearTimeout(longPressTimer); });
    });
  }
}

// ========== 更新记忆数量 ==========
function updateMemoryCount(roleName) {
  var el = document.getElementById('memoryCount');
  if (!el) return;
  if (!roleName) { el.textContent = '0 条'; return; }
  var count = getMemoryCount(roleName);
  el.textContent = count + ' 条';
}

// ========== 初始化长期记忆功能 ==========
function initLongTermMemory() {
  console.log('[长期记忆] 初始化...');

  var memorySettingsItem = document.getElementById('memorySettingsItem');
  var memoryLibraryPage = document.getElementById('memoryLibraryPage');
  var chatSettingsPage = document.getElementById('chatSettingsPage');
  var statusBarTime = document.getElementById('statusBarTime');

  if (memorySettingsItem && memoryLibraryPage) {
    memorySettingsItem.addEventListener('click', function() {
      if (!currentChat) {
        if (typeof showToast === 'function') showToast('提示', '请先进入一个聊天', 'warning');
        return;
      }
      if (chatSettingsPage) chatSettingsPage.style.display = 'none';
      memoryLibraryPage.style.display = 'flex';
      if (statusBarTime) statusBarTime.textContent = '记忆库';
      if (isMultiSelectMode) exitMultiSelectMode();
      renderMemoryLibrary(currentChat);
    });
  }

  var memoryLibraryBackBtn = document.getElementById('memoryLibraryBackBtn');
  if (memoryLibraryBackBtn) {
    memoryLibraryBackBtn.addEventListener('click', function() {
      if (memoryLibraryPage) memoryLibraryPage.style.display = 'none';
      if (chatSettingsPage) chatSettingsPage.style.display = 'flex';
      if (statusBarTime) statusBarTime.textContent = '聊天设置';
      if (isMultiSelectMode) exitMultiSelectMode();
      updateMemoryCount(currentChat);
    });
  }

  var selectBtn = document.getElementById('memoryLibrarySelectBtn');
  if (selectBtn) {
    selectBtn.addEventListener('click', function() {
      if (isMultiSelectMode) {
        exitMultiSelectMode();
      } else {
        enterMultiSelectMode();
      }
    });
  }

  document.getElementById('memorySelectAllBtn')?.addEventListener('click', selectAllMemories);
  document.getElementById('memoryDeselectAllBtn')?.addEventListener('click', deselectAllMemories);

  document.getElementById('memoryExportTxtBtn')?.addEventListener('click', function() {
    if (!currentChat) return;
    exportMemoriesToTxt(currentChat, selectedMemoryIds);
  });

  // ⭐ 新增：导入TXT按钮
  var importTxtBtn = document.getElementById('memoryImportTxtBtn');
  if (importTxtBtn) {
    importTxtBtn.addEventListener('click', function() {
      if (!currentChat) {
        if (typeof showToast === 'function') showToast('提示', '请先进入一个聊天', 'warning');
        return;
      }
      importMemoriesFromTxt(currentChat);
    });
  }

  document.getElementById('memoryRefineBtn')?.addEventListener('click', function() {
    if (!currentChat) return;
    refineMemories(currentChat, selectedMemoryIds);
  });

  document.getElementById('memoryBatchDeleteBtn')?.addEventListener('click', function() {
    if (!currentChat || selectedMemoryIds.length === 0) {
      if (typeof showToast === 'function') showToast('提示', '请先选择要删除的记忆', 'warning');
      return;
    }
    if (confirm('确认删除选中的 ' + selectedMemoryIds.length + ' 条记忆吗？')) {
      deleteMemoriesByIds(currentChat, selectedMemoryIds);
      selectedMemoryIds = [];
      updateMemorySelectionUI();
      renderMemoryLibrary(currentChat);
      updateMemoryCount(currentChat);
      if (typeof showToast === 'function') showToast('已删除', '已删除选中的记忆', 'success');
    }
  });

  var clearBtn = document.getElementById('memoryLibraryClearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      if (!currentChat) return;
      if (confirm('确认清空「' + currentChat + '」的所有长期记忆吗？')) {
        clearMemories(currentChat);
        if (isMultiSelectMode) exitMultiSelectMode();
        renderMemoryLibrary(currentChat);
        updateMemoryCount(currentChat);
        if (typeof showToast === 'function') showToast('已清空', '长期记忆已清空', 'info');
      }
    });
  }

  var autoToggle = document.getElementById('autoSummaryToggle');
  if (autoToggle) {
    autoToggle.checked = getAutoSummaryEnabled();
    autoToggle.addEventListener('change', function() {
      saveAutoSummaryEnabled(this.checked);
      if (typeof showToast === 'function') showToast(this.checked ? '已开启' : '已关闭', '自动总结已' + (this.checked ? '开启' : '关闭'), 'success');
    });
  }

  var intervalInput = document.getElementById('summaryIntervalInput');
  if (intervalInput) {
    var savedInterval = localStorage.getItem('summaryInterval');
    if (savedInterval) {
      var val = parseInt(savedInterval);
      if (val >= 2 && val <= 500) intervalInput.value = val;
    }
    intervalInput.addEventListener('change', function() {
      var val = parseInt(this.value);
      if (val >= 2 && val <= 500) {
        saveSummaryInterval(val);
        if (typeof showToast === 'function') showToast('已保存', '自动总结间隔已更新为 ' + val + ' 条', 'success');
      } else {
        this.value = getSummaryInterval();
        if (typeof showToast === 'function') showToast('提示', '请输入 2-500 之间的数字', 'warning');
      }
    });
  }

  document.getElementById('manualSummarizeBtn')?.addEventListener('click', function() {
    if (!currentChat) {
      if (typeof showToast === 'function') showToast('提示', '请先进入一个聊天', 'warning');
      return;
    }
    manualSummarize(currentChat);
  });

  if (currentChat) updateMemoryCount(currentChat);
  console.log('[长期记忆] ✅ 初始化完成');
}

// ========== 在 longterm.js 末尾添加 ==========

// ========== 获取所有长期记忆（供备份使用） ==========
function getAllMemories() {
  try {
    var saved = localStorage.getItem('longTermMemory');
    if (saved) {
      var data = JSON.parse(saved);
      var result = {};
      for (var roleName in data) {
        if (data.hasOwnProperty(roleName)) {
          var roleData = data[roleName];
          if (roleData.memories && Array.isArray(roleData.memories)) {
            result[roleName] = roleData.memories.map(function(m) {
              return m.text;
            });
          }
        }
      }
      return result;
    }
  } catch (e) {
    console.error('获取所有长期记忆失败', e);
  }
  return {};
}

// ========== 导入长期记忆（供恢复使用） ==========
function importMemories(memoriesData) {
  if (!memoriesData || typeof memoriesData !== 'object') {
    console.warn('[导入记忆] 数据无效');
    return;
  }

  try {
    var allData = {};
    
    // 检查是否已有数据
    var saved = localStorage.getItem('longTermMemory');
    if (saved) {
      try {
        allData = JSON.parse(saved);
      } catch (e) {}
    }

    for (var roleName in memoriesData) {
      if (memoriesData.hasOwnProperty(roleName)) {
        var mems = memoriesData[roleName];
        
        // 如果传入的是字符串数组（备份格式），转换为完整格式
        if (Array.isArray(mems) && mems.length > 0) {
          if (typeof mems[0] === 'string') {
            // 备份格式：字符串数组
            if (!allData[roleName]) {
              allData[roleName] = { memories: [], lastSummarizedTurn: 0, totalTurns: 0 };
            }
            for (var i = 0; i < mems.length; i++) {
              allData[roleName].memories.push({
                id: generateId(),
                text: mems[i],
                createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
              });
            }
            allData[roleName].totalTurns = (allData[roleName].totalTurns || 0) + mems.length;
          } else if (typeof mems[0] === 'object') {
            // 完整格式：对象数组
            if (!allData[roleName]) {
              allData[roleName] = { memories: [], lastSummarizedTurn: 0, totalTurns: 0 };
            }
            for (var j = 0; j < mems.length; j++) {
              var mem = mems[j];
              allData[roleName].memories.push({
                id: mem.id || generateId(),
                text: mem.text || mem.content || String(mem),
                createdAt: mem.createdAt || new Date().toLocaleString('zh-CN', { hour12: false })
              });
            }
            allData[roleName].totalTurns = (allData[roleName].totalTurns || 0) + mems.length;
          }
        }
      }
    }

    localStorage.setItem('longTermMemory', JSON.stringify(allData));
    console.log('[导入记忆] 成功导入记忆');
    
    // 刷新UI
    if (currentChat) {
      renderMemoryLibrary(currentChat);
      updateMemoryCount(currentChat);
    }
  } catch (error) {
    console.error('[导入记忆] 失败:', error);
  }
}

// ========== 删除角色的所有记忆（供删除联系人使用） ==========
function deleteMemories(roleName) {
  if (!roleName) return;
  
  try {
    var saved = localStorage.getItem('longTermMemory');
    if (saved) {
      var allData = JSON.parse(saved);
      if (allData[roleName]) {
        delete allData[roleName];
        localStorage.setItem('longTermMemory', JSON.stringify(allData));
        console.log('[删除记忆] 已删除 ' + roleName + ' 的所有记忆');
        
        // 刷新UI
        if (currentChat === roleName) {
          renderMemoryLibrary(roleName);
          updateMemoryCount(roleName);
        }
      }
    }
  } catch (e) {
    console.error('[删除记忆] 失败:', e);
  }
}

// ========== 清空所有记忆（供清空所有聊天使用） ==========
function clearAllMemories() {
  try {
    localStorage.removeItem('longTermMemory');
    console.log('[清空记忆] 已清空所有长期记忆');
    
    if (currentChat) {
      renderMemoryLibrary(currentChat);
      updateMemoryCount(currentChat);
    }
  } catch (e) {
    console.error('[清空记忆] 失败:', e);
  }
}

// ========== 从TXT导入记忆 ==========
function importMemoriesFromTxt(roleName) {
  if (!roleName) {
    if (typeof showToast === 'function') showToast('提示', '请先进入一个聊天', 'warning');
    return;
  }

  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt';
  input.onchange = function(e) {
    var file = e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(event) {
      try {
        var text = event.target.result;
        var lines = text.split('\n').filter(function(line) { 
          return line.trim() && !line.startsWith('===') && !line.startsWith('📅') && !line.startsWith('导出时间') && !line.startsWith('角色') && !line.startsWith('共') && !line.startsWith('=');
        });

        // 清理行，去除序号和前缀
        var cleanedLines = [];
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].trim();
          // 去除序号如 "1. " 或 "  1. "
          line = line.replace(/^\s*\d+\.\s*/, '');
          // 去除纯数字序号行
          if (/^\d+$/.test(line)) continue;
          if (line) {
            cleanedLines.push(line);
          }
        }

        if (cleanedLines.length === 0) {
          if (typeof showToast === 'function') showToast('导入失败', '未找到有效的记忆内容', 'error');
          return;
        }

        if (!confirm('将导入 ' + cleanedLines.length + ' 条记忆到「' + roleName + '」，确认继续吗？')) {
          return;
        }

        var data = loadLongTermMemory(roleName);
        if (!data.memories) data.memories = [];

        for (var j = 0; j < cleanedLines.length; j++) {
          data.memories.push({
            id: generateId(),
            text: cleanedLines[j],
            createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
          });
        }
        data.totalTurns = (data.totalTurns || 0) + cleanedLines.length;
        saveLongTermMemory(roleName, data);

        renderMemoryLibrary(roleName);
        updateMemoryCount(roleName);

        if (typeof showToast === 'function') {
          showToast('导入成功', '已导入 ' + cleanedLines.length + ' 条记忆', 'success');
        }
      } catch (error) {
        console.error('导入TXT失败:', error);
        if (typeof showToast === 'function') showToast('导入失败', '文件格式无效', 'error');
      }
    };
    reader.onerror = function() {
      if (typeof showToast === 'function') showToast('读取失败', '无法读取文件', 'error');
    };
    reader.readAsText(file);
    input.value = '';
  };
  input.click();
}

// ========== 暴露全局 ==========
window.getAllMemories = getAllMemories;
window.importMemories = importMemories;
window.deleteMemories = deleteMemories;
window.clearAllMemories = clearAllMemories;
window.importMemoriesFromTxt = importMemoriesFromTxt;
window.loadLongTermMemory = loadLongTermMemory;
window.saveLongTermMemory = saveLongTermMemory;
window.getMemories = getMemories;
window.addMemory = addMemory;
window.deleteMemoryById = deleteMemoryById;
window.deleteMemoriesByIds = deleteMemoriesByIds;
window.clearMemories = clearMemories;
window.getMemoryCount = getMemoryCount;
window.updateMemoryText = updateMemoryText;
window.manualSummarize = manualSummarize;
window.autoSummarize = autoSummarize;
window.refineMemories = refineMemories;
window.exportMemoriesToTxt = exportMemoriesToTxt;
window.renderMemoryLibrary = renderMemoryLibrary;
window.updateMemoryCount = updateMemoryCount;
window.initLongTermMemory = initLongTermMemory;
window.getSummaryInterval = getSummaryInterval;
window.saveSummaryInterval = saveSummaryInterval;
window.getAutoSummaryEnabled = getAutoSummaryEnabled;
window.saveAutoSummaryEnabled = saveAutoSummaryEnabled;
window.enterMultiSelectMode = enterMultiSelectMode;
window.exitMultiSelectMode = exitMultiSelectMode;
window.toggleMemorySelection = toggleMemorySelection;
window.selectAllMemories = selectAllMemories;
window.deselectAllMemories = deselectAllMemories;