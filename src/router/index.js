import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../views/Login/index.vue'
import HomePage from '../views/Home/index.vue'
import MenuConfigPage from '../views/System/Menu/index.vue'
import MainLayout from '../layouts/MainLayout.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginPage },
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', redirect: 'home' },
      { path: 'home', name: 'home', component: HomePage, meta: { title: '系统首页' } },
      {
        path: 'system/menu',
        name: 'system-menu',
        component: MenuConfigPage,
        meta: { title: '菜单配置' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
