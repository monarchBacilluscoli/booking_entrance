var express = require('express');   // express框架
var mysql = require('mysql');       // MySQL数据库
var app = express();

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
app.use(express.static('pages'));

// 登陆页面
app.get('/', function (req, res) {
    res.sendFile(__dirname + "/" + "pages" + "/" + "login.html");
})

// 登陆表单请求
app.get('/process_get', function (req, res) {
    // 输出 JSON 格式
    var response = {
        "username ": req.query.username,
        "password": req.query.password,
    };
    // var a = database.login(req.query.username, req.query.password, req.query.character, res);
    //var sql = "SELECT id FROM " + req.query.character + " WHERE id=" + req.query.username + " AND password= " + req.query.password;  // 从对应表中查找.
    var sql = "SELECT * FROM " + "student" + " WHERE id= " + req.query.username;
    // 信息核对成功则返回true, 否则返回false
    connection.query(sql, function (err, result) {
        if (err) {
            console.log('[SELECT ERROR] - ', err.message);
            res.send("check your username and password and try it again");
            return;
        } else {
            console.log(typeof (result[0].id));
            console.log('--------------------------SELECT----------------------------');
            console.log(result);
            console.log('------------------------------------------------------------\n\n');
            if (result[0].password != req.query.password) {
                res.send("check your username and password and try it again");
            } else {
                res.sendFile(__dirname + "/" + "pages" + "/" + "login.html");// 进入携程预订
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