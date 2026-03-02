const { createApp } = Vue;

const app = Vue.createApp({
    data() {
        return {
            RC: [],
            allData: [],
            token: '',
            countdown: '',
            years: [2026,2025,2024],
            currentYear: '',
            dataSources: {
                2025: 'assets/event_json/RC2025.json',
                2024: 'assets/event_json/RC2024.json',        // 本地 JSON
            },
            channelMap:{
                '八雲劍': 'https://www.youtube.com/@yakumokench2',
                '史黛菈': 'https://www.youtube.com/@StellaEleanor.Limnos',
                '蘇雪霏': 'https://www.youtube.com/@SharronSu_ch',
                '九十九桃華': 'https://www.twitch.tv/tsukumo_momoka',
                '鶴目': 'https://www.youtube.com/@tsurumemizuha',
                '宮森繪里奈': 'https://www.youtube.com/@ElinaChelinakawai',
                '彭奇': 'https://www.youtube.com/@%E5%BD%AD%E5%A5%87Ponchi',
                '七葉': 'https://www.youtube.com/@7YAnanaha', 
                '妮卡沃爾': 'https://www.youtube.com/@NicaCh',
                'TG': 'https://www.youtube.com/@Tenwong_Games',
                'Ten_Wong': 'https://www.youtube.com/@Tenwong_Games',
                '命運交響曲': 'https://www.twitch.tv/tryit046472',
                '仙兔': 'https://www.twitch.tv/vt_alisa',
                '水色孤獨': 'https://www.twitch.tv/ts01711975',
                '水無月悠歌': 'https://www.twitch.tv/minazukitouka',
                '星月櫻奈': 'https://www.youtube.com/@sakurananach.',
                '布雷諾': 'https://www.youtube.com/@layno_renewlive',
                '光頭': 'https://www.youtube.com/@atamahikarich.6358',
                '桃米': 'https://www.youtube.com/@Taomi_TuanZih',
            }
        }
    },
    mounted() {
        this.getCurrentYear();
        this.getList();
        this.startCountdown();

    },
    methods: {
        async getCurrentYear() {
            const year = new Date().getFullYear();
            this.currentYear = year;
        },
        async switchYear(year) {
            this.currentYear = year;
            this.RC = [];
            
            // dataSources 有對應年份的話就直接抓 JSON，沒有的話就重新抓 Google Sheets
            if (!this.dataSources[year]) {
                await this.getList();
            } 
            else {
                // 歷年紀錄JSON，無需抓大頭貼
                const res = await axios.get(this.dataSources[year]);
                this.RC = res.data;
            }
        },
        async getList() {
            // 先拿到 Google Sheets 資料
            const sheetUrl = 'https://script.google.com/macros/s/AKfycbwwvjIAzYJVLFgHm3wmxK81-_ixgwZMCK0Odsb5Ydcabf6GaXl6KVUFV9C02u5plhyrFw/exec?cmd=list';
            const res = await axios.get(sheetUrl);
            this.allData = res.data;

            console.log("拿到 Google Sheets 資料:", this.allData);

            // 先拿到 Twitch Token
            await this.getToken();

            // 幫每一個 player 丟 getURL，並平行處理
            const promises = this.allData.map(item => {
                const twitchID = item.player.split('(')[0].trim();
                return this.getURL(twitchID);
            });

            // 平行等結果回來
            const imgURLs = await Promise.all(promises);

            // 把結果塞回 allData
            this.allData.forEach((item, index) => {
                if(imgURLs[index] !=""){
                    item.imgURL = imgURLs[index];
                }
                else{
                    // 如果 Twitch 沒有大頭貼，就嘗試抓本地圖片
                    this.getLoaclImg(item.player.split('(')[0].trim()).then(path => {
                        if(path != undefined){
                            item.imgURL = path;
                        }
                        else{
                            item.imgURL = "";
                        }
                    });
                }
            });

            // 整理 RC
            this.RC = [
                { "title": "元祖洛克人系列", "data": this.allData.slice(0, 11) },
                { "title": "洛克人X系列", "data": this.allData.slice(11, 19) },
                { "title": "自由選填區", "data": this.allData.slice(19) },
            ];

            console.log("整理好的 RC:", this.RC);
        },
        async getLoaclImg(name) {
            const path = `/assets/img/profile_Img/${name}.png`
            const response = await fetch(path, { method: 'HEAD' });
            if(response.ok){
                return path;
            }
        },
        async getURL(name) {

            const twitchClipsApiUrl = `https://api.twitch.tv/helix/users?login=${name}`;
            try {
                const res = await axios.get(twitchClipsApiUrl, {
                    headers: {
                        'Authorization': 'Bearer ' + this.token,
                        'Client-Id': '2hcw7jubxmk94gkrzhao4wbznzobjv'
                    }
                });
                return res.data.data[0]?.profile_image_url || "";
            } catch (error) {
                console.log("抓取 Twitch 大頭貼失敗:"+name);
                return "";
            }
        },
        async getToken() {
            const res = await axios.post('https://id.twitch.tv/oauth2/token', new URLSearchParams({
                client_id: '2hcw7jubxmk94gkrzhao4wbznzobjv',
                client_secret: 'mz71nl4tw9a9hw2rjz8mpowm38c1hv', 
                grant_type: 'client_credentials'
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            this.token = res.data.access_token;
            console.log("取得 Twitch Token!!");
        },
        startCountdown() {
            const year = new Date().getFullYear();
            const startDate = new Date(year+'-07-01T20:00:00+08:00'); // 活動開始時間
            const endDate = new Date(year+'-07-26T23:59:59+08:00');   // 活動結束時間
            console.log(startDate)
            console.log(endDate)
            
            setInterval(() => {
                const now = new Date();
            
                if (now > endDate) {
                    this.countdown = '🎉 活動已結束，明年敬請期待';
                    return;
                }
            
                if (now >= startDate) {
                    this.countdown = '活動開始';
                    return;
                }
            
                const diff = startDate - now;
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((diff / (1000 * 60)) % 60);
                const seconds = Math.floor((diff / 1000) % 60);
            
                this.countdown = `距離活動開始 ⏳ 倒數 ${days} 天 ${hours} 小時 ${minutes} 分 ${seconds} 秒`;
            }, 1000);
        },
        renderPlayerLinks(text) {
            if (!text) return '';
            
            let processedText = text;
            // 遍歷對照表，將人名替換為 HTML 連結
            Object.keys(this.channelMap).forEach(name => {
              const url = this.channelMap[name];
              // 使用正則表達式確保精準匹配（避免名字的一部分被誤換）
              const regex = new RegExp(name, 'g');
              processedText = processedText.replace(regex, 
                `<a href="${url}" target="_blank" class="text-blue-400 hover:underline">${name}</a>`
              );
            });
        
            // 處理換行符號 \n 轉為 <br>
            return processedText.replace(/\n/g, '<br>');
        },
        getStreamerName(player) {
            if (!player) return '暫時從缺';
    
            // 匹配格式：ID (暱稱) 或 ID（暱稱）
            // \s* 用於處理可能存在的空格
            const match = player.match(/^(.+?)\s*[\(\（](.+?)[\)\）]$/);
    
            if (match) {
                const id = match[1].trim();      // roach
                const nickname = match[2].trim(); // 小強
                return `${nickname} (${id})`;    // 輸出：小強 (roach)
            }
    
            // 如果沒有括號，代表只有 ID，直接回傳
            return player.trim();
        },
    }
})
app.mount('#app');