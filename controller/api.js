const express = require('express');
const orderService = require('../service/orders.js');

const app = express();
const port = 3000;

app.use(express.json());

app.post('/add', async (req, res) => {
    const orderName = req.body.name;
    if (!orderName) {
        res.send('This field is mandatory!')
    }
    const order = await orderService.addOrder(orderName);
    res.send(order);
})

app.post('/remove', async (req, res) => {
    const orderId = req.body.id;
    if (!orderId) {
        res.send('This field is mandatory!')
    }
    const isDeleted = await orderService.deleteOrderById(orderId);
    if (Object.keys(isDeleted).length === 0) {
        res.send(`Order deleted with id ${orderId}`);
    } else {
        res.status(404).send('Order id not found!');
    }
})

app.get('/orders', async (req, res) => {
    const orders = await orderService.getAllOrders();
    res.send(orders);
})

app.delete('/clear', async (req, res) => {
    const isDeletedOrders = await orderService.deleteAllOrders();
    if (isDeletedOrders.length === 0) {
        res.send('All orders been clean successfully');
    } else {
        res.status(404).send('Something went wrong!');
    }
   
})

app.listen(port, () => {
    console.log(`Server listen to http://localhost:${port}`);
});
