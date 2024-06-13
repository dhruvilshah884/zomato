require('dotenv').config()
const express = require("express");
const app = express();
const mongoose = require("mongoose");
mongoose.connect(process.env.mongo_url);
const model = require("./models/user");
const restrurant = require("./models/Restrurant");
const delivery = require("./models/Delivery");
const resAdmin = require("./models/RestrurantAdmin");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const Jimp = require("jimp");
const multer = require("multer");
const stripe = require("stripe")(process.env.Stripe_Secret_Key);
const MongoStore = require('connect-mongo');

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.Session_key,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
    store: MongoStore.create({ mongoUrl: process.env.mongo_url })
  })
);
app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "restaurantLogo") {
      cb(null, "uploads/restaurantLogo/");
    } else if (file.fieldname === "restaurantPhotos") {
      cb(null, "uploads/restaurantPhotos/");
    } else if (file.fieldname === "photo") {
      cb(null, "uploads/photo/");
    } else if (file.fieldname === "proof") {
      cb(null, "uploads/proof/");
    } else if (file.fieldname === "foodImage") {
      cb(null, "uploads/foodImage/");
    } else {
      cb(null, "uploads/");
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });
app.post("/usersignup", async (req, res) => {
  try {
    const { name, email, number, password } = req.body;
    const token = jwt.sign({ email }, process.env.jwt_token, { expiresIn: "1h" });
    let user = await model({
      name,
      email,
      number,
      password,
      token,
    });
    user.token = token;
    await user.save();
    res.redirect("/login");
  } catch (error) {
    console.log(error);
  }
});

