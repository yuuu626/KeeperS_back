import User from '../models/user.js'
import Event from '../models/event.js'
import Material from '../models/material.js'
// import Event from '../models/event.js'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
// import validator from 'validator'
import bcrypt from 'bcrypt'
import Landmark from '../models/landmark.js'
// 註冊
export const create = async (req, res) => {
  try {
    // 資料庫中建立使用者資料
    await User.create(req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      message: ''
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      // 取得第一個錯誤的鍵
      const key = Object.keys(error.errors)[0]
      // 取得錯誤訊息
      const message = error.errors[key].message
      // 返回狀態碼 400 (Bad Request) 和錯誤訊息
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message
      })
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: '服務名稱已註冊'
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

// 登入
// 確保使用者在成功登入後能夠獲得一個有效的 JWT token 用於後續的身份驗證
export const login = async (req, res) => {
  try {
    // 使用 JWT 簽署 token，包含使用者的 _id
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7 days' })
    // 將生成的 token 加入使用者的 tokens 屬性中
    req.user.tokens.push(token)
    // console.log(req.user.role) // 可以console來看資料是否進來
    // console.log(token)
    // 將使用者物件保存到資料庫中，包括更新後的 tokens 屬性
    await req.user.save()
    // 返回成功的 HTTP 狀態碼和包含使用者資訊的 JSON 回應
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      // req.user包含已驗證的使用者資訊
      result: {
        token, // 返回生成的 token
        email: req.user.email, // 返回服務名稱
        role: req.user.role // 返回使用者的角色
      }
    })
    // 如果發生任何錯誤，返回內部伺服器錯誤的 HTTP 狀態碼和錯誤訊息
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

// token 舊換新
export const extend = async (req, res) => {
  try {
    // 找到當前使用的 token 在 tokens 陣列中的索引
    const idx = req.user.tokens.findIndex(token => token === req.token)
    // 簽新的，簽發一個新的 JWT token，並設置有效期為 7 天
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7 days' })
    // 更新使用者 tokens 陣列中的對應索引位置的 token
    req.user.tokens[idx] = token
    // 將更新後的使用者資訊保存到資料庫
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: token
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

// 取基本資料
// 讓已經驗證的使用者取得自己的基本資料
export const profile = (req, res) => {
  try {
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        username: req.user.username,
        role: req.user.role,
        email: req.user.email,
        avatar: req.user.avatar,
        id: req.user.id
      }
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

// 登出
// 使用者請求登出時，會將該使用者的當前 token 從資料庫中移除
export const logout = async (req, res) => {
  try {
    //  過濾掉當前使用的 JWT token
    // req.token 可以獲取到當前的 JWT token
    req.user.tokens = req.user.tokens.filter(token => token !== req.token)
    // 將更新後的使用者資訊保存到資料庫
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: ''
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

export const getAll = async (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'createdAt' // 排序依據，預設為 createdAt
    const sortOrder = req.query.sortOrder || 'desc' // 排序方式，預設為降冪
    const itemsPerPage = req.query.itemsPerPage * 1 || 12 // 每頁顯示的項目數量，預設為 8(*1 文字轉數字)
    const page = req.query.page * 1 || 1 // 目前頁碼，預設為第 1 頁
    // 找文字要處理，不然只會找完全符合的
    // 建立正則表達式做模糊的查詢，''空的，i不分大小寫
    const regex = new RegExp(req.query.search || '', 'i')
    const data = await User
      .find({ // find放查詢條件
        $or: [ // 符合其中一個即可
          { username: regex }
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
    const total = await User.estimatedDocumentCount() // 取得產品總數
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

// 修改基本資料、新增大頭貼
export const edit = async (req, res) => {
  try {
    // console.log(req.body)
    // console.log(req.file)
    const userId = req.user._id
    const updatedData = {}

    // 根據前端傳過來的值進行更新
    if (req.body.username) {
      updatedData.username = req.body.username
    }
    if (req.body.password) {
      updatedData.password = await bcrypt.hash(req.body.password, 10)
    }
    // console.log(req.body)
    if (req.file) {
      updatedData.avatar = req.file.path // 大頭貼
    }
    // console.log(updatedData)
    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
      runValidators: true
    })
    console.log(updatedUser)
    if (!updatedUser) {
      throw new Error('NOT FOUND')
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: '資料更新成功'
    })
  } catch (error) {
    // 錯誤處理邏輯
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '使用者 ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '找不到該使用者'
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
        message: '更新使用者資料失敗'
      })
    }
  }
}

// 收藏活動
export const addmark = async (req, res) => {
  try {
    // console.log(req.body)
    const userId = req.user._id
    // console.log(userId)
    const { eventId } = req.body
    // 找指定 ID 的用戶，並通過 populate 方法加載用戶的 eventmark 欄位
    // const user = await User.findById(userId).populate('eventmark')
    const user = await User.findById(userId)
    // 檢查 user.eventmark 中是否已經包含了要添加的 eventId
    // 有查到該id會回傳true代表收藏過
    if (user.eventmark.some(event => event._id.toString() === eventId)) {
      // 取消收藏
      user.eventmark = user.eventmark.filter(event => event._id.toString() !== eventId)
    } else {
      // 添加收藏
      // console.log(user)
      user.eventmark.push(eventId)
      // user.push(eventId)
    }

    await user.save()
    res.json({ isFavorite: user.eventmark.some(event => event._id.toString() === eventId) })
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' })
  }
}

// 取得收藏的活動資訊
export const getmark = async (req, res) => {
  try {
    const userId = req.user._id
    const user = await User.findById(userId).populate('eventmark')

    if (!user) {
      return res.status(404).send('User not found')
    }

    res.status(200).json(user.eventmark)
  } catch (error) {
    console.error('Error in getFavoriteEvents:', error)
    res.status(500).send('Server error')
  }
}

// 取消活動收藏
export const deletemark = async (req, res) => {
  try {
    const userId = req.user._id
    const { eventId } = req.body
    const user = await User.findById(userId).populate('eventmark')
    if (user.eventmark.some(event => event._id.toString() === eventId)) {
      // 取消收藏
      user.eventmark = user.eventmark.filter(event => event._id.toString() !== eventId)
    }
    await user.save()
    res.json({ isFavorite: user.eventmark.some(event => event._id.toString() === eventId) })
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' })
  }
}

// 使用者活動貼文
export const getEvent = async (req, res) => {
  try {
    // 確保用戶已經登錄，並從請求中取得用戶 ID
    // 用戶 ID，應由身份驗證中間件提供
    // console.log(req.user.id)
    // 取得排序依據、排序方式、每頁顯示數量、當前頁碼，若無則設定預設值
    const sortBy = req.query.sortBy || 'createdAt' // 默認排序依據為 'createdAt'
    const sortOrder = req.query.sortOrder || 'desc' // 默認排序方式為 'desc'
    const itemsPerPage = parseInt(req.query.itemsPerPage, 10) || 12 // 每頁顯示的項目數量，轉為數字，預設為 12
    const page = parseInt(req.query.page, 10) || 1 // 當前頁碼，轉為數字，預設為 1

    // 處理搜尋關鍵字，建立正則表達式以進行模糊查詢
    const regex = new RegExp(req.query.search || '', 'i') // 不區分大小寫

    // 查詢資料
    const data = await Event
      .find({ // 查詢條件
        $and: [ // 所有条件都需要满足
          { user: req.user.id }, // 只查詢該用戶的文章
          {
            $or: [
              { title: regex },
              { category: regex }
            ]
          }
        ]
      })
      .sort({ [sortBy]: sortOrder }) // 排序
      .skip((page - 1) * itemsPerPage) // 分頁 - 跳過的數據量
      .limit(itemsPerPage) // 分頁 - 限制每頁顯示的數據量

    // 獲取資料總數
    const total = await Event.countDocuments({
      $and: [ // 所有条件都需要满足
        { user: req.user.id }, // 只查詢該用戶的文章
        {
          $or: [
            { title: regex },
            { category: regex }
          ]
        }
      ]
    })

    // 回傳結果
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        data,
        total
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

// 使用者物資分享貼文
export const getUserShare = async (req, res) => {
  try {
    // 確保用戶已經登錄，並從請求中取得用戶 ID
    // 用戶 ID，應由身份驗證中間件提供

    // console.log(req.user.id)

    // 取得排序依據、排序方式、每頁顯示數量、當前頁碼，若無則設定預設值
    const sortBy = req.query.sortBy || 'createdAt' // 默認排序依據為 'createdAt'
    const sortOrder = req.query.sortOrder || 'desc' // 默認排序方式為 'desc'
    const itemsPerPage = parseInt(req.query.itemsPerPage, 10) || 12 // 每頁顯示的項目數量，轉為數字，預設為 12
    const page = parseInt(req.query.page, 10) || 1 // 當前頁碼，轉為數字，預設為 1

    // 處理搜尋關鍵字，建立正則表達式以進行模糊查詢
    const regex = new RegExp(req.query.search || '', 'i') // 不區分大小寫

    // 查詢資料
    const data = await Material
      .find({ // 查詢條件
        $and: [ // 所有条件都需要满足
          { user: req.user.id }, // 只查詢該用戶的文章
          { type: 'share' }, // 类型字段必须为 'find'
          {
            $or: [ // 符合以下任一条件即可
              { name: regex }, // 名称字段中匹配正则表达式的文档
              { category: regex } // 分类字段中匹配正则表达式的文档
            ]
          }
        ]
      })
      .sort({ [sortBy]: sortOrder }) // 排序
      .skip((page - 1) * itemsPerPage) // 分頁 - 跳過的數據量
      .limit(itemsPerPage) // 分頁 - 限制每頁顯示的數據量

    // 獲取資料總數
    const total = await Material.countDocuments({
      $and: [ // 所有条件都需要满足
        { user: req.user.id }, // 只查詢該用戶的文章
        { type: 'share' }, // 类型字段必须为 'find'
        {
          $or: [ // 符合以下任一条件即可
            { name: regex }, // 名称字段中匹配正则表达式的文档
            { category: regex } // 分类字段中匹配正则表达式的文档
          ]
        }
      ]
    })

    // 回傳結果
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        data,
        total
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

export const getUserFind = async (req, res) => {
  try {
    // 確保用戶已經登錄，並從請求中取得用戶 ID
    // 用戶 ID，應由身份驗證中間件提供

    // console.log(req.user.id)

    // 取得排序依據、排序方式、每頁顯示數量、當前頁碼，若無則設定預設值
    const sortBy = req.query.sortBy || 'createdAt' // 默認排序依據為 'createdAt'
    const sortOrder = req.query.sortOrder || 'desc' // 默認排序方式為 'desc'
    const itemsPerPage = parseInt(req.query.itemsPerPage, 10) || 12 // 每頁顯示的項目數量，轉為數字，預設為 12
    const page = parseInt(req.query.page, 10) || 1 // 當前頁碼，轉為數字，預設為 1

    // 處理搜尋關鍵字，建立正則表達式以進行模糊查詢
    const regex = new RegExp(req.query.search || '', 'i') // 不區分大小寫

    // 查詢資料
    const data = await Material
      .find({ // 查詢條件
        $and: [ // 所有条件都需要满足
          { user: req.user.id }, // 只查詢該用戶的文章
          { type: 'find' }, // 类型字段必须为 'find'
          {
            $or: [ // 符合以下任一条件即可
              { name: regex }, // 名称字段中匹配正则表达式的文档
              { category: regex } // 分类字段中匹配正则表达式的文档
            ]
          }
        ]
      })
      .sort({ [sortBy]: sortOrder }) // 排序
      .skip((page - 1) * itemsPerPage) // 分頁 - 跳過的數據量
      .limit(itemsPerPage) // 分頁 - 限制每頁顯示的數據量

    // 獲取資料總數
    const total = await Material.countDocuments({
      $and: [ // 所有条件都需要满足
        { user: req.user.id }, // 只查詢該用戶的文章
        { type: 'find' }, // 类型字段必须为 'find'
        {
          $or: [ // 符合以下任一条件即可
            { name: regex }, // 名称字段中匹配正则表达式的文档
            { category: regex } // 分类字段中匹配正则表达式的文档
          ]
        }
      ]
    })

    // 回傳結果
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        data,
        total
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

// 使用者地標
export const getLandmark = async (req, res) => {
  try {
    // console.log(req.user.id)
    const sortBy = req.query.sortBy || 'createdAt' // 默認排序依據為 'createdAt'
    const sortOrder = req.query.sortOrder || 'desc' // 默認排序方式為 'desc'
    const regex = new RegExp(req.query.search || '', 'i') // 不區分大小寫

    // 查詢資料
    const data = await Landmark
      .find({ // 查詢條件
        $and: [ // 所有条件都需要满足
          { user: req.user.id }, // 只查詢該用戶的文章
          {
            $or: [
              { name: regex },
              { tel: regex },
              { category: regex },
              { description: regex }
            ]
          }
        ]
      })
      .sort({ [sortBy]: sortOrder }) // 排序

    // 獲取資料總數
    const total = await Landmark.countDocuments({
      $and: [ // 所有条件都需要满足
        { user: req.user.id }, // 只查詢該用戶的文章
        {
          $or: [
            { name: regex },
            { tel: regex },
            { category: regex },
            { description: regex }
          ]
        }
      ]
    })

    // 回傳結果
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        data,
        total
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
