import { Router } from 'express'// 從 express 模組中導入 Router 物件
import { create, login, extend, profile, logout, getAll, edit, addmark, getmark, deletemark, getEvent, getUserShare, getUserFind, getLandmark } from '../controllers/user.js'
import upload from '../middlewares/upload.js'
import * as auth from '../middlewares/auth.js'
const router = Router() // 建立一個新的 Router 實例

router.post('/', create) // 設置路由：當收到 POST 請求發送到根路徑 '/' 時，調用 create 函數來處理該請求
router.post('/login', auth.login, login)
router.patch('/extend', auth.jwt, extend)
router.get('/profile', auth.jwt, profile)
router.get('/', getAll)
router.delete('/logout', auth.jwt, logout)
router.patch('/change', auth.jwt, upload, edit)

// 取得物資募集貼文
router.get('/find', auth.jwt, getUserFind)
// 取得物資分享貼文
router.get('/share', auth.jwt, getUserShare)
// 取得活動貼文
router.get('/event', auth.jwt, getEvent)
// 取得地標
router.get('/landmark', auth.jwt, getLandmark)

// 新增活動收藏
router.post('/toggleFavorite', auth.jwt, addmark)
// 取得活動收藏
router.get('/mark', auth.jwt, getmark)
// 取消活動收藏
router.patch('/mark', auth.jwt, deletemark)
export default router // 將這個 router 模組導出，以便在其他地方使用
