const express = require('express');
const { response } = require('../app');
const router = express.Router();
const productHelper = require('../helpers/product-helper')
const userHelper = require('../helpers/user-helper');
const envConstants = require('../envConstants');

const verifyLogin = (req, res, next) => {
  if (req.session.loggIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

const getCount = async (user) => {
  return await userHelper.getCartCount(user._id)
  // next()
}



/* GET home page. */
router.get('/', async (req, res, next) => {

  let user = req.session.user
  let cartCound = null
  if (user) {
    cartCound = await getCount(user)
    // console.log(cartCound);
  }
  productHelper.getAllProducts().then((products) => {
    // console.log(products)
    res.render('user/user-prodectview', { products, user, cartCound });
  })
});

router.get('/login', (req, res, next) => {
  if (req.session.loggIn) {
    res.redirect('/')
  } else {

    res.render('user/login', { LoginError: req.session.loginError })
    req.session.loginError = false
  }
})
router.get('/signup', (req, res, next) => {
  res.render('user/signup')
})
router.post('/signup', (req, res, next) => {
  userHelper.doSignup(req.body).then((response) => {
    // res.send("Success")
    // console.log(response)
    req.session.signUp = true
    req.session.user = response
    res.redirect('/login')

  })

})
router.post('/login', (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggIn = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      req.session.loginError = true
      res.redirect('/login')
    }
  })
})



router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})

router.get('/cart', verifyLogin, async (req, res) => {
  let user = req.session.user
  let myCart = await userHelper.getCartItem(user._id)
  // todiaplay when page load 
  let total = 0
  // console.log(total);
  if (myCart.length > 0) {
    total = await userHelper.getTotalAmount(user._id)
    // res.render('user/cart', { user, total })
  }
  // console.log(myCart)
  res.render('user/cart', { user, myCart, total })

})

router.get('/addtocart/:id', (req, res) => {
  // console.log("api call")
  userHelper.addToCart(req.params.id, req.session.user._id).then(() => {
    // res.redirect('/')
    res.json({ status: true })
  })
})
router.post('/change-product-count', (req, res) => {
  // console.log(req.body)
  userHelper.changeProductCount(req.body).then(async (response) => {
    // console.log(req.session.user._id)
    // console.log(response)
    response.total = await userHelper.getTotalAmount(req.session.user._id)
    // console.log(response.total)
    res.json(response)
  })
})

router.get('/place-order', verifyLogin, async (req, res) => {
  // let user=req.session.user._id
  // console.log(req.session.user._id);
  let total = await userHelper.getTotalAmount(req.session.user._id)
  // console.log(t otal)
  res.render('user/place-order', { user: req.session.user, total,razorKeyId:envConstants.razorKeyId })
})

router.get('/removeCart/:id', verifyLogin, (req, res) => {
  console.log(req.params.id)
  userHelper.removeProduct(req.body).then((response) => {
    console.log(response)
    res.render('user/cart')
  })
})
router.post('/place-order', async (req, res) => {
  let product = await userHelper.getCartProductList(req.body.userId)
  let total = await userHelper.getTotalAmount(req.body.userId)
  userHelper.placeOrder(req.body, product, total).then((result) => {
    res.json({ status: true })
  })
  // console.log(req.body)

})

router.get('/view-myorders', verifyLogin, (req, res) => {
  res.render('user/view-myorders', { user: req.session.user })
})
router.get('/myorder', verifyLogin, async (req, res) => {
  let orders = await userHelper.getUserOrder(req.session.user._id)
  console.log(orders)
  res.render('user/myorder', { orders, user: req.session.user })
})
router.get('/vieworders/:id', verifyLogin, async (req, res) => {
  // console.log(req.params.id)
  let orderProducts = await userHelper.getOrderProduct(req.params.id)
  res.render('user/vieworders', { orderProducts, user: req.session.user })
})
module.exports = router;
