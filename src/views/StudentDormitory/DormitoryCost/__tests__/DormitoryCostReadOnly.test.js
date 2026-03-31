import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const USER_STORAGE_KEY = import.meta.env.VITE_USER_STORAGE_KEY ?? 'current_user'

const testContext = vi.hoisted(() => ({
  loadBootstrap: vi.fn(),
  loadList: vi.fn(),
  updateFilters: vi.fn(),
  handleReset: vi.fn(),
  handleSelectCost: vi.fn(),
  handlePageChange: vi.fn(),
  handlePageSizeChange: vi.fn(),
  openCreate: vi.fn(),
  closeForm: vi.fn(),
  closePayDialog: vi.fn(),
  handleCloseDetail: vi.fn(),
  state: {
    stat: {
      data: {
        roomId: 'room-1',
        buildingNum: '1栋',
        roomNum: '101',
        totalCount: 8,
        unpaidCount: 3,
        monthCompletedCount: 2
      }
    },
    filters: { keywords: '', status: '', month: '', onlyMine: false, pageNum: 1, pageSize: 10 },
    list: {
      loading: false,
      items: [
        {
          id: 'cost-1',
          title: '3月聚餐费用',
          totalAmount: 168,
          initiatorName: '张三',
          occurredDate: '2026-03-30',
          dueTime: '2026-04-02 22:00',
          statusLabel: '已发布',
          myAmountDue: 42,
          myPayStatusLabel: '未缴'
        }
      ],
      total: 1
    },
    detail: { visible: false, loading: false, data: null },
    form: {
      id: '',
      title: '',
      totalAmount: '',
      occurredDate: '',
      dueTime: '',
      remark: '',
      sourceVoucherAttachId: '',
      sourceVoucherUrl: '',
      memberList: []
    },
    pay: { visible: false, detailId: '', studentName: '', amountDue: '', voucherAttachId: '', voucherUrl: '' },
    ui: {
      pageLoading: false,
      bootstrapError: '',
      noRoomBinding: false,
      formVisible: false,
      formMode: 'create',
      memberSourceUnavailable: true
    }
  }
}))

vi.mock('../useDormitoryCostPage', () => ({
  createDormitoryCostPageModel: () => testContext
}))

describe('DormitoryCost page shell', () => {
  beforeEach(() => {
    testContext.loadBootstrap.mockReset()
    localStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify({
        userType: '1',
        businessUserId: 'stu-1',
        studentId: 'stu-1'
      })
    )
  })

  it('renders student room stats, the table, and a disabled create action', async () => {
    const { default: DormitoryCostPage } = await import('../index.vue')
    const wrapper = mount(DormitoryCostPage, {
      global: {
        stubs: {
          teleport: true,
          transition: false
        }
      }
    })

    await flushPromises()

    expect(testContext.loadBootstrap).toHaveBeenCalled()
    expect(wrapper.text()).toContain('1栋-101')
    expect(wrapper.text()).toContain('3月聚餐费用')
    expect(wrapper.text()).toContain('待缴人数')
    expect(wrapper.find('.overview-create-button').attributes('disabled')).toBeDefined()
  })
})
