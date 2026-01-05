<script setup>
const props = defineProps({
  /** el-table data */
  data: { type: Array, default: () => [] },

  /** extra props passed to el-table */
  tableProps: { type: Object, default: () => ({}) },

  /** el-table height for internal scroll */
  tableHeight: { type: [String, Number], default: '100%' }
})
</script>

<template>
  <!-- Simple table wrapper without pagination -->
  <div class="table-card">
    <div class="table-card__wrap">
      <el-table
        :data="data"
        border
        class="table-card__table"
        :height="tableHeight"
        v-bind="tableProps"
      >
        <template #empty>
          <el-empty />
        </template>
        <!-- Column definitions from parent -->
        <slot />
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.table-card {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: #ffffff;
  border-radius: 0;
  box-shadow: none;
   /* 关键：把高度吃满（依赖父级有明确高度） */
   height: 100%;
}

.table-card__wrap {
  flex: 1;
    /* 关键：让 el-table 的 100% 有参照 */
    height: 100%;
  min-height: 0;
}

.table-card__table :deep(.el-table__header-wrapper th.el-table__cell) {
  background: #f9fbff;
}
</style>
