<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SideNav from '../components/SideNav.vue'
import TabSwitch from '../components/TabSwitch.vue'
import TopBar from '../components/TopBar.vue'

const route = useRoute()
const router = useRouter()

const tabs = ref([{ name: '/home', label: '系统首页', closable: false }])
const activeTab = ref(route.path)

const getTabLabel = (path) => {
  const match = router.getRoutes().find((item) => item.path === path)
  return match?.meta?.title || '系统首页'
}

const ensureTab = (path) => {
  if (!tabs.value.some((tab) => tab.name === path)) {
    tabs.value.push({
      name: path,
      label: getTabLabel(path),
      closable: path !== '/home'
    })
  }
}

ensureTab(route.path)

watch(
  () => route.path,
  (path) => {
    activeTab.value = path
    ensureTab(path)
  }
)

const handleTabClose = (name) => {
  tabs.value = tabs.value.filter((tab) => tab.name !== name)
  if (activeTab.value === name) {
    const fallback = tabs.value[0]?.name || '/home'
    router.push(fallback)
  }
}

const handleTabChange = (name) => {
  if (name !== route.path) {
    router.push(name)
  }
}
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
          <router-view />
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
  overflow: auto;
}
</style>
