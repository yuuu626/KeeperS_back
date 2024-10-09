import { Schema, ObjectId, model } from 'mongoose'
const donationSchema = new Schema({
  donator: {
    type: String,
    required: [true, '服務單位必填']
  },
  quantity: {
    type: Number,
    required: [true, '數量必填'],
    min: [1, '數量不能小於 1']
  },
  phone: {
    type: String,
    required: [true, '聯絡電話必填']
  }
})

const schema = new Schema({
  image: {
    type: String,
    required: [true, '物品圖片必填']
  },
  name: {
    type: String,
    required: [true, '物品名稱必填']
  },
  quantity: {
    type: Number,
    required: [true, '物品數量必填'],
    min: [1, '物品數量不符']
  },
  category: {
    type: String,
    required: [true, '物品分類必填'],
    enum: {
      values: ['食品', '服飾配件', '日用品', '家具', '輔具', '教育用品', '嬰幼兒用品', '電器', '休閒用品', '其他'],
      message: '物品分類錯誤'
    }
  },
  description: {
    type: String,
    required: [true, '物資介紹必填']
  },
  organizer: {
    type: String,
    required: [true, '主辦單位必填']
  },
  // 分享、募集物資頁面
  type: {
    type: String,
    enum: ['share', 'find']
  },
  user: { // 發布物資貼文的用戶
    type: ObjectId,
    ref: 'users'
  },
  donations: [donationSchema],
  comment: { // 物資貼文
    type: [{
      type: ObjectId,
      ref: 'comments'
    }]
  }
}, {
  timestamps: true,
  versionKey: false
})

export default model('materials', schema)
