import { z } from 'zod'

export const listUsersSchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
})

export const listLogsSchema = z.object({ page: z.coerce.number().int().min(1).default(1) })

export const updateUserSchema = z
  .object({
    role: z.enum(['STUDENT', 'ADMIN']).optional(),
    isLocked: z.boolean().optional(),
  })
  .refine((value) => value.role !== undefined || value.isLocked !== undefined, {
    message: 'Không có gì để cập nhật',
  })

export const subjectSchema = z.object({
  name: z.string().trim().min(2, 'Tên môn quá ngắn').max(120, 'Tên môn quá dài'),
})
