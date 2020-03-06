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
const   http            = require('http').Server(app); //1
const   io              = require('socket.io')(http);  //1


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
    포트번호를 외부 모듈로 뺍니다.
*/
module.exports.PORT = PORT;

/*
    실행환경 설정부분
*/
app.set('views', path.join(__dirname, 'views'));           // views 경로 설정(ejs파일이 있는곳을 'views'로 가리킴)
app.set('view engine', 'ejs');                             // view  엔진 지정
app.use(express.static(path.join(__dirname, 'public')));   // public설정
app.use('/stylesheets', express.static(path.join(__dirname, 'public', 'stylesheets')));   // css 설정
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({ key: 'sid',
                  secret: 'secret key',         // 세션id 암호화할때 사용
                  resave: false,                // 접속할때마다 id부여금지
                  saveUninitialized: true }));  // 세션id사용전에는 발급금지

/*
    URI와 핸들러를 매핑
*/
app.use('/', mainUI);             // URI (/) 접속하면 main.js로 라우팅
app.use('/userwork', userWork);   // URI (/userwork) 접속하면 user_work.js로 라우팅
app.use('/user', user);           // URI (/user) 접속하면 user.js로 라우팅
app.use('/data', data);           // URI (/data) 접속하면 data.js로 라우팅
app.use('/chat', chat);           // URI (/chat) 접속하면 user_chat.js로 라우팅

/*
    서버 실행 소스코드
*/ 
http.listen(PORT, function () {
    let ip_address = getServerIp();

    // ip주소를 외부 모듈로 뺍니다.
    module.exports.ip = ip_address;
    console.log('서버실행: http://' + ip_address +':' + PORT + '/');
});

/*
    채팅 socket.io 서버 실행
*/
io.on('connection', function(socket) {

    // 새로운 유저가 접속했을 경우 기존에 존재하던 유저들에게 알려줌 (순서 1-2)
    socket.on('newUser', function(name) { 

        console.log(name + '님이 접속하셨습니다.'); 

        // 소켓에 이름 저장해두기
        socket.name = name;

        // 모든 유저에게 전송
        io.sockets.emit('connectNotice', socket.name + '님이 접속하셨습니다.');
    });
    
    // 메세지를 보낸 해당 사람에게 전송 (순서 2-2)
    socket.on('sendMsg', function(chatData) {
        socket.emit('sendMsg', chatData); 
    });

    // 메세지를 보낸 해당 사람을 제외하고 모든사람들에게 전송 (순서2-3)
    socket.on('sendMsg', function(chatData) {
        socket.broadcast.emit('sendMsg_broadcast', chatData); 
    });

    // 연결 끊겼을 때 (순서 3-2)
    socket.on('disconnect', function() { 
        console.log(socket.name + '님이 나가셨습니다.');

        // 나가는 사람을 제외한 나머지 유저에게 메시지 전송
        socket.broadcast.emit('disconnectNotice', socket.name + '님이 나가셨습니다.');
    });   
});


/*
    서버 ip 가져오는 함수
*/
function getServerIp() {
    var ifaces = os.networkInterfaces();
    var result = '';
    
    for (var key in ifaces) {
        ifaces[key].forEach(function(details, index) {
            if (details.family == 'IPv4' && details.internal === false) {
                result = details.address;
            }
        });
    }
    
    return result;
}