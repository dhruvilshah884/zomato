const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    categories: [{ type: String }],
    foodName: { type: String },
    foodImage: { type: String }, 
    foodPrice: { type: Number },
    foodDescription: { type: String },
    foodType: { type: String, enum: ['veg', 'nonVeg'] },
    avelType: { type: String, enum: ['inStock', 'outStock'] },
    restrurant: { type: mongoose.Schema.Types.ObjectId, ref: "restrurant" }
});

const ResAdmin = mongoose.model("restrurantAdmin", schema);
module.exports = ResAdmin;