app.post(
  "/restrurantsignup",
  upload.fields([
    { name: "restaurantLogo", maxCount: 1 },
    { name: "restaurantPhotos", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const { name, email, restrurantName, address, number, password } =
        req.body;
      const token = jwt.sign({ email }, process.env.jwt_token, { expiresIn: "1h" });
      const data = await new restrurant({
        name,
        email,
        restrurantName,
        restaurantLogo: req.files["restaurantLogo"][0].path,
        address,
        number,
        restaurantPhotos: req.files["restaurantPhotos"].map(
          (photo) => photo.path
        ),
        password,
        token,
      });
      data.token = token;
      await data.save();
      req.session.restaurantId = data._id;
      res.redirect("/login");
    } catch (error) {
      console.log(error);
    }
  }
);

app.post(
  "/deliverysignup",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "proof", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { name, email, number, address, details, licence, password } =
        req.body;
      const token = jwt.sign({ email }, process.env.jwt_token, { expiresIn: "1h" });
      let data = await new delivery({
        name,
        email,
        number,
        address,
        details,
        licence,
        password,
        photo: req.files["photo"][0].path,
        proof: req.files["proof"][0].path,
      });
      data.token = token;
      await data.save();
      res.redirect("/login");
    } catch (error) {
      console.log(error);
    }
  }
);
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await model.findOne({ email, password });
    if (user) {
      const token = jwt.sign({ email }, process.env.jwt_token, { expiresIn: "1h" });
      req.session.user = user;
      req.session.userType = "user";
      req.session.token = token;
      // const redirectTo = req.session.redirectTo || "/";
      // delete req.session.redirectTo;
      return res.redirect('/');
    } else {
      let resto = await restrurant.findOne({ email, password });
      if (resto) {
        const token = jwt.sign({ email }, "hbdnasdmclkmsc", {
          expiresIn: "1h",
        });
        req.session.restaurantId = resto._id;
        req.session.userType = "restaurant";
        req.session.token = token;
        res.redirect("/restrurantAdmin");
      } else {
        let del = await delivery.findOne({ email, password });
        if (del) {
          const token = jwt.sign({ email }, "hbdnasdmclkmsc", {
            expiresIn: "1h",
          });
          req.session.user = del;
          req.session.userType = "delivery";
          req.session.token = token;
          res.redirect("/deliveryBoy");
        } else {
          res.send("invalid email id and password");
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
});

// middleware
function noCache(req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
}
app.use(noCache);
const userNameMiddleware = (req, res, next) => {

  const userName = req.session.user ? req.session.user.name : 'Guest';
  
  res.locals.userName = userName;
  next();
};

app.use(userNameMiddleware)


function RestroAuth(req, res, next) {
  if (req.session.userType === "restaurant") {
    next();
  } else {
    res.redirect("/login");
  }
}
function DeliveryAuth(req, res, next) {
  if (req.session.userType === "delivery") {
    next();
  } else {
    res.redirect("/login");
  }
}

app.get("/restrurantAdmin", RestroAuth, async (req, res) => {
  try {
    let data = await restrurant.find({});
    res.render("restrurantAdmin", { data: data });
  } catch (error) {
    console.log(error);
  }
});
app.post(
  "/restrurant",
  upload.fields([{ name: "foodImage", maxCount: 1 }]),
  async (req, res) => {
    try {
      const {
        categories,
        foodName,
        foodPrice,
        foodDescription,
        foodType,
        avelType,
      } = req.body;
      const restaurantId = req.session.restaurantId;
      if (!restaurantId) {
        return res.status(404).send("Restaurant not found");
      }
      console.log(req.body);

      const data = await new resAdmin({
        categories: categories.split(","),
        foodName,
        foodImage: req.files["foodImage"][0].path,
        foodPrice,
        foodDescription,
        foodType,
        avelType,
        restrurant: restaurantId,
      });
      await data.save();
      res.redirect("/restrurantTable");
    } catch (error) {
      console.log(error);
    }
  }
);
app.get("/restrurantTable", RestroAuth, async (req, res) => {
  try {
    const restaurantId = req.session.restaurantId;
    let restrurants = await resAdmin.find({ restrurant: restaurantId });
    console.log(restrurants);
    res.render("restrurantTable", { restrurants: restrurants });
  } catch (error) {
    console.log(error);
  }
});
app.get("/delete/:id", async (req, res) => {
  try {
    let id = req.params.id;
    let data = await resAdmin.findByIdAndDelete(id);
    res.redirect("/restrurantTable");
  } catch (error) {
    console.log(error);
  }
});
app.get("/edit/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = await resAdmin.findById(id);
    res.render("restrurantEdit", { data: data });
  } catch (error) {
    console.log(error);
  }
});
app.post(
  "/edit/:id",
  upload.fields([{ name: "foodImage", maxCount: 1 }]),
  async (req, res) => {
    try {
      const id = req.params.id;
      const categories = req.body.categories;
      const { foodName, foodPrice, foodDescription, foodType, avelType } =
        req.body;

      const updateData = {
        foodName,
        foodPrice,
        foodDescription,
        foodType,
        avelType,
      };
      if (categories) {
        updateData.categories = Array.isArray(categories)
          ? categories
          : [categories];
      }
      if (req.files["foodImage"] && req.files["foodImage"].length > 0) {
        updateData.foodImage = req.files["foodImage"][0].path;
      }
      await resAdmin.findByIdAndUpdate(id, updateData);

      res.redirect("/restrurantTable");
    } catch (error) {
      console.error(error);
      res.status(500).send("Failed to update restaurant information");
    }
  }
);
app.get("/", async (req, res) => {
  try {
    
    let restro = await restrurant.find({});
    const data = await resAdmin.find().populate("restrurant");
    res.render("index", { data: data, restro: restro });
  } catch (error) {
    console.log(error);
  }
});
app.get("/menu-listing", async (req, res) => {
  try {
    if (!req.session.user) {
      // req.session.redirectTo = req.originalUrl;
      return res.redirect("/login");
    }

    const restaurantId = req.query.restaurantId;
    const sortBy = req.query.sortBy || "";
    const searchTerm = req.query.searchTerm || "";

    let query = { restrurant: restaurantId };
    let sortOption = {};

    if (sortBy === "lowToHigh") {
      sortOption = { foodPrice: 1 };
    } else if (sortBy === "highToLow") {
      sortOption = { foodPrice: -1 };
    }

    if (searchTerm) {
      query.$or = [{ foodName: { $regex: searchTerm, $options: "i" } }];
    }

    const foodItems = await resAdmin
      .find(query)
      .sort(sortOption)
      .populate("restrurant");
    const vegItems = foodItems.filter((item) => item.foodType === "veg");
    const nonVegItems = foodItems.filter((item) => item.foodType === "nonVeg");

    const user = await model.findById(req.session.user._id).populate({
      path: "cart.product",
      model: "restrurantAdmin",
    });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const cartItems = user.cart;

    res.render("menu-listing", {
      foodItems,
      vegItems,
      nonVegItems,
      restaurantId,
      searchTerm,
      cartItems,
      cartLength: cartItems.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/deliveryboy", DeliveryAuth, (req, res) => {
  res.render("deliveryBoy");
});
app.get("/deliveryBoyDetails", RestroAuth, async (req, res) => {
  try {
    let data = await delivery.find({});
    res.render("deliveryBoyData", { data: data });
  } catch (error) {
    console.log(error);
  }
});
app.get("/restaurant-listing", async (req, res) => {
  try {
    if(!req.session.user){
      // req.session.redirectTo = req.originalUrl;
      res.redirect('/login')
    }
    let category = req.query.category;
    console.log(req.query.category);
    const sortBy = req.query.sortBy || "";
    const searchTerm = req.query.searchTerm || "";

    let sortOption = {};
    if (sortBy === "lowToHigh") {
      sortOption = { foodPrice: 1 };
    } else if (sortBy === "highToLow") {
      sortOption = { foodPrice: -1 };
    }

    let query = {};
    if (category) {
      query = { categories: { $in: [category] } };
    }
    if (searchTerm) {
      query = { foodName: { $regex: searchTerm, $options: "i" } };
    }

    let restaurants;

    if (category) {
      restaurants = await resAdmin
        .find({ categories: { $in: [category] }, ...query })
        .sort(sortOption);
      console.log(restaurants);
    } else {
      restaurants = await resAdmin.find(query);
    }

    res.render("restaurant-listing", {
      restaurants: restaurants,
      category: category,
      searchTerm: searchTerm,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error retrieving restaurant data");
  }
});
app.get("/checkout", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }
    const restaurantId = req.query.restaurantId;
    const user = await model.findById(req.session.user._id).populate({
      path: "cart.product",
      model: "restrurantAdmin",
    });
    console.log(user);

    if (!user) {
      return res.status(404).send("User not found");
    }

    const cartItems = user.cart;
    console.log(cartItems);
    res.render("checkout", { cartItems, user: user });
  } catch (error) {
    console.log(error);
  }
});
app.post("/add-to-cart", async (req, res) => {
  try {
    const { productId, restaurantId } = req.body;

    const user = await model.findById(req.session.user._id);

    if (!user) {
      res.send("user not found ");
    }

    const index = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (index !== -1) {
      user.cart[index].quantity++;
    } else {
      user.cart.push({ product: productId, quantity: 1 });
    }
    user.isPayment = false;

    await user.save();
    res.redirect(`/menu-listing?restaurantId=${restaurantId}`);
  } catch (error) {
    console.log(error);
  }
});
app.post("/increment", async (req, res) => {
  try {
    const { productId, restaurantId } = req.body;
    const user = await model.findById(req.session.user._id);

    if (!user) {
      res.send("user not found");
    }
    const cart = user.cart.find(
      (item) => item.product.toString() === productId
    );
    if (!cart) {
      res.send("cart not found");
    }
    cart.quantity++;
    await user.save();
    res.redirect(`/menu-listing?restaurantId=${restaurantId}`);
  } catch (error) {
    console.log(error);
  }
});
app.post("/decrement", async (req, res) => {
  try {
    const { productId, restaurantId } = req.body;

    const user = await model.findById(req.session.user._id);
    if (!user) {
      res.send("user not found");
    }
    const cart = user.cart.find(
      (item) => item.product.toString() === productId
    );
    if (!cart) {
      res.send("cart not found");
    }
    if (cart.quantity > 1) {
      cart.quantity--;
    }
    await user.save();
    res.redirect(`/menu-listing?restaurantId=${restaurantId}`);
  } catch (error) {
    console.log(error);
  }
});
app.post("/remove", async (req, res) => {
  try {
    const { productId, restaurantId } = req.body;
    const user = await model.findById(req.session.user._id);
    if (!user) {
      res.send("user not found");
    }
    const cartIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );
    if (cartIndex === -1) {
      return res.send("product not found in cart");
    }
    user.cart.splice(cartIndex, 1);
    await user.save();
    res.redirect(`/menu-listing?restaurantId=${restaurantId}`);
  } catch (error) {
    console.log(error);
  }
});
app.post("/asscending", async (req, res) => {
  try {
    const { productId } = req.body;
    let user = await model.findById(req.session.user._id);
    if (!user) {
      res.send("user not found");
    }
    const cart = user.cart.find(
      (item) => item.product.toString() === productId
    );
    if (cart.quantity > 1) {
      cart.quantity--;
    }
    await user.save();
    res.redirect("/checkout");
  } catch (error) {
    console.log(error);
  }
});
app.post("/descending", async (req, res) => {
  try {
    const { productId } = req.body;
    let user = await model.findById(req.session.user._id);
    if (!user) {
      res.send("user not found");
    }
    const cart = user.cart.find(
      (item) => item.product.toString() === productId
    );
    if (!cart) {
      res.send("cart not found");
    }
    cart.quantity++;
    await user.save();
    res.redirect("/checkout");
  } catch (error) {
    console.log(error);
  }
});
app.post("/delete", async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await model.findById(req.session.user._id);
    if (!user) {
      res.send("user not found");
    }
    const cart = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );
    if (cart === -1) {
      res.send("cart not found");
    }
    user.cart.splice(cart, 1);
    await user.save();
    res.redirect("/checkout");
  } catch (error) {
    console.log(error);
  }
});
app.post("/address", async (req, res) => {
  try {
    const userId = req.session.user._id;

    const newAddress = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      address: req.body.address,
      city: req.body.city,
      country: req.body.country,
      phonenumber: req.body.phonenumber,
      zip: req.body.zip,
    };
    const user = await model.findById(userId);
    if (!user) {
      res.send("user not found");
    }
    user.address.push(newAddress);
    await user.save();
    req.session.selectedAddress = newAddress;
    res.redirect("/address");
  } catch (error) {
    console.log(error);
  }
});
app.get("/address", async (req, res) => {
  try {
    if (!req.session.user) {
      req.session.redirectTo = req.originalUrl;
      res.redirect("/login");
    }
    let user = await model.findById(req.session.user._id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    res.render("address", { user: user });
  } catch (error) {
    console.log(error);
  }
});
app.post("/update-address", async (req, res) => {
  try {
    const {
      addressId,
      firstname,
      lastname,
      address,
      city,
      country,
      phonenumber,
      zip,
    } = req.body;
    const user = await model.findById(req.session.user._id);
    if (!user) {
      res.send("user not found");
    }
    const addressUpdate = user.address.id(addressId);
    addressUpdate.firstname = firstname;
    addressUpdate.lastname = lastname;
    addressUpdate.address = address;
    addressUpdate.city = city;
    addressUpdate.country = country;
    addressUpdate.phonenumber = phonenumber;
    addressUpdate.zip = zip;
    await user.save();
    res.redirect("/address");
  } catch (error) {
    console.log(error);
  }
});
app.get("/payment", async (req, res) => {
  try {
    if (!req.session.user) {
      req.session.redirectTo = req.originalUrl;
      res.redirect("/login");
    }
    const user = await model.findById(req.session.user._id);

    if (!user) {
      return res.status(404).send("User not found");
    }

    if (user.address.length === 0) {
      return res.redirect("/address");
    }

    const cartItems = await Promise.all(
      user.cart.map(async (item) => {
        const product = await resAdmin.findById(item.product);
        return {
          ...item._doc,
          product: product,
        };
      })
    );
    const address = req.session.selectedAddress;
    res.render("payment", { user, cartItems, address, req });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});
app.post("/payment", (req, res) => {
  req.session.selectedAddress = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    address: req.body.address,
    city: req.body.city,
    country: req.body.country,
    zip: req.body.zip,
    phonenumber: req.body.phonenumber,
  };
  res.redirect("/payment");
});
app.post("/process-payment", async (req, res) => {
  try {
    let { userEmail, publisherKey, cartPrice } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Zomo",
            },
            unit_amount: cartPrice * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "http://localhost:5000/payment-success",
      cancel_url: "http://localhost:5000/payment-fail",
      customer_email: userEmail,
      metadata: {
        publisher_key: publisherKey,
      },
    });
    req.session.userEmail = userEmail;
    res.redirect(session.url);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/payment-success", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }
    const user = await model.findById(req.session.user._id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    user.isPayment = true;
    await user.save();
    res.redirect("/confirm-order");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/payment-fail", (req, res) => {
  res.redirect("/payment");
});

