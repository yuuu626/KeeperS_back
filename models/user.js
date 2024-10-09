import { Schema, model, ObjectId, Error } from 'mongoose'
import validator from 'validator'
import bcrypt from 'bcrypt'
import UserRole from '../enums/UserRole.js'

const schema = new Schema({
  avatar: {
    type: String,
    default () {
      return 'https://i1.wangminggu.com/f903571781a785df810d967a/be58/bc5a/bf5d164f88a3869f8e06c82ec0569761a6296fd4259bd3065c9ac8b927c8cf4672aeb8c2368d11.jpg'
    }
  },
  username: {
    type: String,
    required: [true, '服務單位必填'],
    minlength: [3, '服務單位長度不符'],
    maxlength: [20, '服務單位長度不符'],
    unique: true
  },
  email: {
    type: String,
    required: [true, '使用者信箱必填'],
    unique: true, // 用過的值不能重複用
    validate: {
      validator (value) {
        return validator.isEmail(value)
      },
      message: '使用者信箱格式錯誤，需使用公務信箱'
    }
  },
  password: {
    type: String,
    minlength: [6, '使用者密碼長度不符'],
    required: [true, '使用者密碼必填']
  },
  tokens: {
    type: [String]
  },
  role: { // 另外寫在enums
    type: Number,
    default: UserRole.USER
  },
  events: { // 活動貼文
    type: [{
      type: ObjectId,
      ref: 'events'
    }]
  },
  eventmark: { // 活動收藏
    type: [{
      type: ObjectId,
      ref: 'events'
    }]
  },
  landmark: { // 地標資源
    type: [{
      type: ObjectId,
      ref: 'landmarks'
    }]
  },
  materials: { // 物資貼文
    type: [{
      type: ObjectId,
      ref: 'materials'
    }]
  },
  comment: { // 物資貼文
    type: [{
      type: ObjectId,
      ref: 'comments'
    }]
  }
}, {
  timestamps: true, // 使用者建立時間，會多建立兩個欄位一個是帳號建立時間和更新時間
  versionKey: false // 追蹤版本
})

// 保存之前執行function，檢查新密碼是否符合要求，不符合拋錯誤，符合就進行 bcrypt 加密
schema.pre('save', function (next) {
  const user = this
  if (user.isModified('password')) { // 檢查欄位是否修改過
    if (user.password.length < 6 || user.password.length > 20) {
      const error = new Error.ValidationError()
      error.addError('password', new Error.ValidatorError({ message: '使用者密碼長度不符' }))
      next(error)
      return
    } else {
      //  bcrypt 加密，把使用者的密碼加鹽10次
      user.password = bcrypt.hashSync(user.password, 10)
    }
  }
  next()
})

export default model('users', schema)
