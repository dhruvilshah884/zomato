// app.post('/restrurant', upload.fields([
//     { name: 'restaurantLogo', maxCount: 1 }, 
//     { name: 'foodImage', maxCount: 1 }, 
//     { name: 'restaurantPhotos', maxCount: 5 } 
//   ]), async (req, res) => {
//     try {
//       const {
//         ownerName,
//         restaurantName,
//         restaurantEmail,
//         restaurantPhoneNumber,
//         restaurantAddress,
//         categories,
//         foodName,
//         foodPrice,
//         foodDescription,
//         foodType
//       } = req.body;
  
//       const restaurant = new Restaurant({
//         ownerName,
//         restaurantName,
//         restaurantEmail,
//         restaurantPhoneNumber,
//         restaurantAddress,
//         categories: categories.split(','), 
//         restaurantLogo: req.files['restaurantLogo'][0].path, 
//         foodName,
//         foodImage: req.files['foodImage'][0].path,
//         foodPrice,
//         foodDescription,
//         foodType,
//         restaurantPhotos: req.files['restaurantPhotos'].map(photo => photo.path) 
//       });
  
//       await restaurant.save();
//       res.redirect('/restrurantTable')
//     } catch (error) {
//       console.error(error);
//       res.status(500).send('Failed to create restaurant');
//     }
//   });
//   app.get('/restrurantTable',async(req,res)=>{
//     try {
//       const restrurants =await Restaurant.find({})
//       res.render('restrurantTable',{restrurants:restrurants})
//     } catch (error) {
//       console.error(error);
//         res.status(500).send('Failed to fetch restaurants');
//     }
//   })

//   app.get('/delete/:id',async(req,res)=>{
//     try {
//       let id = req.params.id;
//       let data = await Restaurant.findByIdAndDelete(id)
//       res.redirect('/restrurantTable')
//     } catch (error) {
      
//     }
//   })
//   app.get('/edit/:id',async(req,res)=>{
//     try {
//       let id = req.params.id;
//       let data = await Restaurant.findById(id);
//       res.render('restrurantEdit',{data:data})
//     } catch (error) {
//       console.log(error);
//     }
//   })

//   app.post('/edit/:id', upload.fields([
//     { name: 'restaurantLogo', maxCount: 1 },
//     { name: 'foodImage', maxCount: 1 },
//     { name: 'restaurantPhotos', maxCount: 5 }
// ]), async (req, res) => {
//     try {
//         const id = req.params.id;
//         const {
//             ownerName,
//             restaurantName,
//             restaurantEmail,
//             restaurantPhoneNumber,
//             restaurantAddress,
//             categories,
//             foodName,
//             foodPrice,
//             foodDescription,
//             foodType
//         } = req.body;

//         const updateData = {
//             ownerName,
//             restaurantName,
//             restaurantEmail,
//             restaurantPhoneNumber,
//             restaurantAddress,
//             categories: categories.split(','),
//             foodName,
//             foodPrice,
//             foodDescription,
//             foodType
//         };

       
//         if (req.files['restaurantLogo'] && req.files['restaurantLogo'].length > 0) {
//             updateData.restaurantLogo = req.files['restaurantLogo'][0].path;
//         }

        
//         if (req.files['foodImage'] && req.files['foodImage'].length > 0) {
//             updateData.foodImage = req.files['foodImage'][0].path;
//         }

        
//         if (req.files['restaurantPhotos'] && req.files['restaurantPhotos'].length > 0) {
//             updateData.restaurantPhotos = req.files['restaurantPhotos'].map(photo => photo.path);
//         }

      
//         await Restaurant.findByIdAndUpdate(id, updateData);

        
//         res.redirect('/restrurantTable');
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Failed to update restaurant information');
//     }
// });


