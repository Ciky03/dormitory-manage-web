<script setup>
import { computed, ref } from 'vue'
import AddButton from '../../../components/button/AddButton.vue'
import QueryButton from '../../../components/button/QueryButton.vue'
import ResetButton from '../../../components/button/ResetButton.vue'
import SearchInput from '../../../components/list/SearchInput.vue'
import PageList from '../../../components/list/pageList.vue'

const keywords = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const selectedBuildingId = ref('')

const buildingList = ref([])
const roomList = ref([])

const filteredRooms = computed(() => {
  const keyword = keywords.value.trim()
  return roomList.value.filter((room) => {
    const matchBuilding = selectedBuildingId.value
      ? room.buildingId === selectedBuildingId.value
      : true
    const matchKeyword = keyword
      ? String(room.roomNo || '').includes(keyword) ||
        String(room.buildingNo || '').includes(keyword)
      : true
    return matchBuilding && matchKeyword
  })
})

const total = computed(() => filteredRooms.value.length)

const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRooms.value.slice(start, start + pageSize.value)
})

const handleQuery = () => {
  currentPage.value = 1
}

const handleReset = () => {
  keywords.value = ''
  selectedBuildingId.value = ''
  currentPage.value = 1
}

const handleSelectBuilding = (building) => {
  selectedBuildingId.value = building?.id ?? ''
  currentPage.value = 1
}
</script>

<template>
  <section class="room-page">
    <div class="room-content">
      <aside class="room-building">
        <div class="room-building__header">
          <AddButton class="room-building__add" size="default">新增楼栋</AddButton>
        </div>
        <div class="room-building__list">
          <button
            v-for="building in buildingList"
            :key="building.id"
            type="button"
            class="room-building__item"
            :class="{ 'room-building__item--active': building.id === selectedBuildingId }"
            @click="handleSelectBuilding(building)"
          >
            {{ building.buildingNo || '-' }}
          </button>
        </div>
      </aside>

      <div class="room-main">
        <div class="room-card room-card--search">
          <div class="room-search">
            <SearchInput
              v-model="keywords"
              label="关键字"
              placeholder="宿舍号/楼栋号"
              width="100%"
              @enter="handleQuery"
            />
            <div class="room-search__actions">
              <QueryButton @click="handleQuery" />
              <ResetButton @click="handleReset" />
            </div>
          </div>
        </div>

        <PageList
          :data="tableData"
          :total="total"
          v-model:currentPage="currentPage"
          v-model:pageSize="pageSize"
          :table-props="{ border: true }"
          table-height="100%"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column label="宿舍号" min-width="140">
            <template #default="{ row }">
              {{ row.roomNo || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="楼栋号" min-width="140">
            <template #default="{ row }">
              {{ row.buildingNo || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="宿舍可住人数" min-width="160">
            <template #default="{ row }">
              {{ row.capacity ?? '-' }}
            </template>
          </el-table-column>
          <el-table-column label="创建时间" min-width="180">
            <template #default="{ row }">
              {{ row.createdAt || '-' }}
            </template>
          </el-table-column>
        </PageList>
      </div>
    </div>
  </section>
</template>

<style scoped>
.room-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
  height: 100%;
  overflow: hidden;
}

.room-content {
  display: flex;
  gap: 16px;
  flex: 1 1 auto;
  min-height: 0;
}

.room-building {
  width: 220px;
  background: #ffffff;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.room-building__header {
  display: flex;
  align-items: center;
}

.room-building__add {
  width: 100%;
}

.room-building__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
}

.room-building__item {
  text-align: left;
  padding: 8px 12px;
  border: 1px solid #ebeef5;
  background: #ffffff;
  cursor: pointer;
  border-radius: 6px;
}

.room-building__item--active {
  border-color: #409eff;
  color: #409eff;
}

.room-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1 1 auto;
  min-width: 0;
}

.room-card {
  background: #ffffff;
  border-radius: 0;
  box-shadow: none;
}

.room-card--search {
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.room-search {
  display: flex;
  align-items: center;
  gap: 16px;
}

.room-search > :first-child {
  flex: 1 1 auto;
  min-width: 0;
}

.room-search__actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

@media (max-width: 1024px) {
  .room-content {
    flex-direction: column;
  }

  .room-building {
    width: 100%;
  }

  .room-search {
    flex-direction: column;
    align-items: stretch;
  }

  .room-search__actions {
    justify-content: flex-start;
  }
}
</style>
    
