var express = require('express');       // express框架
var mysql = require('mysql');           // MySQL数据库
var bodyParser = require('body-parser');// 解析URL
var app = express();
app.set('view engine', 'jade');         // Jade模板引擎
app.set('views', './views');            // 模板路径
app.set('pages', './pages');

// 创建 application/x-www-form-urlencoded 编码解析
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// 数据库连接参数
var connectParams = {
    'hostname': 'localhost',
    'user': 'root',
    'password': 'Aa@123456',
    'port': '3306',
    'database': 'sys'
}

var IS_TEST = false; // 测试用开关

//连接数据库
var connection = mysql.createConnection({   // 数据库连接参数
    host: 'localhost',
    user: 'root',
    password: 'Aa@123456',
    port: '3306',
    database: 'ccc2018',
});
connection.connect();
console.log('database connected.' + '\n');

// 托管的静态文件所在路径
app.use(express.static('pages'));

// 获取IP
function getClientIp(req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
};

// 须知页面
app.get('/', function (req, res) {
    var warningString = ' '; // 登陆提示为空
    res.sendfile('pages/verification.html');
    return;
})

// TODO: 登陆携程请求，显示订房余数，选择并订房，计算结果，处理数据库剩余房间
app.post('/login_xiecheng_post', urlencodedParser, function (req, res) {
    var response = {
        "username": req.body.username,
        "password": req.body.password,
    };
    connection.query('SELECT * FROM test WHERE pin= ?',
        [req.body.username], function (err, result) {   // 使用PIN进行选择只可能有一个返回结果
            if (err) {
                // 纯粹错误
                console.log('[SELECT ERROR] - ', err.message);
                console.log("Error time: " + new Date(Date.now()));
                console.log("IP: " + getClientIp(req));

                var warningString = 'check your PIN number/password and try it again'; // 登陆提示
                res.render('verification', { s: warningString });
                return;
            } else {
                if (result[0] == undefined) {
                    // PIN不存在
                    console.log('------------------------hold(PIN)--------------------------');
                    console.log("WRONG PIN: " + req.body.username)
                    console.log("Hold time: " + new Date(Date.now()));  // 输出时间
                    console.log("Clien info: " + JSON.stringify(req.headers))
                    console.log("IP: " + getClientIp(req));
                    console.log('------------------------------------------------------------\n\n');
                    var warningString = 'Check your PIN number and try it again';
                    res.render('verification', { s: warningString });
                    return
                } else if (req.body.password != result[0].phone) {
                    // 密码错误
                    console.log('------------------------hold(PHONE)--------------------------');
                    console.log("PIN: " + result[0].pin)
                    console.log("Hold time: " + new Date(Date.now()));  // 输出时间
                    console.log("Clien info: " + JSON.stringify(req.headers))
                    console.log("IP: " + getClientIp(req));
                    console.log('------------------------------------------------------------\n\n');
                    var warningString = 'Check your password and try it again';
                    res.render('verification', { s: warningString });
                    return
                } else {
                    // 登陆成功
                    console.log('--------------------------Login----------------------------');
                    console.log(result);
                    console.log("Login time: " + new Date(Date.now()));  // 输出时间
                    console.log("Clien info: " + JSON.stringify(req.headers))
                    console.log("IP: " + getClientIp(req));
                    console.log('------------------------------------------------------------\n\n');
                    res.redirect('https://m.ctrip.com/webapp/meeting/b2croom/CCC/index');   // 进入携程预订
                    return
                }
            }
        })
})
// TODO: 登陆东湖请求
app.post('/login_donghu_post', urlencodedParser, function (req, res) {
    // 注意修改table
    connection.query('SELECT * FROM test WHERE pin= ?',
        [req.body.username], function (err, result) {   // 使用PIN进行选择只可能有一个返回结果
            if (err) {
                // 纯粹错误
                console.log('[SELECT ERROR] - ', err.message);
                console.log("Error time: " + new Date(Date.now()));
                console.log("IP: " + getClientIp(req));

                var warningString = 'check your PIN number/password and try it again'; // 登陆提示
                res.render('verification', { s: warningString });
                return;
            } else {
                if (result[0] == undefined) {
                    // PIN不存在
                    console.log('------------------------hold(PIN)--------------------------');
                    console.log("WRONG PIN: " + req.body.username)
                    console.log("Hold time: " + new Date(Date.now()));  // 输出时间
                    console.log("Clien info: " + JSON.stringify(req.headers))
                    console.log("IP: " + getClientIp(req));
                    console.log('------------------------------------------------------------\n\n');
                    var warningString = 'Check your PIN number and try it again';
                    res.render('verification', { s: warningString });
                    return
                } else if (req.body.password != result[0].phone) {
                    // 密码错误
                    console.log('------------------------hold(Phone)--------------------------');
                    console.log("PIN: " + result[0].pin)
                    console.log("Hold time: " + new Date(Date.now()));  // 输出时间
                    console.log("Clien info: " + JSON.stringify(req.headers))
                    console.log("IP: " + getClientIp(req));
                    console.log('------------------------------------------------------------\n\n');
                    var warningString = 'Check your password and try it again';
                    res.render('verification', { s: warningString });
                    return
                } else {
                    // 登陆成功
                    console.log('--------------------------Login----------------------------');
                    console.log(result);
                    console.log("Login time: " + new Date(Date.now()));  // 输出时间
                    console.log("Clien info: " + JSON.stringify(req.headers))
                    console.log("IP: " + getClientIp(req));
                    console.log('------------------------------------------------------------\n\n');

                    // TODO: 根据是否填写姓名电话邮箱进入不同的页面
                    if (result[0].emile) {
                        // TODO: 已经填写邮箱的不需要填写邮箱，仍显示邮箱框，但已经填写，可修改
                        //req.render();
                    } else {
                        // TODO: 没有填写邮箱的需要填写邮箱，该表单选项为空
                        //req.render();
                    }
                    // res.redirect('https://m.ctrip.com/webapp/meeting/b2croom/CCC/index');   // 进入携程预订
                    res.send('添加携程登陆');
                    return
                }
            }
        })
})

// TODO: 东湖订房表单请求处理, 此处需要session
app.post('/donghu_book_post', function (req, res) {
    // TODO: 数据
    var response = {
        "tingtao2_biao": req.query.tingtao2_biao,
        "tingtao2_dan": req.query.tingtao2_dan,
        "nanshanyi_biao": req.query.nanshanyi_biao,
        "nanshanyi_dan": req.query.nanshanyi_dan,
        "baihua2_biao": req.query.baihua2_biao,
        "baihua2_dan": req.query.baihua2_dan
    };
    // TODO: 修改数据库数据
    // TODO: 首先按照房间（判断可以前台写，但不知道是否可行或者安全）
    //connection.query(,,)
    // TODO: 按照用户
    //connection.query(,,)
})

// TODO: 管理员修改数据请求，此处出于安全考虑需要session
app.post('/menager_post', function (req, res) {
    // TODO: 如何回馈
})
// TODO: 


// 设置监听端口为8081
var server = app.listen(8081, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("test，URL is http://%s:%s", host, port)
})




