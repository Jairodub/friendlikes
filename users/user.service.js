const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
var express = require('express');
var app = express();
var server   = require('http').Server(app);
var io       = require('socket.io')(server);

const config = require('config.json');
const db = require('_helpers/db');
const User = db.User;
const Online = db.Online;
const Message = db.Message;

module.exports = {
    authenticate,
    getAll,
    getById,
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

async function getById(uid) {
    return await User.findById(uid);
}

async function create(userParam) {

    //check for duplicate custom uids 
    if(await User.exists({userId:userParam.userId})) throw 'duplicate userId'

    // validate
    if (await User.findOne({ username: userParam.username })) {
        throw 'Username "' + userParam.username + '" is already taken';
    }

    const user = new User(userParam);

    // hash password
    if (userParam.password) {
        user.hash = bcrypt.hashSync(userParam.password, 10);
    }else throw "password required"

    // save user
    await user.save();
}

async function update(id, userParam) {
    // find user while validating for existance
    const user = await User.findById(id);
    if (!user) throw 'User not found';

    // validate ownership
    if(userId !== user.id) throw 'Unothorised action'

    // validate for new username uniqueness 
    if (user.username !== userParam.username && await User.findOne({ username: userParam.username })) {
        throw 'Username "' + userParam.username + '" is already taken';
    }

    // hash password if it was entered
    if (userParam.password) {
        userParam.hash = bcrypt.hashSync(userParam.password, 10);
    }

    // copy userParam properties to user
    Object.assign(user, userParam);

    await user.save();
}

async function _delete(id) {
    await User.findByIdAndRemove(id);
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
    User.find({"username" : req.body.myUsername,"friends.name":req.body.friendUsername},function(err,doc){
        if(err) throw err 
        else if(doc.length!=0){
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
            io.to(doc[req.body.friendUsername]).emit('message', req.body);
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
