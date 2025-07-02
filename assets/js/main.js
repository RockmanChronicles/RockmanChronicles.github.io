const { createApp } = Vue;

const app = Vue.createApp({
    data() {
        return {
            RC: [],
            allData: [],
            token: '',
            countdown: '',
        }
    },
    mounted() {
        this.getList();
        this.startCountdown();

    },
    methods: {
        async getList() {
            // 先拿到 Google Sheets 資料
            const sheetUrl = 'https://script.google.com/macros/s/AKfycbxC-ua2DAzcAQz9IE6Uf97LDzyvAfhaaUl6R0phM8QV5Bx4PucZAq6nNV4jamVLPWk8Mw/exec?cmd=list';
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
                item.imgURL = imgURLs[index];
            });

            // 整理 RC
            this.RC = [
                { "title": "元祖洛克人系列", "data": this.allData.slice(0, 11) },
                { "title": "洛克人X系列", "data": this.allData.slice(11, 19) },
                { "title": "自由選填區", "data": this.allData.slice(19) },
            ];

            console.log("整理好的 RC:", this.RC);
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
                console.error("抓取 Twitch 大頭貼失敗:", name, error);
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
            console.log("取得 Twitch Token:", this.token);
        },
        startCountdown() {
            const startDate = new Date('2025-07-01T20:00:00+08:00'); // 活動開始時間
            const endDate = new Date('2025-07-31T23:59:59+08:00');   // 活動結束時間
          
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
    },
})
app.mount('#app');