import { Schema, model, ObjectId } from 'mongoose'
const schema = new Schema({
  name: {
    type: String,
    required: [true, '服務名稱必填']
  },
  address: {
    type: String,
    required: [true, '服務地址必填']
  },
  tel: {
    type: String
  },
  cl: {
    type: String
  },
  lat: {
    type: Number
  },
  lng: {
    type: Number
  },
  categories: {
    type: [String],
    required: [true, '活動分類必填']
  },
  description: {
    type: String
  },
  user: { // 創建地標的用戶
    type: ObjectId,
    ref: 'users',
    required: true
  }
}, {
  timestamps: true, // 使用者建立時間，會多建立兩個欄位一個是帳號建立時間和更新時間
  versionKey: false // 追蹤版本
})

export default model('landmarks', schema)
