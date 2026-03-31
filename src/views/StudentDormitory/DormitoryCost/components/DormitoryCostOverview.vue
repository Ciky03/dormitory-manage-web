<script setup>
import { computed } from 'vue'

const props = defineProps({
  stat: {
    type: Object,
    required: true
  },
  createDisabled: {
    type: Boolean,
    default: false
  },
  createDisabledText: {
    type: String,
    default: '暂不支持新建公摊单'
  }
})

const emit = defineEmits(['create'])

const roomLabel = computed(() => `${props.stat?.buildingNum || '-'}-${props.stat?.roomNum || '-'}`)
const cards = computed(() => [
  { label: '全部公摊单', value: props.stat?.totalCount ?? 0 },
  { label: '待缴人数', value: props.stat?.unpaidCount ?? 0 },
  { label: '本月已完成公摊单', value: props.stat?.monthCompletedCount ?? 0 }
])
</script>

<template>
  <section class="cost-overview">
    <el-card class="overview-card" shadow="never">
      <div class="overview-header">
        <div class="overview-copy">
          <h2 class="room-label">{{ roomLabel }}</h2>
          <p class="overview-tip">查看宿舍费用公摊概览与个人待缴情况。</p>
        </div>
        <div class="overview-actions">
          <el-button
            class="overview-create-button"
            type="primary"
            :disabled="createDisabled"
            :title="createDisabled ? createDisabledText : '新建公摊单'"
            @click="emit('create')"
          >
            新建公摊单
          </el-button>
          <span v-if="createDisabled" class="create-disabled-text">{{ createDisabledText }}</span>
        </div>
      </div>

      <div class="overview-stats">
        <article v-for="card in cards" :key="card.label" class="stat-card">
          <span class="stat-label">{{ card.label }}</span>
          <strong class="stat-value">{{ card.value }}</strong>
        </article>
      </div>
    </el-card>
  </section>
</template>

<style scoped>
.cost-overview {
  min-height: 0;
}

.overview-card {
  border: 1px solid #dde6f2;
  background: linear-gradient(135deg, #ffffff 0%, #f6f9ff 100%);
}

.overview-card :deep(.el-card__body) {
  display: grid;
  gap: 16px;
  padding: 16px 18px;
}

.overview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.room-label {
  margin: 0;
  color: #122033;
  font-size: 24px;
  line-height: 1.2;
}

.overview-tip {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.overview-actions {
  display: grid;
  justify-items: end;
  gap: 8px;
}

.overview-create-button {
  border-radius: var(--el-border-radius-base);
}

.create-disabled-text {
  max-width: 240px;
  color: #8b95a7;
  font-size: 12px;
  line-height: 1.5;
  text-align: right;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  padding: 14px 16px;
  border: 1px solid #e3ebf6;
  border-radius: 12px;
  background: #f8fbff;
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
  .overview-header {
    flex-direction: column;
  }

  .overview-actions {
    width: 100%;
    justify-items: start;
  }

  .create-disabled-text {
    max-width: none;
    text-align: left;
  }

  .overview-stats {
    grid-template-columns: 1fr;
  }
}
</style>
