var express = require('express');   // express���
var mysql = require('mysql');       // MySQL���ݿ�
var app = express();

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
app.use(express.static('pages'));

// ��½ҳ��
app.get('/', function (req, res) {
    res.sendFile(__dirname + "/" + "pages" + "/" + "login.html");
})

// ��½������
app.get('/process_get', function (req, res) {
    // ��� JSON ��ʽ
    var response = {
        "username ": req.query.username,
        "password": req.query.password,
    };
    // var a = database.login(req.query.username, req.query.password, req.query.character, res);
    //var sql = "SELECT id FROM " + req.query.character + " WHERE id=" + req.query.username + " AND password= " + req.query.password;  // �Ӷ�Ӧ���в���.
    var sql = "SELECT * FROM " + "student" + " WHERE id= " + req.query.username;
    // ��Ϣ�˶Գɹ��򷵻�true, ���򷵻�false
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
                res.sendFile(__dirname + "/" + "pages" + "/" + "login.html");// ����Я��Ԥ��
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