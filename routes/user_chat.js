const   fs          = require('fs');
const   express     = require('express');
const   ejs         = require('ejs');
const   mysql       = require('mysql');
const   bodyParser  = require('body-parser');
const   router      = express.Router();

router.use(bodyParser.urlencoded({ extended: false }));

/* 
    데이터베이스 연동 소스코드 
*/
const db = mysql.createConnection({
    host:       'localhost',        // DB서버 IP주소
    port:       3306,               // DB서버 Port주소
    user:       'root',             // DB접속 아이디
    password:   'root',             // DB암호
    database:   'work_management'   //사용할 DB명
});



/*
    채팅 화면을 출력합니다.
*/
const GetChatPage = (req, res) => {
    let chatPageHtmlStream = ''; 
    chatPageHtmlStream = chatPageHtmlStream + fs.readFileSync(__dirname + '/../views/header.ejs','utf8'); 
    chatPageHtmlStream = chatPageHtmlStream + fs.readFileSync(__dirname + '/../views/chat.ejs','utf8'); 
    chatPageHtmlStream = chatPageHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

    res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
    res.end(ejs.render(chatPageHtmlStream, {
                                            'title' : '채팅',
                                            'url' : '../../' })); 
};

router.get('/', GetChatPage);

module.exports = router