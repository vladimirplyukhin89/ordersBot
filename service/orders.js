const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const orderService = require("./orders");
const filePath = path.join(__dirname, `../orders.json`);
const { handleError } = require('../utils/handleError');

async function getAllOrders() {
   try {
       return JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
   } catch (err) {
       console.error('Error: ', err);
       return handleError(err.status, err.message);
   }
}

async function addOrder(orderName) {
    try {
        const orders = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
        orders.find(order => {
            if (order.name === orderName) {
                return handleError(400, 'This name exists already');
            }
        });
        const newOrder = {
            id: uuidv4(),
            name: orderName,
            date: new Date().toISOString()
        };
        orders.push(newOrder);
        await fs.promises.writeFile(filePath, JSON.stringify(orders, null, 2), 'utf-8');
        return newOrder;
    } catch (err) {
        console.error('Error: ', err.message);
        handleError(err.status, `Error adding order: ${err.message}`);
    }
}

async function deleteAllOrders() {
    try {
        let orders = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
        const deletedOrdersLength = orders.length;
        if (deletedOrdersLength === 0) {
            return 0;
        }
        
        orders.length = 0
        await fs.promises.writeFile(filePath, JSON.stringify(orders, null, 2));
        return deletedOrdersLength;
    } catch (err) {
        console.error('Error: ', err.message);
        handleError(err.status, err.message);
    }
}

async function deleteOrderById(id) {
    try {
        let orders = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
        const initialLength = orders.length;
        const deletedOrder = orders.find(order => order.id === id);
        orders = orders.filter(order => order.id !== id);
        
        if (initialLength === orders.length) {
            return false;
        }
        await fs.promises.writeFile(filePath, JSON.stringify(orders, null, 2));
        return deletedOrder;
    } catch (err) {
        console.error('Error: ', err);
        handleError(err.status, `Error deleting order: ${err.message}`);
    }
}

module.exports = { getAllOrders, deleteAllOrders, addOrder, deleteOrderById }
