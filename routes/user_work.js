const   fs          = require('fs');
const   express     = require('express');
const   ejs         = require('ejs');
const   mysql       = require('mysql');
const   bodyParser  = require('body-parser');
const   url         = require('url');
//const   session     = require('express-session');
const   router      = express.Router();
const   moment      = require('moment');
const   async       = require('async');

router.use(bodyParser.urlencoded({ extended: false }));


/* 
    데이터베이스 연동 소스코드 
*/
const db = mysql.createConnection({
    host:       'localhost',        // DB서버 IP주소
    port:       3306,               // DB서버 Port주소
    user:       'root',             // DB접속 아이디
    password:   'root',             // DB암호
    database:   'work_management',  //사용할 DB명
    dateStrings:'date',
    multipleStatements: true
});

/* 
    업무 조회 페이지를 출력합니다.
*/
const GetInquireWorkSheet = (req, res) => {

    if (req.session.userid) {
        
        // 주업무 데이터를 가져오는 쿼리문
        let last_sql_str    = "SELECT * FROM LAST_WORK WHERE user_id=?;";
        let this_sql_str    = "SELECT * FROM THIS_WORK WHERE user_id=?;";
        let future_sql_str  = "SELECT * FROM FUTURE_WORK WHERE user_id=?;";

        // 부업무 데이터를 가져오는 쿼리문
        let sub_last_sql_str    = "SELECT * FROM SUB_LAST_WORK WHERE user_id=?;";
        let sub_this_sql_str    = "SELECT * FROM SUB_THIS_WORK WHERE user_id=?;";
        let sub_future_sql_str  = "SELECT * FROM SUB_FUTURE_WORK WHERE user_id=?;";


        let inquirePageHtmlStream = '';
    
        inquirePageHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8');  
        inquirePageHtmlStream += fs.readFileSync(__dirname + '/../views/nav.ejs','utf8');     
        inquirePageHtmlStream += fs.readFileSync(__dirname + '/../views/inquire_worksheet.ejs','utf8'); 
        inquirePageHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 
        res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

        let last_result, this_result, future_result, sub_last_result, sub_this_result, sub_future_result;

        // 지난업무, 금주업무, 예정업무 동기화 처리를 하기 위함(SELECT문에만 async.waterfall을 사용하지 않고 mysql 다중쿼리 처리함)
        db.query(last_sql_str + sub_last_sql_str + this_sql_str + sub_this_sql_str + future_sql_str + sub_future_sql_str, 
            [req.session.userid, req.session.userid, req.session.userid, req.session.userid, req.session.userid, req.session.userid], (error, results) => {
            if (error) {
                console.log(error);
                res.end("error");
            } else {
                if (results[2].length <= 0) 
                    this_result = null;
                if (results[3].length <= 0)
                    sub_this_result = null;
                if (results[4].length <= 0)
                    future_result = null;
                if (results[5].length <= 0)
                    sub_future_result = null;

                last_result         = results[0]; 
                sub_last_result     = results[1];
                this_result         = results[2][0].work; // results는 배열로 받아온다. work는 this_work 테이블 내의 컬럼명.
                sub_this_result     = results[3][0].work;
                future_result       = results[4][0].work;
                sub_future_result   = results[5][0].work;

                res.end(ejs.render(inquirePageHtmlStream, {
                                                            'title'         :'업무관리 프로그램',
                                                            'url'           :'../../',
                                                            lastWork        :last_result,
                                                            'thisWork'      :this_result,
                                                            'futureWork'    :future_result,
                                                            sub_lastWork    :sub_last_result,
                                                            'sub_thisWork'  :sub_this_result,
                                                            'sub_futureWork':sub_future_result}));
            }
        });
    } else {
        let inquirePageErrorHtmlStream = '';
        inquirePageErrorHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
        inquirePageErrorHtmlStream += fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
        inquirePageErrorHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');
        
        res.status(562).end(ejs.render(inquirePageErrorHtmlStream, {
                                                                    'title' : '업무관리 프로그램',
                                                                    'error' : '업무 조회 페이지를 출력하는 도중'}));  
    }
};

