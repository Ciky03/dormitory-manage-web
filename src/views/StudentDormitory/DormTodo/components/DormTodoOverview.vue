<script setup>
import { computed } from 'vue'

const props = defineProps({
  stat: { type: Object, required: true },
  showCreate: { type: Boolean, default: false }
})

const emit = defineEmits(['create'])

const roomLabel = computed(() => `${props.stat?.buildingNum || '-'}-${props.stat?.roomNum || '-'}`)
const cards = computed(() => [
  { label: '全部待办', value: props.stat?.totalCount ?? 0 },
  { label: '待处理', value: props.stat?.pendingCount ?? 0 },
  { label: '进行中', value: props.stat?.processingCount ?? 0 },
  { label: '本周已完成', value: props.stat?.weekCompletedCount ?? 0 }
])
</script>

<template>
  <section class="todo-overview">
    <el-card class="overview-hero" shadow="never">
      <div class="hero-header">
        <div>
          <p class="hero-caption">当前宿舍</p>
          <h2 class="hero-room">{{ roomLabel }}</h2>
        </div>
        <el-button v-if="showCreate" type="primary" @click="emit('create')">新建待办</el-button>
      </div>
      <div class="hero-stats">
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

.hero-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.hero-caption {
  margin: 0 0 6px;
  color: #64748b;
  font-size: 13px;
}

.hero-room {
  margin: 0;
  color: #122033;
  font-size: 28px;
}

.hero-stats {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  padding: 16px;
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
  margin-top: 6px;
  color: #122033;
  font-size: 24px;
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

  .hero-stats {
    grid-template-columns: 1fr;
  }
}
</style>