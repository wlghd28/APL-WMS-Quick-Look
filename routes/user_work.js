const   fs          = require('fs');
const   express     = require('express');
const   ejs         = require('ejs');
const   mysql       = require('mysql');
const   bodyParser  = require('body-parser');
const   url = require('url');
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
    database:   'work_management'   //사용할 DB명
});


/* 
    업무 조회 페이지를 출력합니다.
*/
const GetInquireWorkSheet = (req, res) => {

    if (req.session.userid) {
        // 주업무 데이터를 가져오는 쿼리문
        let last_sql_str    = "SELECT * FROM LAST_WORK WHERE user_id = ?";
        let this_sql_str    = "SELECT * FROM THIS_WORK WHERE user_id = ?";
        let future_sql_str  = "SELECT * FROM FUTURE_WORK WHERE user_id = ?";

        // 부업무 데이터를 가져오는 쿼리문
        let sub_last_sql_str    = "SELECT * FROM SUB_LAST_WORK WHERE user_id = ?";
        let sub_this_sql_str    = "SELECT * FROM SUB_THIS_WORK WHERE user_id = ?";
        let sub_future_sql_str  = "SELECT * FROM SUB_FUTURE_WORK WHERE user_id = ?";


        let htmlStream      = '';
    
        htmlStream = htmlStream + fs.readFileSync(__dirname + '/../views/header.ejs','utf8');  
        htmlStream = htmlStream + fs.readFileSync(__dirname + '/../views/nav.ejs','utf8');     
        htmlStream = htmlStream + fs.readFileSync(__dirname + '/../views/inquire_worksheet.ejs','utf8'); 
        htmlStream = htmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 
        res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

        let last_result, this_result, future_result, sub_last_result, sub_this_result, sub_future_result;
        // 지난업무, 금주업무, 예정업무 동기화 처리를 하기 위함
        async.waterfall([
            function(callback) {
                db.query(last_sql_str, [req.session.userid], (error, results) => {
                    if (error) {
                        console.log(error);
                        res.end("error");
                    } else{
                            last_result = results;
                    }
                    callback(null);
                });
            },
            function(callback){
                db.query(sub_last_sql_str, [req.session.userid], (error, results) => {
                    if (error) {
                        console.log(error);
                        res.end("error");
                    } else{
                            sub_last_result = results;

                    }
                    callback(null);
                });
            },
            function(callback){
                db.query(this_sql_str, [req.session.userid], (error, results) => {
                    if (error) {
                        console.log(error);
                        res.end("error");
                    } else {
                        if (results.length <= 0)
                            this_result = null;
                        else {
                            this_result = results[0].work;
                        }
                        callback(null);
                    }
                });
            },
            function(callback){
                db.query(sub_this_sql_str, [req.session.userid], (error, results) => {
                    if (error) {
                        console.log(error);
                        res.end("error");
                    } else {
                        if (results.length <= 0)
                            sub_this_result = null;
                        else {
                            sub_this_result = results[0].work;
                        }
                        callback(null);
                    }
                });
            },
            function(callback){
                db.query(future_sql_str, [req.session.userid], (error, results) => {
                    if (error) {
                        console.log(error);
                        res.end("error");
                    } else {
                        if (results.length <= 0) 
                            future_result = null;
                        else {
                            future_result = results[0].work;
                        }
                        callback(null);
                    }
                   
                });
            },
            function(callback){
                db.query(sub_future_sql_str, [req.session.userid], (error, results) => {
                    if (error) {
                        console.log(error);
                        res.end("error");
                    } else {
                        if (results.length <= 0) 
                            sub_future_result = null;
                        else {
                            sub_future_result = results[0].work;
                        }
                        callback(null);
                    }
                });
            },
            function(callback) {
                res.end(ejs.render(htmlStream, {
                                                'title'         :'업무관리 프로그램',
                                                'url'           :'../../',
                                                lastWork        :last_result,
                                                'thisWork'      :this_result,
                                                'futureWork'    :future_result,
                                                sub_lastWork    :sub_last_result,
                                                'sub_thisWork'  :sub_this_result,
                                                'sub_futureWork':sub_future_result,
                }));
                callback(null);
            }
        ], function(error, results) {
            if (error)
                console.log(error);
        }); 
    } else {
        let errorHtmlStream = '';
        errorHtmlStream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
        errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
        errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');
        
        res.status(562).end(ejs.render(errorHtmlStream, {'title' : '업무관리 프로그램'}));  
    }
};