/*
    금주 업무 등록하는 페이지를 출력합니다.
*/
const  GetThisWorkSheet = (req, res) => {   
    
    // 로그인에 성공했을 경우에만 업무 등록을 할 수 있음
    if (req.session.userid) {
        let this_sql_str        = "SELECT * FROM THIS_WORK WHERE user_id=?;";
        let sub_this_sql_str    = "SELECT * FROM SUB_THIS_WORK WHERE user_id=?;";

        let thisWorkPagehtmlStream = '';
    
        thisWorkPagehtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8');  
        thisWorkPagehtmlStream += fs.readFileSync(__dirname + '/../views/nav.ejs','utf8');       
        thisWorkPagehtmlStream += fs.readFileSync(__dirname + '/../views/today_worksheet.ejs','utf8'); 

        res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); 

        let this_work, sub_this_work;

        db.query(this_sql_str + sub_this_sql_str, [req.session.userid, req.session.userid], (error, results) => {
            if (error) {
                console.log(error);
                res.end("error");
            } else {
                if (results.length[0] <= 0)
                    this_work = null;
                if (results.length[1] <= 0)
                    sub_this_work = null;
                this_work       = results[0][0].work;
                sub_this_work   = results[1][0].work;

                res.end(ejs.render(thisWorkPagehtmlStream, {
                                                            'title'         :'업무관리 프로그램',
                                                            'url'           :'../../',
                                                            thisWork        :this_work,
                                                            sub_thisWork    :sub_this_work})); 
            }
        });
    } else {
        let thisWorkPageErrorHtmlStream = '';
        thisWorkPageErrorHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
        thisWorkPageErrorHtmlStream += fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
        thisWorkPageErrorHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');

        res.status(562).end(ejs.render(thisWorkPageErrorHtmlStream, {
                                                        'title' : '업무관리 프로그램',
                                                        'error' : '금주 업무 페이지를 출력하는 도중'}));  
    }
};

