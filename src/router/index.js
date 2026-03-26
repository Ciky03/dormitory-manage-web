import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../views/Login/index.vue'
import HomePage from '../views/Home/index.vue'
import MenuConfigPage from '../views/System/Menu/index.vue'
import RolePage from '../views/System/Role/index.vue'
import UserPage from '../views/System/User/index.vue'
import PasswordPage from '../views/Person/Password/index.vue'
import AvatarPage from '../views/Person/Avatar/index.vue'
import BindWxPage from '../views/Person/BindWx/index.vue'
import ClassPage from '../views/Config/Class/index.vue'
import RoomPage from '../views/Config/Room/index.vue'
import ConfigPersonPage from '../views/Config/Person/index.vue'
import ConfigPersonFormPage from '../views/Config/Person/form.vue'
import DormitoryConventionPage from '../views/StudentDormitory/Convention/index.vue'
import DormTodoPage from '../views/StudentDormitory/DormTodo/index.vue'
import NotFoundPage from '../views/NotFound/index.vue'
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
      },
      {
        path: 'person/bindwx',
        name: 'PersonBindWx',
        component: BindWxPage,
        meta: { title: '绑定微信' }
      },
      {
        path: 'config/class',
        name: 'Class',
        component: ClassPage,
        meta: { title: '班级配置' }
      },
      {
        path: 'config/room',
        name: 'Room',
        component: RoomPage,
        meta: { title: '宿舍配置' }
      },
      {
        path: 'config/person',
        name: 'Person',
        component: ConfigPersonPage,
        meta: { title: '人员配置' }
      },
      {
        path: 'config/person/form',
        name: 'PersonForm',
        component: ConfigPersonFormPage,
        meta: { title: '新增人员' }
      },
      {
        path: 'student/dormitory/convention',
        name: 'StudentDormitoryConvention',
        component: DormitoryConventionPage,
        meta: { title: '宿舍公约' }
      },
      {
        path: 'student/dorm-todo',
        name: 'StudentDormTodo',
        component: DormTodoPage,
        meta: { title: '宿舍待办事务' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundPage,
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const TOKEN_STORAGE_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY ?? 'token'

router.beforeEach((to) => {
  if (to.name === 'login' || to.name === 'NotFound') {
    return true
  }
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (!token) {
    return { name: 'login', replace: true }
  }
  return true
})

export default router