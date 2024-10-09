import { Schema, model, ObjectId } from 'mongoose'

const schema = new Schema({
  image: {
    type: String,
    required: [true, '活動圖片必填']
  },
  title: {
    type: String,
    required: [true, '活動標題必填']
  },
  date: {
    type: String,
    required: [true, '活動日期必填']
  },
  address: {
    type: String,
    required: [true, '活動地點必填']
  },
  category: {
    type: [String],
    // type: String,
    required: [true, '活動分類必填'],
    enum: {
      values: ['兒童', '青少年', '育兒', '長照', '精神', '照顧', '就學', '就業', '身障', '親職教育', '早療', '紓壓', '居住', '醫療', '司法', '社工', '其他'],
      message: '活動分類錯誤'
    }
  },
  organizer: {
    type: String,
    required: [true, '主辦單位必填']
  },
  description: {
    type: String,
    required: [true, '活動介紹必填']
  },
  user: { // 創建活動的用戶
    type: ObjectId,
    ref: 'users'
  }
}, {
  timestamps: true, // 使用者建立時間，會多建立兩個欄位一個是帳號建立時間和更新時間
  versionKey: false // 追蹤版本
})

export default model('events', schema)
