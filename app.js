var express = require('express'); // express框架
var mysql = require('mysql'); // MySQL数据库
var session = require('express-session'); // session包
var FileStore = require('session-file-store')(session);
// var cookieParser = require('cookie-parser'); // cookie解析, 很可惜 没有
var bodyParser = require('body-parser'); // 解析URL
const nodemailer = require('nodemailer'); // 发送邮件的Nodemailer包
var app = express();
var async = require('async'); // 同步处理模块
app.set('view engine', 'jade'); // Jade模板引擎
app.set('views', './views'); // 模板路径
app.set('pages', './pages'); // 托管网页文件

const ROOM_TYPE = 5;

// 创建 application/x-www-form-urlencoded 编码解析，必须使用这个方可对POST进行解析
var urlencodedParser = bodyParser.urlencoded({
    extended: false
})

// 托管的静态文件所在路径
app.use(express.static('pages'));
app.use(express.static('bootstrap'));
app.use(express.static('views'));
app.use(express.static('TF迁移'))

// var IS_TEST = false; // 测试用开关, 已废弃

// session设置
// app.use(cookieParser());
app.use(session({
    secret: 'tc2018', // 用于对session id相关的cookie进行签名
    store: new FileStore(), // 本地存储session为文本文件
    name: 'ccc_donghu_booking', // cookie名字
    cookie: {
        maxAge: 600 * 1000
    }, // 设置session超时时间
    resave: true, // 是否每次都重新保存会话，建议false
    saveUninitialized: false // 是否自动保存未初始化会话，建议false
}))

//连接数据库
var connection = mysql.createConnection({ // 数据库连接参数
    host: 'localhost',
    user: 'root',
    password: 'Aa@123456',
    port: '3306',
    database: 'ccc2018',
});
connection.connect(); //! cancel the connect, since others' pc don't have this database
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
    secure: false, // 是否使用TLS
    // 暂时使用老夫的账号密码
    auth: {
        user: 'ccc2018_reserve@cug.edu.cn',
        pass: 'Aa@CCC2018Hotel'
    }
});

// 字符串占位符处理函数
String.prototype.format = function () {
    if (arguments.length == 0) return this;
    var obj = arguments[0];
    var s = this;
    for (var key in obj) {
        s = s.replace(new RegExp("\\{\\{" + key + "\\}\\}", "g"), obj[key]);
    }
    return s;
};

