// ========== 美化设置功能 ==========
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
// ========== 默认CSS ==========
var DEFAULT_THEME_CSS = 'body {\n  background: #f2f2f7;\n  color: #000000;\n}\n\n.screen {\n  background: #f2f2f7;\n}\n\n.chat-detail-page {\n  background: #ffffff;\n}';

var DEFAULT_BUBBLE_CSS = '.message.sent {\n  background: #007AFF;\n  color: white;\n  border-bottom-right-radius: 4px;\n}\n\n.message.received {\n  background: #e9e9ed;\n  color: #000000;\n  border-bottom-left-radius: 4px;\n}';

// ========== 加载美化设置 ==========
function loadBeautifySettings() {
  try {
    var saved = localStorage.getItem('beautifySettings');
    if (saved) {
      var data = JSON.parse(saved);
      if (data.themeCss) applyThemeCss(data.themeCss);
      if (data.bubbleCss) applyBubbleCss(data.bubbleCss);
      if (data.fontUrl) applyFontUrl(data.fontUrl);
      return data;
    }
  } catch (e) {
    console.error('加载美化设置失败', e);
  }
  return null;
}

// ========== 保存美化设置 ==========
function saveBeautifySettings() {
  var themeCss = document.getElementById('themeCssInput');
  var bubbleCss = document.getElementById('bubbleCssInput');
  var fontUrl = document.getElementById('fontUrlInput');

  var data = {
    themeCss: themeCss ? themeCss.value : DEFAULT_THEME_CSS,
    bubbleCss: bubbleCss ? bubbleCss.value : DEFAULT_BUBBLE_CSS,
    fontUrl: fontUrl ? fontUrl.value.trim() : ''
  };

  localStorage.setItem('beautifySettings', JSON.stringify(data));
  return data;
}

// ========== 应用主题CSS ==========
function applyThemeCss(css) {
  var oldStyle = document.getElementById('customThemeStyle');
  if (oldStyle) oldStyle.remove();
  if (!css || css.trim() === '') return;
  var style = document.createElement('style');
  style.id = 'customThemeStyle';
  style.textContent = css;
  document.head.appendChild(style);
}

// ========== 应用气泡CSS ==========
function applyBubbleCss(css) {
  var oldStyle = document.getElementById('customBubbleStyle');
  if (oldStyle) oldStyle.remove();
  if (!css || css.trim() === '') return;
  var style = document.createElement('style');
  style.id = 'customBubbleStyle';
  style.textContent = css;
  document.head.appendChild(style);
}

// ========== 应用字体URL ==========
function applyFontUrl(url) {
  var oldLink = document.getElementById('customFontLink');
  if (oldLink) oldLink.remove();
  if (!url || url.trim() === '') return;
  var link = document.createElement('link');
  link.id = 'customFontLink';
  link.rel = 'stylesheet';
  link.href = url.trim();
  document.head.appendChild(link);
}

// ========== 加载设置到UI ==========
function loadBeautifyToUI() {
  try {
    var saved = localStorage.getItem('beautifySettings');
    if (saved) {
      var data = JSON.parse(saved);
      var themeCss = document.getElementById('themeCssInput');
      var bubbleCss = document.getElementById('bubbleCssInput');
      var fontUrl = document.getElementById('fontUrlInput');
      if (themeCss) themeCss.value = data.themeCss || DEFAULT_THEME_CSS;
      if (bubbleCss) bubbleCss.value = data.bubbleCss || DEFAULT_BUBBLE_CSS;
      if (fontUrl) fontUrl.value = data.fontUrl || '';
    } else {
      var themeCss2 = document.getElementById('themeCssInput');
      var bubbleCss2 = document.getElementById('bubbleCssInput');
      if (themeCss2) themeCss2.value = DEFAULT_THEME_CSS;
      if (bubbleCss2) bubbleCss2.value = DEFAULT_BUBBLE_CSS;
    }
  } catch (e) {
    console.error('加载美化设置到UI失败', e);
  }
  loadBeautifyPresetList();
}

// ========== 重置美化设置 ==========
function resetBeautifySettings() {
  var themeCss = document.getElementById('themeCssInput');
  var bubbleCss = document.getElementById('bubbleCssInput');
  var fontUrl = document.getElementById('fontUrlInput');
  if (themeCss) themeCss.value = DEFAULT_THEME_CSS;
  if (bubbleCss) bubbleCss.value = DEFAULT_BUBBLE_CSS;
  if (fontUrl) fontUrl.value = '';
  applyThemeCss(DEFAULT_THEME_CSS);
  applyBubbleCss(DEFAULT_BUBBLE_CSS);
  applyFontUrl('');
  var oldTheme = document.getElementById('customThemeStyle');
  if (oldTheme) oldTheme.remove();
  var oldBubble = document.getElementById('customBubbleStyle');
  if (oldBubble) oldBubble.remove();
  var oldFont = document.getElementById('customFontLink');
  if (oldFont) oldFont.remove();
  saveBeautifySettings();
  if (typeof showToast === 'function') {
    showToast('已重置', '美化设置已恢复默认', 'info');
  }
}

