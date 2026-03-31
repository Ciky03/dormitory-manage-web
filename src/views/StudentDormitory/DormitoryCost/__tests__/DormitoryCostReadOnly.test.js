import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DormitoryCostFormDialog from '../components/DormitoryCostFormDialog.vue'

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

const setStudentUser = () => {
  localStorage.setItem(
    USER_STORAGE_KEY,
    JSON.stringify({
      userType: '1',
      businessUserId: 'stu-1',
      studentId: 'stu-1'
    })
  )
}

const resetState = () => {
  Object.assign(testContext.state.stat.data, {
    roomId: 'room-1',
    buildingNum: '1栋',
    roomNum: '101',
    totalCount: 8,
    unpaidCount: 3,
    monthCompletedCount: 2
  })
  Object.assign(testContext.state.filters, {
    keywords: '',
    status: '',
    month: '',
    onlyMine: false,
    pageNum: 1,
    pageSize: 10
  })
  testContext.state.list.loading = false
  testContext.state.list.items = [
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
  ]
  testContext.state.list.total = 1
  testContext.state.detail.visible = false
  testContext.state.detail.loading = false
  testContext.state.detail.data = null
  testContext.state.ui.pageLoading = false
  testContext.state.ui.bootstrapError = ''
  testContext.state.ui.noRoomBinding = false
  testContext.state.ui.formVisible = false
  testContext.state.ui.formMode = 'create'
  testContext.state.ui.memberSourceUnavailable = true
}

const buildWrapper = async (options = {}) => {
  const { default: DormitoryCostPage } = await import('../index.vue')
  return mount(DormitoryCostPage, {
    global: {
      stubs: {
        teleport: true,
        transition: false,
        ElDrawer: {
          props: ['modelValue', 'title'],
          template: '<div v-if="modelValue" class="drawer-stub"><div>{{ title }}</div><slot /></div>'
        },
        ...options.stubs
      }
    }
  })
}

describe('DormitoryCost page shell', () => {
  beforeEach(() => {
    testContext.loadBootstrap.mockReset()
    testContext.handleSelectCost.mockReset()
    resetState()
    setStudentUser()
  })

  it('renders student room stats, the table, and a disabled create action', async () => {
    const wrapper = await buildWrapper()
    await flushPromises()

    expect(testContext.loadBootstrap).toHaveBeenCalled()
    expect(wrapper.text()).toContain('1栋-101')
    expect(wrapper.text()).toContain('3月聚餐费用')
    expect(wrapper.text()).toContain('待缴人数')
    expect(wrapper.find('.overview-create-button').attributes('disabled')).toBeDefined()
  })

  it('renders a non-student empty state without bootstrapping', async () => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ userType: '2', businessUserId: 'teacher-1' }))

    const wrapper = await buildWrapper()
    await flushPromises()

    expect(testContext.loadBootstrap).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('当前用户不是学生')
  })

  it('renders a no-room-binding empty state for students', async () => {
    testContext.state.ui.noRoomBinding = true

    const wrapper = await buildWrapper()
    await flushPromises()

    expect(testContext.loadBootstrap).toHaveBeenCalled()
    expect(wrapper.text()).toContain('当前学生暂未绑定宿舍')
  })

  it('renders bootstrap errors with a retry entry point', async () => {
    testContext.state.ui.bootstrapError = '加载失败'

    const wrapper = await buildWrapper()
    await flushPromises()

    expect(wrapper.text()).toContain('加载失败')
    expect(wrapper.text()).toContain('重试')
  })

  it('wires the table detail entry point and renders the detail drawer shell', async () => {
    testContext.state.detail.visible = true
    testContext.state.detail.data = {
      title: '3月聚餐费用',
      totalAmount: 168,
      initiatorName: '张三',
      occurredDate: '2026-03-30',
      dueTime: '2026-04-02 22:00',
      statusLabel: '已发布',
      remark: '凭证待补'
    }

    const wrapper = await buildWrapper()
    await flushPromises()

    const detailButton = wrapper.findAll('button').find((item) => item.text().includes('查看详情'))
    expect(detailButton).toBeTruthy()
    await detailButton.trigger('click')

    expect(testContext.handleSelectCost).toHaveBeenCalledWith(testContext.state.list.items[0])
    expect(wrapper.text()).toContain('公摊详情')
    expect(wrapper.text()).toContain('凭证待补')
  })
})

describe('DormitoryCostFormDialog', () => {
  it('shows the placeholder alert only for disabled create mode', () => {
    const createWrapper = mount(DormitoryCostFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        form: {},
        disabledCreate: true
      },
      global: {
        stubs: {
          teleport: true,
          transition: false,
          ElDialog: {
            props: ['modelValue', 'title'],
            template: '<div v-if="modelValue"><div>{{ title }}</div><slot /><slot name="footer" /></div>'
          }
        }
      }
    })

    const editWrapper = mount(DormitoryCostFormDialog, {
      props: {
        visible: true,
        mode: 'edit',
        form: {},
        disabledCreate: true
      },
      global: {
        stubs: {
          teleport: true,
          transition: false,
          ElDialog: {
            props: ['modelValue', 'title'],
            template: '<div v-if="modelValue"><div>{{ title }}</div><slot /><slot name="footer" /></div>'
          }
        }
      }
    })

    expect(createWrapper.text()).toContain('宿舍成员数据暂不可用')
    expect(editWrapper.text()).not.toContain('宿舍成员数据暂不可用')
  })
})
