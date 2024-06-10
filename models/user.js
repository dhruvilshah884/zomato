const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    firstname: { type: String },
    lastname: { type: String },
    address: { type: String },
    city: { type: String },
    country: { type: String },
    phonenumber: { type: String },
    zip: { type: String }
});

const orderSchema = new mongoose.Schema({
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: "restrurantAdmin" },
        quantity: { type: Number }
    }],
    date: { type: Date, default: Date.now },
    address: addressSchema
});

const schema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    number: { type: Number, required: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" },
    token: { type: String },
    cart: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: "restrurantAdmin" },
        quantity: { type: Number, default: 1 }
    }],
    address: [addressSchema],
    isPayment: { type: Boolean, default: false },
    orders: [orderSchema]
});

const UserModel = mongoose.model("user", schema);
module.exports = UserModel;
