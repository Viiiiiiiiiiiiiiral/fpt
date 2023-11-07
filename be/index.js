var express = require('express');
const { v4: uuidv4 } = require('uuid');
const NodeCache = require( "node-cache" );
var bodyParser = require('body-parser');
var cors = require('cors');

var app = express();


app.use(cors());

const myCache = new NodeCache();
var jsonParser = bodyParser.json();

app.get('/products', async (req, res) => {
    const checkProduct = await myCache.get('product')
    if (!checkProduct) {
        await myCache.set('product', [
            {
                'ID': 1,
                'Name': 'Cookies',
                'Price': '$2.99',
            },
            {
                'ID': 2,
                'Name': 'Bread',
                'Price': '$2.00',
            },
            {
                'ID': 3,
                'Name': 'Orange Juice',
                'Price': '$5.00',
            },
        ]);
    }
    const products = await myCache.get('product');
    res.send(products);
});

app.post('/products', jsonParser, async (req, res) => {
    const { name, price } = req.body;
    const products = await myCache.get('product') || [];
    const checkID = [];
    products.forEach((element) => {
        checkID.push(element.ID);
    });
    const ID = checkID.length > 0 ? Math.max(...checkID) + 1 : 1;
    products.push({
        'ID': ID,
        'Name': name,
        'Price': price,
    })
    await myCache.set('product', products);
    res.send(
        {
            'ID': ID,
            'Name': name,
            'Price': price,
        }
    );
});

app.post('/orders', jsonParser, async (req, res) => {
    const productList = req.body.product;
    const products = await myCache.get('product');
    const orders = await myCache.get('order') || [];
    
    if (!productList || !productList.length || !products) {
        res.send('ERROR')
    }
    const productInfo = [];
    let totalPrice = 0;
    productList.forEach((e) => {
        const foundProduct = products.find((v) => v.ID == e.ID);
        if (foundProduct && e.quantity) {
            totalPrice += Number(foundProduct.Price.split('$')[1]) * Number(e.quantity);
            productInfo.push({
                Quantity: e.quantity,
                product: foundProduct,
            })
        };
    });
    const id = uuidv4();
    orders.push({
        'ID': id,
        'Product': productInfo,
        'Total': '$' + totalPrice,
    })
    await myCache.set('order', orders);
    console.log(orders)
    res.send({
        'ID': id,
        'Product': productInfo,
        'Total': '$' + totalPrice,
    })
})

app.listen(3001, function () {
    console.log('App listening on port 3001!');
});