const msgBox = document.getElementById('msgBox');
const txtInput = document.getElementById('txtInput');
const btnSend = document.getElementById('btnSend');
const iosDesktop = document.getElementById('iosDesktop');
const chatAppContainer = document.getElementById('chatAppContainer');
const hiddenFileInput = document.getElementById('hiddenFileInput');

let config = JSON.parse(localStorage.getItem('chat_config_v9')) || {
    name: "Black",
    avatar: "",
    userName: "我",
    userAvatar: "",
    delay: 1.0,
    cssBubble: "",
    cssTheme: "",
    cssFont: "",
    soundUrl: "",
    apiBase: "",
    apiKey: "",
    apiModel: "",
    systemPrompt: "你是一个优雅、极富人性化的角色扮演AI助手。"
};

let presets = JSON.parse(localStorage.getItem('presets_db')) || { bubble: [], theme: [], font: [], sound: [] };
let history = JSON.parse(localStorage.getItem('chat_logs')) || [];
let currentUploadTarget = null;

function showIosDialog(title, msg, onConfirm = null) {
    document.getElementById('alertTitle').innerText = title;
    document.getElementById('alertMsg').innerText = msg;
    const footer = document.getElementById('alertFooter');
    footer.innerHTML = '';
    
    if(onConfirm) {
        const btnCancel = document.createElement('button');
        btnCancel.className = 'ios-alert-btn cancel';
        btnCancel.innerText = '取消';
        btnCancel.onclick = () => document.getElementById('iosAlert').classList.remove('show');
        
        const btnOk = document.createElement('button');
        btnOk.className = 'ios-alert-btn';
        btnOk.innerText = '确定';
        btnOk.onclick = () => { onConfirm(); document.getElementById('iosAlert').classList.remove('show'); };
        
        footer.appendChild(btnCancel);
        footer.appendChild(btnOk);
    } else {
        const btnOk = document.createElement('button');
        btnOk.className = 'ios-alert-btn';
        btnOk.innerText = '好';
        btnOk.onclick = () => document.getElementById('iosAlert').classList.remove('show');
        footer.appendChild(btnOk);
    }
    document.getElementById('iosAlert').classList.add('show');
}

function updateDesktopClock() {
    const now = new Date();
    document.getElementById('desktopTime').innerText = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
    document.getElementById('desktopDate').innerText = `${now.getMonth()+1}月${now.getDate()}日 ${['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][now.getDay()]}`;
}

function init() {
    updateDesktopClock();
    setInterval(updateDesktopClock, 30000);
    applyConfig();
    renderHistory();
    renderAllPresets();

    document.getElementById('appLaunchChat').onclick = () => {
        iosDesktop.classList.add('hidden');
        chatAppContainer.classList.add('active');
    };
    document.getElementById('btnBackToDesktop').onclick = () => {
        chatAppContainer.classList.remove('active');
        iosDesktop.classList.remove('hidden');
    };

    btnSend.onclick = sendMsg;
    document.getElementById('btnOpenSettings').onclick = () => document.getElementById('settingsPage').classList.add('open');
    document.getElementById('btnCloseSettings').onclick = () => document.getElementById('settingsPage').classList.remove('open');
    document.getElementById('btnSaveSettings').onclick = saveSettings;
    
    document.getElementById('speedSlider').oninput = (e) => document.getElementById('speedVal').innerText = e.target.value;
    document.getElementById('btnExportData').onclick = exportBackup;
    document.getElementById('btnImportData').onclick = importBackup;

    document.getElementById('aiAvatarUploader').onclick = () => { currentUploadTarget = 'ai'; hiddenFileInput.click(); };
    document.getElementById('userAvatarUploader').onclick = () => { currentUploadTarget = 'user'; hiddenFileInput.click(); };
    hiddenFileInput.onchange = handleLocalAvatarUpload;

    document.getElementById('btnTryClear').onclick = () => {
        showIosDialog('清空记录', '确定要删除本地所有的对话历史吗？该操作不可撤销。', clearChat);
    };

    txtInput.oninput = function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    };
}

function handleLocalAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        showIosDialog('提示', '图片体积偏大(限2MB内)，请更换或进行压缩。');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(evt) {
        const base64Data = evt.target.result;
        if (currentUploadTarget === 'ai') {
            document.getElementById('preViewAiAvatar').style.backgroundImage = `url(${base64Data})`;
            document.getElementById('preViewAiAvatar').setAttribute('data-base64', base64Data);
        } else if (currentUploadTarget === 'user') {
            document.getElementById('preViewUserAvatar').style.backgroundImage = `url(${base64Data})`;
            document.getElementById('preViewUserAvatar').setAttribute('data-base64', base64Data);
        }
    };
    reader.readAsDataURL(file);
}

