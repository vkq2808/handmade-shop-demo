const winston = require('winston');

// 1. Định nghĩa các định dạng (Formats)
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }), // Ghi lại stack trace cho lỗi
  winston.format.splat(), // Hỗ trợ định dạng chuỗi
  winston.format.json() // Định dạng log dưới dạng JSON
  // Hoặc dùng winston.format.simple() cho môi trường dev
  // winston.format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}`)
);


// 2. Định nghĩa các Transports (Nơi ghi Log)
const transports = [
  // Ghi log ra Console (Terminal)
  new winston.transports.Console({
    // Chỉ ghi những log có cấp độ 'info' trở lên ra console
    level: 'info',
    format: winston.format.colorize({ all: true }) // Tô màu cho log console
  }),

  // Ghi log lỗi vào một tệp riêng
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),

  // Ghi tất cả các log khác vào một tệp chung
  new winston.transports.File({
    filename: 'logs/combined.log',
    level: 'debug', // Ghi tất cả từ 'debug' trở lên
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
];

// 3. Tạo Logger chính
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  // Cấp độ mặc định. Ví dụ: 'info' trong production, 'debug' trong development
  
  format: logFormat,
  transports: transports,
  exitOnError: false, // Không thoát process khi có ngoại lệ
});

module.exports = logger;