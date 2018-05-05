var express = require('express');       // express框架
var mysql = require('mysql');           // MySQL数据库
var session = require('express-session');   // session包
var FileStore = require('session-file-store')(session);
// var cookieParser = require('cookie-parser'); // cookie解析, 很可惜 没有
var bodyParser = require('body-parser');// 解析URL
const nodemailer = require('nodemailer');   // 发送邮件的Nodemailer包
var app = express();
app.set('view engine', 'jade');         // Jade模板引擎
app.set('views', './views');            // 模板路径
app.set('pages', './pages');            // 托管网页文件

// 创建 application/x-www-form-urlencoded 编码解析，必须使用这个方可对POST进行解析
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// 托管的静态文件所在路径
app.use(express.static('pages'));
app.use(express.static('views'));

// var IS_TEST = false; // 测试用开关, 已废弃

// session设置
// app.use(cookieParser());
app.use(session({
    secret: 'tc2018',               // 用于对session id相关的cookie进行签名
    store: new FileStore(),       // 本地存储session为文本文件
    name: 'ccc_donghu_booking',        // cookie名字
    cookie: { maxAge: 600 * 1000 },   // 设置session超时时间
    resave: true,                  // 是否每次都重新保存会话，建议false
    saveUninitialized: false        // 是否自动保存未初始化会话，建议false
}))

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

// 获取IP函数
function getClientIp(req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
};

// 设置邮件客户端登陆信息
var transporter = nodemailer.createTransport({
    host: 'smtphm.qiye.163.com',
    port: 25,
    secure: false,  // 是否使用TLS
    // 暂时使用老夫的账号密码
    auth: {
        user: 'ccc2018_reserve@cug.edu.cn',
        pass: 'Aa@CCC2018Hotel'
    }
});
// 基础邮件内容
var mailOptions = {
    from: '"CCC2018酒店预订" ccc2018_reserve@cug.edu.cn', // 显示名称(可自定义)+发件人地址(不可更改)
    to: '531817981@qq.com',
    subject: 'Test mail',                            // 标题
    text: 'It is a test mail of CCC2018 reservation'                     // 正文
};
// 确认邮箱可用性
transporter.verify(function (error, success) {
    if (error) {
        console.log(error);
    } else {
        console.log('Server is ready to take our messages');
        // // 修改并发送测试邮件
        // mailOptions.text = '测试成功!';
        // transporter.sendMail(mailOptions, function (err, info) {
        //     if (err) {
        //         console.log(err);
        //         return;
        //     }
        //     else {
        //         console.log('Successfully sent mail!');
        //     }
        // })
    }
});

// 检查session函数
function checkSession(sess) {
    if (sess.loginUser) {   // 如果用户存在
        // 页面停留时间未超过最大session生存时间
        if (sess.cookie.maxAge > 0) {
            return;
        }
        else {
            // 页面停留时间过长
            return 'The page stay is too long, please log in again';
        }
    } else {
        // 阻止通过URL直接登陆
        return 'Please log in first.';
    }
}

// 须知页面
app.get('/', function (req, res) {
    //res.sendFile(__dirname+'/'+'pages/DongHu_Hotel.html')
    res.sendFile(__dirname + '/' + 'pages/verification.html');
    return;
})

// 登陆页面
app.get('/login_get', function (req, res) {
    res.render('verification.jade');
})

