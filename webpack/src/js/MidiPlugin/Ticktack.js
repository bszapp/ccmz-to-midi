export default class Ticktack {
    buffers = []

    constructor(context) {
        this.context = context
        this.loadAudioFile(context, './sounds/tick.mp3', (buffer) => {
            this.buffers[0] = buffer
        })
        this.loadAudioFile(context, './sounds/tack.mp3', (buffer) => {
            this.buffers[1] = buffer
        })
    }

    playSound(buffer) {
        let source = this.context.createBufferSource();
        source.buffer = buffer;
        source.loop = false; //循环播放
        source.connect(this.context.destination);
        source.start(0); //立即播放
    }

    loadAudioFile(context, url, callback) {
        var xhr = new XMLHttpRequest(); //通过XHR下载音频文件
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function () { //下载完成
            context.decodeAudioData(xhr.response, function (buffer) { //解码成功时的回调函数
                callback(buffer);
            }, function (e) { //解码出错时的回调函数
                console.log('Error decoding file', e);
            });
        };
        xhr.send();
    }
    play(isTick) {
        if (this.buffers.length == 2) {
            this.playSound(this.buffers[isTick ? 0 : 1])
        }
    }
}