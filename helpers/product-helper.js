const db = require('../DBconfig/connection')
const collections = require('../DBconfig/collections');
const { ObjectId } = require('mongodb');
module.exports = {
    addProdect: (product) => {
        // console.log(product)
        return new Promise(async (resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).insertOne(product).then((data) => {
                // console.log(product[0].name)
                resolve(data.insertedId)
            })

        })
        // db.get().collection(collections.PRODUCT_COLLECTION).insertOne(product).then((data) => {
        //     callback(data.insertedId)
        //     // id=data.insertedId
        //     // console.log(db.id(data.insertedId))
        // });
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let product = db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
            // console.log(product[0].name)
            resolve(product)

        })
    },
    deleteProduct: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({ _id: ObjectId(id) }).then((result) => {
                resolve(result)
            })
        })
    },
    getProductDetails: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({ _id: ObjectId(id) }).then((product) => {
                resolve(product)
            })
        })
    },
    editProduct: (id, products) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).update({ _id: ObjectId(id) },
                {
                    $set: {
                        name: products.name,
                        category: products.category,
                        price: products.price,
                        description: products.description
                    }
                }).then((response) => {
                    resolve()
                })
        })
    }
}