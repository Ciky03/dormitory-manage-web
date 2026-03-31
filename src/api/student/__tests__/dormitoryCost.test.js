import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../request', () => ({
  request: vi.fn()
}))

import { request } from '../../request'
import {
  addDormitoryCost,
  cancelDormitoryCost,
  deleteDormitoryCost,
  editDormitoryCost,
  fetchDormitoryCostDetail,
  fetchDormitoryCostList,
  fetchDormitoryCostStat,
  payDormitoryCost,
  publishDormitoryCost,
  uploadDormitoryCostAttach
} from '../dormitoryCost'

describe('dormitoryCost api', () => {
  beforeEach(() => {
    request.mockReset()
    request.mockResolvedValue({ code: '200', data: {} })
  })

  it('uses the exact read and write paths', async () => {
    await fetchDormitoryCostStat()
    await fetchDormitoryCostList({ keywords: '聚餐', status: '1', month: '2026-03', onlyMine: true, pageNum: 1, pageSize: 10 })
    await fetchDormitoryCostDetail('cost-1')
    await addDormitoryCost({ title: '3月聚餐费用' })
    await editDormitoryCost('cost-1', { title: '更新标题' })
    await publishDormitoryCost('cost-1')
    await payDormitoryCost('detail-1', { voucherAttachId: 'att-2' })
    await cancelDormitoryCost('cost-1')
    await deleteDormitoryCost('cost-1')

    expect(request).toHaveBeenNthCalledWith(1, '/dormitory/cost/stat', { method: 'GET' })
    expect(request).toHaveBeenNthCalledWith(
      2,
      '/dormitory/cost/list?keywords=%E8%81%9A%E9%A4%90&status=1&month=2026-03&onlyMine=true&pageNum=1&pageSize=10',
      { method: 'GET' }
    )
    expect(request).toHaveBeenNthCalledWith(3, '/dormitory/cost/detail/cost-1', { method: 'GET' })
    expect(request).toHaveBeenNthCalledWith(4, '/dormitory/cost/add', { method: 'POST', body: { title: '3月聚餐费用' } })
    expect(request).toHaveBeenNthCalledWith(5, '/dormitory/cost/edit/cost-1', { method: 'PUT', body: { title: '更新标题' } })
    expect(request).toHaveBeenNthCalledWith(6, '/dormitory/cost/publish/cost-1', { method: 'POST' })
    expect(request).toHaveBeenNthCalledWith(7, '/dormitory/cost/pay/detail-1', { method: 'POST', body: { voucherAttachId: 'att-2' } })
    expect(request).toHaveBeenNthCalledWith(8, '/dormitory/cost/cancel/cost-1', { method: 'POST' })
    expect(request).toHaveBeenNthCalledWith(9, '/dormitory/cost/del/cost-1', { method: 'DELETE' })
  })

  it('uploads attachments as form-data with the business bucket', async () => {
    const file = new File(['voucher'], 'voucher.png', { type: 'image/png' })
    await uploadDormitoryCostAttach(file)

    const [, options] = request.mock.calls[0]
    expect(request).toHaveBeenCalledWith('/attach/upload', expect.objectContaining({ method: 'POST' }))
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.body.get('file')).toBe(file)
    expect(options.body.get('bucket')).toBe('dm-business-cost')
  })
})