/*
    금주 업무 등록하는 페이지를 출력합니다.
*/
const  GetThisWorkSheet = (req, res) => {   
    
    // 로그인에 성공했을 경우에만 업무 등록을 할 수 있음
    if (req.session.userid) {
        let this_sql_str        = "SELECT * FROM THIS_WORK WHERE user_id = ?";
        let sub_this_sql_str    = "SELECT * FROM SUB_THIS_WORK WHERE user_id = ?";

        let htmlStream          = '';
    
        htmlStream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');    
        htmlStream = htmlStream + fs.readFileSync(__dirname + '/../views/today_worksheet.ejs','utf8'); 

        res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); 

        let this_work, sub_this_work;

        async.waterfall([
            function(callback) {
                db.query(this_sql_str, [req.session.userid], (error, results) => {
                    if(error){
                        console.log(error);
                        res.end("error");
                    } else {
                        if(results.length <= 0){
                            this_work = '없음';
                        }
                        else{
                            this_work = results[0].work;
                        }
                        callback(null);
                    }
                });
            },
            function(callback) {
                db.query(sub_this_sql_str, [req.session.userid], (error, results) => {
                    if(error){
                        console.log(error);
                        res.end("error");
                    } else {    
                        if(results.length <= 0){
                            sub_this_work = '없음';
                        }
                        else{
                            sub_this_work = results[0].work;
                        }
                        callback(null);         
                    }
                });
            },
            function(callback) {
                res.end(ejs.render(htmlStream, {
                    'title'         :'업무관리 프로그램',
                    'url'           :'../../',
                    thisWork        :this_work,
                    sub_thisWork    :sub_this_work
                 })); 
                callback(null);
            }
        ], function(error, result) {
            if (error)
                console.log(error);
        });
    } else {
        let errorHtmlStream = '';
        errorHtmlStream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
        errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
        errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');

        res.status(562).end(ejs.render(errorHtmlStream, {'title' : '업무관리 프로그램'}));  
    }
};

