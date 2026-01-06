import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/global.css'
import permission from './directives/permission'

const app = createApp(App)
app.directive('permission', permission)
app.use(router).use(ElementPlus).mount('#app')
