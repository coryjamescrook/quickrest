import qr, { Request, Response } from './quickrest'
import routes from './routes'

const server = qr({ enableLogging: true })

server.port(3053)
server.setDefaultHeaders({ name: 'Content-Type', value: 'application/json' })

const loggingMw = (req: Request, _res: Response) => {
  if (server.loggingEnabled) {
    console.log('reached endpoint:', req.url)
  }
}

server.use('*', loggingMw)
server.get('/system_status', routes.getSystemStatus)
server.get('/testing', (_req, res) => {
  res.status(201).send({ name: 'River', age: 1.5 })
}, () => {
  console.log('hit the testing endpoint, custom middleware here...')
})

server.serve(() => {
  console.log('listening on port 3053')
})
