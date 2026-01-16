export default class Signal {
    constructor(component) {
        this.component = component
        if (navigator.userAgent.indexOf('ccpiano-android') != -1) {
            this.platform = 'android'
        } else if (navigator.userAgent.indexOf('ccpiano-ios') != -1) {
            this.platform = 'ios'
        } else if (navigator.userAgent.indexOf('ccmusic-cocos') != -1) {
            this.platform = 'cocos'
        }
        if (this.platform == 'ios') {
            let originLog = console.log;
            console.log = function () {
                let str = Array.prototype.join.call(arguments, "");
                originLog(str);
                window.webkit.messageHandlers.logger.postMessage(str);
            };
        }
    }

    send(method, data) {
        if (this.platform == 'ios') {
            window.webkit.messageHandlers[method].postMessage(JSON.stringify(data));
        } else if (this.platform == 'android') {
            window.android[method](JSON.stringify(data));
        } else {
            if (window.parent && this.isValidDomain()) {
                window.parent.postMessage({
                    method: method,
                    data: data
                }, "*")
            } else {
                this.component.$emit(method, data);
            }
        }
    }
    isApp() {
        return this.platform == 'ios' || this.platform == 'android'
    }
    isValidAccess() {
        if (this.isApp()) return true;
        return this.isValidReferrer();
    }
    isValidDomain() {
        if (this.platform == 'cocos') return true;

        let referrerDomain = document.referrer.split('/')[2];

        if (!referrerDomain) {
            let currentDomain = window.location.href.split('/')[2];
            return currentDomain && currentDomain.match(/localhost:[0-9]*$/g)
        }

        let reg = /(gangqinpu\.com$)|(lzjoy\.com$)|(ccguitar\.cn$)|(netshi\.cn$)/g;
        return referrerDomain && referrerDomain.match(reg);
    }
}