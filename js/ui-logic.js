// js/ui-logic.js

const { createApp, ref, computed, nextTick, watch } = Vue;

// 代理请求函数
const proxyAxiosGet = (url, config = {}) => {
    return new Promise((resolve, reject) => {
        const requestId = Date.now() + Math.random(); 
        
        window.parent.postMessage({
            type: 'AXIOS_REQUEST',
            id: requestId,
            config: { ...config, url, method: 'get' }
        }, '*');

        const handleMessage = (event) => {
            const { type, id, success, data, error } = event.data;
            if (type === 'AXIOS_RESPONSE' && id === requestId) {
                window.removeEventListener('message', handleMessage);
                if (success) {
                    resolve({ data });
                } else {
                    reject(error);
                }
            }
        };
        window.addEventListener('message', handleMessage);
    });
};

createApp({
    setup() {
        // --- 资源配置 ---
        const apiList = ref([
            { name: '极速资源', host: 'https://ikunzyapi.com' },
            { name: '量子资源', host: 'https://cj.lziapi.com' }
        ]);
        
        // --- 状态变量 ---
        const curApiIdx = ref(0);
        const currentMod = ref('vod');
        const showSourceMenu = ref(false); 

        const loading = ref(false);
        const list = ref([]);
        const classes = ref([]); 
        const pg = ref(1);
        const pageCount = ref(1);
        const curClassId = ref('');
        const searchWd = ref('');
        
        const detail = ref(null);
        const episodes = ref([]);
        const playIndex = ref(0);
        const playerRef = ref(null);
        let art = null;

        // --- 播放设置 ---
        const isAutoNext = ref(true);
        const skipHead = ref(0);
        const skipTail = ref(0);

        // ★★★ 修改点 1: 全局音量 (默认 0.7) ★★★
        // 不能直接读取 localStorage，先给个默认值，然后找爸爸要数据
        const globalVolume = ref(0.7);

        // ★★★ 修改点 2: 监听父页面发回来的存储数据 ★★★
        window.addEventListener('message', (event) => {
            const { type, key, value } = event.data;
            // 如果收到了音量数据
            if (type === 'STORAGE_DATA' && key === 'cloud_player_volume') {
                if (value !== null) {
                    const vol = parseFloat(value);
                    globalVolume.value = vol;
                    console.log('从父页面同步音量成功:', vol);
                    // 如果播放器已经创建了，立刻更新播放器音量
                    if (art) art.volume = vol;
                }
            }
        });

        // ★★★ 修改点 3: 初始化时，向父页面请求音量数据 ★★★
        // 发送消息："爸爸，把 cloud_player_volume 的值给我"
        window.parent.postMessage({ type: 'GET_STORAGE', key: 'cloud_player_volume' }, '*');

        // ------------------------------------------------
        
        const curApiName = computed(() => apiList.value[curApiIdx.value].name);
        
        const getName = (i) => i.vod_name || '未知标题';
        const getPic = (i) => i.vod_pic || '';
        const getContent = (i) => i.vod_content || '暂无简介';
        const getId = (i) => i.vod_id;
        
        const imgErr = (e) => {
            e.target.style.objectFit = 'contain';
            e.target.src = 'https://via.placeholder.com/300x450?text=No+Image';
        };

        const toggleSourceMenu = () => {
            showSourceMenu.value = !showSourceMenu.value;
        };

        // --- 请求逻辑 ---
        const req = async (params) => {
            loading.value = true;
            const host = apiList.value[curApiIdx.value].host.replace(/\/$/, '');
            const url = `${host}/api.php/provide/vod/`; 
            
            try {
                const res = await proxyAxiosGet(url, { params });
                return res.data;
            } catch(e) {
                console.error("Request Failed:", e);
                return null;
            } finally {
                loading.value = false;
            }
        };

        const load = async () => {
            const data = await req({ 
                ac: 'list', 
                pg: pg.value, 
                t: curClassId.value, 
                wd: searchWd.value 
            });

            if(data && (data.code === 1 || data.list)) {
                list.value = data.list || [];
                pageCount.value = Number(data.pagecount) || 1;
                if(classes.value.length === 0 && data.class && Array.isArray(data.class)) {
                    classes.value = data.class;
                }
            } else {
                list.value = [];
            }
        };

        const fetchDetail = async (item) => {
            const data = await req({ ac: 'detail', ids: getId(item) });
            
            if(data && data.list && data.list.length > 0) {
                detail.value = data.list[0];
                processVod(detail.value);
            }
        };

        const processVod = (vod) => {
            let urlStr = vod.vod_play_url;
            if(!urlStr) return;

            if(urlStr.includes('$$$')) urlStr = urlStr.split('$$$')[0];
            
            episodes.value = urlStr.split('#').map(s => {
                const p = s.split('$');
                return { 
                    name: p.length > 1 ? p[0] : '正片', 
                    url: p.length > 1 ? p[1] : p[0] 
                };
            });

            nextTick(() => { 
                if(episodes.value.length > 0) play(episodes.value[0].url, 0); 
            });
        };

        const play = (url, idx) => {
            playIndex.value = idx;
            if(art) art.destroy();
            
            const isM3U8 = url.includes('.m3u8');

            art = new Artplayer({
                container: playerRef.value,
                url: url,
                type: isM3U8 ? 'm3u8' : 'auto',
                autoplay: true,
                fullscreen: true,
                theme: '#3b82f6',
                setting: true,
                playbackRate: true,
                autoPlayback: true,
                
                // 使用当前的全局音量变量
                volume: globalVolume.value,

                customType: {
                    m3u8: function (video, url) {
                        if (Hls.isSupported()) {
                            const hls = new Hls({ enableWorker: false });
                            hls.loadSource(url);
                            hls.attachMedia(video);
                        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                            video.src = url;
                        }
                    },
                },
            });

            // ★★★ 修改点 4: 音量变化时，通知父页面保存 ★★★
            art.on('volume', (vol) => {
                globalVolume.value = vol;
                // 发送消息："爸爸，帮我存一下 cloud_player_volume"
                window.parent.postMessage({
                    type: 'SAVE_STORAGE',
                    key: 'cloud_player_volume',
                    value: vol
                }, '*');
            });

            art.on('ready', () => {
                if (skipHead.value > 0) art.currentTime = skipHead.value;
            });

            art.on('video:timeupdate', () => {
                const currentTime = art.currentTime;
                const duration = art.duration;
                if (skipTail.value > 0 && duration > 0 && (duration - currentTime < skipTail.value)) {
                    playNext();
                }
            });

            art.on('video:ended', () => {
                if (isAutoNext.value) playNext();
            });
        };

        const playNext = () => {
            const nextIdx = playIndex.value + 1;
            if (nextIdx < episodes.value.length) {
                play(episodes.value[nextIdx].url, nextIdx);
            } else {
                if(art) art.notice.show = '全部播放完毕';
            }
        };

        watch(skipHead, (val) => {
            if(art && art.currentTime < val) art.currentTime = val;
        });

        const changeApi = (i) => { 
            curApiIdx.value = i; 
            showSourceMenu.value = false; 
            reset(); 
        };

        const changeClass = (id) => { curClassId.value = id; pg.value = 1; load(); };
        const doSearch = () => { pg.value = 1; load(); };
        const resetHome = () => { detail.value = null; searchWd.value = ''; reset(); };
        
        const reset = () => {
            pg.value = 1; 
            curClassId.value = ''; 
            classes.value = [];
            detail.value = null; 
            list.value = [];
            load();
        };
        
        load();

        return {
            apiList, curApiIdx, curApiName, loading, list, classes, pg, pageCount, curClassId, searchWd,
            detail, episodes, playIndex, playerRef,
            isAutoNext, skipHead, skipTail, showSourceMenu, 
            changeApi, changeClass, doSearch, resetHome, fetchDetail, play, toggleSourceMenu,
            getName, getPic, getContent, imgErr
        };
    }
}).mount('#app');