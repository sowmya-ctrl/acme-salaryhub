import { vi } from 'vitest'
import api from './api'
import { downloadFile } from './download'

vi.mock('./api', () => ({ default: { get: vi.fn() } }))

let clicked
beforeEach(() => {
  vi.clearAllMocks()
  clicked = null
  URL.createObjectURL = vi.fn(() => 'blob:fake')
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
    clicked = { href: this.href, download: this.download }
  })
})

it('fetches the file through the authenticated client and triggers a download', async () => {
  api.get.mockResolvedValue({
    data: new Blob(['a,b']),
    headers: { 'content-disposition': 'attachment; filename="employees.csv"' },
  })

  await downloadFile('/employees/export', { status: 'active' }, 'fallback.csv')

  expect(api.get).toHaveBeenCalledWith('/employees/export', { params: { status: 'active' }, responseType: 'blob' })
  expect(clicked).toEqual({ href: 'blob:fake', download: 'employees.csv' })
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake')
})

it('uses the fallback file name when the server sends none', async () => {
  api.get.mockResolvedValue({ data: new Blob(['x']), headers: {} })

  await downloadFile('/employees/export', undefined, 'fallback.csv')

  expect(clicked.download).toBe('fallback.csv')
})

it('propagates failures so the caller can show an error', async () => {
  api.get.mockRejectedValue(new Error('boom'))

  await expect(downloadFile('/employees/export', undefined, 'x.csv')).rejects.toThrow('boom')
  expect(clicked).toBeNull()
})
