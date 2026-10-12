import type { NextFunction, Request, Response } from 'express'
import { MulterError } from 'multer'
import { ZodError } from 'zod'
import { HttpError } from '../lib/httpError.js'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message })
  }
  if (err instanceof ZodError) {
    // Lấy lỗi đầu tiên làm thông báo để giao diện hiển thị được ngay
    return res.status(400).json({ message: err.issues[0]?.message ?? 'Dữ liệu không hợp lệ', issues: err.issues })
  }
  if (err instanceof MulterError) {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE'
    return res.status(tooLarge ? 413 : 400).json({ message: tooLarge ? 'File vượt quá 20 MB' : 'File tải lên không hợp lệ' })
  }
  // Không trả chi tiết lỗi nội bộ cho client
  console.error(err)
  res.status(500).json({ message: 'Lỗi máy chủ' })
}
