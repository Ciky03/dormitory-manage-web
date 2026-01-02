<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const menuSections = [
  {
    title: '宿舍管理',
    items: [
      { label: '学生管理', path: '/login' },
      { label: '宿舍信息', todo: true },
      { label: '床位分配', todo: true },
      { label: '维修报修', todo: true }
    ]
  },
  {
    title: '日常事务',
    items: [
      { label: '出入登记', todo: true },
      { label: '违规记录', todo: true },
      { label: '考勤统计', todo: true },
      { label: '费用管理', todo: true }
    ]
  },
  {
    title: '系统设置',
    items: [
      { label: '菜单配置', path: '/system/menu' },
      { label: '通知公告', todo: true },
      { label: '角色权限', todo: true },
      { label: '个人中心', todo: true }
    ]
  }
]

const topLevelItems = [{ label: '系统首页', path: '/home' }]

const activePath = computed(() => route.path)
</script>

<template>
  <nav class="side-nav">
    <div class="menu-panel">
      <el-menu
        :default-active="activePath"
        class="menu"
        router
        background-color="transparent"
        text-color="#2f3a55"
        active-text-color="var(--app-primary)"
      >
        <el-menu-item
          v-for="item in topLevelItems"
          :key="item.label"
          :index="item.path"
          class="top-level-item"
        >
          <span>{{ item.label }}</span>
        </el-menu-item>
        <el-sub-menu v-for="section in menuSections" :key="section.title" :index="section.title">
          <template #title>
            <span class="section-title">{{ section.title }}</span>
          </template>
          <el-menu-item
            v-for="item in section.items"
            :key="item.label"
            :index="item.path || item.label"
            :disabled="item.todo"
          >
            <span>{{ item.label }}</span>
            <el-tag v-if="item.todo" size="small" type="info" class="todo-tag">TODO</el-tag>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>
  </nav>
</template>

<style scoped>
.side-nav {
  min-height: 100vh;
  width: 240px;
  border-right: 1px solid #e3e8f3;
  background: #ffffff;
}

.menu-panel {
  padding: 12px 8px;
}

.menu {
  border-right: none;
}

.section-title {
  font-weight: 600;
}

.menu :deep(.el-sub-menu__title) {
  padding-left: 14px;
}

.menu :deep(.el-menu-item.top-level-item) {
  padding-left: 14px;
  font-weight: 600;
  height: 46px;
  line-height: 46px;
  margin: 0;
  border-radius: 0;
}

.menu :deep(.el-menu-item) {
  height: 38px;
  line-height: 38px;
  padding-left: 22px;
  border-radius: 4px;
  margin: 2px 8px;
  position: relative;
}

.menu :deep(.el-menu-item.is-active) {
  background: #f2f5ff;
  color: var(--app-primary);
}

.menu :deep(.el-menu-item.is-active)::after {
  content: "";
  position: absolute;
  right: 6px;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 3px;
  background: var(--app-primary);
}

.todo-tag {
  margin-left: auto;
}

@media (max-width: 960px) {
  .side-nav {
    width: 220px;
  }
}
</style>
