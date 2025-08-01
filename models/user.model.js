const mongoose = require('mongoose');
const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
        trim:true   ,
        lowercase:true,
        unique:true,
        minlength:3,
    },
    email:{
        type:String,
        required:true,
        trim:true,
        lowercase:true, 
        unique:true,minlength:5,},
        password:{
            type:String,
            required:true,
            trim:true,
            minlength:5,
        }
}) 
const userModel=mongoose.model('user',userSchema);
module.exports=userModel;