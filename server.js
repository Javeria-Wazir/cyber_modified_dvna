require('dotenv').config()
var express = require('express')
var bodyParser = require('body-parser')
var passport = require('passport')
var session = require('express-session')
var ejs = require('ejs')
var morgan = require('morgan')
var helmet = require('helmet')
var fileUpload = require('express-fileupload')
var winston = require('winston')
var config = require('./config/server')

//Initialize Winston Logger
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'security.log' })
  ]
})

//Initialize Express
var app = express()
require('./core/passport')(passport)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://maxcdn.bootstrapcdn.com', 'https://cdnjs.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://maxcdn.bootstrapcdn.com'],
      fontSrc: ["'self'", 'https:', 'data:'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'https://maxcdn.bootstrapcdn.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"]
    }
  }
}))
app.use(express.static('public'))
app.set('view engine','ejs')
app.use(morgan('tiny'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(fileUpload());

// Enable for Reverse proxy support
// app.set('trust proxy', 1) 

// Intialize Session
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}))

// Initialize Passport
app.use(passport.initialize())
app.use(passport.session())

// Initialize express-flash
app.use(require('express-flash')());

// Routing
app.use('/app',require('./routes/app')())
app.use('/',require('./routes/main')(passport))

// Start Server
app.listen(config.port, config.listen)
logger.info('Application started')