<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchMenuRoutes } from '../api/menu'

const route = useRoute()
const MENU_ROUTES_KEY = 'menu_routes'

const menuRoutes = ref([])

const topLevelItems = [{ label: '首页', path: '/home' }]

const activePath = computed(() => route.path)

const normalizeRouteList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.list)) return payload.list
  if (Array.isArray(payload?.data?.list)) return payload.data.list
  return []
}

const buildPath = (parentPath, routePath) => {
  if (!routePath) return parentPath || '/'
  if (routePath.startsWith('/')) return routePath
  if (!parentPath) return `/${routePath}`
  return `${parentPath.replace(/\/$/, '')}/${routePath}`
}

const mapRoutes = (nodes, parentPath = '') =>
  nodes
    .filter((node) => node?.visible !== false)
    .map((node) => {
      const path = buildPath(parentPath, node.routePath)
      const children = Array.isArray(node.children) ? mapRoutes(node.children, path) : []
      return {
        id: node.id,
        label: node.name,
        path,
        children
      }
    })

const menuSections = computed(() => mapRoutes(menuRoutes.value))

const loadMenuRoutes = async () => {
  try {
    const data = await fetchMenuRoutes()
    const routes = normalizeRouteList(data)
    menuRoutes.value = routes
    localStorage.setItem(MENU_ROUTES_KEY, JSON.stringify(routes))
  } catch (error) {
    menuRoutes.value = []
  }
}

onMounted(() => {
  const cached = localStorage.getItem(MENU_ROUTES_KEY)
  if (cached) {
    try {
      menuRoutes.value = JSON.parse(cached)
    } catch (error) {
      localStorage.removeItem(MENU_ROUTES_KEY)
    }
  }
  loadMenuRoutes()
})
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
        <template v-for="section in menuSections" :key="section.id || section.label">
          <el-menu-item
            v-if="!section.children.length"
            :index="section.path || section.label"
            class="top-level-item"
          >
            <span>{{ section.label }}</span>
          </el-menu-item>
          <el-sub-menu v-else :index="section.path || section.label">
            <template #title>
              <span class="section-title">{{ section.label }}</span>
            </template>
            <el-menu-item
              v-for="item in section.children"
              :key="item.id || item.label"
              :index="item.path || item.label"
            >
              <span>{{ item.label }}</span>
            </el-menu-item>
          </el-sub-menu>
        </template>
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
  height: 46px;
  line-height: 46px;
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
  height: 46px;
  line-height: 46px;
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
