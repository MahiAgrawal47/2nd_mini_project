const mongoose=require("mongoose");

mongoose.connect(`mongodb://127.0.0.1:27017/socialMediaUsers?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.3.1`);

const userSchema=new mongoose.Schema({
    username:String,
    email:String,
    password:String,
    posts:[{type:mongoose.Schema.Types.ObjectId,ref:"post"}],
})

module.exports=mongoose.model("user",userSchema);