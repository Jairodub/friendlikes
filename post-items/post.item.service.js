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
async function getById(Iid) {
    var postitem = await PostItem.findOne({postitemId:Iid})
        .populate({path:'poster'});
        if(postitem) return postitem;
        return await PostItem.findById(Iid)
        .populate({path:'poster'}); 
}

async function getChildren(id) {
    return await PostItem.find({parent:id})
    .populate({path:'poster'})
}

async function create(postitemParam) {
    // check for duplicate ids
    if(await PostItem.exists({postitemId:postitemParam.postitemId})){
        throw 'Duplicate itemId'
    } 

    const postitem = new PostItem(postitemParam);
    await postitem.save();
}

async function update(userId, id, postitemParam) {
    const postitem = await PostItem.findOne({poster:userId, _id:id});
    
    // validate
    if (!postitem) throw 'Postitem not found';

    // copy postitemParam properties to postitem
    Object.assign(postitem, postitemParam);

    await postitem.save();
    
}
async function like (userId, likedPostId){
    var postItem = await PostItem.findById(likedPostId);
  
    
    var allLikes = postItem.Likers;

    allLikes.push(userId);

    Object.assign(postItem, {likers: allLikes});
    await postitem.save();
}
async function unlike(userId, likedPostId){
    // validate ownership
    var postItem = await PostItem.findById(likedPosttId)

    if (!postitem.likers.includes(userId)){
        throw 'Item does not exist'
    }
  
    var allLikes = postItem.Likers;

    // remove disliking user from copy of likers
    allLikes = allLikes.filter(x=> x.id!==userId);

    // update item likers to exclude disliking user
    Object.assign(postItem, {likers: allLikes});
    
    // save updated item
    await postitem.save();
}
async function _delete(userId, itemId) {

    // validate existance
    if(!(await PostItem.exists({_id:itemId}))){
        throw 'item does not exist'
    }
    // validate ownership
    if (!(await PostItem.exists({poster:userId, _id:itemId}))){
        throw 'unauthorised action'
    }
    await PostItem.findByIdAndRemove(itemId);
}

