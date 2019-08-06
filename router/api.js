const express = require('express'),
    router = express.Router(),
    {user,task} = require('../model/schema'),
    path = require('path'),//路径拼接
    multer = require('multer');//文件上传功能
// console.log(process.cwd());
const storage = multer.diskStorage({
    // 1. __dirname 当前文件所在的目录
    // 2. process.cwd() node 工作目录

    destination : path.join(process.cwd(),'public/upload'),

    filename : function (req,file,callback) {
        const h = file.originalname.split('.');
        const filename = `${Date.now()}.${h[h.length - 1]}`;
         callback(null,filename)
    }

});
// console.log(stroage);
const upload = multer({
    storage
});
//文件上传
router.post('/upload',function (req, res) {

    upload.single('file')(req, res, function (err) {
        if(err){
            return res.send({code:1, msg:'上传失败'})
        }
        res.send({
            code:0,
            msg:'上传成功',
            data :{
                src : `/upload/${req.file.filename}`
            }
        })
    })
})
//全部任务
router.post('/task/all',function (req, res) {
    Promise.all([
        task.find().populate('author').skip((req.body.page - 1) * req.body.limit),
        task.countDocuments()
    ]).then(function (data) {
        // console.log(data);
        res.send({code: 0 , data: data[0], count: data[1]})
    })
})
//可以接取的任务
router.post('/task/can', function (req,res) {
    // console.log();
    Promise.all([
        task.find({$and:[{'endTime':{$gte:new Date()}},{'can':false}]}).populate('author').skip((req.body.page - 1) * req.body.limit),
        task.find().countDocuments({$and:[{'endTime':{$gte:new Date()}},{'can':false}]})
    ]).then(function (data) {
        res.send({code: 0 , data: data[0], count: data[1]})
    })
    // task.find({'endTime':{$gte:new Date()}},function (err,data) {
        // console.log(data);
        // Promise.all([
        //     task.find('_id':data._id).populate('author').skip((req.body.page - 1) * req.body.limit),
        //     task.countDocuments()
        // ]).then(function (data) {
        //     // console.log(data);
        //     res.send({code: 0 , data: data[0], count: data[1]})
        // })
    // })

})

router.post('/task/notcan', function (req,res) {
    Promise.all([
        task.find({$or:[{'endTime':{$lt:new Date()}},{'can':true}]}).populate('author').skip((req.body.page - 1) * req.body.limit),
        task.find().countDocuments({$or:[{'endTime':{$lt:new Date()}},{'can':true}]})
    ]).then(function (data) {
        res.send({code: 0 , data: data[0], count: data[1]})
    })
})

router.post('/task/my',function (req,res) {
    // console.log(req.session._id);
    Promise.all([
        task.find({'author': req.session.data._id}).populate('author').skip((req.body.page - 1) * req.body.limit),
        task.countDocuments()
    ]).then(function (data) {
        // console.log(data);
        // data[0].user
        res.send({code: 0 , data: data[0], count: data[1]})
    })
})

router.post('/task/ing',function (req,res) {
    // console.log(req.session.data._id);
    task.find()
        .populate({
            path:'receiver.user author',
            options:{
            //     sort:{'_id':-1},
                skip:(req.body.page - 1) * req.body.limit,
                limit:Number(req.body.limit),
            }
        }).then(function (data) {
        // console.log(data);
        var arr = [] ;
        data.forEach(function (val) {
            val.receiver.forEach(function (value,i) {
                // console.log(value.user._id==req.session.data._id);
                if (value.user._id == req.session.data._id) {
                    arr.push(val)
                }
            })
        })
        res.send({code:0,data:arr,count:arr.length})
    })


})

router.get('/task/details:id', function (req,res) {
    // console.log(req.params);
    if(!req.session.data)return res.redirect('/login');
    if(!req.params.id) return res.send({code:1,msg:'请求失败！'});
    task.findOne({'_id':req.params.id}).populate('author receiver.user').exec().then(function (data) {
        // console.log(data);
        res.render('./details.ejs',{
            title:'任务详情',
            user: req.session.data,
            login:req.session.login,
            data,
            'id' : req.session.data._id
        })
         console.log(data);
    })



})

router.post('/task/fin', function (req,res) {
    task.find().populate({
        path:'finish author',
        options:{
            skip:(req.body.page - 1) * req.body.limit,
            limit:Number(req.body.limit),
        }

    }).exec().then(function (data) {
        var a = [] ;
        data.forEach(function (val,index,arr) {
            // console.log(val.finish);
            if(val.finish && val.finish._id == req.session.data._id){
                // console.log(3);
                a.push(val)
            }
        })
        res.send({code:0,data:a,count:a.length})
    })

})

module.exports = router ;