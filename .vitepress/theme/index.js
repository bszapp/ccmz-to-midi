import DefaultTheme from 'vitepress/theme'
import ShuqianItem from './ShuqianItem.vue'
import './custom.css'

export default {
    extends: DefaultTheme,
    enhanceApp({ app }) {
        if (typeof window !== 'undefined') {
            let cachedCode = null;
            const run = async () => {
                const container = document.querySelector('#app-main');
                if (!container || container.innerHTML.trim() !== '' || window._isAppLoading) return;
                window._isAppLoading = true;
                try {
                    if (!cachedCode) {
                        const res = await fetch('./app-main.js');
                        cachedCode = await res.text();
                    }
                    new Function(cachedCode)();
                } catch (e) {
                    console.error(e);
                } finally {
                    window._isAppLoading = false;
                }
            };

            const observer = new MutationObserver(run);
            observer.observe(document.documentElement, { childList: true, subtree: true });
            run();
        }
        app.component('ShuqianItem', ShuqianItem);
    }
}