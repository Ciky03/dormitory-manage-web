<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchMenuRoutes } from '../../api/system/menu'
import openNavIcon from '../../assets/main/open-nav.svg'
import closeNavIcon from '../../assets/main/close-nav.svg'

const route = useRoute()
const MENU_ROUTES_KEY = 'menu_routes'

const menuRoutes = ref([])
const isCollapsed = ref(false)

const topLevelItems = [
  { label: '首页', path: '/home', icon: 'home.svg', pitchIcon: 'home-pitch.svg' }
]

const activePath = computed(() => route.path)

const menuIconModules = import.meta.glob('../../assets/menu-icons/*', {
  eager: true,
  import: 'default'
})

const menuPitchIconModules = import.meta.glob('../../assets/menu-pitch-icons/*', {
  eager: true,
  import: 'default'
})

const buildIconMap = (modules) =>
  new Map(
    Object.entries(modules).map(([path, url]) => {
      const segments = path.split('/')
      const filename = segments[segments.length - 1]
      return [filename, url]
    })
  )

const menuIconMap = computed(() => buildIconMap(menuIconModules))
const menuPitchIconMap = computed(() => buildIconMap(menuPitchIconModules))

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

const isDirectory = (node) => node?.type === 2 || node?.type === '2'
const isButton = (node) => node?.type === 4 || node?.type === '4'

const mapRoutes = (nodes, parentPath = '') =>
  nodes
    .filter((node) => node?.visible !== false && !isButton(node))
    .map((node) => {
      const path = buildPath(parentPath, node.routePath)
      const children = Array.isArray(node.children) ? mapRoutes(node.children, path) : []
      return {
        id: node.id,
        label: node.name,
        path,
        icon: node.icon,
        pitchIcon: node.pitchIcon,
        type: node.type,
        isDirectory: isDirectory(node),
        children
      }
    })

const menuSections = computed(() => mapRoutes(menuRoutes.value))
const flatSections = computed(() =>
  menuSections.value.map((section) => ({
    ...section,
    children: []
  }))
)

const isPathActive = (path) => {
  if (!path) return false
  return activePath.value === path || activePath.value.startsWith(`${path}/`)
}

const getIconUrl = (iconName, pitchName, active) => {
  if (active && pitchName && menuPitchIconMap.value.has(pitchName)) {
    return menuPitchIconMap.value.get(pitchName)
  }
  if (iconName && menuIconMap.value.has(iconName)) {
    return menuIconMap.value.get(iconName)
  }
  return ''
}

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

const toggleNav = () => {
  isCollapsed.value = !isCollapsed.value
}

const handleMenuSelect = () => {
  if (isCollapsed.value) {
    isCollapsed.value = false
  }
}
</script>

<template>
  <nav class="side-nav" :class="{ collapsed: isCollapsed }">
    <el-scrollbar class="menu-panel">
      <el-menu
        :default-active="activePath"
        class="menu"
        :router="!isCollapsed"
        :collapse="isCollapsed"
        :collapse-transition="false"
        @select="handleMenuSelect"
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
        <div class="section-title">
          <i class="menu-icon" aria-hidden="true">
            <img
              v-if="getIconUrl(item.icon, item.pitchIcon, isPathActive(item.path))"
              :src="getIconUrl(item.icon, item.pitchIcon, isPathActive(item.path))"
              :alt="item.label"
            />
          </i>
          <span v-if="!isCollapsed">{{ item.label }}</span>
        </div>
        </el-menu-item>
        <template v-if="!isCollapsed">
          <template v-for="section in menuSections" :key="section.id || section.label">
            <el-menu-item
              v-if="!section.isDirectory"
              :index="section.path || section.label"
              class="top-level-item"
            >
              <i class="menu-icon" aria-hidden="true">
                <img
                  v-if="getIconUrl(section.icon, section.pitchIcon, isPathActive(section.path))"
                  :src="getIconUrl(section.icon, section.pitchIcon, isPathActive(section.path))"
                  :alt="section.label"
                />
              </i>
              <span>{{ section.label }}</span>
            </el-menu-item>
            <el-sub-menu v-else :index="section.path || section.label">
              <template #title>
                <span class="section-title">
                  <i class="menu-icon" aria-hidden="true">
                    <img
                      v-if="getIconUrl(section.icon, section.pitchIcon, isPathActive(section.path))"
                      :src="getIconUrl(section.icon, section.pitchIcon, isPathActive(section.path))"
                      :alt="section.label"
                    />
                  </i>
                  {{ section.label }}
                </span>
              </template>
              <el-menu-item
                v-for="item in section.children"
                :key="item.id || item.label"
                :index="item.path || item.label"
              >
                <i class="menu-icon" aria-hidden="true">
                  <img
                    v-if="getIconUrl(item.icon, item.pitchIcon, isPathActive(item.path))"
                    :src="getIconUrl(item.icon, item.pitchIcon, isPathActive(item.path))"
                    :alt="item.label"
                  />
                </i>
                <span>{{ item.label }}</span>
              </el-menu-item>
            </el-sub-menu>
          </template>
        </template>
        <template v-else>
          <el-menu-item
            v-for="section in flatSections"
            :key="section.id || section.label"
            :index="section.path || section.label"
            class="top-level-item"
          >
            <i class="menu-icon" aria-hidden="true">
              <img
                v-if="getIconUrl(section.icon, section.pitchIcon, isPathActive(section.path))"
                :src="getIconUrl(section.icon, section.pitchIcon, isPathActive(section.path))"
                :alt="section.label"
              />
            </i>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
    <button class="nav-toggle" type="button" @click="toggleNav">
      <img :src="isCollapsed ? openNavIcon : closeNavIcon" alt="toggle" />
    </button>
  </nav>
</template>

<style scoped>
.side-nav {
  min-height: 100vh;
  width: 240px;
  border-right: 1px solid #e3e8f3;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: width 0.2s ease;
}

.side-nav.collapsed {
  width: 72px;
}

.menu-panel {
  flex: 1;
  min-height: 0;
}

.menu-panel :deep(.el-scrollbar__view) {
  padding: 12px 8px 96px;
}

.menu-panel :deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}

.menu-panel :deep(.el-scrollbar__bar.is-vertical) {
  width: 6px;
  right: 2px;
}

.menu-panel :deep(.el-scrollbar__thumb) {
  background-color: #d3d7e5;
  border-radius: 6px;
}

.menu-panel :deep(.el-scrollbar__thumb:hover) {
  background-color: #c2c6d4;
}

.menu {
  border-right: none;
}

.section-title {
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
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

.menu-icon {
  width: 18px;
  height: 18px;
  margin-right: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 18px;
}

.menu-icon img {
  width: 18px;
  height: 18px;
  object-fit: contain;
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

.nav-toggle {
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  position: absolute;
  right: 16px;
  bottom: 74px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.side-nav.collapsed .nav-toggle {
  right: 24px;
}

.nav-toggle img {
  width: 20px;
  height: 20px;
  display: block;
}

@media (max-width: 960px) {
  .side-nav {
    width: 220px;
  }
}
</style>
