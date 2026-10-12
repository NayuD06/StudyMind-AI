import { Router } from 'express'
import multer from 'multer'
import { optionalAuth, requireAuth } from '../../middlewares/auth.js'
import { uploadLimiter } from '../../middlewares/rateLimit.js'
import { createDocumentSchema, idParamSchema, listDocumentsSchema, ratingSchema } from './documents.schema.js'
import * as documentsService from './documents.service.js'

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024

// Giữ file trong bộ nhớ để kiểm tra nội dung trước, hợp lệ mới ghi xuống đĩa
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 10 },
})

export const documentsRouter = Router()

documentsRouter.get('/', async (req, res) => {
  res.json(await documentsService.listPublicDocuments(listDocumentsSchema.parse(req.query)))
})

documentsRouter.get('/mine', requireAuth, async (req, res) => {
  res.json({ items: await documentsService.listMyDocuments(req.user!) })
})

documentsRouter.get('/favorites', requireAuth, async (req, res) => {
  res.json({ items: await documentsService.listFavorites(req.user!) })
})

documentsRouter.post('/', requireAuth, uploadLimiter, upload.single('file'), async (req, res) => {
  const result = await documentsService.createDocument(createDocumentSchema.parse(req.body), req.file, req.user!)
  res.status(201).json(result)
})

documentsRouter.get('/:id', optionalAuth, async (req, res) => {
  const { id } = idParamSchema.parse(req.params)
  res.json({ document: await documentsService.getDocument(id, req.user) })
})

// ?download=1 để tải về (cần đăng nhập, có ghi lịch sử); mặc định là xem trong trình đọc PDF
documentsRouter.get('/:id/file', optionalAuth, async (req, res) => {
  const { id } = idParamSchema.parse(req.params)
  const download = req.query.download === '1'
  const file = await documentsService.getDocumentFile(id, req.user, download)

  res.type('application/pdf')
  // Tài liệu chưa duyệt cũng đi qua route này nên không cho proxy hay trình duyệt lưu lại
  res.set('Cache-Control', 'private, no-store')
  if (download) return res.download(file.path, file.fileName)
  res.set('Content-Disposition', 'inline')
  res.sendFile(file.path)
})

documentsRouter.put('/:id/rating', requireAuth, async (req, res) => {
  const { id } = idParamSchema.parse(req.params)
  res.json(await documentsService.rateDocument(id, ratingSchema.parse(req.body), req.user!))
})

documentsRouter.put('/:id/favorite', requireAuth, async (req, res) => {
  const { id } = idParamSchema.parse(req.params)
  res.json(await documentsService.setFavorite(id, req.user!, true))
})

documentsRouter.delete('/:id/favorite', requireAuth, async (req, res) => {
  const { id } = idParamSchema.parse(req.params)
  res.json(await documentsService.setFavorite(id, req.user!, false))
})

documentsRouter.delete('/:id', requireAuth, async (req, res) => {
  const { id } = idParamSchema.parse(req.params)
  await documentsService.deleteDocument(id, req.user!)
  res.status(204).end()
})
