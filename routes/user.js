const   fs          = require('fs');
const   express     = require('express');
const   ejs         = require('ejs');
const   mysql       = require('mysql');
const   bodyParser  = require('body-parser');
const   methodOverride = require('method-override');
//const   session     = require('express-session');
const   router      = express.Router();
const   requestIp   = require('request-ip');
const   moment      = require('moment');
require('moment-timezone');

router.use(methodOverride('_method'));
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
    회원 로그인 화면을 출력합니다.
*/
const GetLoginPage = (req, res) => {
    let loginPageHtmlStream = ''; 
    loginPageHtmlStream = loginPageHtmlStream + fs.readFileSync(__dirname + '/../views/header.ejs','utf8'); 
    loginPageHtmlStream = loginPageHtmlStream + fs.readFileSync(__dirname + '/../views/login.ejs','utf8'); 
    loginPageHtmlStream = loginPageHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

    res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
    res.end(ejs.render(loginPageHtmlStream, {
                                            'title' : '로그인',
                                            'url' : '../../' })); 
};

/*
    로그인을 처리합니다.
*/
const HandleLogin = (req, res) => {
    let body = req.body; // body에 login.ejs 폼으로부터 name값 value값이 객체 형식으로 넘어옴 {uid: '어쩌고', pass: '저쩌고'}
    let userid, userpass, username;
    let sql_str, sql_str2;
    let ip_address;
    let handleLoginErrorHtmlStream = '';
    moment.tz.setDefault("Asia/Seoul");
    
    handleLoginErrorHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
    handleLoginErrorHtmlStream += fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
    handleLoginErrorHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  

    if (body.uid == '' || body.pass == '') {
        res.status(562).end(ejs.render(handleLoginErrorHtmlStream, {
                                                                    'title' : '업무관리 프로그램',
                                                                    'url'   : '../../',
                                                                    'error' : '로그인을 처리하는 도중'}));  
    } else {
        sql_str = "SELECT * FROM USER WHERE user_id=? AND user_pwd=?;";
        sql_str2 = "INSERT INTO LOGIN_LOG(date, user_id, user_name, ip_address) VALUES(?, ?, ?, ?)";
        
        db.query(sql_str, [body.uid, body.pass], (error, results, fields) => {
            if (error) {
                res.status(562).end(ejs.render(handleLoginErrorHtmlStream, {
                                                                            'title' : '업무관리 프로그램',
                                                                            'url'   : '../../',
                                                                            'error' : '로그인을 처리하는 도중'}));  
                console.log(error); 
            } else {
                if (results.length <= 0) {  // select 조회결과가 없는 경우 (즉, 등록계정이 없는 경우)
                    res.status(562).end(ejs.render(handleLoginErrorHtmlStream, {
                                                                                'title' : '업무관리 프로그램',
                                                                                'url'   : '../../',
                                                                                'error' : '로그인을 처리하는 도중'}));  
                } else {  // select 조회결과가 있는 경우 (즉, 등록된 계정이 존재하는 경우)
                    //console.log("results: ", results);  
                    results.forEach((user_data, index) => { // results는 db로부터 넘어온 key와 value를 0번째 방에 객체로 저장함
                        userid    = user_data.user_id;  
                        userpass  = user_data.user_pwd; 
                        username  = user_data.user_name;

                        //console.log("DB에서 로그인성공한 ID/암호 : %s/%s", userid, userpass);

                        // 로그인이 성공한 경우
                        if (body.uid == userid && body.pass == userpass) {
                            req.session.auth    = 99;      // 임의로 수(99)로 로그인성공했다는 것을 설정함
                            req.session.userid  = userid; 
                            req.session.who     = username; // 인증된 사용자명 확보 (로그인후 이름출력용)
                            
                            if (body.uid == 'admin')     // 만약, 인증된 사용자가 관리자(admin)라면 이를 표시
                                req.session.admin = true;

                            ip_address = requestIp.getClientIp(req);
                            //console.log("ip_address: ", ip_address);

                            // 접속로그를 남깁니다.
                            db.query(sql_str2, [moment().format('YYYY-MM-DD HH:mm:ss'), userid, username, ip_address], (error) => {
                                if (error) {     
                                    console.log(error);
                                    res.end("error");
                                } else {
                                    console.log('Insertion into DB was completed!');
                                }
                            });   
                            res.redirect('/userwork/inquire_worksheet');
                        }
                    }); // foreach 
                } // else
            }  // else
        });
   } // else
};

