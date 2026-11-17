import api from './api'

/**
 * Download a file from an authenticated endpoint. A plain <a href> cannot send the
 * Authorization header, so we fetch the bytes and hand the browser a temporary blob URL.
 */
export async function downloadFile(url, params, fallbackName) {
  const response = await api.get(url, { params, responseType: 'blob' })
  const disposition = response.headers?.['content-disposition'] ?? ''
  const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? fallbackName

  const blobUrl = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(blobUrl)
}
