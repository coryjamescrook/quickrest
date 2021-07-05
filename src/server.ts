import { QuickRest } from './quickrest'

const port = 8887
const enableLogging = true

const server = new QuickRest({ enableLogging, port })

server.get('/system_status', (_req, res) => {
  res.json({ status: 'online', current_time: new Date().toISOString() })
})

server.get('/unauthed', (_req, res) => {
  res.unauthorized({ error: { message: 'You are not authorized to perform this action!' } })
})

server.get('/fail', (_req, res) => {
  res.json({ message: 'Hello!' })
})

server.use('*', (req) => {
  console.log(
    `Incoming request:
    ${req.method} ${req.url}
    at: ${new Date().toISOString()}
    by ip: ${req.socket.remoteAddress}
    `
  )
})

server.use('/fail', async (_req, res) => {
  await res.badRequest()
})

server.serve(() => {
  console.info(`Successfully started server on port: ${port}`)
})
