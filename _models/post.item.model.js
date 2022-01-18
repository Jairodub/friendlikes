const mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;
var connection = mongoose.connection;

const schema = new Schema({
    postitemId: {
        type:String, 
        required:true
    },
    text:  String,
    isOrphan: Boolean,
    allowComment: {type:Boolean, default:true},
    isRead: {type:Boolean, default:false},
    poster : {
        type: Schema.Types.ObjectId,
        required: isPresent,
        ref: "User"
    },
    created:{
        type:Date,
        default:Date.now 
    },
    parentPost: {   
        type: Schema.Types.ObjectId,
        ref: "PostItem"  
    }, 
    childShared: {
        type: Schema.Types.ObjectId,
        ref: "PostItem"  
    },
    targetUser : [{
        type: Schema.Types.Object,
        ref: "User"
    }],
    likers: [{
            type: Schema.Types.ObjectId,
            ref: "User"
    }], 
 
});
function isPresent() {
    return typeof this.poster === 'string'? false : true
}

schema.plugin(mongoosePaginate);
schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});


module.exports = mongoose.model('PostItem', schema);