/*
    금주 업무 등록을 처리합니다.
*/
const HandleThisWorkSheet = (req, res) => {

    if (req.session.userid) {
        console.log('금주 업무 등록 요청보냄');
        // 주업무 등록하는 쿼리문
        let sql_str1 = 'SELECT * FROM THIS_WORK WHERE user_id = ?';
        let sql_str2 = 'INSERT INTO THIS_WORK(start_date, end_date, user_id, user_name, work) VALUES(?,?,?,?,?)';
        let sql_str3 = 'UPDATE THIS_WORK SET work = ? WHERE user_id = ?';

        // 부업무 등록하는 쿼리문
        let sub_sql_str1 = 'SELECT * FROM SUB_THIS_WORK WHERE user_id = ?';
        let sub_sql_str2 = 'INSERT INTO SUB_THIS_WORK(start_date, end_date, user_id, user_name, work) VALUES(?,?,?,?,?)';
        let sub_sql_str3 = 'UPDATE SUB_THIS_WORK SET work = ? WHERE user_id = ?';

        let body = req.body;
        let userid = req.session.userid;
        let username = req.session.who;
        let start_date, end_date;
        let today = moment().day();
        let work = body.work;
        let sub_work = body.sub_work;

        start_date = moment().add((-1) * today, 'days').format("YYYY-MM-DD");
        end_date = moment().add((6 - today), 'days').format("YYYY-MM-DD");


        console.log(req.body);
        console.log(userid);
        console.log(start_date);
        console.log(end_date);
        console.log('POST 데이터 받음');

        async.waterfall([
            function(callback) {
                db.query(sql_str1, [userid], (error, results) => {
                    if (error) {     
                        console.log(error);
                        res.end("error");
                    } else {      
                        // 금주 주업무 등록이 안 되어있는 상태일 경우 데이터를 삽입합니다.
                        if (results[0] == null) {
                            db.query(sql_str2, [start_date, end_date, userid, username, userwork], (error) => {
                                    if (error) {
                                        res.end("error");
                                        console.log(error);
                                    } else {
                                        console.log('Insertion into DB was completed!');
                                    }
                            }); // db.query();
                        } else { // 금주 주업무가 등록이 되어있는 상태일 경우 데이터를 수정합니다.
                            db.query(sql_str3, [work, userid], (error) => {
                                if (error) {
                                    res.end("error");
                                    console.log(error);
                                } else {
                                    console.log('update set DB was completed!');           
                                }
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
                                    } else {
                                        console.log('Insertion into DB was completed!');
                                       
                                    }
                            }); // db.query();
                        } else { // 금주 부업무가 등록이 되어있는 상태일 경우 데이터를 수정합니다.
                            db.query(sub_sql_str3, [sub_work, userid], (error) => {
                                if (error) {
                                    res.end("error");
                                    console.log(error);
                                } else {
                                    console.log('update set DB was completed!');
                                }
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
        // 금주 업무 등록이 되어있는지 조사합니다.
        
    } else {
        let errorHtmlStream = '';
        errorHtmlStream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
        errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
        errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');
        
        res.status(562).end(ejs.render(errorHtmlStream, {'title' : '업무관리 프로그램'}));   
    }
};

/*
    예정된 업무를 등록하는 페이지를 출력합니다.
*/
const  GetFutureWorkSheet = (req, res) => {   
    
    if (req.session.userid) {
        let future_sql_str = "SELECT * FROM FUTURE_WORK WHERE user_id = ?";
        let sub_future_sql_str = "SELECT * FROM SUB_FUTURE_WORK WHERE user_id = ?";

        let htmlStream = '';
    
        htmlStream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');   
        htmlStream = htmlStream + fs.readFileSync(__dirname + '/../views/future_worksheet.ejs','utf8'); 

        res.writeHead(200, {'Content-Type':'text/html; charset=utf8'});

        let futureWork, sub_futureWork;

        async.waterfall([
            function(callback) {
                db.query(future_sql_str, [req.session.userid], (error, results) => {
                    if (error) {
                        console.log(error);
                        res.end("error");
                    } else {
                        if(results.length <= 0){
                            futureWork = null;
                        } else {
                            futureWork = results[0].work;
                        }
                    }
                    callback(null);
                });
            },
            function(callback){
                db.query(sub_future_sql_str, [req.session.userid], (error, results) => {
                    if (error) {
                        console.log(error);
                        res.end("error");
                    } else {
                        if(results.length <= 0){
                            sub_futureWork = null;
                        } else {
                            sub_futureWork = results[0].work;
                        }
                    }
                    callback(null);
                });
            },
            function(callback) {
                res.end(ejs.render(htmlStream, {
                                                'title'         :'업무관리 프로그램',
                                                'url'           :'../../',
                                                futureWork      :futureWork,
                                                sub_futureWork  :sub_futureWork
                 })); 
                callback(null);
            }
        ],  function(error, result) {
            if (error)
                console.log(error);
        });
    } else {
        let errorHtmlStream = '';
        errorHtmlStream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
        errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
        errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');

        res.status(562).end(ejs.render(errorHtmlStream, {
                                                        'title' : '업무관리 프로그램',
                                                        'url'   : '../../'}));  
    }
};

/*
    예정된 업무 등록을 처리합니다. 
*/
const HandleFutureWorkSheet = (req, res) => {

    if (req.session.userid) {
        console.log('예정된 업무 등록 요청보냄');
        let sql_str1 = 'SELECT * FROM FUTURE_WORK WHERE user_id = ?';
        let sql_str2 = 'INSERT INTO FUTURE_WORK(start_date, end_date, user_id, work) VALUES(?,?,?,?)';
        let sql_str3 = 'UPDATE FUTURE_WORK SET work = ? WHERE user_id = ?';

        let sub_sql_str1 = 'SELECT * FROM SUB_FUTURE_WORK WHERE user_id = ?';
        let sub_sql_str2 = 'INSERT INTO SUB_FUTURE_WORK(start_date, end_date, user_id, work) VALUES(?,?,?,?)';
        let sub_sql_str3 = 'UPDATE SUB_FUTURE_WORK SET work = ? WHERE user_id = ?';
        
        
        let body = req.body;
        let userid = req.session.userid;
        //let username = req.session.who;
        let start_date, end_date;
        let today = moment().day();
        let work = body.work;
        let sub_work = body.sub_work;

        start_date = moment().add(6 - today, 'days').format("YYYY-MM-DD");
        end_date = moment().add(13 - today, 'days').format("YYYY-MM-DD");


        console.log(req.body);
        console.log(start_date);
        console.log(end_date);
        console.log('POST 데이터 받음');

        async.waterfall([
            function(callback) {
                // 예정된 주업무 등록이 되어있는지 조사합니다.
                db.query(sql_str1, [userid], (error, results) => {
                    if (error) {     
                        console.log(error);
                        res.end("error");
                    } else {
                        // 예정된 주업무 등록이 안 되어있는 상태일 경우 데이터를 삽입합니다.
                        if (results[0] == null) {
                            db.query(sql_str2, [start_date, end_date, userid, work], (error) => {
                                    if (error) {
                                        res.end("error");
                                        console.log(error);
                                    } else {
                                        console.log('Insertion into DB was completed!');                                   
                                    }
                            }); // db.query();
                        } else { // 예정된 주업무가 등록이 되어있는 상태일 경우 데이터를 수정합니다.
                            db.query(sql_str3, [work, userid], (error) => {
                                if (error) {
                                    res.end("error");
                                    console.log(error);
                                } else {
                                    console.log('update set DB was completed!');                                  
                                }
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
                            db.query(sub_sql_str2, [start_date, end_date, userid, sub_work], (error) => {
                                    if (error) {
                                        res.end("error");
                                        console.log(error);
                                    } else {
                                        console.log('Insertion into DB was completed!');                                       
                                    }
                            }); // db.query();
                        } else { // 예정된 부업무가 등록이 되어있는 상태일 경우 데이터를 수정합니다.
                            db.query(sub_sql_str3, [sub_work, userid], (error) => {
                                if (error) {
                                    res.end("error");
                                    console.log(error);
                                } else {
                                    console.log('update set DB was completed!');
                                }
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
        let errorHtmlStream = '';
        errorHtmlStream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
        errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
        errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');

        res.status(562).end(ejs.render(errorHtmlStream, {
                                                        'title' : '업무관리 프로그램',
                                                        'url'   : '../../'}));  
    }
};

/* 
    키워드 검색 페이지를 출력합니다.
*/
const GetSearchPage = (req, res) => {
    if(req.session.userid){
        let searchResultHtmlStream = ''; 

        searchResultHtmlStream = searchResultHtmlStream + fs.readFileSync(__dirname + '/../views/header.ejs','utf8'); 
        searchResultHtmlStream = searchResultHtmlStream + fs.readFileSync(__dirname + '/../views/search_bar.ejs','utf8'); 
        searchResultHtmlStream = searchResultHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

        res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
        res.end(ejs.render(searchResultHtmlStream, {
                                                'title' : '키워드 검색',
                                                'url'   : '../' }));
    } else {
        let errorHtmlStream = '';
        errorHtmlStream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
        errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
        errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');

        res.status(562).end(ejs.render(errorHtmlStream, {
                                                        'title' : '업무관리 프로그램',
                                                        'url'   : '../../'}));  
    }
};

/* 
    키워드 검색을 처리합니다.
*/
const HandleSearch = (req, res) => {

    if(req.session.userid){
        const  query = url.parse(req.url, true).query;
        let search = query.search;
        let last_results;
        let sub_last_results;

        let sql_str1 = "SELECT * FROM LAST_WORK WHERE work 'LIKE %?%'";
        let sql_str2 = "SELECT * FROM SUB_LAST_WORK WHERE work 'LIKE %?%'";
        // 테스트 코드
        console.log(query);
        async.waterfall([
            function(callback) {
                db.query(sql_str1, [search], (error, results) => {
                    if (error) {
                        res.end("error");
                        console.log(error);
                    } else {
                        last_results = results;
                        callback(null);
                    }
                }); // db.query();
            },
            function(callback){
                db.query(sql_str2, [search], (error, results) => {
                    if (error) {
                        res.end("error");
                        console.log(error);
                    } else {
                        sub_last_results = results;
                        callback(null);
                    }
                }); // db.query();
            },
            function(callback) {
                let searchResultHtmlStream = ''; 

                searchResultHtmlStream = searchResultHtmlStream + fs.readFileSync(__dirname + '/../views/header.ejs','utf8'); 
                searchResultHtmlStream = searchResultHtmlStream + fs.readFileSync(__dirname + '/../views/search_result.ejs','utf8'); 
                searchResultHtmlStream = searchResultHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8'); 

                res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
                res.end(ejs.render(searchResultHtmlStream, {
                                                                'title' : '키워드 검색결과',
                                                                'url'   : '../',
                                                                lastWork : last_results,
                                                                sub_lastWork : sub_last_results
                                                            }));
                callback(null);
            }
        ],  function(error, result) {
            if (error)
                console.log(error);
        });
        
    } else {
        let errorHtmlStream = '';
        errorHtmlStream = fs.readFileSync(__dirname + '/../views/header.ejs','utf8');
        errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/alert.ejs','utf8');
        errorHtmlStream = errorHtmlStream + fs.readFileSync(__dirname + '/../views/footer.ejs','utf8');

        res.status(562).end(ejs.render(errorHtmlStream, {
                                                        'title' : '업무관리 프로그램',
                                                        'url'   : '../../'}));  
    }
};

router.get('/inquire_worksheet', GetInquireWorkSheet);
router.get('/this_worksheet', GetThisWorkSheet);
router.get('/future_worksheet', GetFutureWorkSheet);
router.get('/search', GetSearchPage);
router.get('/result', HandleSearch);
router.post('/upload_this_worksheet', HandleThisWorkSheet);
router.post('/upload_future_worksheet', HandleFutureWorkSheet);


module.exports = router