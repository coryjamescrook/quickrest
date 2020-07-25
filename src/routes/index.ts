import { Request, Response } from '../quickrest'

const getSystemStatus = (_req: Request, res: Response) => {
  res.status(200).json({ status: 'working!' })
}

export default {
  getSystemStatus
}
