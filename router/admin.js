const express = require('express'),
    {user,task} = require('../model/schema'),
    crypto = require("crypto"),
    router = express.Router();

router.use(function (req,res,next) {
    if (req.session.login) {
        if (req.session.data.level >= 10) {
            return next();
        }
        return res.send('你没有权限');
    }
    res.send('请登陆');
});

router.get('/user',function (req,res) {
    res.render('./admin/user.ejs',{
       title : '用户管理',
        username : req.session.data.username,
        level : req.session.data.level
    })
}).post('/user',function (req,res) {

    Promise.all([
        user.find().skip((req.body.page -1 ) * req.body.limit).limit(Number(req.body.limit)),
        user.countDocuments(),
    ]).then(function (data) {
        res.send({code:0,data:data[0],count:data[1]});
        // console.log(data);
    })
});

router.post('/user/reused',function (req,res) {
    // console.log(user_id);
     user.updateOne({_id : req.body.user_id} , {$set:{used:req.body.used}},function (err) {
         if (err) throw err;
         return res.send({code:0,msg:'更新成功'})
     })
})

router.post('/user/del',function (req,res) {
    user.findOne({_id: req.body.user_id},function (err,data) {
        // console.log(data);
        if (req.session.data.level > data.level) {
            // req.session.data.level

            user.deleteOne({_id: req.body.user_id} , function (err,data) {
                // console.log(err,data);
                //删除任务
                task.deleteMany({'author':req.body.user_id},function (err,data) {
                    // res.send({code:0,msg:'删除成功'})
                    task.updateMany({'receiver': req.body.user_id},{$pull : {'receiver': req.body.user_id}},function () {
                        
                    });
                });
                user.updateMany({'task.receive': req.body.user_id},{$pull : {'task.receive': req.body.user_id}},function () {

                })

            })
             return res.send({code:0,msg:'删除成功'})
        }else{
            return res.send({code:2,msg:'你无法删除该用户'})
        }
    })
    // console.log(1);

})

router.post('/user/relevel',function (req,res) {
    // console.log(req.session.data.level,req.body.levle,req.session.data.level <= req.body.levle);
    user.findOne({_id:req.body.user_id},function (err,data) {
        if (req.session.data.level >= req.body.level && req.session.data.level > data.level) {

            user.updateOne({_id:req.body.user_id},{$set:{level:req.body.level}},function (err,data) {
                if(err)throw err;
                res.send({code:0,msg:'修改成功'})
            })
        }else{
            res.send({code:1,msg:'用户等级权限不足'})
        }
    })


})

router.post('/deltask',function (req,res) {
    console.log(1);
    Promise.all([
        task.deleteOne({'_id':req.body.task_id}),
        user.updateMany({'task.receive': req.body.task_id},{$pull: {'task.receive': req.body.task_id}}),
        user.updateMany({'task.accomplish': req.body.task_id},{$pull: {'task.accomplish': req.body.task_id}}),
        user.updateMany({'task.publish': req.body.task_id},{$pull : {'task.publish': req.body.task_id}})
    ]).then(function (data) {
        console.log(data);
        res.send({code:0,msg:'删除成功'})
    })
    // res.send({code:0,msg:'删除成功'})

})

router.get('/edittask', function (req,res) {
    res.render('./admin/edittask.ejs',{
        username : req.session.data.username,
        level : req.session.data.level,
        title : '任务管理'
    })
})

router.post('/edittask', function (req,res) {
    Promise.all([
        task.find().populate('author').skip((req.body.page - 1) * req.body.limit),
        task.countDocuments()
    ]).then(function (data) {
        // console.log(data);
        res.send({code: 0 , data: data[0], count: data[1]})
    })
})

module.exports = router;