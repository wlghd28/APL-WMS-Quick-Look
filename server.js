/*
    Node.JS 내외부 모듈추출
*/
const   cookieParser    = require('cookie-parser');
const   session         = require('express-session');
const   bodyParser      = require('body-parser');
const   express         = require('express');
const   createError     = require('http-errors');
const   path            = require('path');
const   os              = require('os');
const   app             = express();

/*
    BMS 개발소스 모듈
*/
const   mainUI          = require('./routes/main');
const   userWork        = require('./routes/user_work');
const   user            = require('./routes/user');
const   data            = require('./routes/data');
const   chat            = require('./routes/user_chat');

/*
    BMS 전용 포트주소 설정
*/
const   PORT = 3000;

/*
    실행환경 설정부분
*/
app.set('views', path.join(__dirname, 'views'));  // views경로 설정(ejs파일이 있는곳을 'view'로 가리킴)
app.set('view engine', 'ejs');                    // view엔진 지정
app.use(express.static(path.join(__dirname, 'public')));   // public설정
app.use('/stylesheets', express.static(path.join(__dirname, 'public', 'stylesheets')));   // css 설정
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({ key: 'sid',
                  secret: 'secret key',  // 세션id 암호화할때 사용
                  resave: false,         // 접속할때마다 id부여금지
                  saveUninitialized: true })); // 세션id사용전에는 발급금지

/*
    URI와 핸들러를 매핑
*/
app.use('/', mainUI);             // URI (/) 접속하면 main.js로 라우팅
app.use('/userwork', userWork);   // URI (/userwork) 접속하면 user_work.js로 라우팅
app.use('/user', user);           // URI (/user) 접속하면 user.js로 라우팅
app.use('/data', data);           // URI (/data) 접속하면 data.js로 라우팅
app.use('/chat', chat);           // URI (/chat) 접속하면 chat.js로 라우팅

/*
    서버 실행 소스코드
*/ 
app.listen(PORT, function () {
    let ip_address = getServerIp();
    console.log('서버실행: http://' + ip_address +':' + PORT + '/');
});

// 채팅 socket.io 서버 실행
app.io = require('socket.io')();

app.io.on('connection', function(socket){
    
    socket.broadcast.emit('새로운 분이 입장하셨습니다.');
    
    socket.on('sendmsg', function(msg){
        socket.emit('sendmsg', msg);
    }); 

    socket.on('disconnect', function(user){
        console.log(user + '이(가) 나가셨습니다.');
    });
     
});


/*
    서버 ip 가져오는 함수
*/
function getServerIp() {
    var ifaces = os.networkInterfaces();
    var result = '';
    
    for (var dev in ifaces) {
        var alias = 0;
        ifaces[dev].forEach(function(details) {
            if (details.family == 'IPv4' && details.internal === false) {
                result = details.address;
                ++alias;
            }
        });
    }
    
    return result;
}