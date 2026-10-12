import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { errorMessage } from '../lib/api.ts'
import { fetchFile } from '../lib/documents.ts'

// Phải đặt worker ngay trong file dùng <Document>, nếu không react-pdf ghi đè bằng giá trị mặc định
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

const ZOOMS = [0.75, 1, 1.25, 1.5, 2]

function Note({ text }: { text: string }) {
  return <p className="grid min-h-[28rem] place-items-center px-6 text-center font-mono text-xs text-muted">{text}</p>
}

export default function PdfViewer({ docId }: { docId: number }) {
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [width, setWidth] = useState(0)
  const frame = useRef<HTMLDivElement>(null)

  // File không đổi sau khi đăng nên giữ lại trong suốt phiên, không tải lại mỗi lần quay về tab
  const file = useQuery({
    queryKey: ['document-file', docId],
    queryFn: () => fetchFile(docId),
    staleTime: Infinity,
    gcTime: 5 * 60_000,
  })

  // Trang PDF vẽ theo bề rộng khung chứa để vừa cả màn hình hẹp
  useEffect(() => {
    const el = frame.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const go = (next: number) => setPage(Math.min(Math.max(1, next), pages || 1))
  const step = (dir: 1 | -1) => setZoom(ZOOMS[Math.min(Math.max(0, ZOOMS.indexOf(zoom) + dir), ZOOMS.length - 1)])

  return (
    <div className="panel shadow-hard flex flex-col">
      <div className="flex items-center gap-2 border-b-2 border-ink px-3 py-2 font-mono text-xs">
        <button onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Trang trước" className="border-2 border-ink px-2 py-1 transition-colors hover:bg-mark disabled:opacity-30">
          ←
        </button>
        <input
          value={page}
          onChange={(e) => go(Number(e.target.value.replace(/\D/g, '')) || 1)}
          inputMode="numeric"
          aria-label="Số trang"
          className="w-12 border-2 border-ink bg-sheet py-1 text-center outline-none focus:bg-mark"
        />
        <span className="text-muted">/ {pages || '?'}</span>
        <button onClick={() => go(page + 1)} disabled={page >= pages} aria-label="Trang sau" className="border-2 border-ink px-2 py-1 transition-colors hover:bg-mark disabled:opacity-30">
          →
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => step(-1)} disabled={zoom === ZOOMS[0]} aria-label="Thu nhỏ" className="border-2 border-ink px-2 py-1 transition-colors hover:bg-mark disabled:opacity-30">
            −
          </button>
          <span className="w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => step(1)} disabled={zoom === ZOOMS.at(-1)} aria-label="Phóng to" className="border-2 border-ink px-2 py-1 transition-colors hover:bg-mark disabled:opacity-30">
            +
          </button>
        </div>
      </div>

      <div ref={frame} className="max-h-[80vh] min-h-[28rem] overflow-auto bg-paper">
        {file.isPending && <Note text="ĐANG TẢI FILE..." />}
        {file.isError && <Note text={errorMessage(file.error)} />}
        {file.data && width > 0 && (
          <Document
            file={file.data}
            onLoadSuccess={(pdf) => setPages(pdf.numPages)}
            loading={<Note text="ĐANG MỞ PDF..." />}
            error={<Note text="Không mở được file PDF này." />}
          >
            <Page key={page} pageNumber={page} width={width * zoom} loading={<Note text={`TRANG ${page}...`} />} className="animate-pop" />
          </Document>
        )}
      </div>
    </div>
  )
}