// ========== 预设管理 ==========
function saveBeautifyPreset() {
  var nameInput = document.getElementById('beautifyPresetNameInput');
  var themeCss = document.getElementById('themeCssInput');
  var bubbleCss = document.getElementById('bubbleCssInput');
  var fontUrl = document.getElementById('fontUrlInput');

  if (!nameInput || !nameInput.value.trim()) {
    if (typeof showToast === 'function') {
      showToast('提示', '请输入预设名称', 'warning');
    }
    nameInput.focus();
    return;
  }

  var name = nameInput.value.trim();
  var presets = JSON.parse(localStorage.getItem('beautifyPresets') || '{}');
  presets[name] = {
    themeCss: themeCss ? themeCss.value : DEFAULT_THEME_CSS,
    bubbleCss: bubbleCss ? bubbleCss.value : DEFAULT_BUBBLE_CSS,
    fontUrl: fontUrl ? fontUrl.value.trim() : '',
    createdAt: new Date().toLocaleString()
  };
  localStorage.setItem('beautifyPresets', JSON.stringify(presets));
  loadBeautifyPresetList();
  if (typeof showToast === 'function') {
    showToast('保存成功', '预设「' + name + '」已保存', 'success');
  }
}

function loadBeautifyPresetList() {
  var select = document.getElementById('beautifyPresetSelect');
  if (!select) return;
  var presets = JSON.parse(localStorage.getItem('beautifyPresets') || '{}');
  var names = Object.keys(presets);
  select.innerHTML = '<option value="">-- 选择预设 --</option>';
  for (var i = 0; i < names.length; i++) {
    var option = document.createElement('option');
    option.value = names[i];
    option.textContent = names[i];
    select.appendChild(option);
  }
}

function loadBeautifyPreset() {
  var select = document.getElementById('beautifyPresetSelect');
  if (!select || !select.value) {
    if (typeof showToast === 'function') {
      showToast('提示', '请先选择一个预设', 'warning');
    }
    return;
  }
  var name = select.value;
  var presets = JSON.parse(localStorage.getItem('beautifyPresets') || '{}');
  var preset = presets[name];
  if (!preset) {
    if (typeof showToast === 'function') {
      showToast('错误', '预设不存在', 'error');
    }
    return;
  }
  var themeCss = document.getElementById('themeCssInput');
  var bubbleCss = document.getElementById('bubbleCssInput');
  var fontUrl = document.getElementById('fontUrlInput');
  if (themeCss) themeCss.value = preset.themeCss || DEFAULT_THEME_CSS;
  if (bubbleCss) bubbleCss.value = preset.bubbleCss || DEFAULT_BUBBLE_CSS;
  if (fontUrl) fontUrl.value = preset.fontUrl || '';
  applyThemeCss(preset.themeCss || DEFAULT_THEME_CSS);
  applyBubbleCss(preset.bubbleCss || DEFAULT_BUBBLE_CSS);
  applyFontUrl(preset.fontUrl || '');
  saveBeautifySettings();
  if (typeof showToast === 'function') {
    showToast('加载成功', '已加载预设「' + name + '」', 'success');
  }
}

function deleteBeautifyPreset() {
  var select = document.getElementById('beautifyPresetSelect');
  if (!select || !select.value) {
    if (typeof showToast === 'function') {
      showToast('提示', '请先选择一个预设', 'warning');
    }
    return;
  }
  var name = select.value;
  if (!confirm('确认删除预设「' + name + '」吗？')) return;
  var presets = JSON.parse(localStorage.getItem('beautifyPresets') || '{}');
  delete presets[name];
  localStorage.setItem('beautifyPresets', JSON.stringify(presets));
  loadBeautifyPresetList();
  if (typeof showToast === 'function') {
    showToast('已删除', '预设「' + name + '」已删除', 'info');
  }
}


// ============================================================
//  桌面壁纸功能
// ============================================================

function loadWallpaper() {
  try {
    var saved = localStorage.getItem('wallpaper');
    if (saved) {
      var data = JSON.parse(saved);
      if (data.url) {
        applyWallpaper(data.url);
        return data.url;
      }
    }
  } catch (e) {}
  return null;
}

function saveWallpaper(url) {
  localStorage.setItem('wallpaper', JSON.stringify({ url: url }));
}

function applyWallpaper(url) {
  var homeContent = document.getElementById('homeContent');
  var screen = document.querySelector('.screen');
  if (!url) {
    if (homeContent) homeContent.style.backgroundImage = '';
    if (screen) screen.style.backgroundImage = '';
    return;
  }
  if (homeContent) {
    homeContent.style.backgroundImage = 'url(' + url + ')';
    homeContent.style.backgroundSize = 'cover';
    homeContent.style.backgroundPosition = 'center';
  }
  if (screen) {
    screen.style.backgroundImage = 'url(' + url + ')';
    screen.style.backgroundSize = 'cover';
    screen.style.backgroundPosition = 'center';
  }
  var timeWidget = document.querySelector('.time-widget');
  if (timeWidget) timeWidget.style.background = 'transparent';
}

function removeWallpaper() {
  localStorage.removeItem('wallpaper');
  var homeContent = document.getElementById('homeContent');
  var screen = document.querySelector('.screen');
  if (homeContent) {
    homeContent.style.backgroundImage = '';
    homeContent.style.backgroundSize = '';
    homeContent.style.backgroundPosition = '';
  }
  if (screen) {
    screen.style.backgroundImage = '';
    screen.style.backgroundSize = '';
    screen.style.backgroundPosition = '';
  }
  var preview = document.getElementById('wallpaperPreview');
  var wrap = document.getElementById('wallpaperPreviewWrap');
  if (preview) {
    preview.style.backgroundImage = '';
    preview.style.backgroundSize = '';
    preview.style.backgroundPosition = '';
  }
  if (wrap) wrap.style.display = 'none';
  var urlInput = document.getElementById('wallpaperUrlInput');
  if (urlInput) urlInput.value = '';
  if (typeof showToast === 'function') {
    showToast('已移除', '壁纸已移除', 'info');
  }
}

