import { QuickRest } from './quickrest'

const port = 8887
const enableLogging = true

const server = new QuickRest({ enableLogging, port })

server.get('/system_status', (_req, res) => {
  res.json({ status: 'online', current_time: new Date().toISOString() })
})

server.post('/unauthed', (_req, res) => {
  res.unauthorized({ error: { message: 'You are not authorized to perform this action!' } })
})

server.serve(() => {
  console.info(`Successfully started server on port: ${port}`)
})
