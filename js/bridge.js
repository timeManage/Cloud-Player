// js/bridge.js

// 监听子页面的消息
window.addEventListener('message', async (event) => {
    // 解构消息内容
    const { type, config, id, key, value } = event.data;
    
    const iframe = document.getElementById('sandbox-frame');
    if (!iframe || !iframe.contentWindow) return;

    // --- 1. 处理网络请求 (Axios) ---
    if (type === 'AXIOS_REQUEST') {
        try {
            const response = await axios(config);
            iframe.contentWindow.postMessage({
                type: 'AXIOS_RESPONSE',
                id: id,
                success: true,
                data: response.data
            }, '*');
        } catch (error) {
            iframe.contentWindow.postMessage({
                type: 'AXIOS_RESPONSE',
                id: id,
                success: false,
                error: error.message || 'Network Error'
            }, '*');
        }
    }

    // --- 2. 处理数据存储 (让父页面帮忙存 localStorage) ---
    // 保存数据
    if (type === 'SAVE_STORAGE') {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error('Storage Save Error:', e);
        }
    }

    // 读取数据
    if (type === 'GET_STORAGE') {
        const val = localStorage.getItem(key);
        // 把读到的数据发回给子页面
        iframe.contentWindow.postMessage({
            type: 'STORAGE_DATA',
            key: key,
            value: val
        }, '*');
    }
});