function renderAllPresets() {
    renderPresetRow('bubble', 'cssBubble');
    renderPresetRow('theme', 'cssTheme');
    renderPresetRow('font', 'cssFont');
    renderPresetRow('sound', 'soundUrl');
}

function renderPresetRow(key, targetId) {
    const container = document.getElementById('pre' + key.charAt(0).toUpperCase() + key.slice(1));
    container.innerHTML = `<button class="btn-preset" style="color:#007aff" onclick="triggerSavePreset('${key}','${targetId}')">+ 存预设</button>`;
    presets[key].forEach((p, idx) => {
        const btn = document.createElement('button');
        btn.className = 'btn-preset';
        btn.innerText = p.name;
        btn.onclick = () => { document.getElementById(targetId).value = p.val; };
        btn.oncontextmenu = (e) => {
            e.preventDefault();
            showIosDialog('删除预设', `确定删除 [${p.name}] 吗？`, () => {
                presets[key].splice(idx, 1);
                localStorage.setItem('presets_db', JSON.stringify(presets));
                renderAllPresets();
            });
        };
        container.appendChild(btn);
    });
}

function triggerSavePreset(key, targetId) {
    const val = document.getElementById(targetId).value.trim();
    if(!val) return showIosDialog('提示', '请填入内容后再存为预设。');
    const name = prompt('起个样式别称:', '预设样式' + (presets[key].length + 1));
    if(name) {
        presets[key].push({name, val});
        localStorage.setItem('presets_db', JSON.stringify(presets));
        renderAllPresets();
    }
}

function saveSettings() {
    config.name = document.getElementById('cfgName').value.trim() || "AI 角色";
    config.userName = document.getElementById('cfgUserName').value.trim() || "我";
    config.delay = parseFloat(document.getElementById('speedSlider').value);
    config.cssBubble = document.getElementById('cssBubble').value;
    config.cssTheme = document.getElementById('cssTheme').value;
    config.cssFont = document.getElementById('cssFont').value;
    config.soundUrl = document.getElementById('soundUrl').value;
    
    config.apiBase = document.getElementById('apiBase').value.trim();
    config.apiKey = document.getElementById('apiKey').value.trim();
    config.apiModel = document.getElementById('apiModel').value.trim();
    config.systemPrompt = document.getElementById('systemPrompt').value;

    const aiBase64 = document.getElementById('preViewAiAvatar').getAttribute('data-base64');
    const userBase64 = document.getElementById('preViewUserAvatar').getAttribute('data-base64');
    if(aiBase64) config.avatar = aiBase64;
    if(userBase64) config.userAvatar = userBase64;

    localStorage.setItem('chat_config_v9', JSON.stringify(config));
    applyConfig();
    document.getElementById('settingsPage').classList.remove('open');
    msgBox.innerHTML = ''; renderHistory();
}

function applyConfig() {
    document.getElementById('uiTitle').innerText = config.name;
    document.getElementById('cfgName').value = config.name;
    document.getElementById('cfgUserName').value = config.userName || "我";
    document.getElementById('speedSlider').value = config.delay || 1.0;
    document.getElementById('speedVal').innerText = config.delay || 1.0;
    
    document.getElementById('cssBubble').value = config.cssBubble || "";
    document.getElementById('cssTheme').value = config.cssTheme || "";
    document.getElementById('cssFont').value = config.cssFont || "";
    document.getElementById('soundUrl').value = config.soundUrl || "";

    document.getElementById('apiBase').value = config.apiBase || "";
    document.getElementById('apiKey').value = config.apiKey || "";
    document.getElementById('apiModel').value = config.apiModel || "";
    document.getElementById('systemPrompt').value = config.systemPrompt || "";
    
    if(config.avatar) {
        document.getElementById('preViewAiAvatar').style.backgroundImage = `url(${config.avatar})`;
        document.getElementById('preViewAiAvatar').setAttribute('data-base64', config.avatar);
    }
    if(config.userAvatar) {
        document.getElementById('preViewUserAvatar').style.backgroundImage = `url(${config.userAvatar})`;
        document.getElementById('preViewUserAvatar').setAttribute('data-base64', config.userAvatar);
    }

    document.getElementById('customStyles').innerHTML = `
        ${config.cssTheme || ""}
        ${config.cssBubble || ""}
        ${config.cssFont || ""}
    `;
}

