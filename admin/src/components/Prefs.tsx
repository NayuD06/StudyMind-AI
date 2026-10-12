import { lang, setLang, t, type Lang } from '../lib/i18n.ts'
import { toggleTheme, useTheme } from '../lib/theme.ts'

const LANGS: Lang[] = ['vi', 'en']

type Props = { onDark?: boolean; className?: string }

// Hai nút dùng chung: đổi giao diện sáng/tối và đổi ngôn ngữ.
// onDark: khi đặt trên khối nền đen (chân trang, thanh bên)
export default function Prefs({ onDark = false, className = '' }: Props) {
  const dark = useTheme() === 'dark'
  const frame = onDark ? 'border-paper text-paper' : 'border-ink bg-sheet text-ink'
  const hover = onDark ? 'hover:bg-flame hover:text-ink' : 'hover:bg-mark'
  const picked = onDark ? 'bg-paper text-ink' : 'bg-ink text-paper'

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={toggleTheme}
        aria-label={dark ? t('Chuyển sang giao diện sáng') : t('Chuyển sang giao diện tối')}
        title={dark ? t('Giao diện sáng') : t('Giao diện tối')}
        className={`grid size-9 shrink-0 place-items-center border-2 transition-colors ${frame} ${hover}`}
      >
        {/* Ô vuông nửa đặc nửa rỗng, lật ngược khi đổi giao diện */}
        <svg viewBox="0 0 24 24" className={`size-4 transition-transform duration-500 ${dark ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M4 4h16v16H4z" />
          <path d="M4 4h16L4 20z" fill="currentColor" />
        </svg>
      </button>

      <div role="group" aria-label={t('Đổi ngôn ngữ')} className={`flex h-9 shrink-0 border-2 font-mono text-xs font-semibold ${frame}`}>
        {LANGS.map((code) => (
          <button
            key={code}
            onClick={() => code !== lang && setLang(code)}
            aria-pressed={code === lang}
            lang={code}
            className={`px-2 uppercase transition-colors ${code === lang ? picked : hover}`}
          >
            {code}
          </button>
        ))}
      </div>
    </div>
  )
}
