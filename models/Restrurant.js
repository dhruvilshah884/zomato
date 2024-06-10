const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    restrurantName: { type: String, required: true },
    restaurantLogo: { type: String },
    address: { type: String, required: true },
    number: { type: String, required: true },
    restaurantPhotos: [{ type: String }],
    password: { type: String, required: true },
    role: { type: String, default: "Restrurant" },
    token: { type: String }
});

const Restrurant = mongoose.model("restrurant", schema);
module.exports = Restrurant;
