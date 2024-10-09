import { Router } from 'express'
import * as auth from '../middlewares/auth.js'
import upload from '../middlewares/upload.js'
// import admin from '../middlewares/admin.js'
import { create, getAll, edit, getId, deleteId } from '../controllers/event.js'

const router = Router()

// 請求進來 > 經過jwt認證 > 新增活動
router.post('/', auth.jwt, upload, create)

router.get('/', getAll)
// 請求進來 > 經過jwt認證 > 判斷是不是管理員 > 取得全部的資料
router.get('/all', getAll)

router.get('/:id', getId)

router.patch('/:id', auth.jwt, upload, edit)
// 刪除活動貼文
router.delete('/:id', auth.jwt, deleteId)
export default router
