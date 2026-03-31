import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DormitoryCostFilters from '../components/DormitoryCostFilters.vue'

describe('DormitoryCostFilters', () => {
  it('keeps keywords, status, month, onlyMine, and inline actions visible together', () => {
    const wrapper = mount(DormitoryCostFilters, {
      props: {
        modelValue: { keywords: '', status: '', month: '', onlyMine: false, pageNum: 1, pageSize: 10 }
      }
    })

    expect(wrapper.find('.keywords-item').exists()).toBe(true)
    expect(wrapper.find('.status-item').exists()).toBe(true)
    expect(wrapper.find('.month-item').exists()).toBe(true)
    expect(wrapper.find('.mine-item').exists()).toBe(true)
    expect(wrapper.find('.filter-actions-inline').exists()).toBe(true)
  })
})
