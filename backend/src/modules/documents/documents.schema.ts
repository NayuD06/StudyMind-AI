import { z } from 'zod'

// Form gửi chuỗi rỗng khi người dùng không chọn; coi như không có giá trị
const optionalId = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.coerce.number('Mã không hợp lệ').int().positive('Mã không hợp lệ').optional(),
)

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined)

export const createDocumentSchema = z.object({
  title: z.string().trim().min(3, 'Tiêu đề quá ngắn').max(200),
  description: optionalText(2000),
  school: optionalText(120),
  major: optionalText(120),
  subjectId: optionalId,
})

export const listDocumentsSchema = z.object({
  q: z.string().trim().max(200).optional(),
  subjectId: optionalId,
  sort: z.enum(['new', 'popular']).default('new'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
})

export const ratingSchema = z.object({ score: z.number().int().min(1).max(5) })

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() })

export const moderationQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
})

export const moderateSchema = z
  .object({
    status: z.enum(['APPROVED', 'REJECTED']),
    reason: z.string().trim().max(500).optional(),
  })
  .refine((value) => value.status === 'APPROVED' || !!value.reason, {
    message: 'Cần ghi lý do khi từ chối',
    path: ['reason'],
  })
