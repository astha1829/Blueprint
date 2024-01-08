import mongoose from "mongoose";
import { ObjectId } from 'mongodb';

const userSchema = new mongoose.Schema({
    name:{type:String, required:true, trim:true},
    email:{type:String, required:true, trim:true},
    password:{type:String, required:true, trim:true},
    city:{type:String, required:true, trim:true},
    gender:{type:String, required:true, trim:true},
    
    tc:{type:Boolean, required:true}
})

//Model

const UserModel = mongoose.model("user", userSchema)

export default UserModel