// 邮件
// 预订通知邮件
var text_reserve = '尊敬的{{name}}学者：\n\n\
\v\v\v\v您好! 您刚刚提交了2018年7月{{checkin}}日——2018年7月{{checkout}}日东湖宾馆{{TTB}}{{TTD}}{{NSB}}{{NSD}}{{BHB}}的预定申请，房间预定金为100元/天/间，您的预定金一共{{deposit}}元。\n\
\v\v\v\v请您从现在起三日内（2018年5月{{payday}}日前）将预定金打到下述东湖宾馆账号上，并回邮件附上付款凭证（照片或截图）。谢谢！\n\
\v\v\v\v三日内若未收到该订单付款确认信息或上传付款凭证有误，该预订申请中的房间将不再为您保留，敬请理解。\n\
\v\v\v\v因东湖宾馆房间数量有限，若订房后未入住，预订金不退。\n\n\
\v\v\v\v开户名：XXXXXXXXXXXXXXX公司\n\n\
\v\v\v\v账  号：XXX XXXX XXXX XXX\n\
\v\v\v\v开户行：XXXX行\n\
\v\v\v\v行  号：XXXXXXXXXXXX\n\n\
\v\v\v\v感谢您的配合，期待7月与您相聚在美丽的江城武汉。\n\n\
中国地质大学（武汉）\n\
自动化学院\n\
CCC2018\n\
2018年5月{{sendday}}日';
// 确认缴费邮件
var text_pay = '尊敬的{{name}}学者：\n\n\
\v\v\v\v您好! 您已成功预定了2018年7月{{checkin}}日——2018年7月{{checkout}}日东湖宾馆{{TTB}}{{TTD}}{{NSB}}{{NSD}}{{BHB}}间，房间预定金为100元/天/间，收到预定金一共{{deposit}}元。\n\
\v\v\v\v入住时请在东湖宾馆前台出示您的身份证办理入住手续，入住仅支付住房尾款，住宿全额发票由东湖宾馆开具。\n\n\
\v\v\v\v感谢您的配合，期待7月与您相聚在美丽的江城武汉。\n\n\
中国地质大学（武汉）\n\
自动化学院\n\
CCC2018\n\
2018年5月{{sendday}}日';
var mailOptions = {
    from: '"CCC2018酒店预订" ccc2018_reserve@cug.edu.cn', // 显示名称(可自定义)+发件人地址(不可更改)
    to: '531817981@qq.com',
    subject: 'CCC2018邮件测试', // 标题，要改
    text: '测试邮件' // 正文, TODO:加上占位符
};
// 确认邮箱可用性
transporter.verify(function (error, success) {
    if (error) {
        console.log(error);
    } else {
        console.log('Server is ready to take our messages');
        // // 修改并发送测试邮件
        // //mailOptions.text = '测试成功!';
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
    if (sess.loginUser) { // 如果用户存在
        // 页面停留时间未超过最大session生存时间
        if (sess.cookie.maxAge > 0) {
            return;
        } else {
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
    //res.sendFile(__dirname + '/' + 'pages/DongHu_Hotel.html')
    // connection.query('insert test (pin,pwd)values(24,3231)', function (err, result) {
    //     console.log(result.insertId);
    // });
    // connection.query('select * from test where sn = LAST_INSERT_ID()', function (err, result) {
    //     console.log(result[0]);
    // });
    // var a = [[1,2,3],[22,41,1]];
    // var a = 1;
    // var a = {
    //     a:1,
    //     b:2
    // }
    // res.render('fuck', {e:a});
    // res.send('what');
    // res.sendFile(__dirname + '/' + 'pages/attention.html');
    res.sendFile(__dirname+'/'+'TF迁移/home.html')
    return;
})

// 登陆页面
app.get('/login_get', function (req, res) {
    res.render('verification.jade',{s:'test'});
})

// TODO: 登陆请求，显示订房余数，选择并订房，计算结果，处理数据库剩余房间
app.post('/login_post', urlencodedParser, function (req, res) {
    var sess = req.session;
    var response = {
        "pin": req.body.pin,
        "name": req.body.name,
    };
    connection.query('SELECT * FROM login WHERE pin= ?', [response.pin], function (err, result) { // 使用PIN进行选择只可能有一个返回结果
        if (err) {
            // 纯粹错误
            console.log('[SELECT ERROR] - ', err.message);
            console.log("Error time: " + new Date(Date.now()));
            console.log("IP: " + getClientIp(req));
            var warningString = 'Wrong PIN, please try it again or register in TCCT'; // 登陆提示
            res.render('verification', {
                show: 'display:block;',
                s: warningString
            });
            return;
        } else {
            if (result[0] == undefined) {
                // PIN不存在
                console.log('------------------------hold(PIN)--------------------------');
                console.log("WRONG PIN: " + response.pin);
                console.log("Hold time: " + new Date(Date.now())); // 输出时间
                console.log("Clien info: " + JSON.stringify(req.headers))
                console.log("IP: " + getClientIp(req));
                console.log('------------------------------------------------------------\n\n');
                var warningString = 'Check your PIN and try it again';
                res.render('verification', {
                    s: warningString
                });
                return
            } else if (req.body.name != result[0].username) {
                // 密码错误
                console.log('------------------------hold(NAME)--------------------------');
                console.log("PIN: " + result[0].pin);
                console.log("wrong name: " + response.username);
                console.log("Hold time: " + new Date(Date.now())); // 输出时间
                console.log("Clien info: " + JSON.stringify(req.headers));
                console.log("IP: " + getClientIp(req));
                console.log('------------------------------------------------------------\n\n');
                var warningString = 'Check your name and try it again';
                res.render('verification', {
                    show: 'display:block;',
                    s: warningString
                });
                return;
            } else {
                // 登陆成功
                console.log('--------------------------Login----------------------------');
                console.log(result);
                console.log("Login time: " + new Date(Date.now())); // 输出时间
                console.log("Clien info: " + JSON.stringify(req.headers));
                console.log("IP: " + getClientIp(req));
                console.log('------------------------------------------------------------\n\n');
                // 重新生成session
                req.session.regenerate(function (err) {
                    if (err) {
                        var warningString = 'System Error: @regenerate session. </br>Please contact administor.';
                        res.render('verification', {
                            show: 'display:block;',
                            s: warningString
                        });
                        return;
                    } else {
                        req.session.loginUser = response.pin;
                        req.session.loginName = response.name; // 登陆成功，设置session
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
app.get('/xiecheng_choice', function (req, res) {
    var warningString = checkSession(req.session);
    if (warningString) { // 如果存在sessionCheck不通过（直接URL/页面停留过长），那么将存在提示字符串，并退回登陆页面
        res.render('verification', {
            s: warningString
        })
        return;
    } else {
        // res.render('hotel',{a:1}); // 进入携程
        res.sendFile(__dirname + '/pages/hotelx.html')
    }
})

// 选择进入东湖
app.get('/donghu_choice', function (req, res) {
    var warningString = checkSession(req.session);
    if (warningString) { // 如果存在sessionCheck不通过（直接URL/页面停留过长），那么将存在提示字符串，并退回登陆页面
        res.render('verification', {
            s: warningString
        })
        return;
    } else {
        // res.render('hotel',{a:0}); // 进入东湖
        res.sendFile(__dirname + '/pages/hoteld.html')
    }
})

// 东湖系统选择
app.get('/donghu_choices', function (req, res) {
    var warningString = checkSession(req.session);
    if (warningString) { // 如果存在sessionCheck不通过（直接URL/页面停留过长），那么将存在提示字符串，并退回登陆页面
        res.render('verification', {
            show: 'display:block;',
            s: warningString
        });
        return;
    } else {
        res.sendFile(__dirname + '/' + 'pages/donghu_button.html');
    }
})

// 进入东湖官网预订系统
app.get('/donghu_official', function (req, res) {
    var warningString = checkSession(req.session);
    if (warningString) { // 如果存在sessionCheck不通过（直接URL/页面停留过长），那么将存在提示字符串，并退回登陆页面
        res.render('verification', {
            s: warningString
        });
        return;
    } else {
        res.redirect('http://www.el-h.com');
    }
});

// 进入东湖自有预订系统
app.get('/donghu_get', function (req, res) {
    //var sess = req.session;
    var warningString = checkSession(req.session);
    if (warningString) { // 如果存在sessionCheck不通过（直接URL/页面停留过长），那么将存在提示字符串，并退回登陆页面
        res.render('verification', {
            s: warningString
        });
        return;
    } else {
        // 获取数据：先获取房间信息——获取六天的所有房间信息
        connection.query('SELECT * FROM room WHERE day BETWEEN 23 AND 28', function (err_r, result_r) {
            if (err_r) {
                console.err(err_r);
                return;
            } else {
                // 处理获取的result
                var ept = [
                    [0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0]
                ]; // 一共6天
                // console.log(result_r.length);
                for (let i = 0; i < result_r.length; i++) { // 与房间类型数量相当
                    ept[0][i] = result_r[i].u1;
                    ept[1][i] = result_r[i].u2;
                    ept[2][i] = result_r[i].u3;
                    ept[3][i] = result_r[i].u4;
                    ept[4][i] = result_r[i].u5;
                }
                // console.log(ept);
                // 获取数据：再获取个人信息
                connection.query('SELECT * FROM login WHERE pin = ?', [req.session.loginUser], function (err_u, result_u) {
                    if (err_u) {
                        console.err(err_r);
                        return;
                    } else {
                        // console.log(ept);
                        // 渲染网页并显示
                        // console.log(result_u[0].username);
                        res.render('DongHu_Hotel', {
                            // 用户信息
                            name: result_u[0].username,
                            phone: result_u[0].phone,
                            email: result_u[0].email,
                            // 房间信息数组，由前台进行处理
                            info: ept
                        });
                    }
                })
            }
        })
    }
})

// 东湖预定请求
app.get('/reservation_get', function (req, res) {
    // res.sendFile(__dirname + '/' + 'pages/donghu_button.html');
    var warningString = checkSession(req.session);
    if (warningString) { // 如果存在sessionCheck不通过（直接URL/页面停留过长），那么将存在提示字符串，并退回登陆页面
        res.render('verification', {
            s: warningString
        })
        return;
    } else {
        //console.log(typeof(req.query.checkin));
        //var c = parseInt(((req.query.checkin).split('-'))[2]);
        //console.log(typeof(c)+c);
        var response = {
            "pin": req.session.loginUser,
            "name": req.query.name,
            "phone": req.query.phonenum,
            "email": req.query.email,
            "TTB": parseInt(req.query.TTB),
            "TTD": parseInt(req.query.TTD),
            "NSB": parseInt(req.query.NSB),
            "NSD": parseInt(req.query.NSD),
            "BHB": parseInt(req.query.BHB),
            "CIN": parseInt(((req.query.checkin).split('-'))[2]),
            "COUT": parseInt(((req.query.checkout).split('-'))[2]),
            "DPT": req.query.deposit
        };
        connection.query('BEGIN', function (err, result) { // 开始事务
            if (err) {
                console.log(err);
                res.send('Database write error.');
                return;
            } else {
                var room = 'UPDATE room SET u1=u1-?,u2=u2-?,u3=u3-?,u4=u4-?,u5=u5-? WHERE day between ? and ?-1';
                var order = 'INSERT orders (pin) VALUES(?)';
                var r_rooms = 'INSERT INTO r_room (type,order_id,checkin,checkout) values (?,?,?,?)';
                var userInfo = 'UPDATE login SET phone=?, email=? WHERE pin= ?';
                async.waterfall([
                        function (callback) { // 处理总房间
                            connection.query(room, [response.TTB, response.TTD, response.NSB, response.NSD, response.BHB, response.CIN, response.COUT], function (err1, result1) {
                                callback(err1, result1);
                            });
                            return;
                        },
                        function (r, callback) { // 处理订单
                            connection.query(order, response.pin, function (err2, result2) {
                                callback(err2, result2.insertId);
                            });
                            return;
                        },
                        function (order_id, callback) { // 循环处理订单下属房间条目，此处应不用callback
                            // console.log(order_id);
                            for (let i = 0; i < response.TTB; i++) {
                                connection.query(r_rooms, [1, order_id, response.CIN, response.COUT], function (err, result) {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            }
                            for (let i = 0; i < response.TTD; i++) {
                                connection.query(r_rooms, [2, order_id, response.CIN, response.COUT], function (err, result) {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            }
                            for (let i = 0; i < response.NSB; i++) {
                                connection.query(r_rooms, [3, order_id, response.CIN, response.COUT], function (err, result) {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            }
                            for (let i = 0; i < response.NSD; i++) {
                                connection.query(r_rooms, [4, order_id, response.CIN, response.COUT], function (err, result) {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            }
                            for (let i = 0; i < response.BHB; i++) {
                                connection.query(r_rooms, [5, order_id, response.CIN, response.COUT], function (err, result) {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            }
                            callback(null);
                            return;
                        },
                        function (callback) { // 处理个人信息
                            connection.query(userInfo, [response.phone, response.email, response.pin], function (err3, result3) {
                                callback(err3, result3);
                            });
                            return;
                        }
                    ],
                    function (err, results) {
                        if (err) {
                            console.log(err);
                            res.send(err);
                            connection.query('ROLLBACK');
                            return;
                        } else {
                            connection.query('COMMIT'); // 事务确认
                            console.log(results);
                            mailOptions.to = response.email;
                            var placeholder = {
                                name: response.name,
                                checkin: response.CIN,
                                checkout: response.COUT,
                                TTB: response.TTB ? '听涛2号标间' + response.TTB + '间 ' : '',
                                TTD: response.TTD ? '听涛2号单间' + response.TTD + '间 ' : '',
                                NSB: response.NSB ? '南山乙所标间' + response.NSB + '间 ' : '',
                                NSD: response.NSD ? '南山乙所单间' + response.NSD + '间 ' : '',
                                BHB: response.BHB ? '百花2号标间' + response.BHB + '间 ' : '',
                                deposit: response.DPT,
                                payday: new Date().getDate() + 3,
                                sendday: new Date().getDate()
                            };
                            var tr = text_reserve.format(placeholder);
                            // console.log(tr);
                            mailOptions.to = response.email;
                            mailOptions.text = tr;
                            mailOptions.subject = 'CCC2018东湖酒店预订缴费通知';
                            transporter.sendMail(mailOptions, function (err_m) {
                                if (err_m) {
                                    console.log(err_m);
                                    res.send('Payment reminder email failed, please try it again');
                                    return;
                                } else {
                                    // 这句有问题
                                    var text = "Payment reminder email sent successfully, please check it in your email: "+response.email+", and follow the prompts";
                                    res.send(text);
                                    return;
                                }
                            });
                            return;
                        }
                    }
                );
                return;
            }
        });
        return;
    }
});

// app.get('/test', function (req, res) {
//     res.render('test');
// });

// 管理员登陆请求
app.post('/menager_post', urlencodedParser, function (req, res) {
    // TODO: 管理员登陆怎么搞？和用户登陆合并还是单独做？
    var warningString = checkSession(req.session);
    if (warningString) { // 如果存在sessionCheck不通过（直接URL/页面停留过长），那么将存在提示字符串，并退回登陆页面
        res.render('verification', {
            s: warningString
        })
        return;
    } else {
        var admin_check = 'SELECT admin FROM login WHERE pin = ?'
        connection.query(admin_check, [req.session.loginUser], function (err, result) {
            if (result[0].admin) { //是管理员
                // TODO: 显示
                var rooms = 'SELECT * FROM room WHERE day BETWEEN 23 AND 28'
                connection.query(room, function (err_t, result_t) {
                    if (err) {
                        console.log(err_t);
                        res.send('Sorry, there is a problem here, please contact the administrator.');
                        return;
                    } else {
                        // TODO: 将结果转化为JSON
                    }
                })
            } else { //不是管理员
                var warningString = 'Sorry, you are not an administrator.';
                res.render('verification', {
                    s: warningString
                })
            }
        });
    }
});
app.get('/manager_search', function (req, res) {
    // TODO: 管理员搜索功能，使用姓名/PIN进行搜索，结果按照订房顺序降序排列，然后按照房间类型升序排列
    connection.query('SELECT * FROM login a INNER JOIN orders b ON a.pin=b.pin INNER JOIN r_room c ON b.id=c.order_id WHERE username=? OR a.pin=? ORDER BY c.order_id DESC, c.type ASC', [req.body.name, req.body.name], function (err_s, result_s) {
        // 首先要判断有几个订单
        if (result) {
            n = 0;
            var orders = new Array();
            for (let i = 1, t = 0; i < result_s.length; i++) {
                if (result_s[i].order_id != result_s[i - 1]) {
                    // TODO:
                }
            }
            res.render()
        } else {
            res.send("没结果");
        }
        // res.render();
    })
})
//管理员修改页面
app.get('/maneger_change', function (req, res) {
    // TODO: 管理员修改
    // 确认缴费
    // 退订（删除订单）
});
// 导出文件页面
app.get('/file_export', function (req, res) {
    connection.query('SELECT * FROM login INTO OUTFILE "F:/booking_entrance/booking_entrance/mysql_outfile/login.csv" FIELDS TERMINATED BY "," ENCLOSED BY """ LINES TERMINATED BY "\r\n"'); //TODO: 语句仍然有问题
    res.sendFile('F:/booking_entrance/booking_entrance/mysql_outfile/login.csv');
})
// TODO: 退出登陆，必须要有（尚未测试）
app.get('/logout', function (req, res, next) {
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        } else { // 重定向至初始页面
            res.sendFile(__dirname + '/' + 'pages/attention.html');
        }
    })
})
// 测试Bootstrap页面
app.get('/test',function(req,res){
    res.sendFile(__dirname + '/' + 'pages/attention.html');
});
app.get('/test2',function(req,res){
    res.sendFile(__dirname + '/' + 'pages/verification.html');
});
app.get('/test3',function(req,res){
    res.sendFile(__dirname + '/' + 'pages/choice.html');
});
app.get('/test4',function(req,res){
    res.sendFile(__dirname + '/' + 'pages/hotel.html'); 
});

// 设置监听端口为8081
var server = app.listen(8081, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Successfully connected, URL is http://%s:%s", host, port)
})