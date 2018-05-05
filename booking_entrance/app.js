var express = require('express');       // express���
var mysql = require('mysql');           // MySQL���ݿ�
var session = require('express-session');   // session��
var FileStore = require('session-file-store')(session);
// var cookieParser = require('cookie-parser'); // cookie����, �ܿ�ϧ û��
var bodyParser = require('body-parser');// ����URL
const nodemailer = require('nodemailer');   // �����ʼ���Nodemailer��
var app = express();
app.set('view engine', 'jade');         // Jadeģ������
app.set('views', './views');            // ģ��·��
app.set('pages', './pages');            // �й���ҳ�ļ�

// ���� application/x-www-form-urlencoded �������������ʹ��������ɶ�POST���н���
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// �йܵľ�̬�ļ�����·��
app.use(express.static('pages'));
app.use(express.static('views'));

// var IS_TEST = false; // �����ÿ���, �ѷ���

// session����
// app.use(cookieParser());
app.use(session({
    secret: 'tc2018',               // ���ڶ�session id��ص�cookie����ǩ��
    store: new FileStore(),       // ���ش洢sessionΪ�ı��ļ�
    name: 'ccc_donghu_booking',        // cookie����
    cookie: { maxAge: 600 * 1000 },   // ����session��ʱʱ��
    resave: true,                  // �Ƿ�ÿ�ζ����±���Ự������false
    saveUninitialized: false        // �Ƿ��Զ�����δ��ʼ���Ự������false
}))

//�������ݿ�
var connection = mysql.createConnection({   // ���ݿ����Ӳ���
    host: 'localhost',
    user: 'root',
    password: 'Aa@123456',
    port: '3306',
    database: 'ccc2018',
});
connection.connect();
console.log('database connected.' + '\n');

// ��ȡIP����
function getClientIp(req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
};

