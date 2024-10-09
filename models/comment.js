import { Schema, model, ObjectId } from 'mongoose'

const schema = new Schema({
  material: {
    type: ObjectId,
    ref: 'materials',
    required: true
  },
  user: { // 留言者
    type: ObjectId,
    ref: 'users'
  },
  content: { // 留言內容
    type: String,
    required: [true, '留言內容必填']
  }
}, {
  timestamps: true,
  versionKey: false
})

export default model('comments', schema)
