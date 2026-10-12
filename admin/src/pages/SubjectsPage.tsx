import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import PageHeader, { ErrorNote } from '../components/PageHeader.tsx'
import { api, errorMessage } from '../lib/api.ts'
import { t } from '../lib/i18n.ts'

type SubjectRow = { id: number; name: string; slug: string; _count: { documents: number } }

export default function SubjectsPage() {
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<number | null>(null)

  const subjects = useQuery({
    queryKey: ['admin-subjects'],
    queryFn: async () => (await api.get<{ items: SubjectRow[] }>('/admin/subjects')).data.items,
  })

  const refresh = () => {
    setEditingId(null)
    queryClient.invalidateQueries({ queryKey: ['admin-subjects'] })
    queryClient.invalidateQueries({ queryKey: ['stats'] })
  }

  const create = useMutation({ mutationFn: (name: string) => api.post('/admin/subjects', { name }), onSuccess: refresh })
  const rename = useMutation({
    mutationFn: (input: { id: number; name: string }) => api.patch(`/admin/subjects/${input.id}`, { name: input.name }),
    onSuccess: refresh,
  })
  const remove = useMutation({ mutationFn: (id: number) => api.delete(`/admin/subjects/${id}`), onSuccess: refresh })

  function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    create.mutate(String(new FormData(form).get('name')), { onSuccess: () => form.reset() })
  }

  function save(e: FormEvent<HTMLFormElement>, id: number) {
    e.preventDefault()
    rename.mutate({ id, name: String(new FormData(e.currentTarget).get('name')) })
  }

  function confirmRemove(row: SubjectRow) {
    const note = row._count.documents ? t(' {0} tài liệu sẽ mất nhãn môn này (tài liệu vẫn còn).', row._count.documents) : ''
    if (window.confirm(t('Xóa môn "{0}"?{1}', row.name, note))) remove.mutate(row.id)
  }

  const failed = [create, rename, remove].find((mutation) => mutation.isError)
  const busy = create.isPending || rename.isPending || remove.isPending

  return (
    <>
      <PageHeader title={t('Môn học')}>
        <form onSubmit={add} className="flex gap-3">
          <input name="name" required minLength={2} maxLength={120} placeholder={t('Tên môn học mới')} className="field w-64 py-2" />
          <button disabled={busy} className="btn btn-sm btn-ink">
            {t('+ Thêm')}
          </button>
        </form>
      </PageHeader>

      {subjects.isError && <ErrorNote message={errorMessage(subjects.error)} />}
      {failed && <ErrorNote message={errorMessage(failed.error)} />}

      {subjects.data && (
        <div className="panel overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t('Môn học')}</th>
                <th>{t('Mã')}</th>
                <th>{t('Tài liệu')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {subjects.data.map((row) => (
                <tr key={row.id}>
                  <td>
                    {editingId === row.id ? (
                      <form id={`subject-${row.id}`} onSubmit={(e) => save(e, row.id)}>
                        <input name="name" defaultValue={row.name} required minLength={2} maxLength={120} autoFocus className="field py-1.5" />
                      </form>
                    ) : (
                      <span className="font-display font-bold">{row.name}</span>
                    )}
                  </td>
                  <td className="font-mono text-xs text-muted">{row.slug}</td>
                  <td className="tabular-nums">{row._count.documents}</td>
                  <td>
                    <div className="flex justify-end gap-3 whitespace-nowrap">
                      {editingId === row.id ? (
                        <>
                          <button form={`subject-${row.id}`} disabled={busy} className="btn btn-sm btn-ink">
                            {t('Lưu')}
                          </button>
                          <button onClick={() => setEditingId(null)} className="btn btn-sm">
                            {t('Hủy')}
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setEditingId(row.id)} className="btn btn-sm">
                            {t('Đổi tên')}
                          </button>
                          <button disabled={busy} onClick={() => confirmRemove(row)} className="btn btn-sm btn-flame">
                            {t('Xóa')}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {subjects.data.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted">
                    {t('Chưa có môn học nào.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
