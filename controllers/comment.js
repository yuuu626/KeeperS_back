import User from '../models/user.js'
import Comment from '../models/comment.js'
import Material from '../models/material.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'

export const create = async (req, res) => {
  try {
    console.log(req.body.materialId)
    const { materialId, content } = req.body
    const userId = req.user._id
    console.log(userId)
    console.log(content)
    if (!materialId || !content) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: '物資 ID 和留言內容是必需的' })
    }

    // 創建新留言
    const comment = new Comment({
      material: materialId,
      user: userId,
      content
    })

    await comment.save()

    const material = await Material.findById(materialId)
    if (!material) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: '物資不存在' })
    }
    material.comment.push(comment._id) // 將新留言的 ID 添加到 comment 陣列中
    await material.save()

    // 查詢使用者並添加留言 ID
    const user = await User.findById(userId)
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: '使用者不存在' })
    }

    user.comment.push(comment._id) // 將新留言的 ID 添加到 comment 陣列中
    await user.save()

    res.status(StatusCodes.CREATED).json({
      success: true,
      comment
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      {
        success: false,
        message: '未知錯誤'
      })
  }
}

export const getComments = async (req, res) => {
  try {
    const materialId = req.params.id
    console.log(materialId)

    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    // 查詢留言並填充用戶和物資資訊
    const result = await Comment.find({ material: materialId })
      .populate('user', 'username avatar') // 填充用戶資訊
      .populate('material', 'name image') // 填充物資資訊
      .exec()

    // console.log(result)
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '商品 ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無留言'
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

export const edit = async (req, res) => {
  try {
    console.log(req.body)
    // 使用 validator.isMongoId 來驗證請求參數中的商品 ID 是否符合  ObjectId 格式。如果不符合，會拋出一個 ID 錯誤
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')
    // 使用 Product.findByIdAndUpdate 根據 ID 更新商品信息
    // runValidators: true 確保更新時會執行模型中的驗證規則
    // orFail(new Error('NOT FOUND')) 如果找不到匹配的商品，會拋出一個 NOT FOUND 錯誤
    await Comment.findByIdAndUpdate(req.params.id, req.body, { runValidators: true }).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: ''
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '商品 ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無商品'
      })
    } else if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

// 刪除貼文
export const deleteId = async (req, res) => {
  try {
    console.log(req.body)
    // 使用 validator.isMongoId 來驗證請求參數中的商品 ID 是否符合  ObjectId 格式。如果不符合，會拋出一個 ID 錯誤
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')
    // runValidators: true 確保更新時會執行模型中的驗證規則
    // orFail(new Error('NOT FOUND')) 如果找不到匹配的商品，會拋出一個 NOT FOUND 錯誤
    await Comment.findByIdAndDelete(req.params.id, req.body).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: ''
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '商品 ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無商品'
      })
    } else if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}