// �����ʼ��ͻ��˵�½��Ϣ
var transporter = nodemailer.createTransport({
    host: 'smtphm.qiye.163.com',
    port: 25,
    secure: false,  // �Ƿ�ʹ��TLS
    // ��ʱʹ���Ϸ���˺�����
    auth: {
        user: 'ccc2018_reserve@cug.edu.cn',
        pass: 'Aa@CCC2018Hotel'
    }
});
// �����ʼ�����
var mailOptions = {
    from: '"CCC2018�Ƶ�Ԥ��" ccc2018_reserve@cug.edu.cn', // ��ʾ����(���Զ���)+�����˵�ַ(���ɸ���)
    to: '531817981@qq.com',
    subject: 'Test mail',                            // ����
    text: 'It is a test mail of CCC2018 reservation'                     // ����
};
// ȷ�����������
transporter.verify(function (error, success) {
    if (error) {
        console.log(error);
    } else {
        console.log('Server is ready to take our messages');
        // // �޸Ĳ����Ͳ����ʼ�
        // mailOptions.text = '���Գɹ�!';
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

// ���session����
function checkSession(sess) {
    if (sess.loginUser) {   // ����û�����
        // ҳ��ͣ��ʱ��δ�������session����ʱ��
        if (sess.cookie.maxAge > 0) {
            return;
        }
        else {
            // ҳ��ͣ��ʱ�����
            return 'The page stay is too long, please log in again';
        }
    } else {
        // ��ֹͨ��URLֱ�ӵ�½
        return 'Please log in first.';
    }
}

// ��֪ҳ��
app.get('/', function (req, res) {
    //res.sendFile(__dirname+'/'+'pages/DongHu_Hotel.html')
    res.sendFile(__dirname + '/' + 'pages/verification.html');
    return;
})

// ��½ҳ��
app.get('/login_get', function (req, res) {
    res.render('verification.jade');
})

// TODO: ��½������ʾ����������ѡ�񲢶��������������������ݿ�ʣ�෿��
app.post('/login_post', urlencodedParser, function (req, res) {
    var sess = req.session;
    var response = {
        "pin": req.body.pin,
        "name": req.body.name,
    };
    connection.query('SELECT * FROM login WHERE pin= ?', [response.pin], function (err, result) {   // ʹ��PIN����ѡ��ֻ������һ�����ؽ��
        if (err) {
            // �������
            console.log('[SELECT ERROR] - ', err.message);
            console.log("Error time: " + new Date(Date.now()));
            console.log("IP: " + getClientIp(req));
            var warningString = 'Wrong PIN, please try it again or register in TCCT'; // ��½��ʾ
            res.render('verification', { s: warningString });
            return;
        } else {
            if (result[0] == undefined) {
                // PIN������
                console.log('------------------------hold(PIN)--------------------------');
                console.log("WRONG PIN: " + response.pin);
                console.log("Hold time: " + new Date(Date.now()));  // ���ʱ��
                console.log("Clien info: " + JSON.stringify(req.headers))
                console.log("IP: " + getClientIp(req));
                console.log('------------------------------------------------------------\n\n');
                var warningString = 'Check your PIN and try it again';
                res.render('verification', { s: warningString });
                return
            } else if (req.body.name != result[0].username) {
                // �������
                console.log('------------------------hold(NAME)--------------------------');
                console.log("PIN: " + result[0].pin);
                console.log("wrong name: " + response.username);
                console.log("Hold time: " + new Date(Date.now()));  // ���ʱ��
                console.log("Clien info: " + JSON.stringify(req.headers));
                console.log("IP: " + getClientIp(req));
                console.log('------------------------------------------------------------\n\n');
                var warningString = 'Check your name and try it again';
                res.render('verification', { s: warningString });
                return;
            } else {
                // ��½�ɹ�
                console.log('--------------------------Login----------------------------');
                console.log(result);
                console.log("Login time: " + new Date(Date.now()));  // ���ʱ��
                console.log("Clien info: " + JSON.stringify(req.headers));
                console.log("IP: " + getClientIp(req));
                console.log('------------------------------------------------------------\n\n');
                // ��������session
                req.session.regenerate(function (err) {
                    if (err) {
                        var warningString = 'System Error: @regenerate session. </br>Please contact administor.';
                        res.render('verification', { s: warningString });
                        return;
                    }
                    else {
                        req.session.loginUser = response.pin;
                        req.session.loginName = response.name;// ��½�ɹ�������session
                        //console.log(req.session.loginName);
                        res.sendFile(__dirname + '/pages/choice.html');
                        return;
                    }
                })
            }
        }
    })
})

// ѡ�����Я��
app.get('/xiecheng_get', function (req, res) {
    var warningString = checkSession(req.session);
    if (warningString) {    // �������sessionCheck��ͨ����ֱ��URL/ҳ��ͣ������������ô��������ʾ�ַ��������˻ص�½ҳ��
        res.render('verification', { s: warningString })
        return;
    } else {
        res.sendFile(__dirname + '/' + 'pages' + '/' + 'QR.html');  // ����Я�̶�ά��
    }
})

// ѡ����붫��
app.get('/donghu_get', function (req, res) {
    //var sess = req.session;
    var warningString = checkSession(req.session);
    if (warningString) {    // �������sessionCheck��ͨ����ֱ��URL/ҳ��ͣ������������ô��������ʾ�ַ��������˻ص�½ҳ��
        res.render('verification', { s: warningString })
        return;
    } else {
        // ��ȡ���ݣ��Ȼ�ȡ������Ϣ
        connection.query('SELECT * FROM donghu WHERE sn=1', function (err_r, result_r) {
            if (err_r) {
                // �������߼�������Ӧ�ò������
                return;
            } else {
                // ��ȡ���ݣ��ٻ�ȡ������Ϣ
                connection.query('SELECT * FROM login WHERE pin = ?', [req.session.loginUser], function (err_u, result_u) {
                    if (err_u) {
                        // �������߼�����Ȼע�����ôӦ��Ҳ�������
                        return;
                    } else {
                        // ��Ⱦ��ҳ����ʾ
                        res.render('donghu', {
                            // �û���Ϣ
                            name: result_u[0].username, phone: result_u[0].phone, email: result_u[0].email,
                            // ������Ϣ
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

// TODO: ����Ԥ������
app.post('/donghu_reservation_post', urlencodedParser, function (req, res) {
    var warningString = checkSession(req.session);
    if (warningString) {    // �������sessionCheck��ͨ����ֱ��URL/ҳ��ͣ������������ô��������ʾ�ַ��������˻ص�½ҳ��
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
        // TODO: ִ���߼�: ����д�����ݿ⣬�ظ��ʼ���ҳ������
        // �ȴ���ʣ�෿���������������ֹͣ��һ������
        connection.query('UPDATE donghu SET tingtao2_biao_current=tingtao2_biao-?, tingtao2_dan_current-?',[req.body.input-num_TTB,req.body.input-num_TTD],function(err_r,result_r){
            if(err){
                console.log(err_r); // TODO��������һ�����������޷������η�Χ�Ĵ�������һ�¾Ͳ��Լ�д�����ˡ�
                res.send('Room number not valid.');
                return;
            }
            else{
                console.log(result_r);
                // �ٴ�����
                var order = 'INSERT donghu VALUES(pin, tingtao_2_biao,tingtao2_dan,nanshanyi_biao,nanshanyi_dan,baihua2_biao,checkin,checkout)';
                connection.query(order,[response.pin,response.TTB,response.TTD,response.NSB,response.NSD,response.BHB,response.CIN,response.COUT],function(err_o,result_o){
                    if(err_o){
                        console.log(err_o);
                        return;
                    }
                    else{
                        // �ٴ��������Ϣ
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

// // TODO: ����������������, �˴���Ҫsession
// app.post('/donghu_book_post', function (req, res) {
//     // TODO: ����
//     // ��������
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
//     // TODO: �޸����ݿ�����
//     // TODO: ���Ȱ��շ��䣨�жϿ���ǰ̨д������֪���Ƿ���л��߰�ȫ��
//     connection.query('UPDATE room SET tingtao2_biao_current=tingtao2_biao_current-?,tingtao2_dan_current=tingtao2_dan_current-?,nanshanyi_biao_current=nanshanyi_biao_current-?,nanshanyi_dan_current=nanshanyi_dan_current- WHRER sn=1', [req.query.tingtao2_biao, req.query.tingtao2_dan, req.query.nanshanyi_biao, req.query.nanshanyi_dan, req.query.baihua2_biao], function (err, result) {

//     })
//     // TODO: �����û�
//     //connection.query(,,)
// })

// TODO: ����Ա�޸��������󣬴˴����ڰ�ȫ������Ҫsession
app.post('/menager_post', function (req, res) {
    // TODO: ��λ���
})
// TODO: �˳���½������Ҫ�У���δ���ԣ�
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

// ���ü����˿�Ϊ8081
var server = app.listen(8081, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Successfully connected, URL is http://%s:%s", host, port)
})




