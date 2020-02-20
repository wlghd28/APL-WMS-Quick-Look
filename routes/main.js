const  express  = require('express');
const  ejs      = require('ejs');
const  fs       = require('fs');
const  router   = express.Router();

/*
    메인화면을 출력합니다.
*/
const  GetMainUI = (req, res) => {   
    let htmlStream = ''; 

    htmlStream = htmlStream + fs.readFileSync(__dirname + '/../views/main.ejs','utf8'); // Content

    res.writeHead(200, {'Content-Type':'text/html; charset=utf8'}); // 200은 성공
    res.end(ejs.render(htmlStream, {
                                        'title' : '업무관리 프로그램',
                                        'url' : '../' })); 
};

router.get('/', GetMainUI);

module.exports = router
