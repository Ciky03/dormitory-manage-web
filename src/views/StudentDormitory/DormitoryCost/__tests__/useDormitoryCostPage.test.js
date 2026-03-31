import { describe, expect, it, vi } from 'vitest'
import { createDormitoryCostPageModel } from '../useDormitoryCostPage'

describe('createDormitoryCostPageModel read flows', () => {
  it('loads stat and list, and switches to no-room mode when roomId is empty', async () => {
    const api = {
      fetchDormitoryCostStat: vi.fn().mockResolvedValue({
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

  it('loads stat and list when roomId exists and preserves the list result', async () => {
    const api = {
      fetchDormitoryCostStat: vi.fn().mockResolvedValue({
        roomId: 'room-1',
        buildingNum: '1\u6811',
        roomNum: '101',
        totalCount: 8,
        unpaidCount: 3,
        monthCompletedCount: 2
      }),
      fetchDormitoryCostList: vi.fn().mockResolvedValue({
        list: [{ id: 'cost-1', title: '3\u6708\u805a\u9910\u8d39\u7528' }],
        total: 1
      })
    }
    const model = createDormitoryCostPageModel({ api, showError: vi.fn() })

    await model.loadBootstrap()

    expect(api.fetchDormitoryCostStat).toHaveBeenCalledTimes(1)
    expect(api.fetchDormitoryCostList).toHaveBeenCalledWith({
      keywords: '',
      status: '',
      month: '',
      onlyMine: false,
      pageNum: 1,
      pageSize: 10
    })
    expect(model.state.list.items).toEqual([{ id: 'cost-1', title: '3\u6708\u805a\u9910\u8d39\u7528' }])
    expect(model.state.list.total).toBe(1)
    expect(model.state.ui.noRoomBinding).toBe(false)
  })

  it('passes the exact filter payload and clears stale detail data while loading selection', async () => {
    let resolveDetail
    const detailPromise = new Promise((resolve) => {
      resolveDetail = resolve
    })
    const api = {
      fetchDormitoryCostStat: vi.fn().mockResolvedValue({
        roomId: 'room-1',
        buildingNum: '1\u6811',
        roomNum: '101',
        totalCount: 8,
        unpaidCount: 3,
        monthCompletedCount: 2
      }),
      fetchDormitoryCostList: vi.fn().mockResolvedValue({
        list: [{ id: 'cost-1', title: '3\u6708\u805a\u9910\u8d39\u7528' }],
        total: 1
      }),
      fetchDormitoryCostDetail: vi.fn().mockImplementation(() => detailPromise)
    }
    const model = createDormitoryCostPageModel({ api, showError: vi.fn() })

    model.updateFilters({ keywords: ' \u805a\u9910 ', status: '1', month: '2026-03', onlyMine: true })
    await model.loadList()
    model.state.detail.data = { id: 'old-detail' }
    const loadingPromise = model.handleSelectCost({ id: 'cost-1' })

    expect(model.state.detail.data).toBeNull()

    resolveDetail({
      id: 'cost-1',
      title: '3\u6708\u805a\u9910\u8d39\u7528',
      status: 1,
      statusLabel: '\u5df2\u53d1\u5e03',
      memberList: []
    })
    await loadingPromise

    expect(api.fetchDormitoryCostList).toHaveBeenCalledWith({
      keywords: '\u805a\u9910',
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

  it('clears stale detail state when bootstrap falls into no-room or error', async () => {
    const noRoomApi = {
      fetchDormitoryCostStat: vi.fn().mockResolvedValue({
        roomId: '',
        buildingNum: '',
        roomNum: '',
        totalCount: 0,
        unpaidCount: 0,
        monthCompletedCount: 0
      }),
      fetchDormitoryCostList: vi.fn().mockResolvedValue({ list: [], total: 0 })
    }
    const noRoomModel = createDormitoryCostPageModel({ api: noRoomApi, showError: vi.fn() })
    noRoomModel.state.detail.visible = true
    noRoomModel.state.detail.data = { id: 'old-detail' }
    noRoomModel.state.list.selectedId = 'old-detail'

    await noRoomModel.loadBootstrap()

    expect(noRoomApi.fetchDormitoryCostList).not.toHaveBeenCalled()
    expect(noRoomModel.state.detail.visible).toBe(false)
    expect(noRoomModel.state.detail.data).toBeNull()
    expect(noRoomModel.state.list.selectedId).toBe('')

    const errorApi = {
      fetchDormitoryCostStat: vi.fn().mockRejectedValue(new Error('boom')),
      fetchDormitoryCostList: vi.fn().mockResolvedValue({ list: [], total: 0 })
    }
    const errorModel = createDormitoryCostPageModel({ api: errorApi, showError: vi.fn() })
    errorModel.state.detail.visible = true
    errorModel.state.detail.data = { id: 'old-detail' }
    errorModel.state.list.selectedId = 'old-detail'

    await errorModel.loadBootstrap()

    expect(errorModel.state.detail.visible).toBe(false)
    expect(errorModel.state.detail.data).toBeNull()
    expect(errorModel.state.list.selectedId).toBe('')
    expect(errorModel.state.ui.bootstrapError).toBe('boom')
  })

  it('blocks create entry and reports the member source restriction', () => {
    const showError = vi.fn()
    const model = createDormitoryCostPageModel({ showError })

    model.openCreate()

    expect(showError).toHaveBeenCalledWith(
      null,
      '\u5f85\u5bbf\u820d\u6210\u5458\u63a5\u53e3\u8865\u9f50\u540e\u542f\u7528\u65b0\u5efa\u516c\u62a5\u5355'
    )
    expect(model.state.ui.formVisible).toBe(false)
  })

  it('reuses the current filters for pagination and restores defaults on reset', async () => {
    const api = {
      fetchDormitoryCostList: vi.fn().mockResolvedValue({ list: [], total: 0 })
    }
    const model = createDormitoryCostPageModel({ api, showError: vi.fn() })

    model.updateFilters({
      keywords: '  \u6c34\u7535  ',
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
      keywords: '\u6c34\u7535',
      status: '2',
      month: '2026-03',
      onlyMine: true,
      pageNum: 2,
      pageSize: 20
    })
    expect(api.fetchDormitoryCostList).toHaveBeenNthCalledWith(2, {
      keywords: '\u6c34\u7535',
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
