import { Router } from 'express'
import * as auth from '../middlewares/auth.js'
// import admin from '../middlewares/admin.js'
import { create, getComments, edit, deleteId } from '../controllers/comment.js'

const router = Router()

router.post('/', auth.jwt, create)

router.get('/:id', auth.jwt, getComments)

router.patch('/:id', auth.jwt, edit)

router.delete('/:id', auth.jwt, deleteId)
export default router
