var express = require('express');   // express���
var mysql = require('mysql');       // MySQL���ݿ�
var app = express();
app.set('view engine', 'jade');     // Jadeģ������
app.set('views', './views');         // ģ��·��
// ���ݿ����Ӳ���
//var connectParams = {
//    'hostname': 'localhost',
//    'user': 'root',
//    'password': 'l1994321',
//    'port': '3306',
//    'database': 'mylab'
//}

//�������ݿ�
var connection = mysql.createConnection({   // ע��ʹ�õ�ʱ�������ϢҪ�ĳ����ݿ����趨����Ϣ��
    host: 'localhost',
    user: 'root',
    password: 'l1994321',
    port: '3306',
    database: 'mylab',
});
connection.connect();


console.log('database connected.' + '\n');


// �йܵľ�̬�ļ�����·��
// app.use(express.static('pages'));
app.use(express.static('views'));

// ��½ҳ��
app.get('/', function (req, res) {
    //res.sendFile(__dirname + "/" + "pages" + "/" + "verification.html");
    // TODO: ģ��
    var warningString = ' '; // ��½��ʾ
    res.render('verification', { s: warningString });
    return;
})

// ��½������
app.get('/process_get', function (req, res) {
    // ��� JSON ��ʽ
    var response = {
        "username ": req.query.username,
        "password": req.query.password,
    };
    // ��Ϣ�˶Գɹ��򷵻�true, ���򷵻�false
    connection.query('SELECT * FROM student WHERE id= ?',
        [req.query.username], function (err, result) {
            if (err) {
                console.log('[SELECT ERROR] - ', err.message);
                // res.send("check your username and password and try it again");
                // TODO: ģ��
                var warningString = 'check your PIN number/password and try it again'; // ��½��ʾ
                res.render('verification', { s: warningString });
                return;
            } else {
                console.log(result[0] == undefined);
                if (result[0] == undefined) {
                    // res.send("check your pin number and try it again");
                    // TODO: ģ��
                    var warningString = 'Check your PIN number and try it again';
                    res.render('verification', { s: warningString });
                    return
                } else if (req.query.password != result[0].password) {
                    res.send("Check your password and try it again");
                    // TODO: ģ��
                    var warningString = 'Check your password and try it again';
                    res.render('verification', { s: warningString });
                    return
                } else {
                    console.log(typeof (result[0].id));
                    console.log('--------------------------SELECT----------------------------');
                    console.log(result);
                    console.log('------------------------------------------------------------\n\n');
                    res.redirect('https://m.ctrip.com/webapp/meeting/b2croom/CCC/index');   // ����Я��Ԥ��
                    return
                }
            }
        })
})


// ���ü����˿�Ϊ8081
var server = app.listen(8081, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("test��URL is http://%s:%s", host, port)
})