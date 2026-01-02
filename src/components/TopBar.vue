<script setup>
import { ArrowDown } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import topicIcon from '../assets/topic.svg'

const props = defineProps({
  userName: {
    type: String,
    default: 'ciky'
  },
  avatarUrl: {
    type: String,
    default: ''
  }
})

const router = useRouter()
const tokenKey = import.meta.env.VITE_AUTH_TOKEN_KEY ?? 'token'
const MENU_ROUTES_KEY = 'menu_routes'

const handleCommand = (command) => {
  if (command === 'logout') {
    localStorage.removeItem(tokenKey)
    localStorage.removeItem(MENU_ROUTES_KEY)
    router.push({ name: 'login' })
  }
}
</script>

<template>
  <el-header class="top-bar">
    <div class="brand">
      <img :src="topicIcon" alt="" class="brand-icon" />
      <el-text class="brand-text">宿舍管理平台</el-text>
    </div>
    <el-space :size="10" alignment="center" class="user-info">
      <el-avatar :src="props.avatarUrl" :alt="props.userName" class="avatar">
        {{ props.userName.slice(0, 1) }}
      </el-avatar>
      <el-dropdown trigger="click" @command="handleCommand">
        <span class="user-dropdown">
          <el-text class="user-name">{{ props.userName }}</el-text>
          <el-icon class="user-caret"><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="change-password">修改密码</el-dropdown-item>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-space>
  </el-header>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  background: #ffffff;
  border-bottom: 1px solid #e3e8f3;
  height: auto;
  min-height: 64px;
  position: sticky;
  top: 0;
  z-index: 20;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #1f2a44;
}

.brand-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.brand-text {
  font-size: 1.05rem;
}

.user-info {
  color: #2f3a55;
}

.avatar {
  background: #eef3ff;
  color: #2f5bff;
  font-weight: 600;
}

.user-name {
  font-size: 0.95rem;
}

.user-dropdown {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.user-caret {
  font-size: 14px;
  color: #667085;
}
</style>
