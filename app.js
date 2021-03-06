var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

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

app.use('/', routes);
app.use('/users', users);


// sockets for voice commands
var server = require('http').Server(app);
var io = require('socket.io')(server);

//package for arduino control
var five = require("johnny-five");
var Board = require("firmata");
// var board = new Board("path to serialport");

var board = new five.Board();
var pos=180;
var close;
var open;
board.on("ready", function() {
  // led = new five.Led(13);
  // led.strobe(1000); // on off every second
  servo = new five.Servo(9); //initialize pwm
  // var val;
  servo.to(pos)
  A0 = new five.Pin("A0");
  A1 = new five.Pin("A1");

  servo.to(165);
  setInterval(function(){
  A0.query(function(state){
      console.log(state.value,'A0');
  })
  A0.query(function(state){
      console.log(state.value,'A1');
  })

  }, 200)
  

});

server.listen(80);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('close', function (data) {
    console.log(data.command)
    var state1=false;
    var state2=false;
    close=true;
    open=false;
   // while(!state1&& !state2){
      var openFunc=setInterval(function(){
        A0.query(function(state) {
        console.log(state.value,'A0');
        if(state.value<=30){
          state1=true;
        }
        else if (state2 && state.value<=30){
          state1=true;
        }
        })   
        A1.query(function(state) {
        console.log(state.value,'A1');
        if(state.value<=30){
          state2=true;
        }
        else if(state1 && state.value<=30){
          state2=true;
        }
        })
        if(close){
          if(pos<180){
             if(state1 && state2){}
              else{
                 pos++;
              }
       
      console.log(pos,'pos')
      servo.to(pos)
      }
        }
      },50)
  //  }
  });
  socket.on('open',function(data){
    console.log('close')
    close=false;
    open=true;
    setInterval(function(){
      if(open){
       if(pos>0){
        pos--;
        servo.to(pos);
      } 
      }
      
    },50);
  })
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
