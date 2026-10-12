import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import PageHeader, { ErrorNote } from '../components/PageHeader.tsx'
import { api, errorMessage } from '../lib/api.ts'
import { useAuth } from '../lib/auth.tsx'
import { locale, t } from '../lib/i18n.ts'

type Role = 'STUDENT' | 'ADMIN'

type UserRow = {
  id: number
  name: string
  email: string
  role: Role
  isLocked: boolean
  createdAt: string
  _count: { documents: number }
}

type UserList = { items: UserRow[]; total: number; page: number; limit: number }

export default function UsersPage() {
  const { user: me } = useAuth()
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const users = useQuery({
    queryKey: ['admin-users', q, page],
    queryFn: async () => (await api.get<UserList>('/admin/users', { params: { q: q || undefined, page } })).data,
    placeholderData: keepPreviousData,
  })

  const update = useMutation({
    mutationFn: (input: { id: number; role?: Role; isLocked?: boolean }) =>
      api.patch(`/admin/users/${input.id}`, { role: input.role, isLocked: input.isLocked }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setQ(String(new FormData(e.currentTarget).get('q')).trim())
    setPage(1)
  }

  function toggleRole(row: UserRow) {
    const toAdmin = row.role !== 'ADMIN'
    const question = toAdmin
      ? t('Cấp quyền quản trị cho {0}? Người này sẽ duyệt được tài liệu và quản lý người dùng.', row.email)
      : t('Bỏ quyền quản trị của {0}?', row.email)
    if (window.confirm(question)) update.mutate({ id: row.id, role: toAdmin ? 'ADMIN' : 'STUDENT' })
  }

  const data = users.data
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <>
      <PageHeader code={t('04 · NGƯỜI DÙNG')} title={t('Người dùng')}>
        <form onSubmit={search} className="flex gap-3">
          <input name="q" defaultValue={q} maxLength={100} placeholder={t('Tìm theo tên hoặc email')} className="field w-64 py-2" />
          <button className="btn btn-sm">{t('Tìm')}</button>
        </form>
      </PageHeader>

      {users.isError && <ErrorNote message={errorMessage(users.error)} />}
      {update.isError && <ErrorNote message={errorMessage(update.error)} />}

      {data && (
        <>
          <div className="panel overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('NGƯỜI DÙNG')}</th>
                  <th>{t('VAI TRÒ')}</th>
                  <th>{t('TÀI LIỆU')}</th>
                  <th>{t('NGÀY TẠO')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr key={row.id} className={row.isLocked ? 'opacity-60' : ''}>
                    <td>
                      <p className="font-display font-bold">
                        {row.name}
                        {row.id === me?.id && <span className="tag ml-2 bg-mark">{t('BẠN')}</span>}
                      </p>
                      <p className="font-mono text-xs text-muted">{row.email}</p>
                    </td>
                    <td>
                      <span className={`tag ${row.role === 'ADMIN' ? 'bg-ink text-paper' : ''}`}>{row.role === 'ADMIN' ? t('QUẢN TRỊ') : t('SINH VIÊN')}</span>
                      {row.isLocked && <span className="tag ml-2 bg-flame">{t('ĐÃ KHÓA')}</span>}
                    </td>
                    <td className="font-mono tabular-nums">{row._count.documents}</td>
                    <td className="font-mono text-xs whitespace-nowrap">{new Date(row.createdAt).toLocaleDateString(locale)}</td>
                    <td>
                      {/* Server cũng chặn việc tự khóa hoặc tự hạ quyền */}
                      {row.id !== me?.id && (
                        <div className="flex justify-end gap-3 whitespace-nowrap">
                          <button disabled={update.isPending} onClick={() => toggleRole(row)} className="btn btn-sm">
                            {row.role === 'ADMIN' ? t('Bỏ quyền quản trị') : t('Cấp quyền quản trị')}
                          </button>
                          <button
                            disabled={update.isPending}
                            onClick={() => update.mutate({ id: row.id, isLocked: !row.isLocked })}
                            className={`btn btn-sm ${row.isLocked ? '' : 'btn-flame'}`}
                          >
                            {row.isLocked ? t('Mở khóa') : t('Khóa')}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted">
                      {t('Không tìm thấy người dùng nào.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="font-mono text-xs text-muted">
              {data.total} {t('NGƯỜI DÙNG · TRANG')} {data.page}/{pages}
            </p>
            <div className="flex gap-3">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-sm">
                {t('← Trước')}
              </button>
              <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="btn btn-sm">
                {t('Sau →')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
