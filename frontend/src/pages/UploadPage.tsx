import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type DragEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage } from '../lib/api.ts'
import { useAuth } from '../lib/auth.tsx'
import { fetchSubjects } from '../lib/documents.ts'

const MAX_BYTES = 20 * 1024 * 1024

type PiiFinding = { type: 'email' | 'phone'; page: number; sample: string }
type UploadResult = { document: { id: number; title: string }; piiFindings: PiiFinding[] }

export default function UploadPage() {
  const { user, loading } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<UploadResult | null>(null)

  const client = useQueryClient()
  const subjects = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })

  // Kiểm tra sớm ở trình duyệt cho tiện; server vẫn kiểm tra lại nội dung file
  function pick(picked: File | undefined) {
    setError('')
    if (!picked) return
    if (picked.type !== 'application/pdf') return setError('Chỉ nhận file PDF')
    if (picked.size > MAX_BYTES) return setError('File vượt quá 20 MB')
    setFile(picked)
  }

  function drop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    pick(e.dataTransfer.files[0])
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file) return setError('Chưa chọn file PDF')
    const form = new FormData(e.currentTarget)
    form.set('file', file)
    setBusy(true)
    setError('')
    try {
      setResult((await api.post<UploadResult>('/documents', form)).data)
      client.invalidateQueries({ queryKey: ['my-documents'] })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="font-display text-4xl font-bold">Cần đăng nhập để đăng tài liệu</h1>
        <Link to="/login" className="btn btn-ink mt-6">
          Đăng nhập →
        </Link>
      </div>
    )
  }

  if (result) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="panel shadow-hard animate-pop p-8">
          <p className="font-mono text-xs text-muted">/ ĐÃ GỬI · CHỜ DUYỆT</p>
          <h1 className="mt-2 font-display text-3xl font-bold">{result.document.title}</h1>
          <p className="mt-3 text-muted">
            Tài liệu sẽ hiện trong thư viện sau khi quản trị viên duyệt. Bạn theo dõi trạng thái ở mục "Của tôi".
          </p>

          {result.piiFindings.length > 0 && (
            <div className="mt-6 border-l-4 border-flame bg-mark/40 px-4 py-3">
              <p className="font-display font-bold">Tài liệu có thể chứa thông tin cá nhân</p>
              <p className="mt-1 text-sm">
                Hãy cân nhắc xóa các thông tin này rồi đăng lại nếu chúng không nên công khai.
              </p>
              <ul className="mt-3 space-y-1 font-mono text-xs">
                {result.piiFindings.map((finding) => (
                  <li key={finding.sample}>
                    {finding.type === 'email' ? 'Email' : 'Số điện thoại'} · trang {finding.page} · {finding.sample}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/me" className="btn btn-ink">
              Xem tài liệu của tôi →
            </Link>
            <button
              onClick={() => {
                setResult(null)
                setFile(null)
              }}
              className="btn"
            >
              Đăng tài liệu khác
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="font-mono text-xs text-muted">/ ĐĂNG TÀI LIỆU</p>
      <h1 className="mt-2 overflow-hidden pb-1 font-display text-5xl font-bold">
        <span className="block animate-rise">Chia sẻ tài liệu</span>
      </h1>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={drop}
          className={`block cursor-pointer border-2 border-dashed border-ink px-6 py-14 text-center transition duration-200 ${dragging ? 'scale-[1.02] bg-mark' : 'bg-sheet hover:bg-mark/40'}`}
        >
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          {file ? (
            <p key={file.name} className="animate-pop font-mono">
              {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          ) : (
            <>
              <p className="font-display text-2xl font-bold">Kéo thả file PDF vào đây</p>
              <p className="mt-2 text-muted">hoặc bấm để chọn file · tối đa 20 MB</p>
            </>
          )}
        </label>

        <label className="block">
          <span className="mb-1 block font-display font-bold">Tiêu đề</span>
          <input name="title" required minLength={3} maxLength={200} className="field" />
        </label>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block font-display font-bold">Môn học</span>
            <select name="subjectId" className="field" defaultValue="">
              <option value="">Chưa chọn</option>
              {subjects.data?.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-display font-bold">Trường</span>
            <input name="school" maxLength={120} className="field" />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block font-display font-bold">Mô tả</span>
          <textarea name="description" rows={4} maxLength={2000} className="field" />
        </label>

        {error && (
          <p role="alert" className="animate-pop border-l-4 border-flame bg-sheet px-3 py-2 text-sm">
            {error}
          </p>
        )}

        <button disabled={busy} className="btn btn-flame disabled:opacity-60">
          {busy ? 'Đang tải lên...' : 'Đăng tài liệu →'}
        </button>
      </form>
    </div>
  )
}
