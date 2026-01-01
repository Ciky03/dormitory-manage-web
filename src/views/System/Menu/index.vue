<script setup>
import SideNav from '../../../components/SideNav.vue'
import TopBar from '../../../components/TopBar.vue'
</script>

<template>
  <div class="system-layout">
    <TopBar class="system-topbar" />
    <div class="system-body">
      <SideNav />
      <main class="system-content">
        <header class="system-header">
          <h1>????</h1>
          <p>???????????????</p>
        </header>
      </main>
    </div>
  </div>
</template>

<style scoped>
.system-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fb;
}

.system-topbar {
  position: sticky;
  top: 0;
  z-index: 10;
}

.system-body {
  display: grid;
  grid-template-columns: auto 1fr;
  min-height: 0;
}

.system-content {
  padding: 36px 40px;
}

.system-header {
  background: #ffffff;
  padding: 24px 28px;
  border-radius: 18px;
  box-shadow: 0 18px 40px rgba(22, 33, 60, 0.08);
}

.system-header h1 {
  margin: 0 0 8px;
  font-size: 1.6rem;
}

.system-header p {
  margin: 0;
  color: #5a6a82;
}
</style>