// TODO: 登陆请求，显示订房余数，选择并订房，计算结果，处理数据库剩余房间
app.post('/login_post', urlencodedParser, function (req, res) {
    var sess = req.session;
    var response = {
        "pin": req.body.pin,
        "name": req.body.name,
    };
    connection.query('SELECT * FROM login WHERE pin= ?', [response.pin], function (err, result) {   // 使用PIN进行选择只可能有一个返回结果
        if (err) {
            // 纯粹错误
            console.log('[SELECT ERROR] - ', err.message);
            console.log("Error time: " + new Date(Date.now()));
            console.log("IP: " + getClientIp(req));
            var warningString = 'Wrong PIN, please try it again or register in TCCT'; // 登陆提示
            res.render('verification', { s: warningString });
            return;
        } else {
            if (result[0] == undefined) {
                // PIN不存在
                console.log('------------------------hold(PIN)--------------------------');
                console.log("WRONG PIN: " + response.pin);
                console.log("Hold time: " + new Date(Date.now()));  // 输出时间
                console.log("Clien info: " + JSON.stringify(req.headers))
                console.log("IP: " + getClientIp(req));
                console.log('------------------------------------------------------------\n\n');
                var warningString = 'Check your PIN and try it again';
                res.render('verification', { s: warningString });
                return
            } else if (req.body.name != result[0].username) {
                // 密码错误
                console.log('------------------------hold(NAME)--------------------------');
                console.log("PIN: " + result[0].pin);
                console.log("wrong name: " + response.username);
                console.log("Hold time: " + new Date(Date.now()));  // 输出时间
                console.log("Clien info: " + JSON.stringify(req.headers));
                console.log("IP: " + getClientIp(req));
                console.log('------------------------------------------------------------\n\n');
                var warningString = 'Check your name and try it again';
                res.render('verification', { s: warningString });
                return;
            } else {
                // 登陆成功
                console.log('--------------------------Login----------------------------');
                console.log(result);
                console.log("Login time: " + new Date(Date.now()));  // 输出时间
                console.log("Clien info: " + JSON.stringify(req.headers));
                console.log("IP: " + getClientIp(req));
                console.log('------------------------------------------------------------\n\n');
                // 重新生成session
                req.session.regenerate(function (err) {
                    if (err) {
                        var warningString = 'System Error: @regenerate session. </br>Please contact administor.';
                        res.render('verification', { s: warningString });
                        return;
                    }
                    else {
                        req.session.loginUser = response.pin;
                        req.session.loginName = response.name;// 登陆成功，设置session
                        //console.log(req.session.loginName);
                        res.sendFile(__dirname + '/pages/choice.html');
                        return;
                    }
                })
            }
        }
    })
})

// 选择进入携程
app.get('/xiecheng_get', function (req, res) {
    var warningString = checkSession(req.session);
    if (warningString) {    // 如果存在sessionCheck不通过（直接URL/页面停留过长），那么将存在提示字符串，并退回登陆页面
        res.render('verification', { s: warningString })
        return;
    } else {
        res.sendFile(__dirname + '/' + 'pages' + '/' + 'QR.html');  // 进入携程二维码
    }
})

// 选择进入东湖
app.get('/donghu_get', function (req, res) {
    //var sess = req.session;
    var warningString = checkSession(req.session);
    if (warningString) {    // 如果存在sessionCheck不通过（直接URL/页面停留过长），那么将存在提示字符串，并退回登陆页面
        res.render('verification', { s: warningString })
        return;
    } else {
        // 获取数据：先获取房间信息
        connection.query('SELECT * FROM donghu WHERE sn=1', function (err_r, result_r) {
            if (err_r) {
                // 错误处理逻辑（房间应该不会出错）
                return;
            } else {
                // 获取数据：再获取个人信息
                connection.query('SELECT * FROM login WHERE pin = ?', [req.session.loginUser], function (err_u, result_u) {
                    if (err_u) {
                        // 错误处理逻辑（既然注册过那么应该也不会出错）
                        return;
                    } else {
                        // 渲染网页并显示
                        res.render('donghu', {
                            // 用户信息
                            name: result_u[0].username, phone: result_u[0].phone, email: result_u[0].email,
                            // 房间信息
                            tingtao2_biao: result_r[0].tingtao2_biao_current, tingtao2_dan: result_r[0].tingtao2_dan_current,
                            nanshanyi_biao: result_r[0].nanshanyi_biao_current, nanshanyi_dan: result_r[0].nanshanyi_dan_current,
                            baihua2_biao: result_r[0].baihua2_biao_current
                        });
                    }
                })
            }
        })
    }
})