/*
    금주 업무 등록을 처리합니다.
*/
const HandleThisWorkSheet = (req, res) => {

    if (req.session.userid) {
        console.log('금주 업무 등록 요청보냄');
        // 주업무 등록하는 쿼리문
        let user_sql_str = 'SELECT * FROM USER WHERE user_id=?';
        let sql_str1 = 'SELECT * FROM THIS_WORK WHERE user_id=?';
        let sql_str2 = 'INSERT INTO THIS_WORK(start_date, end_date, user_id, user_name, work) VALUES(?, ?, ?, ?, ?)';
        let sql_str3 = 'UPDATE THIS_WORK SET work=? WHERE user_id=?';

        // 부업무 등록하는 쿼리문
        let sub_sql_str1 = 'SELECT * FROM SUB_THIS_WORK WHERE user_id=?';
        let sub_sql_str2 = 'INSERT INTO SUB_THIS_WORK(start_date, end_date, user_id, user_name, work) VALUES(?, ?, ?, ?, ?)';
        let sub_sql_str3 = 'UPDATE SUB_THIS_WORK SET work=? WHERE user_id=?';

        let body        = req.body;
        let userid      = req.session.userid;
        let username    = '';
        let today       = moment().day();
        let start_date  = moment().add((-1) * today, 'days').format("YYYY-MM-DD");
        let end_date    = moment().add((6 - today), 'days').format("YYYY-MM-DD");
        let work        = body.work;
        let sub_work    = body.sub_work;

        async.waterfall([
            function(callback) {
                db.query(user_sql_str, [userid], (error, results) => {
                    if (error) {     
                        console.log(error);
                        res.end("error");
                    } else   
                        username = results[0].user_name;
                });
                callback(null);
            },
            function(callback) {
                db.query(sql_str1, [userid], (error, results) => {
                    if (error) {     
                        console.log(error);
                        res.end("error");
                    } else {      
                        // 금주 주업무 등록이 안 되어있는 상태일 경우 데이터를 삽입합니다.
                        if (results[0] == null) {
                            db.query(sql_str2, [start_date, end_date, userid, username, work], (error) => {
                                    if (error) {
                                        res.end("error");
                                        console.log(error);
                                    } else 
                                        console.log('Insertion into DB was completed!');
                            }); // db.query();
                        } else { // 금주 주업무가 등록이 되어있는 상태일 경우 데이터를 수정합니다.
                            db.query(sql_str3, [work, userid], (error) => {
                                if (error) {
                                    res.end("error");
                                    console.log(error);
                                } else 
                                    console.log('update set DB was completed!');           
                            }); // db.query();
                        }              
                    }
                });
                callback(null);
            },
            function(callback){
                db.query(sub_sql_str1, [userid], (error, results) => {
                    if (error) {     
                        console.log(error);
                        res.end("error");
                    } else {     
                        // 금주 부업무 등록이 안 되어있는 상태일 경우 데이터를 삽입합니다.
                        if (results[0] == null) {
                            db.query(sub_sql_str2, [start_date, end_date, userid, username, sub_work], (error) => {
                                    if (error) {
                                        res.end("error");
                                        console.log(error);
                                    } else 
                                        console.log('Insertion into DB was completed!');
                            }); // db.query();
                        } else { // 금주 부업무가 등록이 되어있는 상태일 경우 데이터를 수정합니다.
                            db.query(sub_sql_str3, [sub_work, userid], (error) => {
                                if (error) {
                                    res.end("error");
                                    console.log(error);
                                } else 
                                    console.log('update set DB was completed!');
                            }); // db.query();
                        }              
                    }
                });
                callback(null);
            },
            function(callback) {
                res.redirect('/userwork/inquire_worksheet');
                callback(null);
            }
        ], function(error, result) {
            if (error)
                console.log(error);
        });
    } else {
        let HandleThisWorkErrorHtmlStream = '';
        HandleThisWorkErrorHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
        HandleThisWorkErrorHtmlStream += fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
        HandleThisWorkErrorHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');
        
        res.status(562).end(ejs.render(HandleThisWorkErrorHtmlStream, {
                                                                        'title' : '업무관리 프로그램',
                                                                        'error' : '금주 업무를 등록하는 도중'}));   
    }
};

/*
    예정된 업무를 등록하는 페이지를 출력합니다.
*/
const  GetFutureWorkSheet = (req, res) => {   
    
    if (req.session.userid) {
        let future_sql_str = "SELECT * FROM FUTURE_WORK WHERE user_id=?;";
        let sub_future_sql_str = "SELECT * FROM SUB_FUTURE_WORK WHERE user_id=?;";

        let futureWorkPagehtmlStream = '';
    
        futureWorkPagehtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8');   
        futureWorkPagehtmlStream += fs.readFileSync(__dirname + '/../views/nav.ejs','utf8');  
        futureWorkPagehtmlStream += fs.readFileSync(__dirname + '/../views/future_worksheet.ejs','utf8'); 

        res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

        let futureWork, sub_futureWork;

        db.query(future_sql_str + sub_future_sql_str, [req.session.userid, req.session.userid], (error, results) => {
            if (error) {
                console.log(error);
                res.end("error");
            } else {
                if (results.length[0] <= 0)
                    futureWork = null;
                if (results.length[1] <= 0)
                    sub_futureWork = null;
                
                futureWork      = results[0][0].work;
                sub_futureWork  = results[1][0].work;

                res.end(ejs.render(futureWorkPagehtmlStream, {
                                                                'title'         :'업무관리 프로그램',
                                                                'url'           :'../../',
                                                                futureWork      :futureWork,
                                                                sub_futureWork  :sub_futureWork})); 
            }
        });
        
    } else {
        let futureWorkPageErrorHtmlStream = '';
        futureWorkPageErrorHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
        futureWorkPageErrorHtmlStream += fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
        futureWorkPageErrorHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');

        res.status(562).end(ejs.render(futureWorkPageErrorHtmlStream, {
                                                                        'title' : '업무관리 프로그램',
                                                                        'url'   : '../../',
                                                                        'error' : '예정된 업무 페이지를 출력하는 도중'}));  
    }
};

