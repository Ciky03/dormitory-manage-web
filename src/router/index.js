import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../views/Login/index.vue'
import HomePage from '../views/Home/index.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: LoginPage },
  { path: '/home', name: 'home', component: HomePage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
