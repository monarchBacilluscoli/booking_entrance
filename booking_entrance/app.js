var express = require('express');   // express框架
var mysql = require('mysql');       // MySQL数据库
var app = express();
app.set('view engine', 'jade');     // Jade模板引擎
app.set('views', './views');         // 模板路径
// 数据库连接参数
//var connectParams = {
//    'hostname': 'localhost',
//    'user': 'root',
//    'password': 'l1994321',
//    'port': '3306',
//    'database': 'mylab'
//}

//连接数据库
var connection = mysql.createConnection({   // 注意使用的时候这个信息要改成数据库所设定的信息。
    host: 'localhost',
    user: 'root',
    password: 'l1994321',
    port: '3306',
    database: 'mylab',
});
connection.connect();


console.log('database connected.' + '\n');


// 托管的静态文件所在路径
// app.use(express.static('pages'));
app.use(express.static('views'));

// 登陆页面
app.get('/', function (req, res) {
    //res.sendFile(__dirname + "/" + "pages" + "/" + "verification.html");
    // TODO: 模板
    var warningString = ' '; // 登陆提示
    res.render('verification', { s: warningString });
    return;
})

// 登陆表单请求
app.get('/process_get', function (req, res) {
    // 输出 JSON 格式
    var response = {
        "username ": req.query.username,
        "password": req.query.password,
    };
    // 信息核对成功则返回true, 否则返回false
    connection.query('SELECT * FROM student WHERE id= ?',
        [req.query.username], function (err, result) {
            if (err) {
                console.log('[SELECT ERROR] - ', err.message);
                // res.send("check your username and password and try it again");
                // TODO: 模板
                var warningString = 'check your PIN number/password and try it again'; // 登陆提示
                res.render('verification', { s: warningString });
                return;
            } else {
                console.log(result[0] == undefined);
                if (result[0] == undefined) {
                    // res.send("check your pin number and try it again");
                    // TODO: 模板
                    var warningString = 'Check your PIN number and try it again';
                    res.render('verification', { s: warningString });
                    return
                } else if (req.query.password != result[0].password) {
                    res.send("Check your password and try it again");
                    // TODO: 模板
                    var warningString = 'Check your password and try it again';
                    res.render('verification', { s: warningString });
                    return
                } else {
                    console.log(typeof (result[0].id));
                    console.log('--------------------------SELECT----------------------------');
                    console.log(result);
                    console.log('------------------------------------------------------------\n\n');
                    res.redirect('https://m.ctrip.com/webapp/meeting/b2croom/CCC/index');   // 进入携程预订
                    return
                }
            }
        })
})


// 设置监听端口为8081
var server = app.listen(8081, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("test，URL is http://%s:%s", host, port)
})