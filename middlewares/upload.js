import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import { StatusCodes } from 'http-status-codes'

// 配置 Cloudinary 的帳戶資訊
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
})

const upload = multer({
  // storage: 指定上傳檔案的儲存位置
  // 指定使用 CloudinaryStorage 來儲存上傳的文件
  storage: new CloudinaryStorage({ cloudinary }),
  // fileFilter：檢查文件的 MIME 類型，只允許上傳 JPEG 和 PNG 格式的圖片
  fileFilter (req, file, callback) {
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) {
      callback(null, true)
    } else {
      callback(new Error('FORMAT'), false)
    }
  },
  // 限制上傳文件的大小為 1MB
  limits: {
    fileSize: 1024 * 1024
  }
})

export default (req, res, next) => {
  // 處理單個文件上傳，文件名為 image
  upload.single('image')(req, res, error => {
    // 檢查是否有 Multer 錯誤
    if (error instanceof multer.MulterError) {
      let message = '上傳錯誤'
      if (error.code === 'LIMIT_FILE_SIZE') {
        message = '檔案太大'
      }
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message
      })
    } else if (error) {
      if (error.message === 'FORMAT') {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '檔案格式錯誤'
        })
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '未知錯誤'
        })
      }
    } else {
      next()
    }
  })
}
