import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DormTodoFilters from '../components/DormTodoFilters.vue'

describe('DormTodoFilters', () => {
  it('keeps actions inline with compact status and priority filters', () => {
    const wrapper = mount(DormTodoFilters, {
      props: {
        modelValue: {
          keywords: '',
          status: '',
          priority: '',
          assigneeStudentId: '',
          dueType: '',
          onlyMine: false,
          pageNum: 1,
          pageSize: 10
        },
        assigneeOptions: [{ label: '全部', value: '' }]
      }
    })

    expect(wrapper.find('.filter-form .action-item').exists()).toBe(true)
    expect(wrapper.find('.filter-form .filter-actions-inline').exists()).toBe(true)
    expect(wrapper.find('.status-item').exists()).toBe(true)
    expect(wrapper.find('.priority-item').exists()).toBe(true)
  })
})
