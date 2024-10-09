import UserRole from '../enums/UserRole.js'
import { StatusCodes } from 'http-status-codes'

export default (req, res, next) => {
  // 經過驗證後會把 user 放到 req 裡面
  // 如果登入者不是管理員
  if (req.user.role !== UserRole.ADMIN) {
    res.status(StatusCodes.FORBIDDEN).json({ // 403狀態碼，是我知道你是誰，但你沒權限
      success: true,
      message: '沒有權限'
    })
  } else {
    next()
  }
}