/*
    예정된 업무 등록을 처리합니다. 
*/
const HandleFutureWorkSheet = (req, res) => {

    if (req.session.userid) {
        console.log('예정된 업무 등록 요청보냄');
        let user_sql_str = 'SELECT * FROM USER WHERE user_id=?';
        let sql_str1     = 'SELECT * FROM FUTURE_WORK WHERE user_id=?';
        let sql_str2     = 'INSERT INTO FUTURE_WORK(start_date, end_date, user_id, user_name, work) VALUES(?, ?, ?, ?, ?)';
        let sql_str3     = 'UPDATE FUTURE_WORK SET work=? WHERE user_id=?';

        let sub_sql_str1 = 'SELECT * FROM SUB_FUTURE_WORK WHERE user_id=?';
        let sub_sql_str2 = 'INSERT INTO SUB_FUTURE_WORK(start_date, end_date, user_id, user_name, work) VALUES(?, ?, ?, ?, ?)';
        let sub_sql_str3 = 'UPDATE SUB_FUTURE_WORK SET work=? WHERE user_id=?';
        
        
        let body        = req.body;
        let userid      = req.session.userid;
        let username    = '';
        let today       = moment().day();
        let start_date  = moment().add(6 - today, 'days').format("YYYY-MM-DD");
        let end_date    = moment().add(13 - today, 'days').format("YYYY-MM-DD");
        let work        = body.work;
        let sub_work    = body.sub_work;


        async.waterfall([
            function(callback) {
                db.query(user_sql_str, [userid], (error, results) => {
                    if (error) {     
                        console.log(error);
                        res.end("error");
                    } else 
                        username = results[0].user_name;
                });
                callback(null);
            },
            function(callback) {
                // 예정된 주업무 등록이 되어있는지 조사합니다.
                db.query(sql_str1, [userid], (error, results) => {
                    if (error) {     
                        console.log(error);
                        res.end("error");
                    } else {
                        // 예정된 주업무 등록이 안 되어있는 상태일 경우 데이터를 삽입합니다.
                        if (results[0] == null) {
                            db.query(sql_str2, [start_date, end_date, userid, username, work], (error) => {
                                    if (error) {
                                        res.end("error");
                                        console.log(error);
                                    } else 
                                        console.log('Insertion into DB was completed!');                                   
                            }); // db.query();
                        } else { // 예정된 주업무가 등록이 되어있는 상태일 경우 데이터를 수정합니다.
                            db.query(sql_str3, [work, userid], (error) => {
                                if (error) {
                                    res.end("error");
                                    console.log(error);
                                } else 
                                    console.log('update set DB was completed!');                                  
                            }); // db.query();
                        }    
                        callback(null);          
                    }
                });
            },
            function(callback){
                // 예정된 부업무 등록이 되어있는지 조사합니다.
                db.query(sub_sql_str1, [userid], (error, results) => {
                    if (error) {     
                        console.log(error);
                        res.end("error");
                    } else {

                        // 예정된 부업무 등록이 안 되어있는 상태일 경우 데이터를 삽입합니다.
                        if (results[0] == null) {
                            db.query(sub_sql_str2, [start_date, end_date, userid, username, sub_work], (error) => {
                                    if (error) {
                                        res.end("error");
                                        console.log(error);
                                    } else 
                                        console.log('Insertion into DB was completed!');                                       
                            }); // db.query();
                        } else { // 예정된 부업무가 등록이 되어있는 상태일 경우 데이터를 수정합니다.
                            db.query(sub_sql_str3, [sub_work, userid], (error) => {
                                if (error) {
                                    res.end("error");
                                    console.log(error);
                                } else 
                                    console.log('update set DB was completed!');
                            }); // db.query();
                        }  
                        callback(null);            
                    }
                });
            },
            function(callback) {
                res.redirect('/userwork/inquire_worksheet');
                callback(null);
            }
        ],  function(error, result) {
            if (error)
                console.log(error);
        });
    } else {
        let handleFutureWorkErrorHtmlStream = '';
        handleFutureWorkErrorHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
        handleFutureWorkErrorHtmlStream += fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
        handleFutureWorkErrorHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');

        res.status(562).end(ejs.render(handleFutureWorkErrorHtmlStream, {
                                                                        'title' : '업무관리 프로그램',
                                                                        'url'   : '../../',
                                                                        'error' : '예정된 업무 등록을 처리하는 도중'}));  
    }
};

