/**
 * 核心大模型异步接口层
 * @param {Array} historyChatLogs - 注入最近的聊天历史记录
 * @param {Object} currentConfig - 传入当下的 API 密钥及环境参数
 */
async function fetchAIResponseFromServer(historyChatLogs, currentConfig) {
    if(!currentConfig.apiKey || !currentConfig.apiBase || !currentConfig.apiModel) {
        return {
            status: "api-error",
            text: "【⚠️未配置API】请点击右上角[设置]，完整填写接口 Base 网址、密钥(API Key)以及模型名称。"
        };
    }

    // 组装上下文消息载荷
    let messages = [];
    if(currentConfig.systemPrompt) {
        messages.push({ role: "system", content: currentConfig.systemPrompt });
    }
    
    // 自动抓取最近 15 轮对话记忆送入云端
    const contextLogs = historyChatLogs.slice(-15);
    contextLogs.forEach(log => {
        messages.push({
            role: log.role === 'user' ? 'user' : 'assistant',
            content: log.text
        });
    });

    try {
        const urlEndpoint = `${currentConfig.apiBase.replace(/\/$/, "")}/chat/completions`;
        const response = await fetch(urlEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${currentConfig.apiKey}`
            },
            body: JSON.stringify({
                model: currentConfig.apiModel,
                messages: messages,
                temperature: 0.7
            })
        });

        // 精准捕获非 200 HTTP 报错状态
        if (!response.ok) {
            const errorPayload = await response.json().catch(() => ({}));
            const detailedMsg = errorPayload.error?.message || "接口未提供具体报错缘由。";
            
            let advice = "请检查您的模型名称、余额是否充足或账户是否被封禁。";
            if (response.status === 401) advice = "您的 API 密钥（API Key）可能输入有误或已失效。";
            if (response.status === 429) advice = "高频并发超限，或您的 Token 账户余额已耗尽。";
            if (response.status === 400) advice = "请求体格式存在缺陷（如选错了模型，或系统提示词规则冲突）。";

            return {
                status: "api-error",
                text: `⚠️ API 接口通讯异常 [HTTP 状态码: ${response.status}]\n详细错误: ${detailedMsg}\n排查建议: ${advice}`
            };
        }

        const data = await response.json();
        return {
            status: "success",
            text: data.choices[0].message.content.trim()
        };
        
    } catch (error) {
        console.error(error);
        return {
            status: "api-error",
            text: `⚠️ 浏览器无法与接口主机建立连接。\n可能原因: 1. API Base URL 填写错误；2. 本地网络存在阻断；3. 接口提供方未允许跨域访问(CORS限制)。`
        };
    }
}
