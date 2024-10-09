import User from '../models/user.js'
import Material from '../models/material.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'

// create 函式負責處理 POST 請求以創建新產品。它將從 req.file.path 中取得圖片，並將其存入 req.body.image 中，
// 將請求中的產品資料和上傳的圖片路徑儲存到數據庫中的 Material 模型中
export const create = async (req, res) => {
  try {
    console.log(req.body)
    // 將上傳的檔案路徑存入 req.body.image
    req.body.image = req.file.path

    req.body.user = req.user._id

    // mongoose - Model.create() 用於創建新的資料並立即保存到資料庫。
    // 建立新的產品資料
    const result = await Material.create(req.body)

    await User.findByIdAndUpdate(req.body.user, { $push: { materials: result._id } })
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

export const getShare = async (req, res) => {
  try {
    // 先從 request 中取得所需的參數(query)或使用預設值
    // 前面沒有的話就用 || 後面的預設值
    const sortBy = req.query.sortBy || 'createdAt' // 排序依據，預設為 createdAt
    const sortOrder = req.query.sortOrder || 'desc' // 排序方式，預設為降冪
    const itemsPerPage = req.query.itemsPerPage * 1 || 8 // 每頁顯示的項目數量，預設為 8(*1 文字轉數字)
    const page = req.query.page * 1 || 1 // 目前頁碼，預設為第 1 頁
    // 找文字要處理，不然只會找完全符合的
    // 建立正則表達式做模糊的查詢，''空的，i不分大小寫
    const regex = new RegExp(req.query.search || '', 'i') // 搜尋關鍵字，不區分大小寫
    const data = await Material
      .find({ // 查找符合以下条件的文档
        $and: [ // 所有条件都需要满足
          { type: 'share' }, // 类型字段必须为 'find'
          {
            $or: [ // 符合以下任一条件即可
              { name: regex }, // 名称字段中匹配正则表达式的文档
              { category: regex } // 分类字段中匹配正则表达式的文档
            ]
          }
        ]
      })
      .sort({ [sortBy]: sortOrder }) // .sort({ 欄位:排序 })，[sortBy]當作key使用
    // 如果一頁有 8 筆
    // 第一頁 = 1 ~ 8 = 跳過 0 筆 = (第 1 頁 - 1) * 8 = 0
    // 第二頁 = 9 ~ 16 = 跳過 8 筆 = (第 2 頁 - 1) * 8 = 8
    // 第三頁 = 17 ~ 24 = 跳過 20 筆 = (第 3 頁 - 1) * 8 = 16
      .skip((page - 1) * 8) // mongoDB 的分頁用 skip 跟 limit 去做，skip是要跳過幾筆資料，limit是要回傳幾筆
      .limit(itemsPerPage)
      // mongoose 的 .estimatedDocumentCount() 計算資料總數
      // 計算 Material 的 collection 有多少東西
    const total = await Material.estimatedDocumentCount() // 取得產品總數
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

export const getFind = async (req, res) => {
  try {
    // 先從 request 中取得所需的參數(query)或使用預設值
    // 前面沒有的話就用 || 後面的預設值
    const sortBy = req.query.sortBy || 'createdAt' // 排序依據，預設為 createdAt
    const sortOrder = req.query.sortOrder || 'desc' // 排序方式，預設為降冪
    const itemsPerPage = req.query.itemsPerPage * 1 || 8 // 每頁顯示的項目數量，預設為 8(*1 文字轉數字)
    const page = req.query.page * 1 || 1 // 目前頁碼，預設為第 1 頁
    // 找文字要處理，不然只會找完全符合的
    // 建立正則表達式做模糊的查詢，''空的，i不分大小寫
    const regex = new RegExp(req.query.search || '', 'i') // 搜尋關鍵字，不區分大小寫
    const data = await Material
      .find({ // 查找符合以下条件的文档
        $and: [ // 所有条件都需要满足
          { type: 'find' }, // 类型字段必须为 'find'
          {
            $or: [ // 符合以下任一条件即可
              { name: regex }, // 名称字段中匹配正则表达式的文档
              { category: regex } // 分类字段中匹配正则表达式的文档
            ]
          }
        ]
      })
      .sort({ [sortBy]: sortOrder }) // .sort({ 欄位:排序 })，[sortBy]當作key使用
    // 如果一頁有 8 筆
    // 第一頁 = 1 ~ 8 = 跳過 0 筆 = (第 1 頁 - 1) * 8 = 0
    // 第二頁 = 9 ~ 16 = 跳過 8 筆 = (第 2 頁 - 1) * 8 = 8
    // 第三頁 = 17 ~ 24 = 跳過 20 筆 = (第 3 頁 - 1) * 8 = 16
      .skip((page - 1) * 8) // mongoDB 的分頁用 skip 跟 limit 去做，skip是要跳過幾筆資料，limit是要回傳幾筆
      .limit(itemsPerPage)
      // mongoose 的 .estimatedDocumentCount() 計算資料總數
      // 計算 Material 的 collection 有多少東西
    const total = await Material.estimatedDocumentCount() // 取得產品總數
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

export const getAll = async (req, res) => {
  try {
    // 先從 request 中取得所需的參數(query)或使用預設值
    // 前面沒有的話就用 || 後面的預設值
    const sortBy = req.query.sortBy || 'createdAt' // 排序依據，預設為 createdAt
    const sortOrder = req.query.sortOrder || 'desc' // 排序方式，預設為降冪
    const itemsPerPage = req.query.itemsPerPage * 1 || 8 // 每頁顯示的項目數量，預設為 8(*1 文字轉數字)
    const page = req.query.page * 1 || 1 // 目前頁碼，預設為第 1 頁
    // 找文字要處理，不然只會找完全符合的
    // 建立正則表達式做模糊的查詢，''空的，i不分大小寫
    const regex = new RegExp(req.query.search || '', 'i') // 搜尋關鍵字，不區分大小寫
    const data = await Material
      .find({ // 查找符合以下条件的文档
        $or: [ // 符合以下任一条件即可
          { name: regex }, // 名称字段中匹配正则表达式的文档
          { category: regex } // 分类字段中匹配正则表达式的文档
        ]
      })
      .sort({ [sortBy]: sortOrder }) // .sort({ 欄位:排序 })，[sortBy]當作key使用
    // 如果一頁有 8 筆
    // 第一頁 = 1 ~ 8 = 跳過 0 筆 = (第 1 頁 - 1) * 8 = 0
    // 第二頁 = 9 ~ 16 = 跳過 8 筆 = (第 2 頁 - 1) * 8 = 8
    // 第三頁 = 17 ~ 24 = 跳過 20 筆 = (第 3 頁 - 1) * 8 = 16
      .skip((page - 1) * 8) // mongoDB 的分頁用 skip 跟 limit 去做，skip是要跳過幾筆資料，limit是要回傳幾筆
      .limit(itemsPerPage)
      // mongoose 的 .estimatedDocumentCount() 計算資料總數
      // 計算 Material 的 collection 有多少東西
    const total = await Material.estimatedDocumentCount() // 取得產品總數
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

// 根據提供的 ID 查找 MongoDB 中的商品並返回結果
export const getId = async (req, res) => {
  try {
    // console.log(req.body)
    // 驗證 ID 是否符合 MongoDB ObjectId 的格式
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    // 使用 Mongoose 的 findById 方法來查找具有指定 ID 的產品
    const result = await Material.findById(req.params.id).orFail(new Error('NOT FOUND'))
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
        message: '查無商品'
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
    // 使用 validator.isMongoId 來驗證請求參數中的商品 ID 是否符合  ObjectId 格式。如果不符合，會拋出一個 ID 錯誤
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')
    // 如果請求中有上傳的圖片，將其路徑保存到 req.body.image
    req.body.image = req.file?.path // ?可能沒有要換圖片(非必填)
    // 使用 Product.findByIdAndUpdate 根據 ID 更新商品信息
    // runValidators: true 確保更新時會執行模型中的驗證規則
    // orFail(new Error('NOT FOUND')) 如果找不到匹配的商品，會拋出一個 NOT FOUND 錯誤
    await Material.findByIdAndUpdate(req.params.id, req.body, { runValidators: true }).orFail(new Error('NOT FOUND'))

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
    // console.log(req.body)
    // 使用 validator.isMongoId 來驗證請求參數中的商品 ID 是否符合  ObjectId 格式。如果不符合，會拋出一個 ID 錯誤
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')
    // orFail(new Error('NOT FOUND')) 如果找不到匹配的商品，會拋出一個 NOT FOUND 錯誤
    await Material.findByIdAndDelete(req.params.id, req.body).orFail(new Error('NOT FOUND'))

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

// 捐贈分享物資
export const donate = async (req, res) => {
  try {
    const { donator, quantity, phone, id } = req.body
    // console.log(id)
    // 查找物資
    const material = await Material.findById(id)
    if (!material) {
      return res.status(404).json({ message: 'Material not found' })
    }

    // 添加捐贈資料到物資中
    material.donations.push({ donator, quantity, phone })

    // 保存更新後的物資
    await material.save()

    res.status(201).json({ message: 'Donation added successfully', material })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error })
  }
}

export const getReply = async (req, res) => {
  try {
    // 先從 request 中取得所需的參數(query)或使用預設值
    // 前面沒有的話就用 || 後面的預設值
    const sortBy = req.query.sortBy || 'createdAt' // 排序依據，預設為 createdAt
    const sortOrder = req.query.sortOrder || 'desc' // 排序方式，預設為降冪
    const itemsPerPage = req.query.itemsPerPage * 1 || 8 // 每頁顯示的項目數量，預設為 8(*1 文字轉數字)
    const page = req.query.page * 1 || 1 // 目前頁碼，預設為第 1 頁
    // 找文字要處理，不然只會找完全符合的
    // 建立正則表達式做模糊的查詢，''空的，i不分大小寫
    const regex = new RegExp(req.query.search || '', 'i') // 搜尋關鍵字，不區分大小寫
    const data = await Material
      .find({ // 查找符合以下条件的文档
        $and: [ // 所有条件都需要满足
          { type: 'share' }, // 类型字段必须为 'find'
          {
            $or: [ // 符合以下任一条件即可
              { name: regex }, // 名称字段中匹配正则表达式的文档
              { category: regex } // 分类字段中匹配正则表达式的文档
            ]
          }
        ]
      })
      .sort({ [sortBy]: sortOrder }) // .sort({ 欄位:排序 })，[sortBy]當作key使用
      .skip((page - 1) * 8) // mongoDB 的分頁用 skip 跟 limit 去做，skip是要跳過幾筆資料，limit是要回傳幾筆
      .limit(itemsPerPage)
      // mongoose 的 .estimatedDocumentCount() 計算資料總數
      // 計算 Material 的 collection 有多少東西
    const total = await Material.estimatedDocumentCount() // 取得產品總數
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