function initWallpaperFeature() {
  console.log('[壁纸] 初始化...');
  loadWallpaper();

  var fileBtn = document.getElementById('wallpaperFileBtn');
  var fileInput = document.getElementById('wallpaperFileInput');
  var urlInput = document.getElementById('wallpaperUrlInput');
  var applyBtn = document.getElementById('applyWallpaperBtn');
  var resetBtn = document.getElementById('wallpaperResetBtn');

  if (fileBtn && fileInput) {
    fileBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('[壁纸] 点击选择文件');
      fileInput.click();
    });
    fileInput.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) {
        console.log('[壁纸] 未选择文件');
        return;
      }
      console.log('[壁纸] 选择了文件:', file.name);
      var reader = new FileReader();
      reader.onload = function(event) {
        var dataUrl = event.target.result;
        console.log('[壁纸] 文件读取完成，长度:', dataUrl.length);
        if (typeof compressImage === 'function') {
          compressImage(dataUrl, 1200, function(compressed) {
            applyWallpaper(compressed);
            saveWallpaper(compressed);
            var preview = document.getElementById('wallpaperPreview');
            var wrap = document.getElementById('wallpaperPreviewWrap');
            if (preview) {
              preview.style.backgroundImage = 'url(' + compressed + ')';
              preview.style.backgroundSize = 'cover';
              preview.style.backgroundPosition = 'center';
            }
            if (wrap) wrap.style.display = 'block';
            if (urlInput) urlInput.value = compressed;
            if (typeof showToast === 'function') {
              showToast('已应用', '桌面壁纸已更新', 'success');
            }
          });
        } else {
          applyWallpaper(dataUrl);
          saveWallpaper(dataUrl);
          var preview = document.getElementById('wallpaperPreview');
          var wrap = document.getElementById('wallpaperPreviewWrap');
          if (preview) {
            preview.style.backgroundImage = 'url(' + dataUrl + ')';
            preview.style.backgroundSize = 'cover';
            preview.style.backgroundPosition = 'center';
          }
          if (wrap) wrap.style.display = 'block';
          if (urlInput) urlInput.value = dataUrl;
          if (typeof showToast === 'function') {
            showToast('已应用', '桌面壁纸已更新', 'success');
          }
        }
      };
      reader.onerror = function() {
        console.error('[壁纸] 文件读取失败');
        if (typeof showToast === 'function') {
          showToast('错误', '图片读取失败', 'error');
        }
      };
      reader.readAsDataURL(file);
      // 重置input，允许重复选择同一文件
      fileInput.value = '';
    });
  } else {
    console.warn('[壁纸] 找不到 wallpaperFileBtn 或 wallpaperFileInput');
  }

  if (applyBtn && urlInput) {
    applyBtn.addEventListener('click', function() {
      var url = urlInput.value.trim();
      if (url) {
        console.log('[壁纸] 应用URL:', url.substring(0, 50));
        applyWallpaper(url);
        saveWallpaper(url);
        var preview = document.getElementById('wallpaperPreview');
        var wrap = document.getElementById('wallpaperPreviewWrap');
        if (preview) {
          preview.style.backgroundImage = 'url(' + url + ')';
          preview.style.backgroundSize = 'cover';
          preview.style.backgroundPosition = 'center';
        }
        if (wrap) wrap.style.display = 'block';
        if (typeof showToast === 'function') {
          showToast('已应用', '桌面壁纸已更新', 'success');
        }
      } else {
        if (typeof showToast === 'function') {
          showToast('提示', '请先选择图片或输入URL', 'warning');
        }
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      console.log('[壁纸] 移除壁纸');
      removeWallpaper();
    });
  }

  // 如果已有壁纸，显示预览
  var saved = localStorage.getItem('wallpaper');
  if (saved) {
    try {
      var data = JSON.parse(saved);
      if (data.url) {
        var preview = document.getElementById('wallpaperPreview');
        var wrap = document.getElementById('wallpaperPreviewWrap');
        if (preview) {
          preview.style.backgroundImage = 'url(' + data.url + ')';
          preview.style.backgroundSize = 'cover';
          preview.style.backgroundPosition = 'center';
        }
        if (wrap) wrap.style.display = 'block';
        if (urlInput) urlInput.value = data.url;
      }
    } catch (e) {
      console.error('[壁纸] 加载预览失败', e);
    }
  }
  console.log('[壁纸] ✅ 初始化完成');
}


// ============================================================
//  图标管理功能
// ============================================================

var currentIconTarget = '';

function loadIconSettings() {
  try {
    var saved = localStorage.getItem('customIcons');
    if (saved) {
      var data = JSON.parse(saved);
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          applyIconToApp(key, data[key]);
        }
      }
      return data;
    }
  } catch (e) {}
  return {};
}

function saveIconSettings(iconData) {
  localStorage.setItem('customIcons', JSON.stringify(iconData));
}

function applyIconToApp(appName, url) {
  var appIcons = document.querySelectorAll('.app-item[data-app="' + appName + '"] .app-icon');
  for (var i = 0; i < appIcons.length; i++) {
    var el = appIcons[i];
    if (url) {
      el.style.backgroundImage = 'url(' + url + ')';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.textContent = '';
    } else {
      el.style.backgroundImage = '';
      el.style.backgroundSize = '';
      el.style.backgroundPosition = '';
      var defaultIcons = {
        'messages': '💬',
        'music': '🎵',
        'settings': '⚙️',
        'notes': '📝',
        'beautify': '🎨'
      };
      el.textContent = defaultIcons[appName] || '📱';
      var colors = {
        'messages': 'linear-gradient(135deg, #32d74b, #1e7b33)',
        'music': 'linear-gradient(135deg, #fc3c44, #9b1b23)',
        'settings': 'linear-gradient(135deg, #8e8e93, #4a4a4f)',
        'notes': 'linear-gradient(135deg, #ffd60a, #b08600)',
        'beautify': 'linear-gradient(135deg, #ff6b9d, #c44d7a)'
      };
      el.style.background = colors[appName] || '#8e8e93';
    }
  }
}

