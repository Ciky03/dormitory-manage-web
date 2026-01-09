import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../views/Login/index.vue'
import HomePage from '../views/Home/index.vue'
import MenuConfigPage from '../views/System/Menu/index.vue'
import RolePage from '../views/System/Role/index.vue'
import UserPage from '../views/System/User/index.vue'
import PasswordPage from '../views/Person/Password/index.vue'
import AvatarPage from '../views/Person/Avatar/index.vue'
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
        name: 'Menu',
        component: MenuConfigPage,
        meta: { title: '菜单配置' }
      },
      {
        path: 'system/role',
        name: 'Role',
        component: RolePage,
        meta: { title: '角色管理' }
      },
      {
        path: 'system/user',
        name: 'User',
        component: UserPage,
        meta: { title: '用户管理' }
      },
      {
        path: 'person/password',
        name: 'PersonPassword',
        component: PasswordPage,
        meta: { title: '修改密码' }
      },
      {
        path: 'person/avatar',
        name: 'PersonAvatar',
        component: AvatarPage,
        meta: { title: '修改头像' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
