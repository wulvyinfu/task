const express = require("express"),
    app = express(),
    session = require('express-session'),
    Mongosession = require('connect-mongo')(session),
    mongoose = require("mongoose");

//连接数据库
mongoose.connect('mongodb://localhost/user',{useNewUrlParser:true});

app.use(session({
    secret:'alsfds',//密钥
    rolling: true,//是否每次点击a ...重新更新保存时间
    resave:false,
    cookie:{maxAge:100*60*60*60},
    saveUninitialized:false,
    store:new Mongosession({
        url: 'mongodb://localhost/user'
    })
}))
//获取post参数
app.use(express.json());
app.use(express.urlencoded({extended:false}));

//静态资源目录
app.use(express.static(__dirname + "/public"));
//模板引擎
app.set('views ',__dirname + '/view');
app.set('views engine','ejs');

app.use('/',require('./router/index.js'));

app.use('/api',require('./router/api.js'));

app.use('/admin',require('./router/admin.js'));

app.listen(3666);