function initIconFeature() {
  console.log('[图标管理] 初始化...');
  loadIconSettings();

  var modal = document.getElementById('iconChangeModal');
  var closeBtn = document.getElementById('iconChangeCloseBtn');
  var fileBtn = document.getElementById('iconFileBtn');
  var fileInput = document.getElementById('iconFileInput');
  var urlInput = document.getElementById('iconUrlInput');
  var applyBtn = document.getElementById('applyIconBtn');
  var resetBtn = document.getElementById('iconResetBtn');
  var preview = document.getElementById('iconPreview');
  var previewWrap = document.getElementById('iconPreviewWrap');
  var title = document.getElementById('iconChangeTitle');

  if (!modal) {
    console.warn('[图标管理] 找不到 iconChangeModal');
    return;
  }

  // 点击图标项打开弹窗
  var iconItems = document.querySelectorAll('.icon-manage-item');
  console.log('[图标管理] 找到 ' + iconItems.length + ' 个图标项');
  
  for (var i = 0; i < iconItems.length; i++) {
    (function(item) {
      item.addEventListener('click', function(e) {
        e.stopPropagation();
        var appName = this.dataset.icon;
        currentIconTarget = appName;
        var labelEl = this.querySelector('div:last-child');
        var label = labelEl ? labelEl.textContent : appName;
        if (title) title.textContent = '更换「' + label + '」图标';
        if (modal) modal.style.display = 'block';
        if (urlInput) urlInput.value = '';
        if (previewWrap) previewWrap.style.display = 'none';
        if (preview) preview.style.backgroundImage = '';

        // 加载当前图标的URL
        var saved = localStorage.getItem('customIcons');
        if (saved) {
          try {
            var data = JSON.parse(saved);
            if (data[appName]) {
              if (urlInput) urlInput.value = data[appName];
              if (preview) {
                preview.style.backgroundImage = 'url(' + data[appName] + ')';
                preview.style.backgroundSize = 'cover';
                preview.style.backgroundPosition = 'center';
              }
              if (previewWrap) previewWrap.style.display = 'block';
            }
          } catch (e) {}
        }
        console.log('[图标管理] 打开弹窗，当前图标:', appName);
      });
    })(iconItems[i]);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      if (modal) modal.style.display = 'none';
      console.log('[图标管理] 关闭弹窗');
    });
  }

  // 点击弹窗外关闭
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  if (fileBtn && fileInput) {
    fileBtn.addEventListener('click', function() {
      console.log('[图标管理] 点击选择文件');
      fileInput.click();
    });
    fileInput.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;
      console.log('[图标管理] 选择了文件:', file.name);
      var reader = new FileReader();
      reader.onload = function(event) {
        var dataUrl = event.target.result;
        if (typeof compressImage === 'function') {
          compressImage(dataUrl, 200, function(compressed) {
            if (urlInput) urlInput.value = compressed;
            if (preview) {
              preview.style.backgroundImage = 'url(' + compressed + ')';
              preview.style.backgroundSize = 'cover';
              preview.style.backgroundPosition = 'center';
            }
            if (previewWrap) previewWrap.style.display = 'block';
            console.log('[图标管理] 图片已压缩');
          });
        } else {
          if (urlInput) urlInput.value = dataUrl;
          if (preview) {
            preview.style.backgroundImage = 'url(' + dataUrl + ')';
            preview.style.backgroundSize = 'cover';
            preview.style.backgroundPosition = 'center';
          }
          if (previewWrap) previewWrap.style.display = 'block';
        }
      };
      reader.onerror = function() {
        console.error('[图标管理] 文件读取失败');
      };
      reader.readAsDataURL(file);
      fileInput.value = '';
    });
  } else {
    console.warn('[图标管理] 找不到 iconFileBtn 或 iconFileInput');
  }

  if (applyBtn && urlInput) {
    applyBtn.addEventListener('click', function() {
      var url = urlInput.value.trim();
      if (url && currentIconTarget) {
        console.log('[图标管理] 应用图标到:', currentIconTarget);
        applyIconToApp(currentIconTarget, url);
        var saved = localStorage.getItem('customIcons');
        var data = saved ? JSON.parse(saved) : {};
        data[currentIconTarget] = url;
        saveIconSettings(data);
        if (typeof showToast === 'function') {
          showToast('已更新', '图标已更换', 'success');
        }
        if (modal) modal.style.display = 'none';
      } else {
        if (typeof showToast === 'function') {
          showToast('提示', '请先选择图片或输入URL', 'warning');
        }
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      if (currentIconTarget) {
        console.log('[图标管理] 恢复默认图标:', currentIconTarget);
        applyIconToApp(currentIconTarget, null);
        var saved = localStorage.getItem('customIcons');
        var data = saved ? JSON.parse(saved) : {};
        delete data[currentIconTarget];
        saveIconSettings(data);
        if (urlInput) urlInput.value = '';
        if (previewWrap) previewWrap.style.display = 'none';
        if (preview) preview.style.backgroundImage = '';
        if (typeof showToast === 'function') {
          showToast('已恢复', '图标已恢复默认', 'info');
        }
        if (modal) modal.style.display = 'none';
      }
    });
  }

  console.log('[图标管理] ✅ 初始化完成');
}


// ============================================================
//  世界书功能
// ============================================================

// 加载世界书列表
function loadWorldbooks() {
  try {
    var saved = localStorage.getItem('worldbooks');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('加载世界书失败', e);
  }
  return [];
}

// 保存世界书列表
function saveWorldbooks(worldbooks) {
  localStorage.setItem('worldbooks', JSON.stringify(worldbooks));
}

