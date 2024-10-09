import Landmark from '../models/landmark.js'
import User from '../models/user.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'

// create 函式負責處理 POST 請求以創建新產品。它將從 req.file.path 中取得圖片，並將其存入 req.body.image 中，
// 將請求中的產品資料和上傳的圖片路徑儲存到數據庫中的 Landmark 模型中
export const create = async (req, res) => {
  try {
    console.log(req.body)
    req.body.user = req.user._id
    // console.log(req.body.user)

    if (req.body.lat == null || req.body.lng == null) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '未順利取得緯度及經度'
      })
    }
    // mongoose - Model.create() 用於創建新的資料並立即保存到資料庫。
    // 建立新的產品資料
    const result = await Landmark.create(req.body)

    // 把該活動id存到user裡
    await User.findByIdAndUpdate(req.body.user, { $push: { landmark: result._id } })
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result
    })
  } catch (error) {
    if (error.name === 'ValidationError') { // 處理驗證錯誤
      const key = Object.keys(error.errors)[0] // 取得第一個錯誤的屬性名稱
      const message = error.errors[key].message // 取得錯誤訊息
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

export const getAll = async (req, res) => {
  try {
    // 先從 request 中取得所需的參數(query)或使用預設值
    // 前面沒有的話就用 || 後面的預設值
    const sortBy = req.query.sortBy || 'createdAt' // 排序依據，預設為 createdAt
    const sortOrder = req.query.sortOrder || 'desc' // 排序方式，預設為降冪
    const regex = new RegExp(req.query.search || '', 'i') // 搜尋關鍵字，不區分大小寫
    const data = await Landmark
      .find({ // find放查詢條件
        $or: [ // 符合其中一個即可
          { name: regex },
          { tel: regex },
          { category: regex },
          { description: regex }
        ]
      })
      .sort({ [sortBy]: sortOrder }) // .sort({ 欄位:排序 })，[sortBy]當作key使用

    const total = await Landmark.estimatedDocumentCount() // 取得產品總數
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        data, total
      }
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

export const deleteId = async (req, res) => {
  try {
    console.log(req.body)
    // 使用 validator.isMongoId 來驗證請求參數中的商品 ID 是否符合  ObjectId 格式。如果不符合，會拋出一個 ID 錯誤
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')
    await Landmark.findByIdAndDelete(req.params.id, req.body).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: ''
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '地標 ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無地標'
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

// 編輯地標
export const edit = async (req, res) => {
  try {
    console.log(req.body)
    // 使用 validator.isMongoId 來驗證請求參數中的商品 ID 是否符合  ObjectId 格式。如果不符合，會拋出一個 ID 錯誤
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    if (req.body.lat == null || req.body.lng == null) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '未順利取得緯度及經度'
      })
    }
    await Landmark.findByIdAndUpdate(req.params.id, req.body, { runValidators: true }).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: ''
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '地標 ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無地標'
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
