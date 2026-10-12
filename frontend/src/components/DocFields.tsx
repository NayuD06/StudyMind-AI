import { useQuery } from '@tanstack/react-query'
import { fetchSubjects } from '../lib/documents.ts'
import { t } from '../lib/i18n.ts'

type Defaults = { title?: string; subjectId?: number; school?: string | null; major?: string | null; description?: string | null }

// Các ô thông tin của tài liệu, dùng chung cho form đăng mới và form sửa
export default function DocFields({ defaults = {} }: { defaults?: Defaults }) {
  const subjects = useQuery({ queryKey: ['subjects'], queryFn: fetchSubjects })

  return (
    <>
      <label className="block">
        <span className="mb-1 block font-display font-bold">{t('Tiêu đề')}</span>
        <input name="title" required minLength={3} maxLength={200} defaultValue={defaults.title} className="field" />
      </label>

      <label className="block">
        <span className="mb-1 block font-display font-bold">{t('Môn học')}</span>
        {/* key: danh sách môn tải xong sau thì select mới nhận đúng giá trị mặc định */}
        <select key={subjects.data?.length ?? 0} name="subjectId" className="field" defaultValue={defaults.subjectId ?? ''}>
          <option value="">{t('Chưa chọn')}</option>
          {subjects.data?.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {t(subject.name)}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block font-display font-bold">{t('Trường')}</span>
          <input name="school" maxLength={120} defaultValue={defaults.school ?? ''} className="field" />
        </label>
        <label className="block">
          <span className="mb-1 block font-display font-bold">{t('Ngành')}</span>
          <input name="major" maxLength={120} defaultValue={defaults.major ?? ''} className="field" />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block font-display font-bold">{t('Mô tả')}</span>
        <textarea name="description" rows={4} maxLength={2000} defaultValue={defaults.description ?? ''} className="field" />
      </label>
    </>
  )
}