async function sendMsg() {
    const val = txtInput.value.trim();
    if(!val) return;

    const uMsg = { role: 'user', text: val, time: curTime() };
    history.push(uMsg);
    renderMsg(uMsg);
    txtInput.value = '';
    txtInput.style.height = 'auto';

    const typing = showTyping();
    
    // 跨物理文件调用：直接引用来自 api.js 引擎的方法
    const aiPayload = await fetchAIResponseFromServer(history, config);
    
    const realDelay = (config.delay * 1000);
    if(realDelay > 0) await new Promise(r => setTimeout(r, realDelay));
    
    typing.remove();

    if(config.soundUrl) {
        const audio = new Audio(config.soundUrl);
        audio.play().catch(() => {});
    }

    const aiMsg = { 
        role: 'ai', 
        text: aiPayload.text, 
        time: curTime(),
        isError: aiPayload.status === 'api-error'
    };
    history.push(aiMsg);
    renderMsg(aiMsg);
    localStorage.setItem('chat_logs', JSON.stringify(history));
}

function renderMsg(m) {
    const row = document.createElement('div');
    const isUser = m.role === 'user';
    row.className = `message-row ${m.role}`;
    
    const targetAvatar = isUser 
        ? (config.userAvatar ? `style="background-image:url(${config.userAvatar})"` : '')
        : (config.avatar ? `style="background-image:url(${config.avatar})"` : '');
        
    const targetName = isUser ? (config.userName || "我") : (config.name || "AI角色");
    let bubbleClass = `bubble ${m.role}${m.isError ? " api-error" : ""}`;
    
    row.innerHTML = `
        <div class="msg-avatar" ${targetAvatar}></div>
        <div class="bubble-container">
            <span class="msg-username">${targetName}</span>
            <div class="${bubbleClass}">
                <div class="text-body" style="white-space: pre-wrap;">${m.text}</div>
            </div>
            <div class="message-meta"><span>${m.time}</span></div>
        </div>`;
    msgBox.appendChild(row);
    msgBox.scrollTop = msgBox.scrollHeight;
}

function showTyping() {
    const div = document.createElement('div');
    div.className = 'message-row ai';
    const aiAvatar = config.avatar ? `style="background-image:url(${config.avatar})"` : '';
    div.innerHTML = `
        <div class="msg-avatar" ${aiAvatar}></div>
        <div class="bubble-container">
            <span class="msg-username">${config.name || "AI角色"}</span>
            <div class="typing-bubble">
                <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
            </div>
        </div>`;
    msgBox.appendChild(div);
    msgBox.scrollTop = msgBox.scrollHeight;
    return div;
}

function clearChat() { 
    history=[]; localStorage.setItem('chat_logs', JSON.stringify(history)); msgBox.innerHTML=''; 
    document.getElementById('settingsPage').classList.remove('open'); 
}

function exportBackup() {
    const backupData = {
        config: JSON.parse(localStorage.getItem('chat_config_v9')) || config,
        presets: JSON.parse(localStorage.getItem('presets_db')) || presets,
        history: JSON.parse(localStorage.getItem('chat_logs')) || history
    };
    const jsonString = JSON.stringify(backupData);
    const tempTexarea = document.createElement('textarea');
    tempTexarea.value = jsonString;
    document.body.appendChild(tempTexarea);
    tempTexarea.select();
    try {
        document.execCommand('copy');
        showIosDialog('导出完毕', '全量沙盒数据及 Base64 压缩头像已【自动复制到剪贴板】。请粘贴妥善保存。');
    } catch (err) {
        alert("请手动全选复制以下备份数据：\n\n" + jsonString);
    }
    document.body.removeChild(tempTexarea);
}

function importBackup() {
    const rawJson = prompt("请在此黏贴导入完整的备份字符串：");
    if (!rawJson) return;
    try {
        const parsed = JSON.parse(rawJson);
        if (parsed.config && parsed.history) {
            localStorage.setItem('chat_config_v9', JSON.stringify(parsed.config));
            localStorage.setItem('presets_db', JSON.stringify(parsed.presets || {bubble:[], theme:[], font:[], sound:[]}));
            localStorage.setItem('chat_logs', JSON.stringify(parsed.history));
            
            config = parsed.config;
            presets = parsed.presets || {bubble:[], theme:[], font:[], sound:[]};
            history = parsed.history;
            
            applyConfig();
            msgBox.innerHTML = ''; renderHistory(); renderAllPresets();
            showIosDialog('恢复就绪', '双向自定头像、外观及聊天记录已成功导入同步！');
        }
    } catch (e) {
        showIosDialog('解析失败', '输入数据已损坏，请确保复制的备份串完整。');
    }
}

function renderHistory() { history.forEach(renderMsg); }
function curTime() { return new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: false}); }

// 启动执行
init();
