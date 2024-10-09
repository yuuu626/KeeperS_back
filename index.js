import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import { StatusCodes } from 'http-status-codes'
import mongoSanitize from 'express-mongo-sanitize' // 防止 MongoDB 資料注入的中間件
// import rateLimit from 'express-rate-limit' // 限制請求速率的中間件
import routeUser from './routes/user.js'
import routeEvent from './routes/event.js'
import routeMaterial from './routes/material.js'
import routeLandmark from './routes/landmark.js'
import routeComment from './routes/comment.js'
import './passport/passport.js'
const app = express() // 建立網頁伺服器

// 限制請求頻率，設定15分鐘內最多 100 個請求
// app.use(rateLimit({
//   windowMs: 1000 * 60 * 15,
//   max: 100,
//   standardHeaders: 'draft-7',
//   legacyHeaders: false,
//   statusCode: StatusCodes.TOO_MANY_REQUESTS,
//   message: '太多請求',
//   //   超出流量時的回應
//   handler (req, res, next, options) { // options得到上面的設定值
//     res.status(options.statusCode).json({
//       success: false,
//       message: options.message
//     })
//   }
// }))

// 設置 CORS 策略，檢查來源來限制誰可以發請求
app.use(cors({ // 套用到每個路由
  // origin = 請求的來源，告訴後端請求是哪個網域發過來的，通常在network > request headers > origin 看得到
  // callback(錯誤, 是否允許)
  origin (origin, callback) {
    if (origin === undefined || // 代表請求是後端送過來的
        // 允許來自 github.io、localhost 或 127.0.0.1 這些來源的請求，而拒絕其他來源的請求
        origin.includes('github.io') || origin.includes('localhost') || origin.includes('127.0.0.1')
    ) {
      callback(null, true)
    } else {
      callback(new Error('CORS'), false)
    }
  }
}))

// 將傳入的 body 解析為 json
app.use(express.json())
// 處理json格式可能的錯誤
app.use((_, req, res, next) => {
  res.status(StatusCodes.BAD_REQUEST).json({
    success: false,
    message: '資料格式錯誤'
  })
})

app.use(mongoSanitize())// 把 $ 開頭的欄位從req.body裡刪掉

app.use('/user', routeUser)
app.use('/event', routeEvent)
app.use('/material', routeMaterial)
app.use('/landmark', routeLandmark)
app.use('/comment', routeComment)
// .all處理所有的請求方式，*所有路徑，只要沒有被上面處理的請求都會進到app.all裡
app.all('*', routeUser)

// 處理所有未知路徑的請求，並回傳一個明確的錯誤訊息給用戶端
app.all('*', (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: '找不到'
  })
})

// 啟動伺服器
app.listen(process.env.PORT || 4000, async () => {
  console.log('伺服器啟動')
  await mongoose.connect(process.env.DB_URL)
  mongoose.set('sanitizeFilter', true) // 過濾不安全符號 $
  console.log('資料庫連線成功') // 連線到資料庫
})
