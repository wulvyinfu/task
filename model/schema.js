const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {type:String ,required:true},
    password: {type: String, required: true},
    used: {type:Boolean,required:true, default: false},//账号是否可用
    level:{type:Number,required:true, default: 1},
    //任务状态
    task: {
        //发布任务
        publish: {type:[{type: mongoose.Schema.Types.ObjectId, ref:'task'}]},
        //已经接取的任务
        receive: {type: [{type: mongoose.Schema.Types.ObjectId, ref:'task'}]},
        //已经完成的任务
        accomplish: {type: [{type: mongoose.Schema.Types.ObjectId, ref:'task' }]}
    }
});
//任务详情
const taskSchema = new mongoose.Schema({
    title: {type: String,required:true},
    content: {type:String,required:true},
    author: {type: mongoose.Schema.Types.ObjectId, ref:'user',required:true},
    authorName:{type:String},
    receiver: {type: [
            {'user': {type: mongoose.Schema.Types.ObjectId, ref:'user' },
            'msg': {type: String},
            'swi': {type: Boolean, required:true, default:false},
            'reply':{type:String}
            },
        ]},//接取人
    startTime: {type: String,required:true,default:new Date()},
    endTime: { type : Number,required:true,default:new Date().getTime()+1000*60*60*24*7 },
    award:{type: String,required:true},
    difficulty:{type:String},
    num: {type:Number},
    finish:{type: mongoose.Schema.Types.ObjectId, ref:'user'},
    can:{type:Boolean,required:true,default:false}
});

//创建表
const user = mongoose.model('user',userSchema);
const task = mongoose.model('task',taskSchema);

module.exports = {
    user,
    task
}