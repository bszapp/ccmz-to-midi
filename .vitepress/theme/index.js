import DefaultTheme from 'vitepress/theme'
import ReactContainer from './ReactContainer.vue'
import ShuqianItem from './ShuqianItem.vue'
import './custom.css'

export default {
    extends: DefaultTheme,
    enhanceApp({ app }) {
        app.component('App', ReactContainer)
        app.component('ShuqianItem', ShuqianItem)
    }
}