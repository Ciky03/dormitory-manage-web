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

  it('emits query and reset actions from inline buttons', async () => {
    const wrapper = mount(DormitoryCostFilters, {
      props: {
        modelValue: { keywords: '聚餐', status: '1', month: '2026-03', onlyMine: true, pageNum: 2, pageSize: 10 }
      }
    })

    const buttons = wrapper.findAll('button')
    const resetButton = buttons.find((item) => item.text().includes('重置'))
    const queryButton = buttons.find((item) => item.text().includes('查询'))

    await queryButton.trigger('click')
    await resetButton.trigger('click')

    expect(wrapper.emitted('query')).toHaveLength(1)
    expect(wrapper.emitted('reset')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })
})
