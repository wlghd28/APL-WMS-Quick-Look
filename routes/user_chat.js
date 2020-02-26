const   fs          = require('fs');
const   express     = require('express');
const   ejs         = require('ejs');
const   mysql       = require('mysql');
const   router      = express.Router();

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
    if(req.session.userid){
        let sql_str = "SELECT * FROM USER WHERE user_id = ?;";
        let userid = req.session.userid; 
        let username;

        db.query(sql_str, [userid], (error, results) => {
            if (error) {     
                console.log(error);

                let ErrorHtmlStream = '';

                ErrorHtmlStream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
                ErrorHtmlStream = ErrorHtmlStream + fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                ErrorHtmlStream = ErrorHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 
                res.status(562).end(ejs.render(ErrorHtmlStream, {
                                                                                'title' : '업무관리 프로그램',
                                                                                'url'   : '../../',
                                                                                'error' : '채팅창을 여는 도중 DB'})); 
            } else {
                username = results[0].user_name;

                let chatPageHtmlStream = ''; 

                chatPageHtmlStream = chatPageHtmlStream + fs.readFileSync(__dirname + '/../views/header.ejs','utf8'); 
                chatPageHtmlStream = chatPageHtmlStream + fs.readFileSync(__dirname + '/../views/chat.ejs','utf8'); 
                chatPageHtmlStream = chatPageHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

                res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
                res.end(ejs.render(chatPageHtmlStream, {
                                                        'title' : '로그인',
                                                        'url' : '../../' })); 
                    }
        });
    } else {
        let ErrorHtmlStream = '';
                
        ErrorHtmlStream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
        ErrorHtmlStream = ErrorHtmlStream + fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
        ErrorHtmlStream = ErrorHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 
        res.status(562).end(ejs.render(ErrorHtmlStream, {
                                                                        'title' : '업무관리 프로그램',
                                                                        'url'   : '../../',
                                                                        'error' : '로그인 정보'})); 
    }
};

router.get('/', GetChatPage);

module.exports = router