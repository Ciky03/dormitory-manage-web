<script setup>
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'

const props = defineProps({
  stat: { type: Object, required: true },
  showCreate: { type: Boolean, default: false }
})

const emit = defineEmits(['create'])
const collapsed = ref(false)

const roomLabel = computed(() => `${props.stat?.buildingNum || '-'}-${props.stat?.roomNum || '-'}`)
const cards = computed(() => [
  { label: '全部待办', value: props.stat?.totalCount ?? 0 },
  { label: '待处理', value: props.stat?.pendingCount ?? 0 },
  { label: '进行中', value: props.stat?.processingCount ?? 0 },
  { label: '本周已完成', value: props.stat?.weekCompletedCount ?? 0 }
])

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <section class="todo-overview">
    <el-card class="overview-hero" :class="{ 'is-collapsed': collapsed }" shadow="never">
      <div class="hero-header">
        <div>
          <h2 class="hero-room">{{ roomLabel }}</h2>
        </div>
        <div class="hero-actions">
          <el-button
            v-if="showCreate"
            class="hero-create-button"
            type="primary"
            @click="emit('create')"
          >
            新建待办
          </el-button>
          <button
            type="button"
            class="hero-collapse-toggle"
            :aria-label="collapsed ? '展开概览' : '收起概览'"
            @click="toggleCollapsed"
          >
            <el-icon>
              <ArrowDown v-if="collapsed" />
              <ArrowUp v-else />
            </el-icon>
          </button>
        </div>
      </div>
      <div v-show="!collapsed" class="hero-stats">
        <article v-for="card in cards" :key="card.label" class="stat-card">
          <span class="stat-label">{{ card.label }}</span>
          <strong class="stat-value">{{ card.value }}</strong>
        </article>
      </div>
    </el-card>
  </section>
</template>

<style scoped>
.todo-overview {
  min-height: 0;
}

.overview-hero {
  border: 1px solid #dde6f2;
  background: linear-gradient(135deg, #ffffff 0%, #f6f9ff 100%);
}

.overview-hero :deep(.el-card__body) {
  padding: 14px 18px 14px;
}

.hero-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero-room {
  margin: 0;
  color: #122033;
  font-size: 24px;
  line-height: 1.2;
}

.hero-create-button {
  border-radius: var(--el-border-radius-base);
}

.hero-collapse-toggle {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid #d8e2f0;
  border-radius: var(--el-border-radius-base);
  background: #ffffff;
  color: #42526b;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
}

.hero-collapse-toggle:hover {
  border-color: #b8c9e6;
  background: #f8fbff;
  color: #2338a6;
}

.overview-hero.is-collapsed {
  padding-bottom: 0;
}

.hero-stats {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  padding: 12px 16px;
  border-radius: 12px;
  background: #f8fbff;
  border: 1px solid #e3ebf6;
}

.stat-label {
  display: block;
  color: #64748b;
  font-size: 13px;
}

.stat-value {
  display: block;
  margin-top: 4px;
  color: #122033;
  font-size: 20px;
}

@media (max-width: 960px) {
  .hero-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .hero-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-actions {
    width: 100%;
    justify-content: space-between;
  }

  .hero-stats {
    grid-template-columns: 1fr;
  }
}
</style>
