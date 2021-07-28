const { ipcRenderer } = require('electron')

var app = new Vue({
    el: '#app',
    data: {
        err: '',
        tab: 'vod',
        input: '',
        clip_name: 'clip',
        last: false,
        path: '',
        channelName: '',
        vods: [],
        channelID: 63681555,
    },
    methods: {
        search: function() {
            
            axios
                .get(`https://booyah.live/api/v3/channels/${this.input}`)
                .then(response => { this.channelName = response.data.user.nickname } ) //

            axios
                .get(`https://booyah.live/api/v3/playbacks?channel_id=${this.input}&cursor=0&count=20&type=17&sort_method=1`)
                .then(response => {
                    this.vods = response.data.playback_list
                    this.err = false
                }).catch((err) => {
                    if(err.response.status){
                        this.err = true

                        setTimeout(() => {
                            this.err = false
                        }, 10000);
                    }
                })

            this.tab = 'vod'
        },
        settab: function(tab) {
            this.tab = tab
            console.log(tab)
        },
        clip: function(last) {
            var from = document.querySelector('#from').value
            var duration = document.querySelector('#duration').value
            
            if (from.length == 1){
                from = '0:0:0' + from
            }else if (from.length == 2){
                from = '0:0:' + from
            }else if (from.length == 4){
                from = '0:' + from
            }else{
                from = moment(from, 'HH:mm:ss').format('HH:mm:ss')
            }

            console.log(from)

            if(from != '' && duration != ''){
                ipcRenderer.sendSync('clip',last, from, duration, this.clip_name)
            }
        }
    },
    mounted () {
       /* axios
          .get(`https://booyah.live/api/v3/playbacks?channel_id=${this.channelID}&cursor=0&count=20&type=17&sort_method=1`)
          .then(response => (this.vods = response.data.playback_list))*/
      }
  })


ipcRenderer.on('status', function (evt, data) {
    console.log(data)
    if(data.status){
        app.path = data.path
        app.last = true

        setTimeout(() => {
            app.path = false
        },5000)
    }
});

Vue.filter('formatDate', function(value) {
  if (value) {

    var date = new Date(value);

    return moment(date).format('MM/DD/YYYY hh:mm')
  }
})