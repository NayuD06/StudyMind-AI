import { app } from './app.js'
import { env } from './config/env.js'
import { startMaintenance } from './lib/maintenance.js'

app.listen(env.PORT, () => {
  console.log(`Backend đang chạy tại http://localhost:${env.PORT}`)
  startMaintenance()
})
