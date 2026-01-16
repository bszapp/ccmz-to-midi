import Vue from 'vue';
import App from './index.vue';
import Vconsole from 'vconsole';
Vue.config.productionTip = false;
if(process.env.NODE_ENV == 'development'){
    Vue.prototype.$vConsole = new Vconsole()
}

new Vue({
    render: (h) => h(App),
}).$mount('#app');
