import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import PageHeader, { ErrorNote } from '../components/PageHeader.tsx'
import { api, errorMessage } from '../lib/api.ts'
import { locale, t } from '../lib/i18n.ts'

type LogRow = {
  id: number
  action: string
  summary: string
  ip: string | null
  createdAt: string
  admin: { name: string; email: string }
}

type LogList = { items: LogRow[]; total: number; page: number; limit: number }

// Nhãn và màu cho từng loại thao tác (xem backend/src/lib/audit.ts)
const ACTIONS: Record<string, { label: string; tone: string }> = {
  ADMIN_LOGIN: { label: t('Đăng nhập'), tone: '' },
  DOCUMENT_APPROVE: { label: t('Duyệt tài liệu'), tone: 'bg-ink text-paper' },
  DOCUMENT_REJECT: { label: t('Từ chối tài liệu'), tone: 'bg-flame' },
  DOCUMENT_DELETE: { label: t('Xóa tài liệu'), tone: 'bg-flame' },
  USER_LOCK: { label: t('Khóa tài khoản'), tone: 'bg-flame' },
  USER_UNLOCK: { label: t('Mở khóa'), tone: '' },
  USER_ROLE: { label: t('Đổi vai trò'), tone: 'bg-mark' },
  SUBJECT_CREATE: { label: t('Thêm môn'), tone: '' },
  SUBJECT_UPDATE: { label: t('Sửa môn'), tone: '' },
  SUBJECT_DELETE: { label: t('Xóa môn'), tone: 'bg-flame' },
  COMMENT_DELETE: { label: t('Xóa bình luận'), tone: 'bg-flame' },
  REPORT_RESOLVE: { label: t('Gỡ theo báo cáo'), tone: 'bg-flame' },
  REPORT_DISMISS: { label: t('Bỏ qua báo cáo'), tone: '' },
}

export default function LogsPage() {
  const [page, setPage] = useState(1)

  const logs = useQuery({
    queryKey: ['admin-logs', page],
    queryFn: async () => (await api.get<LogList>('/admin/logs', { params: { page } })).data,
    placeholderData: keepPreviousData,
  })

  const data = logs.data
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <>
      <PageHeader title={t('Nhật ký quản trị')}>
        <p className="max-w-xs text-right text-sm text-muted">{t('Mọi thao tác của quản trị viên được ghi lại, không sửa hay xóa được.')}</p>
      </PageHeader>

      {logs.isError && <ErrorNote message={errorMessage(logs.error)} />}

      {data && (
        <>
          <div className="panel overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('Thời gian')}</th>
                  <th>{t('Quản trị viên')}</th>
                  <th>{t('Thao tác')}</th>
                  <th>{t('Chi tiết')}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr key={row.id}>
                    <td className="text-sm whitespace-nowrap">{new Date(row.createdAt).toLocaleString(locale)}</td>
                    <td>
                      <p className="font-display font-bold">{row.admin.name}</p>
                      <p className="text-xs text-muted">{row.admin.email}</p>
                    </td>
                    <td>
                      <span className={`tag ${ACTIONS[row.action]?.tone ?? ''}`}>{ACTIONS[row.action]?.label ?? row.action}</span>
                    </td>
                    <td className="text-sm">
                      {row.summary}
                      {row.ip && <span className="ml-2 font-mono text-xs text-muted">IP {row.ip}</span>}
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-muted">
                      {t('Chưa có thao tác nào được ghi.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-sm text-muted">
              {t('{0} dòng, trang {1}/{2}', data.total, data.page, pages)}
            </p>
            <div className="flex gap-3">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-sm">
                {t('← Mới hơn')}
              </button>
              <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="btn btn-sm">
                {t('Cũ hơn →')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
