import { QuickRest } from './quickrest'

const port = 8887
const enableLogging = false

const server = new QuickRest({ enableLogging, port })

server.get('/system_status', (_req, res) => {
  res.json({ status: 'online', current_time: new Date().toISOString() })
})

server.serve(() => {
  console.info(`Successfully started server on port: ${port}`)
})
