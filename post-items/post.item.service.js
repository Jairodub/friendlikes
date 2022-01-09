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
// Fetch item by either the deafult mongo id or the custom id
async function getById(Iid) {
    var postitem = await PostItem.findOne({postitemId:Iid})
        .populate({path:'poster'});
        if(postitem) return postitem;
        return await PostItem.findById(Iid)
        .populate({path:'poster'}); 
}

async function getChildren(childId) {
    if (await(PostItem.exists({id: childId}))){
        return await PostItem.find({parent:id})
        .populate({path:'poster'});
    }
    else throw 'Invalid post id';
   
}

async function create(postitemParam) {
    // check for duplicate ids
    if(await PostItem.exists({postitemId:postitemParam.postitemId})){
        throw 'Duplicate itemId'
    } 
    const postitem = new PostItem(postitemParam);
    await postitem.save();

   const createdPost = await PostItem.findOne({postitemId:postitemParam.postitemId})
        .populate({path:'poster'});
   return createdPost.toJSON();
}

async function update(userId, id, postitemParam) {
    const postitem = await PostItem.findOne({poster:userId, id:id});
    // validate
    if (!postitem) throw 'Postitem not found';
    // copy postitemParam properties to postitem
    Object.assign(postitem, postitemParam);
    await postitem.save(); 
}
async function like (userId, likedPostId){
    // validate post id then get post
    if (await(PostItem.exists({id: likedPostId}))){
        var postItem = await PostItem.findById(likedPostId);
    }
    else throw 'Invalid post id';
    // get all likes from post and add new like
    var allLikes = postItem.Likers;
    allLikes.push(userId);
    // save updated likes to post and save post
    Object.assign(postItem, {likers: allLikes});
    await postitem.save();
}
async function unlike(userId, likedPostId){
    // validate post id then get post
    if (await(PostItem.exists({id: likedPostId}))){
        var postItem = await PostItem.findById(likedPostId);
    }
    else throw 'Invalid post id';
    // check if post is liked
    if (!postitem.likers.includes(userId)){
        throw 'Post already unliked'
    }
    // get all likes from post and remove user's like
    var allLikes = postItem.Likers;
    allLikes = allLikes.filter(x=> x.id!==userId);
    // update post likes and save post
    Object.assign(postItem, {likers: allLikes});
    await postitem.save();

}
// Delete post with either default mongo id or the custom id 
async function _delete(userId, itemId) {
    // boolean variable checking validity of post id
    const exists = await PostItem.exists({id:itemId})||
        await PostItem.exists({postitemId:itemId});
    // boolean variable checking ownership of post by user
    const owned = (await PostItem.exists({poster:userId, id:itemId})||
        await PostItem.exists({poster:userId, postitemId:itemId}));

    // validate existance
    if(!exists){
        throw 'post does not exist' 
    }
    // validate ownership
    if (!owned){
        throw 'unauthorised action'
    }
    const removed = await PostItem.findOneAndRemove({id:itemId});
    if (!removed) await PostItem.findOneAndRemove({postitemId:itemId});
    
}

