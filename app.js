const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const hbs=require('express-handlebars');
const fileUpload=require('express-fileupload')

const session=require('express-session')

const db=require('./DBconfig/connection')

const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');

const app = express();


// const handleBars=exphbs.create({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layouts/',partialsDir:__dirname+'/views/partials/'})
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
// custom Handlebars
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',
layoutDir:__dirname+'/views/layouts/',partialDir:__dirname+'/views/partials/'}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(fileUpload())
// app.use(session({secret:"anime",cookie:{maxAge:600000}}))
app.use(session({secret:"anime",resave: false,saveUninitialized: true,cookie:{maxAge:600000}}))


// dbconnection
db.connect((err)=>{
  if(err) console.log("Connection failed \n"+ err)
  else console.log('Connection Succeful conected to port 27017')
})


app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
