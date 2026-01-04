<script setup>
    import { computed } from 'vue'
    import PaginationBar from './PaginationBar.vue'
    
    const props = defineProps({
      /** el-table 的数据（通常是已经在父组件切好分页的 tableData） */
      data: { type: Array, default: () => [] },
    
      /** 总条数（用于 PaginationBar） */
      total: { type: Number, default: 0 },
    
      /** v-model:currentPage */
      currentPage: { type: Number, default: 1 },
    
      /** v-model:pageSize */
      pageSize: { type: Number, default: 10 },
    
      /** 透传给 el-table 的额外参数 */
      tableProps: { type: Object, default: () => ({}) },
    
      /** el-table 的高度（配合内部 flex 滚动） */
      tableHeight: { type: [String, Number], default: '100%' },
    
      /** 分页区域额外 class（可选） */
      paginationClass: { type: String, default: '' }
    })
    
    const emit = defineEmits(['update:currentPage', 'update:pageSize'])
    
    const currentPageProxy = computed({
      get: () => props.currentPage,
      set: (val) => emit('update:currentPage', val)
    })
    
    const pageSizeProxy = computed({
      get: () => props.pageSize,
      set: (val) => emit('update:pageSize', val)
    })
    </script>
    
    <template>
      <!-- ✅ 通用：表格(可滚动) + 分页(固定底部) -->
      <div class="table-card">
        <div class="table-card__wrap">
          <el-table
            :data="data"
            border
            class="table-card__table"
            :height="tableHeight"
            v-bind="tableProps"
          >
            <!-- ✅ 让父组件把列定义以 slot 形式传进来 -->
            <slot />
          </el-table>
        </div>
    
        <div class="table-card__pagination" :class="paginationClass">
          <PaginationBar
            v-model:current-page="currentPageProxy"
            v-model:page-size="pageSizeProxy"
            :total="total"
          />
        </div>
      </div>
    </template>
    
    <style scoped>
    /* ✅ 原 role-card--table 的核心能力：上表格(可滚) + 下分页(固定) */
    .table-card {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      background: #ffffff;
      border-radius: 0;
      box-shadow: none;
    }
    
    .table-card__wrap {
      flex: 1;
      min-height: 0;
    }
    
    .table-card__pagination {
      flex: 0 0 auto;
      display: flex;
      justify-content: flex-end;
      padding-top: 12px;
    }
    
    /* 表头背景（如果你希望通用组件也带这个默认样式） */
    .table-card__table :deep(.el-table__header-wrapper th.el-table__cell) {
      background: #f9fbff;
    }
    </style>
    