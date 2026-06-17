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
    // 移除之前绑定的所有事件，防止重复绑定
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

  console.log('[美化设置] ✅ 初始化完成！');
}

// ========== 暴露全局 ==========
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