// 获取挂载关系
function loadMounts() {
  try {
    var saved = localStorage.getItem('worldbookMounts');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('加载挂载关系失败', e);
  }
  return {};
}

// 保存挂载关系
function saveMounts(mounts) {
  localStorage.setItem('worldbookMounts', JSON.stringify(mounts));
}

// 获取当前角色挂载的世界书ID列表
function getMountedWorldbookIds(roleName) {
  var mounts = loadMounts();
  return mounts[roleName] || [];
}

// 获取当前角色挂载的世界书完整对象列表
function getMountedWorldbooks(roleName) {
  var allBooks = loadWorldbooks();
  var ids = getMountedWorldbookIds(roleName);
  return allBooks.filter(function(book) {
    return ids.indexOf(book.id) !== -1;
  });
}

// 检查某个世界书是否已挂载到某角色
function isWorldbookMounted(bookId, roleName) {
  var ids = getMountedWorldbookIds(roleName);
  return ids.indexOf(bookId) !== -1;
}

// 切换挂载状态
function toggleWorldbookMount(bookId, roleName) {
  var mounts = loadMounts();
  if (!mounts[roleName]) {
    mounts[roleName] = [];
  }
  var idx = mounts[roleName].indexOf(bookId);
  if (idx === -1) {
    mounts[roleName].push(bookId);
  } else {
    mounts[roleName].splice(idx, 1);
  }
  saveMounts(mounts);
  return mounts[roleName];
}

