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
  ADMIN_LOGIN: { label: t('ĐĂNG NHẬP'), tone: '' },
  DOCUMENT_APPROVE: { label: t('DUYỆT TÀI LIỆU'), tone: 'bg-ink text-paper' },
  DOCUMENT_REJECT: { label: t('TỪ CHỐI TÀI LIỆU'), tone: 'bg-flame' },
  DOCUMENT_DELETE: { label: t('XÓA TÀI LIỆU'), tone: 'bg-flame' },
  USER_LOCK: { label: t('KHÓA TÀI KHOẢN'), tone: 'bg-flame' },
  USER_UNLOCK: { label: t('MỞ KHÓA'), tone: '' },
  USER_ROLE: { label: t('ĐỔI VAI TRÒ'), tone: 'bg-mark' },
  SUBJECT_CREATE: { label: t('THÊM MÔN'), tone: '' },
  SUBJECT_UPDATE: { label: t('SỬA MÔN'), tone: '' },
  SUBJECT_DELETE: { label: t('XÓA MÔN'), tone: 'bg-flame' },
  COMMENT_DELETE: { label: t('XÓA BÌNH LUẬN'), tone: 'bg-flame' },
  REPORT_RESOLVE: { label: t('GỠ THEO BÁO CÁO'), tone: 'bg-flame' },
  REPORT_DISMISS: { label: t('BỎ QUA BÁO CÁO'), tone: '' },
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
      <PageHeader code={t('06 · NHẬT KÝ')} title={t('Nhật ký quản trị')}>
        <p className="max-w-xs text-right text-sm text-muted">{t('Mọi thao tác của quản trị viên được ghi lại, không sửa hay xóa được.')}</p>
      </PageHeader>

      {logs.isError && <ErrorNote message={errorMessage(logs.error)} />}

      {data && (
        <>
          <div className="panel overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('THỜI GIAN')}</th>
                  <th>{t('QUẢN TRỊ VIÊN')}</th>
                  <th>{t('THAO TÁC')}</th>
                  <th>{t('CHI TIẾT')}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-xs whitespace-nowrap">{new Date(row.createdAt).toLocaleString(locale)}</td>
                    <td>
                      <p className="font-display font-bold">{row.admin.name}</p>
                      <p className="font-mono text-xs text-muted">{row.admin.email}</p>
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
            <p className="font-mono text-xs text-muted">
              {data.total} {t('DÒNG · TRANG')} {data.page}/{pages}
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
