import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import PageHeader, { ErrorNote } from '../components/PageHeader.tsx'
import { api, errorMessage } from '../lib/api.ts'

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
    const note = row._count.documents ? ` ${row._count.documents} tài liệu sẽ mất nhãn môn này (tài liệu vẫn còn).` : ''
    if (window.confirm(`Xóa môn "${row.name}"?${note}`)) remove.mutate(row.id)
  }

  const failed = [create, rename, remove].find((mutation) => mutation.isError)
  const busy = create.isPending || rename.isPending || remove.isPending

  return (
    <>
      <PageHeader code="04 · MÔN HỌC" title="Môn học">
        <form onSubmit={add} className="flex gap-3">
          <input name="name" required minLength={2} maxLength={120} placeholder="Tên môn học mới" className="field w-64 py-2" />
          <button disabled={busy} className="btn btn-sm btn-ink">
            + Thêm
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
                <th>MÔN HỌC</th>
                <th>MÃ</th>
                <th>TÀI LIỆU</th>
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
                  <td className="font-mono tabular-nums">{row._count.documents}</td>
                  <td>
                    <div className="flex justify-end gap-3 whitespace-nowrap">
                      {editingId === row.id ? (
                        <>
                          <button form={`subject-${row.id}`} disabled={busy} className="btn btn-sm btn-ink">
                            Lưu
                          </button>
                          <button onClick={() => setEditingId(null)} className="btn btn-sm">
                            Hủy
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setEditingId(row.id)} className="btn btn-sm">
                            Đổi tên
                          </button>
                          <button disabled={busy} onClick={() => confirmRemove(row)} className="btn btn-sm btn-flame">
                            Xóa
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
                    Chưa có môn học nào.
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