// 渲染世界书列表（美化设置中）
function renderWorldbookList() {
  var container = document.getElementById('worldbookList');
  if (!container) return;

  var books = loadWorldbooks();

  if (books.length === 0) {
    container.innerHTML = '<div style="text-align:center; font-size:12px; color:rgba(0,0,0,0.3); padding:10px;">暂无世界书，点击上方创建</div>';
    return;
  }

  var html = '';
  for (var i = 0; i < books.length; i++) {
    var book = books[i];
    var isMounted = currentChat ? isWorldbookMounted(book.id, currentChat) : false;
    var mountStatus = isMounted ? '✅ 已挂载' : '☐ 未挂载';
    var mountBtnText = isMounted ? '卸载' : '挂载';
    var mountBtnColor = isMounted ? '#ff9f0a' : '#07c160';

    html += `
      <div class="worldbook-item" style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:#f7f7f7; border-radius:8px; margin-bottom:6px; border-left:3px solid #07c160;">
        <div style="flex:1; min-width:0;">
          <div style="font-weight:500; font-size:14px; color:#1a1a1a;">${book.name}</div>
          <div style="font-size:12px; color:rgba(0,0,0,0.4); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${book.description || '无描述'}</div>
          <div style="font-size:10px; color:rgba(0,0,0,0.25); margin-top:2px;">${mountStatus}</div>
        </div>
        <div style="display:flex; gap:4px; flex-shrink:0;">
          <button class="worldbook-mount-btn" data-id="${book.id}" style="padding:4px 8px; border:none; border-radius:4px; font-size:11px; cursor:pointer; background:${mountBtnColor}; color:white;">${mountBtnText}</button>
          <button class="worldbook-edit-btn" data-id="${book.id}" style="padding:4px 8px; border:none; border-radius:4px; font-size:11px; cursor:pointer; background:#007AFF; color:white;">编辑</button>
          <button class="worldbook-del-btn" data-id="${book.id}" style="padding:4px 8px; border:none; border-radius:4px; font-size:11px; cursor:pointer; background:#ff375f; color:white;">删除</button>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  // 绑定事件
  container.querySelectorAll('.worldbook-mount-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var id = this.dataset.id;
      if (!currentChat) {
        if (typeof showToast === 'function') {
          showToast('提示', '请先进入一个聊天', 'warning');
        }
        return;
      }
      var roleName = currentChat;
      var result = toggleWorldbookMount(id, roleName);
      var isNowMounted = result.indexOf(id) !== -1;
      this.textContent = isNowMounted ? '卸载' : '挂载';
      this.style.background = isNowMounted ? '#ff9f0a' : '#07c160';
      // 刷新挂载列表
      renderWorldbookList();
      renderMountWorldbookList();
      updateMountCount();
      if (typeof showToast === 'function') {
        showToast(isNowMounted ? '已挂载' : '已卸载', isNowMounted ? '世界书已挂载到当前角色' : '世界书已从当前角色卸载', 'success');
      }
    });
  });

  container.querySelectorAll('.worldbook-edit-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var id = this.dataset.id;
      editWorldbook(id);
    });
  });

  container.querySelectorAll('.worldbook-del-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var id = this.dataset.id;
      deleteWorldbook(id);
    });
  });
}

// 创建世界书
function createWorldbook() {
  var nameInput = document.getElementById('newWorldbookName');
  var name = nameInput ? nameInput.value.trim() : '';

  if (!name) {
    if (typeof showToast === 'function') {
      showToast('提示', '请输入世界书名称', 'warning');
    }
    if (nameInput) nameInput.focus();
    return;
  }

  showWorldbookDialog(null, name);
  if (nameInput) nameInput.value = '';
}

// 编辑世界书
function editWorldbook(id) {
  var books = loadWorldbooks();
  var book = null;
  for (var i = 0; i < books.length; i++) {
    if (books[i].id === id) {
      book = books[i];
      break;
    }
  }
  if (!book) {
    if (typeof showToast === 'function') {
      showToast('错误', '世界书不存在', 'error');
    }
    return;
  }
  showWorldbookDialog(book);
}

// 显示世界书编辑弹窗
function showWorldbookDialog(book, presetName) {
  var overlay = document.createElement('div');
  overlay.className = 'alert-overlay';

  var isEdit = !!book;
  var title = isEdit ? '编辑世界书' : '新建世界书';
  var nameVal = isEdit ? book.name : (presetName || '');
  var descVal = isEdit ? (book.description || '') : '';
  var contentVal = isEdit ? (book.content || '') : '';

  var dialog = document.createElement('div');
  dialog.className = 'alert-dialog';
  dialog.style.width = '340px';
  dialog.style.maxHeight = '80vh';
  dialog.style.overflowY = 'auto';
  dialog.innerHTML = `
    <div class="alert-title">${title}</div>
    <div style="padding: 0 16px 16px 16px;">
      <input type="text" id="wbNameInput" class="alert-input" placeholder="世界书名称" value="${nameVal}" style="margin-top:0;">
      <input type="text" id="wbDescInput" class="alert-input" placeholder="简短描述（选填）" value="${descVal}" style="margin-top:8px;">
      <textarea id="wbContentInput" class="alert-input" placeholder="世界书详细内容（世界观、背景、规则等）" style="min-height:120px; resize:vertical; margin-top:8px; font-family:inherit;">${contentVal}</textarea>
    </div>
    <div class="alert-buttons">
      <button class="alert-btn cancel" id="wbCancelBtn">取消</button>
      <button class="alert-btn confirm" id="wbConfirmBtn">${isEdit ? '保存' : '创建'}</button>
    </div>
  `;

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  function close() {
    overlay.remove();
  }

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) close();
  });

  document.getElementById('wbCancelBtn').addEventListener('click', close);

  document.getElementById('wbConfirmBtn').addEventListener('click', function() {
    var name = document.getElementById('wbNameInput').value.trim();
    var description = document.getElementById('wbDescInput').value.trim();
    var content = document.getElementById('wbContentInput').value.trim();

    if (!name) {
      if (typeof showToast === 'function') {
        showToast('提示', '请输入世界书名称', 'warning');
      }
      return;
    }

    if (!content) {
      if (typeof showToast === 'function') {
        showToast('提示', '请输入世界书详细内容', 'warning');
      }
      return;
    }

    var books = loadWorldbooks();

    if (isEdit) {
      for (var i = 0; i < books.length; i++) {
        if (books[i].id === book.id) {
          books[i].name = name;
          books[i].description = description;
          books[i].content = content;
          books[i].updatedAt = new Date().toLocaleString();
          break;
        }
      }
      if (typeof showToast === 'function') {
        showToast('已更新', '世界书已更新', 'success');
      }
    } else {
      var newBook = {
        id: 'wb_' + Date.now(),
        name: name,
        description: description,
        content: content,
        createdAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString()
      };
      books.push(newBook);
      if (typeof showToast === 'function') {
        showToast('已创建', '世界书「' + name + '」已创建', 'success');
      }
    }

    saveWorldbooks(books);
    renderWorldbookList();
    renderMountWorldbookList();
    updateMountCount();
    close();
  });

  document.getElementById('wbNameInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      document.getElementById('wbConfirmBtn').click();
    }
  });
}

// 删除世界书
function deleteWorldbook(id) {
  if (!confirm('确认删除这个世界书吗？将同时解除所有角色的挂载。')) return;

  var books = loadWorldbooks();
  var newBooks = [];
  for (var i = 0; i < books.length; i++) {
    if (books[i].id !== id) {
      newBooks.push(books[i]);
    }
  }
  saveWorldbooks(newBooks);

  var mounts = loadMounts();
  for (var role in mounts) {
    if (mounts.hasOwnProperty(role)) {
      var idx = mounts[role].indexOf(id);
      if (idx !== -1) {
        mounts[role].splice(idx, 1);
        if (mounts[role].length === 0) {
          delete mounts[role];
        }
      }
    }
  }
  saveMounts(mounts);

  renderWorldbookList();
  renderMountWorldbookList();
  updateMountCount();

  if (typeof showToast === 'function') {
    showToast('已删除', '世界书已删除', 'info');
  }
}

// 渲染挂载世界书列表（聊天设置中）
function renderMountWorldbookList() {
  var container = document.getElementById('mountWorldbookList');
  if (!container) return;

  if (!currentChat) {
    container.innerHTML = '<div style="font-size:12px; color:rgba(0,0,0,0.3);">请先进入一个聊天</div>';
    return;
  }

  var allBooks = loadWorldbooks();
  var mountedIds = getMountedWorldbookIds(currentChat);

  if (allBooks.length === 0) {
    container.innerHTML = '<div style="font-size:12px; color:rgba(0,0,0,0.3);">暂无世界书，请在美化设置中创建</div>';
    return;
  }

  var html = '';
  for (var i = 0; i < allBooks.length; i++) {
    var book = allBooks[i];
    var isMounted = mountedIds.indexOf(book.id) !== -1;
    html += `
      <div style="display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid rgba(0,0,0,0.04);">
        <input type="checkbox" class="mount-checkbox" data-id="${book.id}" ${isMounted ? 'checked' : ''} style="width:18px; height:18px; accent-color:#07c160; cursor:pointer;">
        <span style="font-size:13px; color:#1a1a1a; flex:1;">${book.name}</span>
        <span style="font-size:10px; color:rgba(0,0,0,0.25);">${book.description || ''}</span>
      </div>
    `;
  }

  container.innerHTML = html;

  container.querySelectorAll('.mount-checkbox').forEach(function(cb) {
    cb.addEventListener('change', function() {
      var id = this.dataset.id;
      if (!currentChat) return;
      var result = toggleWorldbookMount(id, currentChat);
      renderWorldbookList();
      updateMountCount();
      if (typeof showToast === 'function') {
        showToast(result.indexOf(id) !== -1 ? '已挂载' : '已卸载', result.indexOf(id) !== -1 ? '世界书已挂载到当前角色' : '世界书已从当前角色卸载', 'success');
      }
    });
  });
}

// 更新挂载数量
function updateMountCount() {
  var el = document.getElementById('mountCount');
  if (!el || !currentChat) {
    if (el) el.textContent = '已挂载 0 个';
    return;
  }
  var ids = getMountedWorldbookIds(currentChat);
  el.textContent = '已挂载 ' + ids.length + ' 个';
}


// ========== 初始化美化设置 ==========
function initBeautifySettings() {
  console.log('[美化设置] 开始初始化...');

  var beautifyPage = document.getElementById('beautifySettingsPage');
  var settingsPage = document.getElementById('settingsPage');
  var homeContent = document.getElementById('homeContent');
  var statusBarTime = document.getElementById('statusBarTime');

  if (!beautifyPage) {
    console.error('[美化设置] 找不到 beautifySettingsPage 元素！');
    return;
  }
  console.log('[美化设置] 找到 beautifySettingsPage');

  // ===== 美化设置返回按钮 =====
  var beautifyBackBtn = document.getElementById('beautifyBackBtn');
  if (beautifyBackBtn) {
    var newBackBtn = beautifyBackBtn.cloneNode(true);
    beautifyBackBtn.parentNode.replaceChild(newBackBtn, beautifyBackBtn);
    
    newBackBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('[美化设置] 返回按钮被点击');
      if (beautifyPage) beautifyPage.style.display = 'none';

      if (settingsPage && settingsPage.style.display === 'flex') {
        if (settingsPage) settingsPage.style.display = 'flex';
        if (statusBarTime) statusBarTime.textContent = '设置';
      } else {
        if (homeContent) homeContent.style.display = 'flex';
        if (typeof showDock === 'function') showDock();
        if (statusBarTime) statusBarTime.textContent = '9:41';
      }
    });
    console.log('[美化设置] 返回按钮已绑定');
  } else {
    console.warn('[美化设置] 找不到 beautifyBackBtn');
  }

  // ===== 美化设置保存按钮 =====
  var beautifySaveBtn = document.getElementById('beautifySaveBtn');
  if (beautifySaveBtn) {
    var newSaveBtn = beautifySaveBtn.cloneNode(true);
    beautifySaveBtn.parentNode.replaceChild(newSaveBtn, beautifySaveBtn);
    
    newSaveBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('[美化设置] 保存按钮被点击');
      var settings = saveBeautifySettings();
      applyThemeCss(settings.themeCss);
      applyBubbleCss(settings.bubbleCss);
      applyFontUrl(settings.fontUrl);
      if (typeof showToast === 'function') {
        showToast('保存成功', '美化设置已应用', 'success');
      }

      if (beautifyPage) beautifyPage.style.display = 'none';

      if (settingsPage && settingsPage.style.display === 'flex') {
        if (settingsPage) settingsPage.style.display = 'flex';
        if (statusBarTime) statusBarTime.textContent = '设置';
      } else {
        if (homeContent) homeContent.style.display = 'flex';
        if (typeof showDock === 'function') showDock();
        if (statusBarTime) statusBarTime.textContent = '9:41';
      }
    });
    console.log('[美化设置] 保存按钮已绑定');
  } else {
    console.warn('[美化设置] 找不到 beautifySaveBtn');
  }

  // ===== 应用主题CSS =====
  var applyThemeBtn = document.getElementById('applyThemeCssBtn');
  if (applyThemeBtn) {
    applyThemeBtn.addEventListener('click', function() {
      var css = document.getElementById('themeCssInput');
      if (css) {
        applyThemeCss(css.value);
        if (typeof showToast === 'function') {
          showToast('已应用', '主题CSS已应用', 'success');
        }
      }
    });
  }

  // ===== 恢复默认主题CSS =====
  var resetThemeBtn = document.getElementById('resetThemeCssBtn');
  if (resetThemeBtn) {
    resetThemeBtn.addEventListener('click', function() {
      var css = document.getElementById('themeCssInput');
      if (css) {
        css.value = DEFAULT_THEME_CSS;
        applyThemeCss(DEFAULT_THEME_CSS);
        if (typeof showToast === 'function') {
          showToast('已恢复', '主题CSS已恢复默认', 'info');
        }
      }
    });
  }

  // ===== 应用气泡CSS =====
  var applyBubbleBtn = document.getElementById('applyBubbleCssBtn');
  if (applyBubbleBtn) {
    applyBubbleBtn.addEventListener('click', function() {
      var css = document.getElementById('bubbleCssInput');
      if (css) {
        applyBubbleCss(css.value);
        if (typeof showToast === 'function') {
          showToast('已应用', '气泡CSS已应用', 'success');
        }
      }
    });
  }

  // ===== 恢复默认气泡CSS =====
  var resetBubbleBtn = document.getElementById('resetBubbleCssBtn');
  if (resetBubbleBtn) {
    resetBubbleBtn.addEventListener('click', function() {
      var css = document.getElementById('bubbleCssInput');
      if (css) {
        css.value = DEFAULT_BUBBLE_CSS;
        applyBubbleCss(DEFAULT_BUBBLE_CSS);
        if (typeof showToast === 'function') {
          showToast('已恢复', '气泡CSS已恢复默认', 'info');
        }
      }
    });
  }

  // ===== 应用字体 =====
  var applyFontBtn = document.getElementById('applyFontBtn');
  if (applyFontBtn) {
    applyFontBtn.addEventListener('click', function() {
      var url = document.getElementById('fontUrlInput');
      if (url) {
        applyFontUrl(url.value.trim());
        if (typeof showToast === 'function') {
          showToast('已应用', '字体已应用', 'success');
        }
      }
    });
  }

  // ===== 恢复默认字体 =====
  var resetFontBtn = document.getElementById('resetFontBtn');
  if (resetFontBtn) {
    resetFontBtn.addEventListener('click', function() {
      var url = document.getElementById('fontUrlInput');
      if (url) {
        url.value = '';
        applyFontUrl('');
        if (typeof showToast === 'function') {
          showToast('已恢复', '字体已恢复默认', 'info');
        }
      }
    });
  }

  // ===== 预设操作 =====
  var savePresetBtn = document.getElementById('saveBeautifyPresetBtn');
  if (savePresetBtn) {
    savePresetBtn.addEventListener('click', saveBeautifyPreset);
  }

  var loadPresetBtn = document.getElementById('loadBeautifyPresetBtn');
  if (loadPresetBtn) {
    loadPresetBtn.addEventListener('click', loadBeautifyPreset);
  }

  var deletePresetBtn = document.getElementById('deleteBeautifyPresetBtn');
  if (deletePresetBtn) {
    deletePresetBtn.addEventListener('click', deleteBeautifyPreset);
  }

  // ===== 回车键触发应用 =====
  var fontUrlInput = document.getElementById('fontUrlInput');
  if (fontUrlInput) {
    fontUrlInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        applyFontUrl(this.value.trim());
        if (typeof showToast === 'function') {
          showToast('已应用', '字体已应用', 'success');
        }
      }
    });
  }

  // ===== 预设名称回车保存 =====
  var presetNameInput = document.getElementById('beautifyPresetNameInput');
  if (presetNameInput) {
    presetNameInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        saveBeautifyPreset();
      }
    });
  }

  loadBeautifyPresetList();
  loadBeautifyToUI();

  // ===== 初始化壁纸功能 =====
  initWallpaperFeature();

  // ===== 初始化图标管理 =====
  initIconFeature();

  // ===== 世界书管理 =====
  var createBtn = document.getElementById('createWorldbookBtn');
  if (createBtn) {
    createBtn.addEventListener('click', createWorldbook);
  }

  var newNameInput = document.getElementById('newWorldbookName');
  if (newNameInput) {
    newNameInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        createWorldbook();
      }
    });
  }

  renderWorldbookList();

  console.log('[美化设置] ✅ 初始化完成！');
}
// ========== 在 beautify.js 末尾添加 ==========

// ========== 获取所有世界书（供备份使用） ==========
function getAllWorldbooks() {
  try {
    var saved = localStorage.getItem('worldbooks');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('获取世界书失败', e);
  }
  return [];
}

// ========== 导入世界书（供恢复使用） ==========
function importWorldbooks(worldbooks) {
  if (!worldbooks || typeof worldbooks !== 'object') {
    console.warn('[导入世界书] 数据无效');
    return;
  }
  
  try {
    // 如果传入的是数组，直接保存
    if (Array.isArray(worldbooks)) {
      saveWorldbooks(worldbooks);
      console.log('[导入世界书] 成功导入 ' + worldbooks.length + ' 个世界书');
      return;
    }
    
    // 如果传入的是对象（兼容旧格式），转换为数组
    if (typeof worldbooks === 'object') {
      var books = [];
      for (var key in worldbooks) {
        if (worldbooks.hasOwnProperty(key)) {
          var book = worldbooks[key];
          // 确保有 id
          if (!book.id) {
            book.id = 'wb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
          }
          books.push(book);
        }
      }
      saveWorldbooks(books);
      console.log('[导入世界书] 成功导入 ' + books.length + ' 个世界书');
    }
  } catch (error) {
    console.error('[导入世界书] 失败:', error);
  }
}

// ========== 暴露全局 ==========
window.getAllWorldbooks = getAllWorldbooks;
window.importWorldbooks = importWorldbooks;
window.loadBeautifySettings = loadBeautifySettings;
window.saveBeautifySettings = saveBeautifySettings;
window.applyThemeCss = applyThemeCss;
window.applyBubbleCss = applyBubbleCss;
window.applyFontUrl = applyFontUrl;
window.initBeautifySettings = initBeautifySettings;
window.loadBeautifyToUI = loadBeautifyToUI;
window.resetBeautifySettings = resetBeautifySettings;
window.saveBeautifyPreset = saveBeautifyPreset;
window.loadBeautifyPresetList = loadBeautifyPresetList;
window.loadBeautifyPreset = loadBeautifyPreset;
window.deleteBeautifyPreset = deleteBeautifyPreset;
window.loadWallpaper = loadWallpaper;
window.saveWallpaper = saveWallpaper;
window.applyWallpaper = applyWallpaper;
window.removeWallpaper = removeWallpaper;
window.initWallpaperFeature = initWallpaperFeature;
window.loadIconSettings = loadIconSettings;
window.saveIconSettings = saveIconSettings;
window.applyIconToApp = applyIconToApp;
window.initIconFeature = initIconFeature;
window.loadWorldbooks = loadWorldbooks;
window.saveWorldbooks = saveWorldbooks;
window.loadMounts = loadMounts;
window.saveMounts = saveMounts;
window.getMountedWorldbookIds = getMountedWorldbookIds;
window.getMountedWorldbooks = getMountedWorldbooks;
window.isWorldbookMounted = isWorldbookMounted;
window.toggleWorldbookMount = toggleWorldbookMount;
window.renderWorldbookList = renderWorldbookList;
window.renderMountWorldbookList = renderMountWorldbookList;
window.updateMountCount = updateMountCount;
window.createWorldbook = createWorldbook;
window.editWorldbook = editWorldbook;
window.deleteWorldbook = deleteWorldbook;