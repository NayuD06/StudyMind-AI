import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DocFields from '../components/DocFields.tsx'
import { api, errorMessage } from '../lib/api.ts'
import { useAuth } from '../lib/auth.tsx'
import type { DocDetail } from '../lib/documents.ts'
import { t } from '../lib/i18n.ts'

export default function EditDocumentPage() {
  const id = Number(useParams().id)
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const client = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Khóa riêng (không dùng chung cache với trang chi tiết) để form luôn mở bằng dữ liệu mới nhất
  const detail = useQuery({
    queryKey: ['document-edit', id, user?.id],
    queryFn: async () => (await api.get<{ document: DocDetail }>(`/documents/${id}`)).data.document,
    enabled: !!user,
    gcTime: 0,
  })
  const doc = detail.data

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.put(`/documents/${id}`, Object.fromEntries(new FormData(e.currentTarget)))
      for (const key of ['my-documents', 'documents', 'document']) client.invalidateQueries({ queryKey: [key] })
      navigate('/me')
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="font-display text-4xl font-bold">{t('Cần đăng nhập để sửa tài liệu')}</h1>
        <Link to="/login" className="btn btn-ink mt-6">
          {t('Đăng nhập')}
        </Link>
      </div>
    )
  }

  // Người khác mở đường dẫn này: tài liệu công khai vẫn tải được nhưng không phải của họ
  const denied = detail.isError || (doc && doc.uploader.id !== user?.id)
  if (denied) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="font-display text-4xl font-bold">{t('Không sửa được tài liệu này')}</h1>
        <p className="mt-3 text-muted">{detail.isError ? errorMessage(detail.error) : t('Chỉ người đăng mới sửa được thông tin tài liệu.')}</p>
        <Link to="/me" className="btn btn-ink mt-6">
          {t('← Tài liệu của tôi')}
        </Link>
      </div>
    )
  }
  if (!doc) return <p className="mx-auto max-w-3xl px-4 py-20 text-sm text-muted">{t('Đang tải dữ liệu...')}</p>

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link to="/me" className="link-wipe text-sm">
        {t('← Tài liệu của tôi')}
      </Link>
      <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">{t('Sửa thông tin')}</h1>

      <p className="mt-4 border-l-4 border-ink bg-sheet px-3 py-2 text-sm">
        {doc.moderationStatus === 'REJECTED'
          ? t('Tài liệu này đang bị từ chối. Lưu xong, nó sẽ quay lại hàng chờ để quản trị viên duyệt lại.')
          : t('Chỉ sửa được thông tin mô tả. Muốn đổi file PDF, hãy xóa tài liệu rồi đăng lại.')}
      </p>
      {doc.rejectReason && (
        <p className="mt-3 border-l-4 border-flame bg-mark/40 px-3 py-2 text-sm">
          {t('Lý do từ chối:')} {doc.rejectReason}
        </p>
      )}

      <form onSubmit={submit} className="mt-8 space-y-6">
        <DocFields defaults={{ ...doc, subjectId: doc.subjects[0]?.subject.id }} />

        {error && (
          <p role="alert" className="border-l-4 border-flame bg-sheet px-3 py-2 text-sm">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-4">
          <button disabled={busy} className="btn btn-flame disabled:opacity-60">
            {busy ? t('Đang lưu...') : t('Lưu thay đổi')}
          </button>
          <Link to="/me" className="btn">
            {t('Hủy')}
          </Link>
        </div>
      </form>
    </div>
  )
}
