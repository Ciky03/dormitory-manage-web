<template>
  <section class="notfound-page">
    <div class="notfound-content">
      <div class="notfound-code">404</div>
      <div class="notfound-text">页面不存在</div>
    </div>
  </section>
</template>

<style scoped>
.notfound-page {
  min-height: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #ffffff;
}

.notfound-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.notfound-code {
  font-size: 150px;
  font-weight: 700;
  color: var(--app-primary);
  letter-spacing: 2px;
}

.notfound-text {
  font-size: 36px;
  font-weight: 600;
  color: #1f2a44;
}
</style>