const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const restaurantSchema = new Schema({
    ownerName: { type: String, required: true },
    restaurantName: { type: String, required: true },
    restaurantEmail: { type: String, required: true },
    restaurantPhoneNumber: { type: String, required: true },
    restaurantAddress: { type: String, required: true },
    categories: [{ type: String }],
    restaurantLogo: { type: String }, 
    foodName: { type: String },
    foodImage: { type: String }, 
    foodPrice: { type: Number },
    foodDescription: { type: String },
    foodType: { type: String, enum: ['veg', 'nonVeg'] },
    restaurantPhotos: [{ type: String }] 
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;



// // Rest of your code remains unchanged



   <div class="theme-arrow">
                <div class="swiper brands-logo">
                    <div class="swiper-wrapper">
                        <% 
                        if (data.length > 0) {
                            // Render HTML for the first item only
                        %>
                        <div class="swiper-slide">
                            <div class="brand-box">
                                <a href="menu-listing" class="food-brands">
                                    <!-- You might want to display the logo corresponding to the first category -->
                                    <!-- You'll need to find the corresponding item in the 'data' array -->
                                    <!-- For now, I'm assuming you want to display a generic logo -->
                                    <img class="img-fluid brand-img" src="<%=item.restrurant.restaurantLogo%>" alt="reslogo">
                                </a>
                                <a href="menu-listing">
                                    <h4><%=item.categories%><</h4>
                                </a>
                            </div>
                        </div>
                        <% 
                        }
                        %>
                    </div>
                </div>
                <div class="swiper-button-next brand-next"></div>
                <div class="swiper-button-prev brand-prev"></div>
            </div>






            veg data
            <%vegItems.forEach((item)=>{%>
                                                    <div id="item-2">
                                                        <div class="product-details-box">
                                                            <div class="product-img">
                                                                <img class="img-fluid img"
                                                                    src="<%=item.foodImage%>" alt="rp1">
                                                            </div>
                                                            <div class="product-content">
                                                                <div
                                                                    class="description d-flex align-items-center justify-content-between">
                                                                    <div>
                                                                        <div class="d-flex align-items-center gap-2">
                                                                            <img class="img-fluid"
                                                                                src="/assets/images/svg/<%= item.foodType === 'veg' ? 'veg.svg' : 'nonveg.svg' %>" alt="<%= item.foodType === 'veg' ? 'vegetarian' : 'non-vegetarian' %>"
                                                                                alt="non-veg">
                                                                            <h6 class="product-name">
                                                                                <%=item.foodName%>
                                                                            </h6>
                                                                            
                                                                        </div>
                                                                       
                                                                        <p>
                                                                            <%=item.foodDescription%>
                                                                        </p>
                                                                    </div>
                                                                    <div class="product-box-price">
                                                                        <h2 class="theme-color fw-semibold">
                                                                           <%=item.foodPrice%>
                                                                        </h2>
                                                                        <a href="#customized"
                                                                            class="btn theme-outline add-btn mt-0"
                                                                            data-bs-toggle="modal">+Add</a>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <% })%>





                                                    non veg
                                                    
                                                    <%nonVegItems.forEach((item)=>{%>
                                                        <div id="item-2">
                                                            <div class="product-details-box">
                                                                <div class="product-img">
                                                                    <img class="img-fluid img"
                                                                        src="<%=item.foodImage%>" alt="rp1">
                                                                </div>
                                                                <div class="product-content">
                                                                    <div
                                                                        class="description d-flex align-items-center justify-content-between">
                                                                        <div>
                                                                            <div class="d-flex align-items-center gap-2">
                                                                                <img class="img-fluid"
                                                                                    src="/assets/images/svg/<%= item.foodType === 'veg' ? 'veg.svg' : 'nonveg.svg' %>" alt="<%= item.foodType === 'veg' ? 'vegetarian' : 'non-vegetarian' %>"
                                                                                    alt="non-veg">
                                                                                <h6 class="product-name">
                                                                                    <%=item.foodName%>
                                                                                </h6>
                                                                                
                                                                            </div>
                                                                           
                                                                            <p>
                                                                                <%=item.foodDescription%>
                                                                            </p>
                                                                        </div>
                                                                        <div class="product-box-price">
                                                                            <h2 class="theme-color fw-semibold">
                                                                               <%=item.foodPrice%>
                                                                            </h2>
                                                                            <a href="#customized"
                                                                                class="btn theme-outline add-btn mt-0"
                                                                                data-bs-toggle="modal">+Add</a>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <% })%>


                                                         <div class="col-md-6">
                                  <div class="address-box new-address-box">
                                    <a href="#address-details" class="btn theme-outline rounded-2" data-bs-toggle="modal">Add New Address</a>
                                  </div>
                                </div>


                            {
  "_id": {
    "$oid": "664de6044178411b9e7773c1"
  },
  "name": "user",
  "email": "user123@gmail.com",
  "number": 9099090990,
  "password": "1",
  "role": "user",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXIxMjNAZ21haWwuY29tIiwiaWF0IjoxNzE2MzgxMTg4LCJleHAiOjE3MTYzODQ3ODh9.jEZH05pmOCvjNIaPwZG7GprQqPHrRCVV6oOiFwlQTv4",
  "isPayment": true,
  "cart": [],
  "address": [
    {
      "firstname": "dhruvil",
      "lastname": "patel",
      "address": "dharm residancy",
      "city": "Ahmedaba",
      "country": "India",
      "phonenumber": "07069456055",
      "zip": "382445",
      "_id": {
        "$oid": "664de6364178411b9e7773e6"
      }
    }
  ],
  "orders": [
    {
      "items": [
        {
          "product": {
            "$oid": "6641eb7e5d6253f42e5e8c3a"
          },
          "quantity": 1,
          "_id": {
            "$oid": "664de6184178411b9e7773cb"
          }
        },
        {
          "product": {
            "$oid": "6641ec055d6253f42e5e8c42"
          },
          "quantity": 1,
          "_id": {
            "$oid": "664de61a4178411b9e7773d4"
          }
        }
      ],
      "_id": {
        "$oid": "664de6504178411b9e7773fd"
      },
      "date": {
        "$date": "2024-05-22T12:34:24.341Z"
      }
    }
  ],
  "__v": 4
}