// TODO: 东湖预定请求
app.post('/donghu_reservation_post', urlencodedParser, function (req, res) {
    var warningString = checkSession(req.session);
    if (warningString) {    // 如果存在sessionCheck不通过（直接URL/页面停留过长），那么将存在提示字符串，并退回登陆页面
        res.render('verification', { s: warningString })
        return;
    } else {
        var response = {
            "pin": req.session.loginUser,
            "name":req.body.name,
            "phone":req.body.phonenum,
            "email":req.body.email,
            "TTB": req.body.input-num_TTB,
            "TTD":req.body.input-num_TTD,
            "NSB":req.body.input-num_NSB,
            "NSD":req.body.input-num_NSD,
            "BHB":req.body.input-num_BHB,
            "CIN":req.body.startDate,
            "COUT":req.body.endDate,
            // "DPT":
        };
        // TODO: 执行逻辑: 数据写入数据库，回复邮件，页面提醒
        // 先处理剩余房间数，如果不够则停止进一步处理
        connection.query('UPDATE donghu SET tingtao2_biao_current=tingtao2_biao-?, tingtao2_dan_current-?',[req.body.input-num_TTB,req.body.input-num_TTD],function(err_r,result_r){
            if(err){
                console.log(err_r); // TODO：这里有一个减法超过无符号整形范围的错误，利用一下就不自己写代码了。
                res.send('Room number not valid.');
                return;
            }
            else{
                console.log(result_r);
                // 再处理订单
                var order = 'INSERT donghu VALUES(pin, tingtao_2_biao,tingtao2_dan,nanshanyi_biao,nanshanyi_dan,baihua2_biao,checkin,checkout)';
                connection.query(order,[response.pin,response.TTB,response.TTD,response.NSB,response.NSD,response.BHB,response.CIN,response.COUT],function(err_o,result_o){
                    if(err_o){
                        console.log(err_o);
                        return;
                    }
                    else{
                        // 再处理个人信息
                        var userInfo = 'UPDATE login SET phone=?, email=? WHERE pin= ?';
                        connection.query(userInfo,[response.phone,response.email,response.pin],function(err_u,result_u){
                            if(err){
                                consol.log(err);
                            }
                            else{
                                
                            }
                        });
                    }
                });
                return;
            }
        });
        // connection.query('INSERT orders (pin, chekin, checkout, tingtao2_biao,tingtao2_dan,nanshanyi_biao,nanshanyi_dan,baihua2_biao, deposit) values(?,?,?,?,?,?,?,?,?)',[,,,,,,,,])
    }
})

// // TODO: 东湖订房表单请求处理, 此处需要session
// app.post('/donghu_book_post', function (req, res) {
//     // TODO: 数据
//     // 订单数据
//     var order_res = {
//         "pin": req.query.pin,
//         "tingtao2_biao": req.query.tingtao2_biao,
//         "tingtao2_dan": req.query.tingtao2_dan,
//         "nanshanyi_biao": req.query.nanshanyi_biao,
//         "nanshanyi_dan": req.query.nanshanyi_dan,
//         "baihua2_biao": req.query.baihua2_biao,
//         "baihua2_dan": req.query.baihua2_dan
//     };
//     var user_res = {
//         "pin": req.query.pin,
//         "name": req.query.name,
//         "phone": req.query.phone,
//         "email": req.query.email
//     };
//     // TODO: 修改数据库数据
//     // TODO: 首先按照房间（判断可以前台写，但不知道是否可行或者安全）
//     connection.query('UPDATE room SET tingtao2_biao_current=tingtao2_biao_current-?,tingtao2_dan_current=tingtao2_dan_current-?,nanshanyi_biao_current=nanshanyi_biao_current-?,nanshanyi_dan_current=nanshanyi_dan_current- WHRER sn=1', [req.query.tingtao2_biao, req.query.tingtao2_dan, req.query.nanshanyi_biao, req.query.nanshanyi_dan, req.query.baihua2_biao], function (err, result) {

//     })
//     // TODO: 按照用户
//     //connection.query(,,)
// })

// TODO: 管理员修改数据请求，此处出于安全考虑需要session
app.post('/menager_post', function (req, res) {
    // TODO: 如何回馈
})
// TODO: 退出登陆，必须要有（尚未测试）
app.get('/logout', function (req, res, next) {
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        }
        else {
            res.sendFile(__dirname + '/' + 'pages/verification.html');
        }
    })
})

// 设置监听端口为8081
var server = app.listen(8081, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Successfully connected, URL is http://%s:%s", host, port)
})




