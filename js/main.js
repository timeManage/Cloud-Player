// 从全局变量 Vue 中解构
const { createApp, ref, computed, nextTick } = Vue;

createApp({
    setup() {
        // ------------------ 1. 配置中心 ------------------
        const apiList = ref([
//            { name: '极速资源', host: 'https://ikunzyapi.com' },
//            { name: '量子资源', host: 'https://cj.lziapi.com' }
            { name: '暴风资源', host: 'https://bfzyapi.com' }
            // 在此添加更多...
        ]);
        
        const modules = [
            { key: 'vod', label: '影视' },
            { key: 'art', label: '资讯' },
            { key: 'actor', label: '演员' },
            { key: 'role', label: '角色' },
            { key: 'website', label: '网址' }
        ];

        // ------------------ 2. 状态变量 ------------------
        const curApiIdx = ref(0);
        const currentMod = ref('vod');
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

        // ------------------ 3. 计算与工具 ------------------
        const curApiName = computed(() => apiList.value[curApiIdx.value].name);
        const curModLabel = computed(() => modules.find(m => m.key === currentMod.value)?.label);
        
        const getName = (i) => i.vod_name || i.art_name || i.actor_name || i.role_name || i.website_name;
        const getPic = (i) => i.vod_pic || i.art_pic || i.actor_pic || i.role_pic || i.website_pic;
        const getContent = (i) => i.vod_content || i.art_content || i.actor_content || i.role_content || i.website_content;
        const getId = (i) => i.vod_id || i.art_id || i.actor_id || i.role_id || i.website_id;
        const imgErr = (e) => e.target.src = 'https://via.placeholder.com/300x450?text=No+Img';

        // ------------------ 4. 核心逻辑 ------------------
        const req = async (params) => {
            loading.value = true;
            const host = apiList.value[curApiIdx.value].host.replace(/\/$/, '');
            const url = `${host}/api.php/provide/${currentMod.value}/`;
            try {
                const res = await axios.get(url, { params });
                return res.data;
            } catch(e) {
                alert('网络请求失败，请检查线路');
                return null;
            } finally {
                loading.value = false;
            }
        };

        const load = async () => {
            const data = await req({ ac: 'list', pg: pg.value, t: curClassId.value, wd: searchWd.value });
            if(data) {
                list.value = data.list || [];
                pageCount.value = parseInt(data.pagecount) || 1;
                if(!classes.value.length && data.class) classes.value = data.class;
            }
        };

        const fetchDetail = async (item) => {
            if (currentMod.value === 'website' && item.website_url) {
                window.open(item.website_url); return;
            }
            const data = await req({ ac: 'detail', ids: getId(item) });
            if(data && data.list.length) {
                detail.value = data.list[0];
                if(currentMod.value === 'vod') processVod(detail.value);
            }
        };

        const processVod = (vod) => {
            let urlStr = vod.vod_play_url;
            if(urlStr.includes('$$$')) urlStr = urlStr.split('$$$')[0]; // 取第一条线路
            episodes.value = urlStr.split('#').map(s => {
                const p = s.split('$');
                return { name: p.length > 1 ? p[0] : '正片', url: p.length > 1 ? p[1] : p[0] };
            });
            nextTick(() => { if(episodes.value.length) play(episodes.value[0].url, 0); });
        };

        const play = (url, idx) => {
            playIndex.value = idx;
            if(art) art.destroy();
            art = new ArtPlayer({
                container: playerRef.value,
                url: url,
                type: url.includes('.m3u8') ? 'm3u8' : 'auto',
                autoplay: true,
                fullscreen: true,
                isLive: false,
                theme: '#3b82f6',
                customType: {
                    m3u8: function (video, url) {
                        if (Hls.isSupported()) {
                            const hls = new Hls();
                            hls.loadSource(url);
                            hls.attachMedia(video);
                        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                            video.src = url;
                        }
                    },
                },
            });
        };

        // ------------------ 5. 交互事件 ------------------
        const switchMod = (k) => { currentMod.value = k; reset(); };
        const changeApi = (i) => { curApiIdx.value = i; reset(); };
        const changeClass = (id) => { curClassId.value = id; pg.value = 1; load(); };
        const doSearch = () => { pg.value = 1; load(); };
        const resetHome = () => { detail.value = null; searchWd.value = ''; reset(); };
        const reset = () => {
            pg.value = 1; curClassId.value = ''; classes.value = []; detail.value = null; list.value = [];
            load();
        };

        // Init
        load();

        return {
            apiList, curApiIdx, curApiName, modules, currentMod, curModLabel,
            loading, list, classes, pg, pageCount, curClassId, searchWd,
            detail, episodes, playIndex, playerRef,
            switchMod, changeApi, changeClass, doSearch, resetHome, fetchDetail, play,
            getName, getPic, getContent, imgErr
        };
    }
}).mount('#app');