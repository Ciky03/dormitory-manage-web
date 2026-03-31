import { describe, expect, it, vi } from 'vitest'
import { createDormitoryCostPageModel } from '../useDormitoryCostPage'

describe('createDormitoryCostPageModel read flows', () => {
  it('loads stat and list, and switches to no-room mode when roomId is empty', async () => {
    const api = {
      fetchDormitoryCostStat: vi
        .fn()
        .mockResolvedValue({
          roomId: '',
          buildingNum: '',
          roomNum: '',
          totalCount: 0,
          unpaidCount: 0,
          monthCompletedCount: 0
        }),
      fetchDormitoryCostList: vi.fn().mockResolvedValue({ list: [], total: 0 })
    }
    const model = createDormitoryCostPageModel({ api, showError: vi.fn() })

    await model.loadBootstrap()

    expect(api.fetchDormitoryCostStat).toHaveBeenCalledTimes(1)
    expect(api.fetchDormitoryCostList).not.toHaveBeenCalled()
    expect(model.state.ui.noRoomBinding).toBe(true)
  })

  it('passes the exact filter payload and opens detail drawer from row selection', async () => {
    const api = {
      fetchDormitoryCostStat: vi
        .fn()
        .mockResolvedValue({
          roomId: 'room-1',
          buildingNum: '1栋',
          roomNum: '101',
          totalCount: 8,
          unpaidCount: 3,
          monthCompletedCount: 2
        }),
      fetchDormitoryCostList: vi.fn().mockResolvedValue({
        list: [{ id: 'cost-1', title: '3月聚餐费用' }],
        total: 1
      }),
      fetchDormitoryCostDetail: vi.fn().mockResolvedValue({
        id: 'cost-1',
        title: '3月聚餐费用',
        status: 1,
        statusLabel: '已发布',
        memberList: []
      })
    }
    const model = createDormitoryCostPageModel({ api, showError: vi.fn() })

    model.updateFilters({ keywords: '聚餐', status: '1', month: '2026-03', onlyMine: true })
    await model.loadList()
    await model.handleSelectCost({ id: 'cost-1' })

    expect(api.fetchDormitoryCostList).toHaveBeenCalledWith({
      keywords: '聚餐',
      status: '1',
      month: '2026-03',
      onlyMine: true,
      pageNum: 1,
      pageSize: 10
    })
    expect(api.fetchDormitoryCostDetail).toHaveBeenCalledWith('cost-1')
    expect(model.state.detail.visible).toBe(true)
    expect(model.state.detail.data.id).toBe('cost-1')
  })

  it('blocks create entry and reports the member source restriction', () => {
    const showError = vi.fn()
    const model = createDormitoryCostPageModel({ showError })

    model.openCreate()

    expect(showError).toHaveBeenCalledWith(null, '待宿舍成员接口补齐后启用新建公摊单')
    expect(model.state.ui.formVisible).toBe(false)
  })

  it('reuses the current filters for pagination and restores defaults on reset', async () => {
    const api = {
      fetchDormitoryCostList: vi.fn().mockResolvedValue({ list: [], total: 0 })
    }
    const model = createDormitoryCostPageModel({ api, showError: vi.fn() })

    model.updateFilters({
      keywords: '  水电  ',
      status: '2',
      month: '2026-03',
      onlyMine: true,
      pageNum: 3,
      pageSize: 20
    })

    await model.handlePageChange(2)
    await model.handlePageSizeChange(15)
    await model.handleReset()

    expect(api.fetchDormitoryCostList).toHaveBeenNthCalledWith(1, {
      keywords: '水电',
      status: '2',
      month: '2026-03',
      onlyMine: true,
      pageNum: 2,
      pageSize: 20
    })
    expect(api.fetchDormitoryCostList).toHaveBeenNthCalledWith(2, {
      keywords: '水电',
      status: '2',
      month: '2026-03',
      onlyMine: true,
      pageNum: 1,
      pageSize: 15
    })
    expect(api.fetchDormitoryCostList).toHaveBeenNthCalledWith(3, {
      keywords: '',
      status: '',
      month: '',
      onlyMine: false,
      pageNum: 1,
      pageSize: 10
    })
  })
})
