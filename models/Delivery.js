const mongoose = require('mongoose')
const schema = new mongoose.Schema({
name:{
    type:String,
    required:true
},
email:{
    type:String,
    required:true
},
photo:{
    type:String
},
number:{
    type:String,
    required:true
},
address:{
    type:String,
    required:true
},
details:{
    type:String,
    required:true
},
licence:{
    type:String,
    required:true
},
proof:{
    type:String,
    required:true
},
password:{
    type:String,
    required:true
},
role:{
    type:String,
    default:"Delivery"
},
token:{
    type:String
}
})

let delivery = mongoose.model("delivery",schema)
module.exports = delivery