/* 
    키워드 검색 페이지를 출력합니다.
*/
const GetSearchPage = (req, res) => {
    if (req.session.userid) {
        let searchBarHtmlStream = ''; 

        searchBarHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8'); 
        searchBarHtmlStream += fs.readFileSync(__dirname + '/../views/nav.ejs','utf8');  
        searchBarHtmlStream += fs.readFileSync(__dirname + '/../views/search_bar.ejs','utf8'); 
        searchBarHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

        res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
        res.end(ejs.render(searchBarHtmlStream, {
                                                'title' : '키워드 검색',
                                                'url'   : '../'}));
    } else {
        let searchBarPageErrorHtmlStream = '';
        searchBarPageErrorHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
        searchBarPageErrorHtmlStream += fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
        searchBarPageErrorHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');

        res.status(562).end(ejs.render(searchBarPageErrorHtmlStream, {
                                                                    'title' : '업무관리 프로그램',
                                                                    'url'   : '../../',
                                                                    'error' : '키워드 검색 페이지를 출력하는 도중'}));  
    }
};

/* 
    키워드 검색을 처리합니다.
*/
const HandleSearch = (req, res) => {
    if (req.session.userid) {
        const   query           = url.parse(req.url, true).query;
        let     search          = query.search;
        let     last_results;
        let     sub_last_results;

        let     sql_str1 = "SELECT * FROM LAST_WORK WHERE work LIKE '%" + search + "%';"
        let     sql_str2 = "SELECT * FROM SUB_LAST_WORK WHERE work LIKE '%" + search + "%';"

        db.query(sql_str1 + sql_str2, (error, results) => {
            if (error) {
                res.end("error");
                console.log(error);
            } else {
                last_results        = results[0];
                sub_last_results    = results[1];

                let searchResultHtmlStream = ''; 

                searchResultHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8'); 
                searchResultHtmlStream += fs.readFileSync(__dirname + '/../views/nav.ejs','utf8');  
                searchResultHtmlStream += fs.readFileSync(__dirname + '/../views/search_result.ejs','utf8'); 
                searchResultHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

                res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
                res.end(ejs.render(searchResultHtmlStream, {
                                                            'title' : '키워드 검색결과',
                                                            'url'   : '../',
                                                            lastWork : last_results,
                                                            sub_lastWork : sub_last_results}));
            }
        }); // db.query();
                
    } else {
        let handleSearchErrorHtmlStream = '';
        handleSearchErrorHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
        handleSearchErrorHtmlStream += fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
        handleSearchErrorHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');

        res.status(562).end(ejs.render(handleSearchErrorHtmlStream, {
                                                                    'title' : '업무관리 프로그램',
                                                                    'url'   : '../../',
                                                                    'error' : '키워드 검색을 처리하는 도중'}));  
    }
};

