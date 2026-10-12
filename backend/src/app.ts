import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { apiLimiter } from './middlewares/rateLimit.js'
import { router } from './routes/index.js'

export const app = express()

app.use(helmet())
// Chỉ các địa chỉ frontend khai báo trong CORS_ORIGIN mới được gọi API kèm cookie
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
app.use(morgan('dev'))
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())

app.use('/api', apiLimiter, router)

app.use(errorHandler)
