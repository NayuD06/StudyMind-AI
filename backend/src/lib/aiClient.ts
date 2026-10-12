import axios from 'axios'
import { env } from '../config/env.js'

// Mọi lời gọi sang AI service đều kèm khóa nội bộ; AI service từ chối request thiếu khóa này
export const aiClient = axios.create({
  baseURL: env.AI_SERVICE_URL,
  headers: { 'X-Internal-Key': env.AI_SERVICE_KEY },
  timeout: 60_000,
})
