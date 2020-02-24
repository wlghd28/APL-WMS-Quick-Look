const   cron        = require('node-cron');
const   mysql       = require('mysql');
const   express     = require('express');
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
    토요일에서 일요일이 넘어가는 자정이 될 경우 데이터를 백업합니다.
*/
const DataBackup = (req, res) => {
    cron.schedule('0, 0, 0, *, *, 0', () => {
        // 금주 주업무 데이터를 지난 업무 데이터로 백업 시키는 과정
        let sql_str1 = "SELECT * FROM THIS_WORK";
        let sql_str2 = "INSERT INTO LAST_WORK(start_date, end_date, user_id, user_name, work) VALUES(?, ?, ?, ?, ?)";
        let sql_str3 = "DELETE FROM THIS_WORK";

        /*
        // 예정된 주업무 데이터를 금주 업무로 업데이트 시키는 과정
        let sql_str4 = "SELECT * FROM FUTUER_WORK";
        let sql_str5 = "INSERT INTO THIS_WORK(start_date, end_date, user_id, work) VALUES(?, ?, ?, ?)";
        let sql_str6 = "DELETE FROM FUTURE_WORK";
        */ 

        // 금주 부업무 데이터를 지난 업무 데이터로 백업 시키는 과정
        let sql_str7 = "SELECT * FROM SUB_THIS_WORK";
        let sql_str8 = "INSERT INTO SUB_LAST_WORK(start_date, end_date, user_id, user_name, work) VALUES(?, ?, ?, ?, ?)";
        let sql_str9 = "DELETE FROM SUB_THIS_WORK";

        /*
        // 예정된 부업무 데이터를 금주 업무로 업데이트 시키는 과정
        let sql_str10 = "SELECT * FROM SUB_FUTUER_WORK";
        let sql_str11 = "INSERT INTO SUB_THIS_WORK(start_date, end_date, user_id, work) VALUES(?, ?, ?, ?)";
        let sql_str12 = "DELETE FROM SUB_FUTURE_WORK";
        */

        async.waterfall([
            function(callback) {
                // 금주 주업무 데이터를 지난 업무 데이터로 백업 시키는 과정
                db.query(sql_str1, (error, results) => {
                    if (error) {
                        console.log(error);
                        res.end("error");
                    } else {
                        if (results.length > 0) {
                            for(var i=0;i<results.length;i++) {
                                db.query(sql_str2, [results[i].start_date, results[i].end_date, 
                                    results[i].user_id, results[i].user_name, results[i].work], (error) => {
                                    if (error) {
                                        console.log(error);
                                        res.end("error");
                                    } else {
                                        console.log("LAST_WORK data was inserted...");
                                    }
                                });
                            }
                        }
                        db.query(sql_str3, (error) => {
                            if (error) {
                                console.log(error);
                                res.end("error");
                            } else {
                               console.log("THIS_WORK data was deleted...");
                            }
                        });
                    }
                });
                // 금주 부업무 데이터를 지난 업무 데이터로 백업 시키는 과정
                db.query(sql_str7, (error, results) => {
                    if (error) {
                        console.log(error);
                        res.end("error");
                    } else {
                        if (results.length > 0) {
                            for(var i=0;i<results.length;i++) {
                                db.query(sql_str8, [results[i].start_date, results[i].end_date, 
                                    results[i].user_id, results[i].user_name, results[i].work], (error) => {
                                    if (error) {
                                        console.log(error);
                                        res.end("error");
                                    } else {
                                        console.log("SUB_LAST_WORK data was inserted...");
                                    }
                                });
                            }
                        }
                        db.query(sql_str9, (error) => {
                            if (error) {
                                console.log(error);
                                res.end("error");
                            } else {
                               console.log("SUB_THIS_WORK data was deleted...");
                            }
                        });
                    }
                });
                callback(null);
            },
            /*
            function(callback) {
                // 예정된 주업무 데이터를 금주 업무로 업데이트 시키는 과정
                db.query(sql_str4, (error, results) => {
                    if (error) {
                        console.log(error);
                        res.end("error");
                    } else {
                        if(results.length > 0) {
                            for(var i = 0; i < results.length; i++) {
                                db.query(sql_str5, [results[i].start_date, results[i].end_date, 
                                    results[i].user_id, results[i].work], (error) => {
                                    if (error) {
                                        console.log(error);
                                        res.end("error");
                                    } else {
                                        console.log("THIS_WORK data was inserted...");
                                    }
                                });
                            }
                        }
                        db.query(sql_str6, (error) => {
                            if (error) {
                                console.log(error);
                                res.end("error");
                            } else {
                               console.log("FUTURE_WORK data was deleted...");
                            }
                        });
                    }
                });
                // 예정된 부업무 데이터를 금주 업무로 업데이트 시키는 과정
                db.query(sql_str10, (error, results) => {
                    if (error) {
                        console.log(error);
                        res.end("error");
                    } else {
                        if(results.length > 0) {
                            for(var i = 0; i < results.length; i++) {
                                db.query(sql_str11, [results[i].start_date, results[i].end_date, 
                                    results[i].user_id, results[i].work], (error) => {
                                    if (error) {
                                        console.log(error);
                                        res.end("error");
                                    } else {
                                        console.log("SUB_THIS_WORK data was inserted...");
                                    }
                                });
                            }
                        }
                        db.query(sql_str12, (error) => {
                            if (error) {
                                console.log(error);
                                res.end("error");
                            } else {
                               console.log("SUB_FUTURE_WORK data was deleted...");
                            }
                        });
                    }
                });
                callback(null);
            }
            */
        ], function(error, result) {
            if (error)
                console.log(error);
        }); 
    });
};

router.get('/backup', DataBackup);

module.exports = router
