<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SideNav from '../components/nav/SideNav.vue'
import TabSwitch from '../components/nav/TabSwitch.vue'
import TopBar from '../components/nav/TopBar.vue'

const route = useRoute()
const router = useRouter()

const tabs = ref([{ name: '/home', label: '系统首页', closable: false }])
const activeTab = ref(route.path)

const getTabLabel = (routeInfo) => {
  const path = routeInfo?.path || routeInfo
  if (path === '/config/person/form') {
    const type = routeInfo?.query?.type
    if (type === 'teacher') return '新增教师'
    if (type === 'dormitory') return '新增宿管'
    return '新增学生'
  }
  const match = router.getRoutes().find((item) => item.path === path)
  return match?.meta?.title || '系统首页'
}

const ensureTab = (routeInfo) => {
  const path = routeInfo?.path || routeInfo
  const label = getTabLabel(routeInfo)
  const existing = tabs.value.find((tab) => tab.name === path)
  if (existing) {
    existing.label = label
    return
  }
  tabs.value.push({
    name: path,
    label,
    closable: path !== '/home'
  })
}

ensureTab(route)

watch(
  () => route.fullPath,
  () => {
    activeTab.value = route.path
    ensureTab(route)
  }
)

const handleTabClose = (name) => {
  const closingIndex = tabs.value.findIndex((tab) => tab.name === name)
  tabs.value = tabs.value.filter((tab) => tab.name !== name)
  if (activeTab.value === name) {
    const fallback =
      tabs.value[closingIndex - 1]?.name ||
      tabs.value[closingIndex]?.name ||
      tabs.value[0]?.name ||
      '/home'
    router.push(fallback)
  }
}

const handleTabChange = (name) => {
  if (name !== route.path) {
    router.push(name)
  }
}

const handleExternalTabClose = (event) => {
  const name = event?.detail?.path
  if (!name) return
  handleTabClose(name)
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('tab-close', handleExternalTabClose)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('tab-close', handleExternalTabClose)
  }
})
</script>

<template>
  <div class="app-layout">
    <TopBar class="app-topbar" />
    <div class="app-body">
      <SideNav />
      <div class="app-main">
        <TabSwitch
          v-model="activeTab"
          :tabs="tabs"
          @close="handleTabClose"
          @update:model-value="handleTabChange"
        />
        <main class="app-content">
          <section class="app-page">
            <section class="app-card">
              <router-view />
            </section>
          </section>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fb;
}

.app-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
}

.app-body {
  display: grid;
  grid-template-columns: auto 1fr;
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.app-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.app-content {
  padding: 10px 10px;
  flex: 1 1 auto;
  overflow: hidden;
}

.app-page {
  display: grid;
  gap: 12px;
  padding: 12px;
  height: 92%;
  width: 100%;
  box-sizing: border-box;
}

.app-card {
  background: #ffffff;
  border-radius: 2px;
  padding: 16px 18px 18px;
  box-shadow: 0 18px 40px rgba(22, 33, 60, 0.08);
  overflow: hidden;
}
</style>
