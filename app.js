var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');

var app = express();

//session management variables
var config = require('./config');
var redis = require('redis');
var client = redis.createClient(process.env.REDIS_URL);
var crypto = require('crypto');
var session = require('express-session');

var helmet = require('helmet');

//Headers security!!
app.use(helmet());

// Implement CSP with Helmet 

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'","https://ajax.googleapis.com/"],
    styleSrc: ["'self'"], 
    imgSrc: ["'self'","https://dl.dropboxusercontent.com"],  
    mediaSrc: ["'none'"],  
    frameSrc: ["'none'"]  
  },

    // Set to true if you want to blindly set all headers: Content-Security-Policy, 
    // X-WebKit-CSP, and X-Content-Security-Policy. 
    setAllHeaders: true

}));

//initialize session
var sess = {
	secret: config.SESSION_ID_SECRET,
  cookie: {}, //add empty cookie to the session by default
  resave: false,
  saveUninitialized: true,
  genid: (req) => {
  	return crypto.randomBytes(16).toString('hex');;
  },
  store: new (require('express-sessions'))({
  	storage: 'redis',
      instance: client, // optional 
      collection: 'sessions' // optional 
  })
}


if (app.get('env') === 'production') {
	app.set('trust proxy', 1) // trust first proxy
	sess.cookie.secure = true // serve secure cookies
}

app.use(session(sess));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
