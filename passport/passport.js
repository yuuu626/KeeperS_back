import passport from 'passport'
import passportLocal from 'passport-local'
import passportJWT from 'passport-jwt'
import bcrypt from 'bcrypt'
import User from '../models/user.js'

passport.use('login', new passportLocal.Strategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await User.findOne({ email })
    if (!user) {
      throw new Error('EMAIL')
    }
    if (!bcrypt.compareSync(password, user.password)) {
      throw new Error('PASSWORD')
    }
    return done(null, user, null)
  } catch (error) {
    console.log(error)
    if (error.message === 'EMAIL') {
      return done(null, null, { message: '信箱不存在' })
    } else if (error.message === 'PASSWORD') {
      return done(null, null, { message: '使用者密碼錯誤' })
    } else {
      return done(null, null, { message: '未知錯誤' })
    }
  }
}))

passport.use('jwt', new passportJWT.Strategy({
  jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  passReqToCallback: true,
  ignoreExpiration: true
  // 預設只有 payload(解出來的資訊) 和 done(進到下一步的function)
  // 須加上passReqToCallback: true才可以用req去取得一些請求資訊
}, async (req, payload, done) => {
  // 手動判斷過期，某些路由可以允許過期的jwt，這樣才可以發舊換新的請求
  try {
    // exp過期時間，換毫秒(*1000)， 檢查 JWT 是否過期，如果比現在還小代表過期了 // iat 甚麼時候簽發的
    const expired = payload.exp * 1000 < new Date().getTime()
    // 判斷請求的網址
    const url = req.baseUrl + req.path
    // 如果 JWT 已過期且網址不是 `/user/extend` 或 `/user/logout`
    if (expired && url !== '/user/extend' && url !== '/user/logout') {
      throw new Error('EXPIRED')
    }
    // 從請求中提取 JWT token
    const token = passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken()(req)
    // 在資料庫中查找使用者，確保 JWT 和使用者的關聯性
    const user = await User.findOne({ _id: payload._id, tokens: token })
    if (!user) {
      throw new Error('JWT')
    }
    // 將使用者和 token 作為成功的結果傳遞給下一個處理程序
    return done(null, { user, token }, null)
  } catch (error) {
    console.log(error)
    if (error.message === 'EXPIRED') {
      return done(null, null, { message: '登入過期' })
    } else if (error.message === 'JWT') {
      return done(null, null, { message: '登入無效' })
    } else {
      return done(null, null, { message: '未知錯誤' })
    }
  }
}))