app.get("/confirm-order", async (req, res) => {
  try {
    if (!req.session.user) {
      req.session.redirectTo = req.originalUrl;
      return res.redirect("/login");
    }

    const user = await model.findById(req.session.user._id);
    if (!user) {
      return res.status(404).send("User not found");
    }

    if (!user.isPayment) {
      return res.redirect("/payment");
    }

    const cartItems = await Promise.all(
      user.cart.map(async (item) => {
        const product = await resAdmin.findById(item.product);
        return {
          ...item._doc,
          product: product,
        };
      })
    );

    const selectedAddress = req.session.selectedAddress;
    const userEmail = req.session.userEmail;

    user.orders.push({
      items: user.cart,
      address: selectedAddress,
    });

    await model.findOneAndUpdate(
      { email: userEmail },
      { isPayment: true, cart: [] }
    );
    await user.save();

    return res.render("confirm-order", {
      user,
      cartItems,
      address: selectedAddress,
      req,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
});

app.get("/my-order", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }

    const user = await model.findById(req.session.user._id).populate({
      path: "orders.items.product",
      populate: {
        path: "restrurant",
        model: "restrurant",
      },
    });

    if (!user) {
      return res.status(404).send("User not found");
    }

    const getImageUrl = (name) => {
      return `/profile-image/${encodeURIComponent(name)}`;
    };
    const profileImage = getImageUrl(user.name);
    console.log(profileImage, "profileImage URL");

    const selectedAddress = req.session.selectedAddress || "Default Address";

    const reversedOrders = user.orders.reverse();

    res.render("my-order", {
      user,
      orders: reversedOrders,
      selectedAddress,
      profileImage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

app.get("/profile-image/:name", async (req, res) => {
  try {
    const name = req.params.name;
    const initials = name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();

    const image = new Jimp(100, 100, 0x000000ff);

    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    image.print(
      font,
      0,
      0,
      {
        text: initials,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
      },
      100,
      100
    );

    image.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
      if (err) {
        res.status(500).send("Error generating image");
      } else {
        res.set("Content-Type", Jimp.MIME_PNG);
        res.send(buffer);
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});
app.post("/saved-address", async (req, res) => {
  try {
    const userId = req.session.user._id;

    const newAddress = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      address: req.body.address,
      city: req.body.city,
      country: req.body.country,
      phonenumber: req.body.phonenumber,
      zip: req.body.zip,
    };
    const user = await model.findById(userId);
    if (!user) {
      res.send("user not found");
    }
    user.address.push(newAddress);
    await user.save();
    console.log(user);
    req.session.selectedAddress = newAddress;
    res.redirect("/saved-address");
  } catch (error) {
    console.log(error);
  }
});
app.get("/saved-address", async (req, res) => {
  try {
    if (!req.session.user) {
      res.redirect("/login");
    }
    const user = await model.findById(req.session.user._id);
    if (!user) {
      res.send("user not found");
    }
    const getImageUrl = (name) => {
      return `/profile-image/${encodeURIComponent(name)}`;
    };
    const profileImage = getImageUrl(user.name);
    console.log(profileImage, "profileImage URL");
    res.render("saved-address", { user, profileImage });
  } catch (error) {
    console.error(error);
  }
});
app.post("/saved-update-address", async (req, res) => {
  try {
    const {
      addressId,
      firstname,
      lastname,
      address,
      city,
      country,
      phonenumber,
      zip,
    } = req.body;
    const user = await model.findById(req.session.user._id);
    if (!user) {
      res.send("user not found");
    }
    const addressUpdate = user.address.id(addressId);
    addressUpdate.firstname = firstname;
    addressUpdate.lastname = lastname;
    addressUpdate.address = address;
    addressUpdate.city = city;
    addressUpdate.country = country;
    addressUpdate.phonenumber = phonenumber;
    addressUpdate.zip = zip;
    req.session.selectedAddress = newAddress;

    await user.save();
    res.redirect("/saved-address");
  } catch (error) {
    console.log(error);
  }
});
app.get("/profile", async (req, res) => {
  try {
    if (!req.session.user) {
      req.session.redirectTo = req.originalUrl;
      res.redirect("/login");
    }
    const id = req.session.user._id;
    const user = await model.findById(id);
    const getImageUrl = (name) => {
      return `/profile-image/${encodeURIComponent(name)}`;
    };
    const profileImage = getImageUrl(user.name);
    console.log(profileImage, "profileImage URL");
    res.render("profile", { user , profileImage });
  } catch (error) {
    console.log(error);
  }
});
app.post('/edit-data',async(req,res)=>{
  try{
    const id = req.session.user._id;
    const {name,email,number,password} = req.body
    let data = await model.findByIdAndUpdate(id,{name,email,number,password})
    await data.save();
    res.redirect('/profile')
  }catch(error){
    console.log(error)
  }
})
app.get('/about',(req,res)=>{
  res.render('about')
})
app.get('/blog-details',(req,res)=>{
  res.render('blog-details')
})
app.get('/blog-grid-left-sidebar',(req,res)=>{
  res.render('blog-grid-left-sidebar')
})
app.get('/blog-grid-right-sidebar',(req,res)=>{
  res.render('blog-grid-right-sidebar')
})
app.get('/coming-soon',(req,res)=>{
  res.render('coming-soon')
})
app.get('/blog-list',(req,res)=>{
  res.render('blog-list')
})
app.get('/contact',(req,res)=>{
  res.render('contact')
})
app.get('/empty-cart',(req,res)=>{
  res.render('empty-cart')
})
app.get('/faq',(req,res)=>{
  res.render('faq')
})
app.get('/menu-grid',(req,res)=>{
  res.render('menu-grid')
})
app.get('/offer',(req,res)=>{
  res.render('offer')
})
app.get('/order-tracking',(req,res)=>{
  res.render('order-tracking')
})
app.get('/otp',(req,res)=>{
  res.render('otp')
})
app.get('/setting',(req,res)=>{
  res.render('setting')
})
app.get('/login',(req,res)=>{
  res.render('login')
})
app.get('/signup',(req,res)=>{
  res.render('signup')
})
app.get('/testimonial',(req,res)=>{
  res.render('testimonial')
})
app.get('/wishlist',(req,res)=>{
  res.render('wishlist')
})
app.get('/restrurantSignup',(req,res)=>{
  res.render('restrurantSignup')
})
app.get('/deliverySignup',(req,res)=>{
  res.render('deliverySignup')
})
app.get('/saved-card',(req,res)=>{
  res.render('saved-card')
})
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error logging out");
    }
    res.redirect("/login"); 
  });
});
app.listen(process.env.PORT, () => {
  console.log("connected");
});
