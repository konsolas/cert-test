const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const favicon=require ('serve-favicon');
const schedule=require('node-schedule');

const certPool=require('./public/javascripts/certPool');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const createRouter=require('./routes/create');
const authRouter=require('./routes/authenticate');
const renewRouter=require('./routes/renew');
/*
var store=require('store');
*/
var rule=new schedule.RecurrenceRule();
rule.hour=0;
rule.minute=0;
schedule.scheduleJob(rule,async function(){
    var updateList=await certPool.updatePool();
    console.log('Updated the unused users: ');
    console.log(updateList);
});
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(__dirname+'/public/images/favicon.ico'));


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/create', createRouter);
app.use('/authenticate',authRouter);
app.use('/renew',renewRouter);

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
