var express = require('express');
var router = express.Router();

var productHelper = require('../helpers/product-helper')



/* GET users listing. */
router.get('/', function (req, res, next) {
  productHelper.getAllProducts().then((products) => {
    // console.log(products)
    res.render('admin/view-product', { admin: true, products });

  })
  // res.render('admin/view-product', { admin: true });
});
router.get('/add-product', function (req, res) {
  res.render('admin/add-product', { admin: true })
});


router.post('/add-product', (req, res) => {

  productHelper.addProdect(req.body).then((id) => {
    let img = req.files.img
    img.mv('./public/images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.render('admin/add-product', { admin: true })
      } else {
        console.log(err)
      }

    })
  })
})
router.get('/product-delete/:id', (req, res) => {
  let proId = req.params.id
  productHelper.deleteProduct(proId).then((result) => {
    res.redirect('/admin')
  })
})

router.get('/edit-product/:id', async (req, res) => {
  let product = await productHelper.getProductDetails(req.params.id)
  // console.log(product)
  res.render('admin/edit-product', { admin: true, product })
})

router.post('/edit-product/:id', (req, res) => {
  // console.log("in update")
  productHelper.editProduct(req.params.id, req.body).then(() => {
    let img = req.files.img
    res.redirect('/admin')
    if (img) {
      img.mv('./public/images/' + req.params.id + '.jpg')
    }
  })
})

module.exports = router;
