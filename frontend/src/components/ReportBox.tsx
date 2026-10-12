import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { api, errorMessage } from '../lib/api.ts'
import { t } from '../lib/i18n.ts'

const REASONS = [t('Vi phạm bản quyền'), t('Nội dung sai hoặc không liên quan'), t('Chứa thông tin cá nhân'), t('Spam hoặc quảng cáo')]

// Nút "Báo cáo vi phạm" mở ra form ngay tại chỗ
export default function ReportBox({ docId }: { docId: number }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')

  const send = useMutation({
    mutationFn: () => api.post(`/documents/${docId}/reports`, { reason: reason.trim() }),
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    send.mutate()
  }

  if (send.isSuccess) {
    return <p className="animate-pop border-l-4 border-ink bg-mark/40 px-3 py-2 text-sm">{t('Đã gửi báo cáo. Quản trị viên sẽ xem xét và báo lại cho bạn.')}</p>
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="link-wipe font-mono text-xs text-muted hover:text-ink">
        {t('⚑ BÁO CÁO VI PHẠM')}
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="animate-pop space-y-3">
      <p className="font-display font-bold">{t('Báo cáo tài liệu này')}</p>
      <div className="flex flex-wrap gap-2">
        {REASONS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setReason(item + ': ')}
            className="border-2 border-ink bg-sheet px-2 py-1 text-xs transition-colors hover:bg-mark"
          >
            {item}
          </button>
        ))}
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        required
        minLength={10}
        maxLength={500}
        placeholder={t('Mô tả vấn đề (ít nhất 10 ký tự)')}
        aria-label={t('Lý do báo cáo')}
        className="field text-sm"
      />
      {send.isError && (
        <p role="alert" className="border-l-4 border-flame px-3 py-1 text-sm">
          {errorMessage(send.error)}
        </p>
      )}
      <div className="flex gap-3">
        <button disabled={send.isPending} className="btn btn-sm btn-flame disabled:opacity-50">
          {send.isPending ? t('Đang gửi...') : t('Gửi báo cáo')}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-sm">
          {t('Thôi')}
        </button>
      </div>
    </form>
  )
}
