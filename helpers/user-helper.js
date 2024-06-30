const db = require("../DBconfig/connection");
const collections = require("../DBconfig/collections");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const Razorpay = require("razorpay");
const envConstants=require('../envConstants');

const instance = new Razorpay({
  key_id:envConstants.razor_key_id,
  key_secret:envConstants.razor_key_secret,
});
module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.Password = await bcrypt.hash(userData.Password, 10);
      db.get()
        .collection(collections.USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          resolve(data.insertedId);
          // console.log(data.insertedId)
        });
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let status = false;
      let response = {};
      // console.log(userData);
      let user = await db
        .get()
        .collection(collections.USER_COLLECTION)
        .findOne({ Email: userData.Email });
      // console.log(user)
      if (user) {
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
            // console.log("login Success::"+status)
            response.user = user;
            response.status = status;
            resolve(response);
          } else {
            console.log("login Failure");
            resolve({ status: false });
          }
        });
      } else {
        console.log("user not exist");
        resolve({ status: false });
      }
    });
  },

  addToCart: (proId, userId) => {
    // console.log(proId)
    let productObj = {
      item: ObjectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      // console.log(userCart)
      if (userCart) {
        let productExist = userCart.products.findIndex(
          (product) => product.item == proId
        );
        // console.log(productExist)
        if (productExist != -1) {
          db.get()
            .collection(collections.CART_COLLECTION)
            .updateOne(
              { user: ObjectId(userId), "products.item": ObjectId(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => resolve());
        } else {
          db.get()
            .collection(collections.CART_COLLECTION)
            .updateOne(
              { user: ObjectId(userId) },
              {
                $push: {
                  products: productObj,
                },
              }
            )
            .then((response) => resolve());
        }
      } else {
        let cartObj = {
          user: ObjectId(userId),
          products: [productObj],
        };
        db.get()
          .collection(collections.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },
  getCartItem: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collections.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      // console.log(cartItems)
      resolve(cartItems);
    });
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      let count = 0;
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
  changeProductCount: (details) => {
    details.count = parseInt(details.count);
    quantity = parseInt(details.quantity);
    return new Promise((resolve, reject) => {
      if (details.count == -1 && quantity == 1) {
        db.get()
          .collection(collections.CART_COLLECTION)
          .updateOne(
            { _id: ObjectId(details.cart) },
            {
              $pull: { products: { item: ObjectId(details.product) } },
            }
          )
          .then(() => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collections.CART_COLLECTION)
          .updateOne(
            {
              _id: ObjectId(details.cart),
              "products.item": ObjectId(details.product),
            },
            {
              $inc: { "products.$.quantity": details.count },
            }
          )
          .then(() => {
            resolve({ status: true });
          });
      }
    });
  },
  getTotalAmount: (userId) => {
    // console.log(userId)
    return new Promise(async (resolve, reject) => {
      let total = await db.get().collection(collections.CART_COLLECTION).aggregate([
        {
          $match: { user: ObjectId(userId) },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            item: "$products.item",
            quantity: "$products.quantity",
          },
        },
        {
          $lookup: {
            from: collections.PRODUCT_COLLECTION,
            localField: "item",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            price: "$product.price",
          },
        },
        {
          $unwind: "$price",
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: { $multiply: ["$quantity", { $toInt: "$price" }] },
            },
          },
        },
      ]).toArray();
      console.log("total:", total)
      // price:{ $arrayElemAt: [ "$product", 0 ]
      if (total.length == 0 || total.length == null) {
        // console.log("inside if userhelper");
        reject("error in server");
      } else {
        resolve(total[0].total);
      }
    });
  },
  removeProduct: (proId, cartId) => {
    console.log(proId, cartId);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.CART_COLLECTION)
        .update(
          { _id: ObjectId(cartId) },
          {
            $pull: {
              products: {
                item: ObjectId(proId),
              },
            },
          }
        )
        .then((response) => {
          console.log(response);
          resolve(response);
        });
      resolve();
    });
  },
  placeOrder: (order, products, total) => {
    return new Promise((resolve, reject) => {
      let status = order.payment === "COD" ? "Placed" : "Pending";
      // let date =
      // date = date.toDateString()
      let orderObj = {
        deliveryDetails: {
          mobile: order.phone,
          address: order.address,
          pincode: order.pincode,
        },
        total: total,
        user: ObjectId(order.userId),
        products: products,
        paymentMehode: order.payment,
        date: new Date(),
        status: status,
      };
      db.get()
        .collection(collections.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collections.CART_COLLECTION)
            .deleteOne({ user: ObjectId(order.userId) });
          console.log("haah", response);
          resolve(response.insertedId);
        });
    });
  },
  getCartProductList: (userId) => {
    // return new Promise(async (resolve, reject) => {
    //   let cart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: ObjectId(userId) });
    //   console.log(cart.products);
    //   resolve(cart.products);
    // });
  },
  getUserOrder: (userId) => {
    return new Promise(async (resolve, reject) => {
      let order = await db.get().collection(collections.ORDER_COLLECTION).find({ user: ObjectId(userId) })
        .toArray();
      // console.log(order);
      resolve(order);
    });
  },
  getOrderProduct: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderItem = await db
        .get()
        .collection(collections.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: ObjectId(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collections.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      // console.log(orderItem)
      resolve(orderItem);
    });
  },
  genarateRzorpay: (orderId, total) => {
    return new Promise(async (resolve, reject) => {
      let options = await {
        amount: total*100,
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, (err, order) => {
        if (err) {
          console.error(err);
        } else {
          console.log("razpay:" + JSON.stringify(order));
          resolve(order)
        }
      })
    });
  },
  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', 'ceqXADhVCVC7T2m2E3BDhaf3');
      hmac.update(details['payment[razorpay_order_id]'] + "|" + details['payment[razorpay_payment_id]']);
      let generatedSignature = hmac.digest('hex');
      if (generatedSignature == details['payment[razorpay_signature]']) {
        resolve()
      } else {
        reject()
      }
    })
  },
  changeOrderPaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(collections.ORDER_COLLECTION)
        .updateOne({ _id: ObjectId(orderId) },
          {
            $set: {
              status: 'placed'
            }
          }).then(()=>{
            resolve()
          })
    })

  }
};
