const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
var express = require('express');
var app = express();
var server   = require('http').Server(app);
var io       = require('socket.io')(server);
const mongoose = require('mongoose');

const config = require('config.json');
const db = require('_helpers/db');
const User = db.User;
const Online = db.Online;
const Message = db.Message;

module.exports = {
    authenticate,
    getAll,
    getById,
    getByIdClean,
    create,
    update,
    delete: _delete,
    sendRequest,
    confirmRequest,
};

async function authenticate({ username, password }) {
    const user = await User.findOne({ username });
    if (user && bcrypt.compareSync(password, user.hash)) {
        const token = jwt.sign({sub:user.id, id:user.id }, config.secret, { expiresIn: '7d' });
        return {
            ...user.toJSON(),
            token
        };
    }
}
async function getAll() {
    return await User.find();
}
async function getById(paramsId) {
    // Validate paramsId
    if(!mongoose.Types.ObjectId.isValid(paramsId)) {
        throw 'Not a valid user id'
    }
    const user = await User.findById(paramsId);
    // Confirm user exists
    if(!user) throw 'User does not exist';
    return user;   
}
async function getByIdClean(uid) {
    return await User.findById(uid);
}
async function create(userParam) {
    //Confirm custom id is unique
    if(await User.exists({userId:userParam.userId})) throw 'duplicate userId'
    // Confirm username is unique
    if (await User.findOne({ username: userParam.username })) {
        throw 'Username "' + userParam.username + '" is already taken';
    }
    // Create user from params
    const user = new User(userParam);
    // Hash the password
    if (userParam.password) {
        user.hash = bcrypt.hashSync(userParam.password, 10);
    }else throw 'Password required';
    // Save registered user
    await user.save();
}
async function update(loggedInUserId, paramsId, reqBody) {
    // Validate paramsId
    if(!mongoose.Types.ObjectId.isValid(paramsId)) {
        throw 'Not a valid user id';
    }
    if(!User.exists({id:paramsId})){
        throw 'User does not exist'
    }
    // Confirm user is updating own profile
    if (loggedInUserId!==paramsId){
        throw 'Unauthoised action';
     }
    const user = await User.findById(paramsId);
    // Confirm username and userId are not changed
    if(reqBody.username){
        throw 'Username cannot be changed';
    }
    if(reqBody.userId){
        throw 'UserId cannot be changed';
    }
    // Hash password if it was updated
    if (reqBody.password) {
        reqBody.hash = bcrypt.hashSync(userParam.password, 10);
    }
    // Copy userParam properties to user and save user with updates
    Object.assign(user, reqBody);
    await user.save();
}
async function _delete(loggedInUserId, paramsId) {
    User.remove();
    // Validate paramsId
    if(!mongoose.Types.ObjectId.isValid(paramsId)) {
        throw 'Not a valid user id';
    }
    if(!User.exists({id:paramsId})){
        throw 'User does not exist';
    }
    // Confirm user is deleting own profile
    if (loggedInUserId!==paramsId){
       throw 'User not authorised to delete profile';
    }
    await User.findByIdAndRemove(paramsId);
}
io.on('connection',(socket)=>{
    io.to(socket.id).emit('username', username);
    users[username ]= socket.id;
    keys[socket.id] = username;
    User.find({"username" : username},{doc:1,_id:0},function(err,doc){
        if(err) return err;
        else{
            friends=[];
            pending=[];
            allFriends=[];
            console.log("friends list: "+doc);
            list=doc[0].friends.slice();
            console.log(list);
            
            for(var i in list){
                if(list[i].status=="Friend"){
                    friends.push(list[i].name);
                }
                else if (list[i].status=="Pending"){
                    pending.push(list[i].name);
                }
                else{
                    continue;
                }
            } 
            io.to(socket.id).emit('friend_list', friends);
            io.to(socket.id).emit('pending_list', pending);
            io.emit('users',users);
        }
    });
    
    socket.on('group message',function(msg){
        io.emit('group',msg);
    });
    
    socket.on('private message',function(msg){
        Messages.create({
            "message":msg.split("#*@")[1],
            "sender" :msg.split("#*@")[2],
            "reciever":msg.split("#*@")[0],
            "date" : new Date()});
        io.to(users[msg.split("#*@")[0]]).emit('private message', msg);
    });
    
    socket.on('disconnect', function(){
        delete users[keys[socket.id]];
        delete keys[socket.id];
        io.emit('users',users);
        console.log(users);
    });
});
async function sendRequest(req) {
    User.find({"username" : req.body.myUsername,"friends.name":req.body.friendUsername},function(err,users){
        if(err) throw err 
        else if(users.length!=0){
           console.log('friend request already sent');
        }
        else{
            User.update({
                username:req.body.myUsername
            },{
                $push:{
                    friends:{
                        name: req.body.friendUsername,
                        status: "Pending"
                    }
                }
            },{
                upsert:true
            },function(err,friendRequest){
                if(err)throw err;
            });
            io.to(users[req.body.friendUsername]).emit('message', req.body);
        }
    });
}
async function confirmRequest (req){
    if(req.body.accept=="Yes"){
        models.user.find({
            "username" : req.body.friendUsername,
            "friends.name":req.body.myUsername
        },function(err,doc){
            console.log('Friend request already ');
            if(err){
                
                throw err;
            }
            else if(doc.length!=0){         
                console.log('Friend request already accepted')
            }
            else{
                models.user.update({
                    "username":req.body.myUsername,
                    "friends.name":req.body.friendUsername
                },{
                    '$set':{
                        "friends.$.status":"Friend"
                    }
                },function(err,doc){
                    if(err) throw err;
                    else{
                        io.to(users[req.body.friendUsername]).emit('friend', req.body.myUsername);
                        io.to(users[req.body.myUsername]).emit('friend', req.body.friendUsername);
                    }
                });
                models.user.update({
                    username:req.body.friendUsername
                },{
                    $push:{
                        friends:{
                            name: req.body.myUsername,
                            status: "Friend"
                        }
                    }
                },{upsert:true},function(err,doc){
                    if(err)throw err;
                    
                });
            }
        });
    }
    else{   
        models.user.update({
            "username":req.body.myUsername
        },{
            '$pull':{
                'friends':{
                    "name":req.body.friendUsername,
                }
            }
        },function(err,doc){
        if(err)throw err;
        });
    }
};
