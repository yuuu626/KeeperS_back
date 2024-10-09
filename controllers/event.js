import User from '../models/user.js'
import Event from '../models/event.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'

// create 函式負責處理 POST 請求以創建新產品。它將從 req.file.path 中取得圖片，並將其存入 req.body.image 中，
// 將請求中的產品資料和上傳的圖片路徑儲存到數據庫中的 Event 模型中
export const create = async (req, res) => {
  try {
    console.log(req.body)
    // 將上傳的檔案路徑存入 req.body.image
    // req.file 是 multer 中間件在處理檔案上傳時的屬性，提供了上傳檔案的詳細信息
    // req.file.path：帶有該檔案被儲存的路徑資訊

    // 因為陣列傳到後端後被轉換成逗號分隔的字串，所以要手動解析類別它回陣列
    if (typeof req.body.category === 'string') {
      req.body.category = req.body.category.split(',')
    }

    req.body.image = req.file.path

    // 紀錄是哪個使用者創建的文章
    req.body.user = req.user._id

    // mongoose - Model.create() 用於創建新的資料並立即保存到資料庫。
    // 建立新的產品資料
    const result = await Event.create(req.body)
    // 把該活動id存到user裡
    await User.findByIdAndUpdate(req.body.user, { $push: { events: result._id } })
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

// 取全部的資料
// 前端會把查詢的一些東西送過來，後端就要根據那些查詢的條件去寫相應的處理
export const getAll = async (req, res) => {
  try {
    // 先從 request 中取得所需的參數(query)或使用預設值
    // 前面沒有的話就用 || 後面的預設值
    const sortBy = req.query.sortBy || 'createdAt' // 排序依據，預設為 createdAt
    const sortOrder = req.query.sortOrder || 'desc' // 排序方式，預設為降冪
    const itemsPerPage = req.query.itemsPerPage * 1 || 12 // 每頁顯示的項目數量，預設為 8(*1 文字轉數字)
    const page = req.query.page * 1 || 1 // 目前頁碼，預設為第 1 頁
    // 找文字要處理，不然只會找完全符合的
    // 建立正則表達式做模糊的查詢，''空的，i不分大小寫
    const regex = new RegExp(req.query.search || '', 'i') // 搜尋關鍵字，不區分大小寫
    const data = await Event
      .find({ // find放查詢條件
        $or: [ // 符合其中一個即可
          { title: regex },
          { category: regex }
        ]
      })
      .sort({ [sortBy]: sortOrder }) // .sort({ 欄位:排序 })，[sortBy]當作key使用
      // 如果一頁有 10 筆
      // 第一頁 = 1 ~ 10 = 跳過 0 筆 = (第 1 頁 - 1) * 10 = 0
      // 第二頁 = 11 ~ 20 = 跳過 10 筆 = (第 2 頁 - 1) * 10 = 10
      // 第三頁 = 21 ~ 30 = 跳過 20 筆 = (第 3 頁 - 1) * 10 = 20
      .skip((page - 1) * itemsPerPage) // mongoDB 的分頁用 skip 跟 limit 去做，skip是要跳過幾筆資料，limit是要回傳幾筆
      .limit(itemsPerPage)
    // mongoose 的 .estimatedDocumentCount() 計算資料總數
    // 計算 Event 的 collection 有多少東西
    const total = await Event.estimatedDocumentCount() // 取得產品總數
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

// 編輯商品
// 首先進行了一些基本驗證（如 ID 格式驗證），然後嘗試更新商品信息。如果更新過程中發生錯誤，會根據錯誤類型返回相應的 HTTP 狀態碼和錯誤訊息
export const edit = async (req, res) => {
  try {
    console.log(req.body)
    // 使用 validator.isMongoId 來驗證請求參數中的商品 ID 是否符合  ObjectId 格式。如果不符合，會拋出一個 ID 錯誤
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')
    // 如果請求中有上傳的圖片，將其路徑保存到 req.body.image
    req.body.image = req.file?.path // ?可能沒有要換圖片(非必填)
    // 使用 Event.findByIdAndUpdate 根據 ID 更新商品信息
    // runValidators: true 確保更新時會執行模型中的驗證規則
    // orFail(new Error('NOT FOUND')) 如果找不到匹配的商品，會拋出一個 NOT FOUND 錯誤
    await Event.findByIdAndUpdate(req.params.id, req.body, { runValidators: true }).orFail(new Error('NOT FOUND'))

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

// 根據提供的 ID 查找 MongoDB 中的商品並返回結果
export const getId = async (req, res) => {
  try {
    console.log(req.body)
    // 驗證 ID 是否符合 MongoDB ObjectId 的格式
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    // 使用 Mongoose 的 findById 方法來查找具有指定 ID 的產品
    const result = await Event.findById(req.params.id).orFail(new Error('NOT FOUND'))

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

// 刪除貼文
export const deleteId = async (req, res) => {
  try {
    console.log(req.body)
    // 使用 validator.isMongoId 來驗證請求參數中的商品 ID 是否符合  ObjectId 格式。如果不符合，會拋出一個 ID 錯誤
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')
    // runValidators: true 確保更新時會執行模型中的驗證規則
    // orFail(new Error('NOT FOUND')) 如果找不到匹配的商品，會拋出一個 NOT FOUND 錯誤
    await Event.findByIdAndDelete(req.params.id, req.body).orFail(new Error('NOT FOUND'))

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
