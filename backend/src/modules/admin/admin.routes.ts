import { Router } from 'express'
import { requireAdmin, requireAuth } from '../../middlewares/auth.js'
import {
  idParamSchema,
  moderateSchema,
  moderationQuerySchema,
  reportQuerySchema,
  resolveReportSchema,
} from '../documents/documents.schema.js'
import * as reportsService from '../documents/reports.service.js'
import * as documentsService from '../documents/documents.service.js'
import { listLogsSchema, listUsersSchema, subjectSchema, updateUserSchema } from './admin.schema.js'
import * as adminService from './admin.service.js'

export const adminRouter = Router()

// Mọi route quản trị đều cần đăng nhập và có vai trò ADMIN
adminRouter.use(requireAuth, requireAdmin)

adminRouter.get('/stats', async (_req, res) => {
  res.json(await adminService.getStats())
})

adminRouter.get('/documents', async (req, res) => {
  const { status } = moderationQuerySchema.parse(req.query)
  res.json({ items: await documentsService.listForModeration(status) })
})

adminRouter.patch('/documents/:id/moderation', async (req, res) => {
  const { id } = idParamSchema.parse(req.params)
  const document = await documentsService.moderateDocument(id, moderateSchema.parse(req.body), req.user!)
  res.json({ document })
})

adminRouter.get('/reports', async (req, res) => {
  const { status } = reportQuerySchema.parse(req.query)
  res.json({ items: await reportsService.listReports(status) })
})

adminRouter.patch('/reports/:id', async (req, res) => {
  const { id } = idParamSchema.parse(req.params)
  await reportsService.resolveReport(id, resolveReportSchema.parse(req.body), req.user!)
  res.status(204).end()
})

adminRouter.get('/users', async (req, res) => {
  res.json(await adminService.listUsers(listUsersSchema.parse(req.query)))
})

adminRouter.patch('/users/:id', async (req, res) => {
  const { id } = idParamSchema.parse(req.params)
  res.json({ user: await adminService.updateUser(id, updateUserSchema.parse(req.body), req.user!) })
})

adminRouter.get('/subjects', async (_req, res) => {
  res.json({ items: await adminService.listSubjects() })
})

adminRouter.post('/subjects', async (req, res) => {
  res.status(201).json({ subject: await adminService.createSubject(subjectSchema.parse(req.body), req.user!) })
})

adminRouter.patch('/subjects/:id', async (req, res) => {
  const { id } = idParamSchema.parse(req.params)
  res.json({ subject: await adminService.updateSubject(id, subjectSchema.parse(req.body), req.user!) })
})

adminRouter.delete('/subjects/:id', async (req, res) => {
  const { id } = idParamSchema.parse(req.params)
  await adminService.deleteSubject(id, req.user!)
  res.status(204).end()
})

adminRouter.get('/logs', async (req, res) => {
  res.json(await adminService.listLogs(listLogsSchema.parse(req.query)))
})
