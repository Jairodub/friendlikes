const db = require('_helpers/db');
const PostItem = db.PostItem;
const mongoose = require('mongoose');

module.exports = {
    getAll,
    paginate,
    getById,
    getChildren,
    create,
    update,
    like,
    unlike,
    delete: _delete
};
async function getAll() {
return await PostItem.find({parent:null})
    .populate({path:'poster'});
}
// Send any multiple object responses in pages holding 10 each
async function paginate(page, pageSize, query){
    if (pageSize === undefined) {
        pageSize = 10;
    }
    if (page === undefined) {
        page = 1;
    }
    var filter = {};
    var keys= Object.keys(query);
    var values = Object.values(query);
    for(var i=0 ; i<keys.length; i++){
        if(keys[i]!= 'page'&& keys[i]!='limit' ){
            filter[keys[i]]=values[i];
        }
    }
    return await PostItem.paginate(filter, {page:page, limit:pageSize, populate:'poster'});
}
// Get item by either the deafult mongo id or the custom id
async function getById(paramsId) {
    var postitem = await PostItem.findOne({postitemId:paramsId})
        .populate({path:'poster'});
        if(postitem) {return postitem;}
        else if(mongoose.Types.ObjectId.isValid(paramsId)){
            return await PostItem.findById(paramsId)
            .populate({path:'poster'}); 
        }
        else throw 'Post does not exist';      
}
// Get all post comments 
async function getChildren(parentId) {
    // Validate parent id
    if(mongoose.Types.ObjectId.isValid(parentId)){
        const postitems = await PostItem.find({parent:parentId})
        .populate({path:'poster'});
        // Confirm comments exist
        if(postitems.length===0){
            throw 'Post does not have comments';}
        return postitems;
    }
    else throw 'Invalid parentId'
}
async function create(loggedInUserId, postitemParam) {
    // Check if post id is a duplicate 
    if(await PostItem.exists({postitemId:postitemParam.postitemId})){
        throw 'Duplicate itemId';
    } 
    // Copy post param properties to a new post 
    const postitem = new PostItem(postitemParam);
    // Assign current user id as post owner and save the post
    Object.assign(postitem, {poster:loggedInUserId})
   
    if(postitem.poster){
        await postitem.save();
    }else throw 'wtf';
    // Get created post and send it
    const createdPost = await PostItem.findOne({postitemId:postitemParam.postitemId})
        .populate({path:'poster'});
    return createdPost.toJSON();
}
async function update(loggedInUserId, paramsId, reqBody) {
    // Confirm poster and postiteId are not being changed
    if(reqBody.poster){
        throw 'Cannot change poster';
    }
    if(reqBody.postitemId){
        throw 'Cannot change postitemId'
    }
    // Find post using the local findById function 
    const postitem = await getById(paramsId);
    // Confirm user owns the post
    if(loggedInUserId!==postitem.poster.id){
        throw 'User not authorised to update post';
    }
    // Copy post param properties to a new post and save the post
    Object.assign(postitem, reqBody);
    await postitem.save(); 
}
async function like (userId, paramsId){
    // Find post using the local findById function 
    var postitem = await getById(paramsId);
    // Get all likes from post and add new like
    var allLikes=[];
    allLikes .concat(postitem.Likers);
    allLikes.push(userId);
    // Save updated likes to post and save post
    Object.assign(postitem, {likers: allLikes});
    await postitem.save();
}
async function unlike(userId, paramsId){
    // Find post using the local findById function 
    var postitem = await getById(paramsId);
    // Check if post is liked
    if (!postitem.likers.includes(userId)){
        throw 'Post already unliked'
    }
    // Get all likes from post and remove user's like
    var allLikes=[]
    allLikes.concat(postitem.Likers);
    allLikes = allLikes.filter(x=> x.id!==userId);
    // Update post likes and save post
    Object.assign(postitem, {likers: allLikes});
    await postitem.save();
}
// Delete post with either default mongo id or the custom id 
async function _delete(userId, paramsId) {
    // Create boolean variable checking validity of post id
    const valid = mongoose.Types.ObjectId.isValid(paramsId)
    if (!(await PostItem.exists({poster:userId, postitemId:paramsId}))){
        if(valid){
            if(!(await PostItem.exists({poster:userId, id:paramsId})));
                throw 'User not authorised to delete post';
        }
        else throw 'User not authorised to delete post';
    }
    // Remove post internal id or custom id 
    var removed =await PostItem.findOneAndRemove({postitemId:paramsId})
    if((!removed)&&valid){
    }     
}