/*
    로그아웃을 처리합니다.
*/
const HandleLogout = (req, res) => {
    req.session.destroy();          // 세션을 완전히 제거하여 인증오작동 문제를 해결
    res.redirect('/user/login');    // 로그아웃후 메인화면으로 재접속
    //console.log('로그아웃 완료!!');
}

/*
    회원가입 페이지를 출력합니다.
*/
const GetSignupPage = (req, res) => {
    let signUpPageHtmlStream = ''; 

    signUpPageHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8'); 
    signUpPageHtmlStream += fs.readFileSync(__dirname + '/../views/signup.ejs','utf8'); 
    signUpPageHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

    res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
    res.end(ejs.render(signUpPageHtmlStream, {
                                                'title' : '회원가입',
                                                'url'   : '../' }));
};

/*
    회원가입을 처리합니다.
*/
const HandleSignup = (req, res) => {
    //console.log('회원가입 요청 보냄');
    let sql_str1            = 'SELECT * FROM USER WHERE user_id=?';
    let sql_str2            = 'INSERT INTO USER(user_id, user_pwd, user_name, user_rank, phonenum, question, answer) VALUES(?, ?, ?, ?, ?, ?, ?)';
    let body                = req.body;
    let userid              = body.uid;
    let username            = body.uname;
    let password            = body.pass;
    let confirm_password    = body.pass2;
    let phonenum            = body.phone;
    let question            = body.question;
    let answer              = body.answer;

    // console.log(req.body);
    // console.log('POST 데이터 받음');

    db.query(sql_str1, [userid], (error, results) => {
        if (error) {     
            console.log(error);
            res.end("error");
        } else {
            // 입력받은 데이터가 DB에 존재하는지 판단합니다. 
            if (results[0] == undefined && password == confirm_password) {
                db.query(sql_str2, [userid, password, username, 0, phonenum, question, answer], (error) => {
                    if (error) {
                        res.end("error");
                        console.log(error);
                    } else {
                        console.log('Insertion into DB was completed!');
                        let signUpSucessPageHtmlStream = '';
                        signUpSucessPageHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
                        signUpSucessPageHtmlStream += fs.readFileSync(__dirname + '/../views/signup_success.ejs','utf8');
                        signUpSucessPageHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');
                
                        res.status(562).end(ejs.render(signUpSucessPageHtmlStream, {
                                                                        'title' : '회원가입 완료',
                                                                        'url'   : '../../'})); 
                    }
                }); // db.query();
            } else {
                let handleSignUpErrorHtmlStream = '';
                handleSignUpErrorHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
                handleSignUpErrorHtmlStream += fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                handleSignUpErrorHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');
        
                res.status(562).end(ejs.render(handleSignUpErrorHtmlStream, {
                                                                'title' : '업무관리 프로그램',
                                                                'url'   : '../../',
                                                                'error' : '회원가입 처리도중 아이디 중복'}));  
            }              
        }
    });
};

/*
    ID 찾기 페이지를 출력합니다.
*/
const GetFindIdPage = (req, res) => {
    let findIdPageHtmlStream = ''; 

    findIdPageHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8'); 
    findIdPageHtmlStream += fs.readFileSync(__dirname + '/../views/find_id.ejs','utf8'); 
    findIdPageHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

    res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
    res.end(ejs.render(findIdPageHtmlStream, {
                                            'title' : 'ID 찾기',
                                            'url'   : '../' }));
};

/*
    ID 찾기를 처리합니다.
*/
const HandleFindId = (req, res) => {
    //console.log("ID 찾기 POST 요청 보냄");
    let sql_str = "SELECT user_id FROM USER WHERE phonenum=? AND user_name=?";
    let body = req.body;
    let phonenum = body.phone;
    let username = body.uname;

    let findIdResultPageHTMLStream = '';
    let handleFindIdErrorHtmlStream = '';

    db.query(sql_str, [phonenum, username], (error, results) => {
        if (error) {     
            console.log(error);
            res.end("error");
        } else {
            // 테스트 코드
            //console.log(results);

            // 입력받은 데이터가 DB에 존재하는지 판단합니다. 
            if (results[0] == null) {
                handleFindIdErrorHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
                handleFindIdErrorHtmlStream += fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                handleFindIdErrorHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

                res.status(562).end(ejs.render(handleFindIdErrorHtmlStream, {
                                                                            'title' : '업무관리 프로그램',
                                                                            'url'   : '../../',
                                                                            'error' : '아이디 찾기를 처리하는 도중'})); 
            } else {
                findIdResultPageHTMLStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
                findIdResultPageHTMLStream += fs.readFileSync(__dirname + '/../views/result_find_id.ejs','utf8'); 
                findIdResultPageHTMLStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

                res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
                res.end(ejs.render( findIdResultPageHTMLStream, {
                                                                'title' : '아이디 찾기',
                                                                'url'   : '../',
                                                                'userid': results[0].user_id}));
            }              
        }
    });
};

