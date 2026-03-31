import { describe, expect, it, vi } from 'vitest'
import { createDormitoryCostPageModel } from '../useDormitoryCostPage'

describe('createDormitoryCostPageModel read flows', () => {
  it('starts with create enabled until member loading proves otherwise', () => {
    const model = createDormitoryCostPageModel({ showError: vi.fn() })

    expect(model.state.ui.memberSourceUnavailable).toBe(false)
  })

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
        buildingNum: '1栋',
        roomNum: '101',
        totalCount: 8,
        unpaidCount: 3,
        monthCompletedCount: 2
      }),
      fetchDormitoryCostList: vi.fn().mockResolvedValue({
        list: [{ id: 'cost-1', title: '3月聚餐费用' }],
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
    expect(model.state.list.items).toEqual([{ id: 'cost-1', title: '3月聚餐费用' }])
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
      fetchDormitoryCostDetail: vi.fn().mockImplementation(() => detailPromise)
    }
    const model = createDormitoryCostPageModel({ api, showError: vi.fn() })

    model.updateFilters({ keywords: ' 聚餐 ', status: '1', month: '2026-03', onlyMine: true })
    await model.loadList()
    model.state.detail.data = { id: 'old-detail' }
    const loadingPromise = model.handleSelectCost({ id: 'cost-1' })

    expect(model.state.detail.data).toBeNull()

    resolveDetail({
      id: 'cost-1',
      title: '3月聚餐费用',
      status: 1,
      statusLabel: '已发布',
      memberList: []
    })
    await loadingPromise

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

  it('opens create and seeds the member list when room members are available', async () => {
    const api = {
      fetchDormitoryRoomMembers: vi.fn().mockResolvedValue([
        { studentId: 'stu-1', studentName: '张三', isCurrentUser: true, avatarUrl: 'https://example.com/a.png' },
        { studentId: 'stu-2', studentName: '李四', isCurrentUser: false, avatarUrl: 'https://example.com/b.png' }
      ])
    }
    const model = createDormitoryCostPageModel({ api, showError: vi.fn() })

    model.state.form.id = 'old-id'
    model.state.form.title = 'old-title'
    model.state.ui.formVisible = false
    model.state.ui.memberSourceUnavailable = true

    await model.openCreate()

    expect(api.fetchDormitoryRoomMembers).toHaveBeenCalledTimes(1)
    expect(model.state.ui.memberSourceUnavailable).toBe(false)
    expect(model.state.ui.formMode).toBe('create')
    expect(model.state.ui.formVisible).toBe(true)
    expect(model.state.form).toEqual({
      id: '',
      title: '',
      totalAmount: '',
      occurredDate: '',
      dueTime: '',
      remark: '',
      sourceVoucherAttachId: '',
      sourceVoucherUrl: '',
      memberList: [
        { studentId: 'stu-1', studentName: '张三', amountDue: '' },
        { studentId: 'stu-2', studentName: '李四', amountDue: '' }
      ]
    })
  })

  it('keeps create closed and reports when room members are unavailable', async () => {
    const showError = vi.fn()
    const api = {
      fetchDormitoryRoomMembers: vi.fn().mockResolvedValue([])
    }
    const model = createDormitoryCostPageModel({ api, showError })

    await model.openCreate()

    expect(api.fetchDormitoryRoomMembers).toHaveBeenCalledTimes(1)
    expect(model.state.ui.memberSourceUnavailable).toBe(true)
    expect(model.state.ui.formVisible).toBe(false)
    expect(showError).toHaveBeenCalledWith(null, '当前宿舍暂无可用于公摊的成员数据')
  })

  it('keeps create closed and reports when room member loading rejects', async () => {
    const showError = vi.fn()
    const api = {
      fetchDormitoryRoomMembers: vi.fn().mockRejectedValue(new Error('boom'))
    }
    const model = createDormitoryCostPageModel({ api, showError })

    await model.openCreate()

    expect(api.fetchDormitoryRoomMembers).toHaveBeenCalledTimes(1)
    expect(model.state.ui.memberSourceUnavailable).toBe(true)
    expect(model.state.ui.formVisible).toBe(false)
    expect(showError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'boom' }),
      '当前宿舍暂无可用于公摊的成员数据'
    )
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

  it('publishes, pays, cancels, and deletes with the expected api chain and refreshes stat list detail', async () => {
    const api = {
      fetchDormitoryCostStat: vi.fn().mockResolvedValue({
        roomId: 'room-1',
        buildingNum: '1栋',
        roomNum: '101',
        totalCount: 1,
        unpaidCount: 1,
        monthCompletedCount: 0
      }),
      fetchDormitoryCostList: vi.fn().mockResolvedValue({
        list: [{ id: 'cost-1', title: '3月聚餐费用' }],
        total: 1
      }),
      fetchDormitoryCostDetail: vi.fn().mockResolvedValue({
        id: 'cost-1',
        title: '3月聚餐费用',
        status: 0,
        statusLabel: '草稿',
        canPublish: true,
        canPay: true,
        canCancel: true,
        memberList: [
          {
            detailId: 'detail-1',
            studentId: 'stu-1',
            studentName: '张三',
            amountDue: 42,
            isCurrentUser: true
          }
        ]
      }),
      fetchDormitoryRoomMembers: vi.fn().mockResolvedValue([
        { studentId: 'stu-1', studentName: '张三', isCurrentUser: true, avatarUrl: '' }
      ]),
      publishDormitoryCost: vi.fn().mockResolvedValue({}),
      uploadDormitoryCostAttach: vi.fn().mockResolvedValue({ data: { id: 'att-pay', url: 'https://example.com/pay.png' } }),
      payDormitoryCost: vi.fn().mockResolvedValue({}),
      cancelDormitoryCost: vi.fn().mockResolvedValue({}),
      deleteDormitoryCost: vi.fn().mockResolvedValue({})
    }
    const model = createDormitoryCostPageModel({ api, showError: vi.fn() })

    await model.loadBootstrap()
    await model.handleSelectCost({ id: 'cost-1' })
    await model.handlePublish()
    model.openPayDialog()
    await model.handlePayVoucherChange(new File(['voucher'], 'voucher.png', { type: 'image/png' }))
    await model.submitPay()
    await model.handleCancel()
    await model.handleDeleteDraft()

    expect(api.publishDormitoryCost).toHaveBeenCalledWith('cost-1')
    expect(api.uploadDormitoryCostAttach).toHaveBeenCalledTimes(1)
    expect(api.payDormitoryCost).toHaveBeenCalledWith('detail-1', { voucherAttachId: 'att-pay' })
    expect(api.cancelDormitoryCost).toHaveBeenCalledWith('cost-1')
    expect(api.deleteDormitoryCost).toHaveBeenCalledWith('cost-1')
    expect(api.fetchDormitoryCostStat).toHaveBeenCalledTimes(5)
    expect(api.fetchDormitoryCostList).toHaveBeenCalledTimes(5)
    expect(api.fetchDormitoryCostDetail).toHaveBeenCalledTimes(4)
    expect(model.state.detail.visible).toBe(false)
    expect(model.state.list.selectedId).toBe('')
  })

  it('opens pay dialog from current user member detail and stores uploaded voucher before submit', async () => {
    const api = {
      fetchDormitoryCostDetail: vi.fn().mockResolvedValue({
        id: 'cost-1',
        status: 1,
        canPay: true,
        memberList: [
          {
            detailId: 'detail-1',
            studentId: 'stu-1',
            studentName: '张三',
            amountDue: 42,
            isCurrentUser: true
          },
          {
            detailId: 'detail-2',
            studentId: 'stu-2',
            studentName: '李四',
            amountDue: 42,
            isCurrentUser: false
          }
        ]
      }),
      uploadDormitoryCostAttach: vi.fn().mockResolvedValue({ id: 'att-pay', url: 'https://example.com/pay.png' }),
      payDormitoryCost: vi.fn().mockResolvedValue({}),
      fetchDormitoryCostStat: vi.fn().mockResolvedValue({
        roomId: 'room-1',
        buildingNum: '1栋',
        roomNum: '101',
        totalCount: 1,
        unpaidCount: 0,
        monthCompletedCount: 1
      }),
      fetchDormitoryCostList: vi.fn().mockResolvedValue({ list: [{ id: 'cost-1' }], total: 1 })
    }
    const model = createDormitoryCostPageModel({ api, showError: vi.fn() })

    await model.handleSelectCost({ id: 'cost-1' })
    model.openPayDialog()
    await model.handlePayVoucherChange(new File(['voucher'], 'voucher.png', { type: 'image/png' }))

    expect(model.state.pay.visible).toBe(true)
    expect(model.state.pay.detailId).toBe('detail-1')
    expect(model.state.pay.studentName).toBe('张三')
    expect(model.state.pay.amountDue).toBe(42)
    expect(model.state.pay.voucherAttachId).toBe('att-pay')
    expect(model.state.pay.voucherUrl).toBe('https://example.com/pay.png')

    await model.submitPay()

    expect(api.payDormitoryCost).toHaveBeenCalledWith('detail-1', { voucherAttachId: 'att-pay' })
  })
})
