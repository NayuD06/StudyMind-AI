import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.ts'

type Notification = { id: number; message: string; documentId: number | null; readAt: string | null; createdAt: string }
type NotificationList = { items: Notification[]; unread: number }

const POLL_MS = 60_000

export default function NotificationBell({ userId }: { userId: number }) {
  const client = useQueryClient()
  const key = ['notifications', userId]
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  const list = useQuery({
    queryKey: key,
    queryFn: async () => (await api.get<NotificationList>('/notifications')).data,
    refetchInterval: POLL_MS,
  })

  // Trên server đánh dấu đã đọc ngay khi mở; trên màn hình vẫn giữ nền vàng cho tới lần mở sau để biết cái nào mới
  const markRead = useMutation({
    mutationFn: () => api.post('/notifications/read'),
    onSuccess: () => client.setQueryData<NotificationList>(key, (old) => (old ? { ...old, unread: 0 } : old)),
  })

  // Bấm ra ngoài hoặc nhấn Esc thì đóng
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function toggle() {
    if (open) {
      // Đóng lại rồi thì lần mở sau không còn cái nào "mới"
      client.invalidateQueries({ queryKey: key })
    } else if (list.data?.unread) {
      markRead.mutate()
    }
    setOpen(!open)
  }

  const unread = list.data?.unread ?? 0

  return (
    <div ref={box} className="relative">
      <button
        onClick={toggle}
        aria-label={unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
        aria-expanded={open}
        className={`relative grid size-9 place-items-center border-2 border-ink transition-colors ${open ? 'bg-ink text-paper' : 'bg-sheet hover:bg-mark'}`}
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
          <path d="M6 17V10a6 6 0 0 1 12 0v7M3 17h18M10 21h4" />
        </svg>
        {unread > 0 && (
          <span key={unread} className="absolute -top-2 -right-2 animate-pop border-2 border-ink bg-flame px-1 font-mono text-[10px] leading-4 text-ink">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        // Điện thoại: trải ngang màn hình ngay dưới header; màn hình rộng: thả xuống dưới cái chuông
        <div className="panel shadow-hard fixed inset-x-4 top-[4.25rem] z-30 max-h-[70vh] animate-pop overflow-y-auto sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-3 sm:w-[22rem]">
          <p className="border-b-2 border-ink px-4 py-2 font-mono text-xs text-muted">THÔNG BÁO</p>
          {list.data?.items.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">Chưa có thông báo nào.</p>}
          <ul>
            {list.data?.items.map((item) => {
              const body = (
                <>
                  <span className="block text-sm">{item.message}</span>
                  <span className="mt-1 block font-mono text-[11px] text-muted">{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                </>
              )
              const tone = `block border-ink px-4 py-3 not-last:border-b-2 ${item.readAt ? '' : 'bg-mark/40'}`
              return (
                <li key={item.id}>
                  {item.documentId ? (
                    <Link to={`/documents/${item.documentId}`} onClick={() => setOpen(false)} className={`${tone} transition-colors hover:bg-mark`}>
                      {body}
                    </Link>
                  ) : (
                    <div className={tone}>{body}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
