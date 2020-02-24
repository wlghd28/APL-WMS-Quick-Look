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
    let loginHtmlStream = ''; 
    loginHtmlStream = loginHtmlStream + fs.readFileSync(__dirname + '/../views/header.ejs','utf8'); 
    loginHtmlStream = loginHtmlStream + fs.readFileSync(__dirname + '/../views/login.ejs','utf8'); 
    loginHtmlStream = loginHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

    res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
    res.end(ejs.render(loginHtmlStream, {
                                        'title' : '로그인',
                                        'url' : '../../' })); 
};

/*
    로그인을 처리합니다.
*/
const HandleLogin = (req, res) => {
    let body = req.body; // body에 login.ejs 폼으로부터 name값(uid, pass)과 uid, pass의 value값이 넘어옴
    let userid, userpass, username;
    let sql_str, sql_str2;
    let ip_address;
    let errorHtmlStream = '';
    moment.tz.setDefault("Asia/Seoul");
    
    errorHtmlStream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
    errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
    errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');  

    console.log('로그인된 아이디 : ', body.uid);
    console.log('로그인된 패스워드 : ', body.pass);
  
    if (body.uid == '' || body.pass == '') {
        alert("아이디나 암호가 입력되지 않아서 로그인할 수 없습니다.");
        res.status(562).end(ejs.render(errorHtmlStream, {
                                                        'title' : '업무관리 프로그램',
                                                        'url'   : '../../'}));  
    } else {
        sql_str = "SELECT * from USER where user_id ='"+ body.uid +"' and user_pwd='" + body.pass + "';";
        sql_str2 = "INSERT INTO LOGIN_LOG(date, user_id, user_name, ip_address) VALUES(?, ?, ?, ?)";
        
        db.query(sql_str, (error, results, fields) => {
            if (error) 
            res.status(562).end(ejs.render(errorHtmlStream, {'title' : '업무관리 프로그램'}));  
            else {
                if (results.length <= 0) {  // select 조회결과가 없는 경우 (즉, 등록계정이 없는 경우)
                    res.status(562).end(ejs.render(errorHtmlStream, {
                                                                    'title' : '업무관리 프로그램',
                                                                    'url'   : '../../'}));  
                } else {  // select 조회결과가 있는 경우 (즉, 등록사용자인 경우)
                    console.log("results: ", results);  
                    results.forEach((user_data, index) => { // results는 db로부터 넘어온 key와 value를 0번째 방에 객체로 저장함
                        userid    = user_data.user_id;  
                        userpass  = user_data.user_pwd; 
                        username  = user_data.user_name;

                        console.log("DB에서 로그인성공한 ID/암호 : %s/%s", userid, userpass);

                        // 로그인이 성공한 경우
                        if (body.uid == userid && body.pass == userpass) {
                            req.session.auth    = 99;      // 임의로 수(99)로 로그인성공했다는 것을 설정함
                            req.session.userid  = userid; 
                            req.session.who     = username; // 인증된 사용자명 확보 (로그인후 이름출력용)
                            
                            if (body.uid == 'admin')     // 만약, 인증된 사용자가 관리자(admin)라면 이를 표시
                                req.session.admin = true;

                            ip_address = requestIp.getClientIp(req);
                            console.log("ip_address: ", ip_address);

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
    req.session.destroy();     // 세션을 제거하여 인증오작동 문제를 해결
    res.redirect('/user/login');         // 로그아웃후 메인화면으로 재접속
    console.log('로그아웃 완료!!');
}

/*
    회원가입 페이지를 출력합니다.
*/
const GetSignupPage = (req, res) => {
    let signUpHtmlStream = ''; 

    signUpHtmlStream = signUpHtmlStream + fs.readFileSync(__dirname + '/../views/header.ejs','utf8'); 
    signUpHtmlStream = signUpHtmlStream + fs.readFileSync(__dirname + '/../views/signup.ejs','utf8'); 
    signUpHtmlStream = signUpHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

    res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
    res.end(ejs.render(signUpHtmlStream, {
                                            'title' : '회원가입',
                                            'url'   : '../' }));
};

/*
    회원가입을 처리합니다.
*/
const HandleSignup = (req, res) => {
    console.log('회원가입 요청 보냄');
    let sql_str1            = 'SELECT * FROM USER WHERE user_id = ?';
    let sql_str2            = 'INSERT INTO USER(user_id, user_pwd, user_name, user_rank, phonenum, question, answer) VALUES(?,?,?,?,?,?,?)';
    let body                = req.body;
    let userid              = body.uid;
    let username            = body.uname;
    let password            = body.pass;
    let confirm_password    = body.pass2;
    let phonenum            = body.phone;
    let question            = body.question;
    let answer              = body.answer;
    console.log(req.body);
    console.log('POST 데이터 받음');

    db.query(sql_str1, [userid], (error, results) => {
        if (error) {     
            console.log(error);
            res.end("error");
        } else {
            // 입력받은 데이터가 DB에 존재하는지 판단합니다. 
            if (results[0] == null && password == confirm_password) {
                db.query(sql_str2, [userid, password, username, 0, phonenum, question, answer], (error) => {
                    if (error) {
                        res.end("error");
                        console.log(error);
                    } else {
                        console.log('Insertion into DB was completed!');
                        res.redirect('/user/login');
                    }
                }); // db.query();
            } else {
                  res.end("error");
            }              
        }
    });
};

/*
    ID 찾기 페이지를 출력합니다.
*/
const GetFindIdPage = (req, res) => {
    let findIdHtmlStream = ''; 

    findIdHtmlStream = findIdHtmlStream + fs.readFileSync(__dirname + '/../views/header.ejs','utf8'); 
    findIdHtmlStream = findIdHtmlStream + fs.readFileSync(__dirname + '/../views/find_id.ejs','utf8'); 
    findIdHtmlStream = findIdHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

    res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
    res.end(ejs.render(findIdHtmlStream, {
                                            'title' : 'ID 찾기',
                                            'url'   : '../' }));
};

/*
    ID 찾기를 처리합니다.
*/
const HandleFindId = (req, res) => {
    console.log("ID 찾기 POST 요청 보냄");
    let sql_str = "SELECT user_id FROM USER WHERE phonenum = ? and user_name = ?";
    let body = req.body;
    let phonenum = body.phone;
    let username = body.uname;

    let resultHtmlStream = '';
    let errorHtmlStream = '';

    db.query(sql_str, [phonenum, username], (error, results) => {
        if (error) {     
            console.log(error);
            res.end("error");
        } else {
            // 테스트 코드
            console.log(results);

            // 입력받은 데이터가 DB에 존재하는지 판단합니다. 
            if (results[0] == null) {
                errorHtmlStream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
                errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

                res.status(562).end(ejs.render(errorHtmlStream, {
                    'title' : '업무관리 프로그램',
                    'url'   : '../../'})); 
            } else {
                resultHtmlStream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
                resultHtmlStream = resultHtmlStream + fs.readFileSync(__dirname + '/../views/result_find_id.ejs','utf8'); 
                resultHtmlStream = resultHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

                res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
                res.end(ejs.render( resultHtmlStream, {
                    'title' : 'ID 찾기',
                    'url'   : '../',
                    'userid': results[0].user_id
                    }));
            }              
        }
    });
};

/*
    Password 찾기 페이지를 출력합니다.
*/
const GetFindPwdPage = (req, res) => {
    let findPwdHtmlStream = ''; 

    findPwdHtmlStream = findPwdHtmlStream + fs.readFileSync(__dirname + '/../views/header.ejs','utf8'); 
    findPwdHtmlStream = findPwdHtmlStream + fs.readFileSync(__dirname + '/../views/find_pwd.ejs','utf8'); 
    findPwdHtmlStream = findPwdHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

    res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
    res.end(ejs.render(findPwdHtmlStream, {
                                            'title' : '비밀번호 찾기',
                                            'url'   : '../' }));
};

/*
    Password 변경 페이지를 출력합니다. 
*/
// Password를 찾기위해 데이터를 입력 시 바로 변경 페이지로 이동합니다.
const GetAlterPwdPage = (req, res) => {
    console.log("비밀번호 변경 POST 요청 보냄");
    let sql_str = "SELECT * FROM USER WHERE phonenum = ? and user_id = ? and question = ? and answer = ?";
    let body = req.body;
    let phonenum = body.phone;
    let userid = body.uid;
    let question = body.question;
    let answer = body.answer;

    let resultHtmlStream = '';
    let errorHtmlStream = '';

    db.query(sql_str, [phonenum, userid, question, answer], (error, results) => {
        if (error) {     
            console.log(error);
            res.end("error");
        } else {
            // 테스트 코드
            console.log(results);

            // 입력받은 데이터가 DB에 존재하는지 판단합니다. 
            if (results[0] == null) {
                errorHtmlStream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
                errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
                errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

                res.status(562).end(ejs.render(errorHtmlStream, {
                    'title' : '업무관리 프로그램',
                    'url'   : '../../'})); 
            } else {
                resultHtmlStream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
                resultHtmlStream = resultHtmlStream + fs.readFileSync(__dirname + '/../views/change_pwd.ejs','utf8'); 
                resultHtmlStream = resultHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

                res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
                res.end(ejs.render( resultHtmlStream, {
                    'title' : '비밀번호 변경',
                    'url'   : '../',
                    'userid': userid
                    }));
            }              
        }
    });
};

/*
    Password 변경을 처리합니다.
*/
const HandleAlterPwd = (req, res) => {
    console.log("비밀번호 변경 PUT 요청 보냄");
    let sql_str = "UPDATE USER SET user_pwd = ? WHERE user_id = ?";
    let body = req.body;
    let userid = body.uid;
    let password = body.pass;

    let errorHtmlStream = '';

    console.log(body);
    db.query(sql_str, [password, userid], (error, results) => {
        if (error) {     
            console.log(error);
            errorHtmlStream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
            errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
            errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 
            res.status(562).end(ejs.render(errorHtmlStream, {
                    'title' : '업무관리 프로그램',
                    'url'   : '../../'})); 
        } else {
            // 테스트 코드
            console.log(results);
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