/*
    Password 찾기 페이지를 출력합니다.
*/
const GetFindPwdPage = (req, res) => {
    let findPwdPageHtmlStream = ''; 

    findPwdPageHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8'); 
    findPwdPageHtmlStream += fs.readFileSync(__dirname + '/../views/find_pwd.ejs','utf8'); 
    findPwdPageHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

    res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
    res.end(ejs.render(findPwdPageHtmlStream, {
                                                'title' : '비밀번호 찾기',
                                                'url'   : '../' }));
};

/*
    Password 변경 페이지를 출력합니다. 
*/
// Password를 찾기위해 데이터를 입력 시 바로 변경 페이지로 이동합니다.
const GetAlterPwdPage = (req, res) => {
    //console.log("비밀번호 변경 POST 요청 보냄");
    let sql_str     = "SELECT * FROM USER WHERE phonenum=? AND user_id=? AND question=? AND answer=?";
    let body        = req.body;
    let phonenum    = body.phone;
    let userid      = body.uid;
    let question    = body.question;
    let answer      = body.answer;

    let pwdChangeResulPageHtmlStream = '';
    let changePwdPageErrorHtmlStream = '';

    db.query(sql_str, [phonenum, userid, question, answer], (error, results) => {
        if (error) {     
            console.log(error);
            res.end("error");
        } else {
            // 테스트 코드
            //console.log(results);

            // 입력받은 데이터가 DB에 존재하는지 판단합니다. 
            if (results[0] == null) {
                changePwdPageErrorHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
                changePwdPageErrorHtmlStream += fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                changePwdPageErrorHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

                res.status(562).end(ejs.render(changePwdPageErrorHtmlStream, {
                                                                            'title' : '업무관리 프로그램',
                                                                            'url'   : '../../',
                                                                            'error' : '비밀번호 변경 페이지를 출력하는 도중'})); 
            } else {
                pwdChangeResulPageHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
                pwdChangeResulPageHtmlStream += fs.readFileSync(__dirname + '/../views/change_pwd.ejs','utf8'); 
                pwdChangeResulPageHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

                res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
                res.end(ejs.render(pwdChangeResulPageHtmlStream, {
                                                                'title' : '비밀번호 변경',
                                                                'url'   : '../',
                                                                'userid': userid }));
            }              
        }
    });
};

/*
    Password 변경을 처리합니다.
*/
const HandleAlterPwd = (req, res) => {
    //console.log("비밀번호 변경 PUT 요청 보냄");
    let sql_str     = "UPDATE USER SET user_pwd=? WHERE user_id=?";
    let body        = req.body;
    let userid      = body.uid;
    let password    = body.pass;

    let HandleChangePwdErrorHtmlStream = '';

    //console.log(body);
    db.query(sql_str, [password, userid], (error, results) => {
        if (error) {     
            console.log(error);
            HandleChangePwdErrorHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
            HandleChangePwdErrorHtmlStream += fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
            HandleChangePwdErrorHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 
            res.status(562).end(ejs.render(HandleChangePwdErrorHtmlStream, {
                                                                            'title' : '업무관리 프로그램',
                                                                            'url'   : '../../',
                                                                            'error' : '패스워드 변경을 처리하는 도중'})); 
        } else {
            // 테스트 코드
            //console.log(results);
            res.redirect('/user/login');
        }
    });
};


router.get('/login',    GetLoginPage);
router.get('/logout',   HandleLogout);
router.get('/signup',   GetSignupPage);
router.get('/findid',   GetFindIdPage);
router.get('/findpwd',  GetFindPwdPage);
router.post('/login',   HandleLogin);
router.post('/signup',  HandleSignup);
router.post('/findid',  HandleFindId);
router.post('/findpwd', GetAlterPwdPage);
router.put('/alterpwd', HandleAlterPwd);

module.exports = router