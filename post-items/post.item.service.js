const db = require('_helpers/db');
const PostItem = db.PostItem;

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
async function getById(Iid) {
    var postitem = await PostItem.findOne({postitemId:Iid})
        .populate({path:'poster'});
        if(postitem) return postitem;
        return await PostItem.findById(Iid)
        .populate({path:'poster'}); 
}
// Get all post comments 
async function getChildren(childId) {
    if (await(PostItem.exists({id: childId}))){
        return await PostItem.find({parent:id})
        .populate({path:'poster'});
    }
    else throw 'Invalid post id';
   
}

async function create(postitemParam) {
    // Check if post id is a duplicate 
    if(await PostItem.exists({postitemId:postitemParam.postitemId})){
        throw 'Duplicate itemId'
    } 
    // Copy post param properties to a new post and save the post
    const postitem = new PostItem(postitemParam);
    await postitem.save();
    // Get created post and sve it
    const createdPost = await PostItem.findOne({postitemId:postitemParam.postitemId})
        .populate({path:'poster'});
    return createdPost.toJSON();
}
async function update(userId, id, postitemParam) {
    const postitem = await PostItem.findOne({poster:userId, id:id});
    // Validate post id
    if (!postitem) throw 'Postitem not found';
    // Copy post param properties to a new post and save the post
    Object.assign(postitem, postitemParam);
    await postitem.save(); 
}
async function like (userId, likedPostId){
    console.log(likedPostId);
    // Validate post id then get post
    if (await(PostItem.exists({id: likedPostId}))){
        var postItem = await PostItem.findById(likedPostId);
    }
    else throw 'Invalid post id';
    // Get all likes from post and add new like
    var allLikes = postItem.Likers;
    allLikes.push(userId);
    // Save updated likes to post and save post
    Object.assign(postItem, {likers: allLikes});
    await postitem.save();
}
async function unlike(userId, likedPostId){
    // Validate post id then get post
    if (await(PostItem.exists({id: likedPostId}))){
        var postItem = await PostItem.findById(likedPostId);
    }
    else throw 'Invalid post id';
    // Check if post is liked
    if (!postitem.likers.includes(userId)){
        throw 'Post already unliked'
    }
    // Get all likes from post and remove user's like
    var allLikes = postItem.Likers;
    allLikes = allLikes.filter(x=> x.id!==userId);
    // Update post likes and save post
    Object.assign(postItem, {likers: allLikes});
    await postitem.save();
}
// Delete post with either default mongo id or the custom id 
async function _delete(userId, itemId) {
    // Create boolean variable checking validity of post id
    const exists = await PostItem.exists({id:itemId})||
        await PostItem.exists({postitemId:itemId});
    // Create boolean variable checking ownership of post by user
    const owned = (await PostItem.exists({poster:userId, id:itemId})||
        await PostItem.exists({poster:userId, postitemId:itemId}));

    // Validate post existance
    if(!exists){
        throw 'post does not exist' 
    }
    // Validate post ownership
    if (!owned){
        throw 'unauthorised action'
    }
    // Remove post internal id or custom id 
    const removed = await PostItem.findOneAndRemove({id:itemId});
    if (!removed) await PostItem.findOneAndRemove({postitemId:itemId});  
}