/* 
    전체 로그 보기 페이지를 출력합니다.
*/
const GetLogPage = (req, res) => {
    if (req.session.userid) {
        let sql_str1 = "SELECT date, user_id, user_name, ip_address FROM LOGIN_LOG;"
        
        db.query(sql_str1, (error, results) => {
            if (error) {
                res.end("error");
                console.log(error);
            } else {
                //console.log(results);
                let logPageHtmlStream = ''; 

                logPageHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8'); 
                logPageHtmlStream += fs.readFileSync(__dirname + '/../views/nav.ejs','utf8');  
                logPageHtmlStream += fs.readFileSync(__dirname + '/../views/log.ejs','utf8'); 
                logPageHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 
    
                res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
                res.end(ejs.render(logPageHtmlStream, {
                                                        'title'     : '전체 로그',
                                                        'url'       : '../',
                                                        results   : results}));
            }
        }); // db.query();
    } else {
        let logPageErrorHtmlStream = '';
        logPageErrorHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
        logPageErrorHtmlStream += fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
        logPageErrorHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');

        res.status(562).end(ejs.render(logPageErrorHtmlStream, {
                                                                'title' : 'Error',
                                                                'url'   : '../../',
                                                                'error' : '전체 로그 페이지를 출력하는 도중'}));  
    }
};

// 로그정보를 키워드로 검색합니다.
const GetSearchLog = (req, res) => {

    if (req.session.userid) {
        const   query   = url.parse(req.url, true).query;
        let     logid   = query.log_id;
        let     sql_str = "SELECT * FROM LOGIN_LOG WHERE user_name=?;";

        db.query(sql_str, [logid], (error, results) => {
            if (error) {
                res.end("error");
                console.log(error);
            } else {
                let logResultPageHtmlStream = ''; 

                logResultPageHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8'); 
                logResultPageHtmlStream += fs.readFileSync(__dirname + '/../views/nav.ejs','utf8');  
                logResultPageHtmlStream += fs.readFileSync(__dirname + '/../views/log.ejs','utf8'); 
                logResultPageHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 
    
                res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
                res.end(ejs.render(logResultPageHtmlStream, {
                                                            'title'     : '로그 검색 결과',
                                                            'url'       : '../',
                                                            results   : results}));
            }
        }); // db.query();

    } else {
        let logPageErrorHtmlStream = '';

        logPageErrorHtmlStream  += fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
        logPageErrorHtmlStream  += fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
        logPageErrorHtmlStream  += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');

        res.status(562).end(ejs.render(logPageErrorHtmlStream, {
                                                        'title' : 'Error',
                                                        'url'   : '../../',
                                                        'error' : '로그 검색 페이지를 출력하는 도중'}));  
    }
};

/* 
    지도 검색 페이지를 출력합니다.
*/
const GetMapPage = (req, res) => {
    if (req.session.userid) {
        let MapPageHtmlStream = ''; 

        MapPageHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8'); 
        MapPageHtmlStream += fs.readFileSync(__dirname + '/../views/nav.ejs','utf8');  
        MapPageHtmlStream += fs.readFileSync(__dirname + '/../views/map.ejs','utf8'); 
        MapPageHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

        res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
        res.end(ejs.render(MapPageHtmlStream, {
                                                'title' : '지도 검색',
                                                'url'   : '../'}));
    } else {
        let MapPageErrorHtmlStream = '';
        MapPageErrorHtmlStream += fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
        MapPageErrorHtmlStream += fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
        MapPageErrorHtmlStream += fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');

        res.status(562).end(ejs.render(MapPageErrorHtmlStream, {
                                                                    'title' : '업무관리 프로그램',
                                                                    'url'   : '../../',
                                                                    'error' : '지도 검색 페이지를 출력하는 도중'}));  
    }
};


router.get('/inquire_worksheet',        GetInquireWorkSheet);
router.get('/this_worksheet',           GetThisWorkSheet);
router.get('/future_worksheet',         GetFutureWorkSheet);
router.get('/search',                   GetSearchPage);
router.get('/result',                   HandleSearch);
router.get('/log',                      GetLogPage);
router.get('/logsearch',                GetSearchLog);
router.get('/map',                      GetMapPage);
router.post('/upload_this_worksheet',   HandleThisWorkSheet);
router.post('/upload_future_worksheet', HandleFutureWorkSheet);

module.exports = router