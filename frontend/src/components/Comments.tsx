import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage } from '../lib/api.ts'
import { useAuth } from '../lib/auth.tsx'
import { locale, t } from '../lib/i18n.ts'

type Comment = { id: number; content: string; createdAt: string; user: { id: number; name: string } }
type CommentList = { items: Comment[]; total: number }

const MAX = 1000

// canPost: chỉ tài liệu đã duyệt mới nhận bình luận mới
export default function Comments({ docId, canPost }: { docId: number; canPost: boolean }) {
  const { user } = useAuth()
  const client = useQueryClient()
  const key = ['comments', docId]
  const [text, setText] = useState('')

  const comments = useQuery({
    queryKey: key,
    queryFn: async () => (await api.get<CommentList>(`/documents/${docId}/comments`)).data,
  })

  const add = useMutation({
    mutationFn: async (content: string) => (await api.post<{ comment: Comment }>(`/documents/${docId}/comments`, { content })).data.comment,
    onSuccess: (comment) => {
      setText('')
      client.setQueryData<CommentList>(key, (old) => (old ? { items: [comment, ...old.items], total: old.total + 1 } : old))
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/documents/${docId}/comments/${id}`),
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    if (text.trim()) add.mutate(text.trim())
  }

  const error = (add.isError && errorMessage(add.error)) || (remove.isError && errorMessage(remove.error))

  return (
    <section className="panel shadow-hard">
      <h2 className="border-b-2 border-ink px-5 py-3 font-display font-bold">
        {t('Bình luận')} <span className="font-sans text-sm font-normal text-muted">{comments.data?.total ? `(${comments.data.total})` : ''}</span>
      </h2>

      {canPost &&
        (user ? (
          <form onSubmit={submit} className="border-b-2 border-ink p-5">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={MAX}
              placeholder={t('Tài liệu này có giúp bạn không? Chỗ nào cần lưu ý?')}
              aria-label={t('Viết bình luận')}
              className="field"
            />
            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="text-xs text-muted">
                {text.length}/{MAX}
              </span>
              <button disabled={add.isPending || !text.trim()} className="btn btn-sm btn-ink disabled:opacity-50">
                {add.isPending ? t('Đang gửi...') : t('Gửi bình luận')}
              </button>
            </div>
          </form>
        ) : (
          <p className="border-b-2 border-ink px-5 py-4 text-sm text-muted">
            <Link to="/login" className="underline">
              {t('Đăng nhập')}
            </Link>{' '}
            {t('để viết bình luận.')}
          </p>
        ))}

      {error && (
        <p role="alert" className="animate-pop border-b-2 border-ink border-l-4 border-l-flame px-4 py-2 text-sm">
          {error}
        </p>
      )}

      <ul>
        {comments.data?.items.map((comment) => (
          <li key={comment.id} className="border-ink/15 px-5 py-4 not-last:border-b">
            <p className="flex items-baseline gap-3">
              <span className="font-display font-bold">{comment.user.name}</span>
              <span className="text-xs text-muted">{new Date(comment.createdAt).toLocaleString(locale)}</span>
              {(user?.id === comment.user.id || user?.role === 'ADMIN') && (
                <button
                  onClick={() => remove.mutate(comment.id)}
                  disabled={remove.isPending}
                  className="ml-auto text-xs text-muted underline underline-offset-4 hover:text-ink"
                >
                  {t('Xóa')}
                </button>
              )}
            </p>
            <p className="mt-1 text-sm break-words whitespace-pre-line">{comment.content}</p>
          </li>
        ))}
      </ul>

      {comments.data?.items.length === 0 && <p className="px-5 py-8 text-center text-sm text-muted">{t('Chưa có bình luận nào.')}</p>}
      {comments.isError && <p className="px-5 py-8 text-center text-sm text-muted">{errorMessage(comments.error)}</p>}
    </section>
  )
}
