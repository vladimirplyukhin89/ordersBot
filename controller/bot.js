const TelegramBot = require('node-telegram-bot-api');
const botAPI = require('../constants/botAPI');
const orderService = require("../service/orders");
const orderStates = new Map();

const bot = new TelegramBot(botAPI.token, { polling: true });

const commands = ['/get_orders', '/add_order', '/delete_by_id', '/cancel_command', '/delete_orders', '/start', '/info'];

// For commands in burger button
const setupMenu = async () => {
    try {
        await bot.setMyCommands([
            { command: 'start', description: 'start the bot' },
            { command: 'info', description: 'Get some information: this is a CRUD bot for testing logic for orders' },
            { command: 'get_orders', description: 'Get all orders' },
            { command: 'add_order', description: 'Add a new order' },
            { command: 'delete_by_id', description: 'Delete order by ID' },
            { command: 'delete_orders', description: 'Delete all orders' },
            { command: 'cancel_command', description: 'Cancel process. Use only during add or delete order' },
        ]);
        
    } catch (err) {
        console.error('Failed to add commands with error', err.message);
    }
};

setupMenu();

bot.on('message', async (msg) => {
    if (msg.from.is_bot) return;
    if (!msg.text) return;
    
    const chatId = msg.chat.id;
    const state = orderStates.get(chatId);
    const text = msg.text?.trim();
    
    const isCommand = commands.includes(text.toLowerCase());
    
    if (isCommand) {
        if (text === '/start') {
            await bot.sendMessage(chatId, 'Welcome to the bot! Enter /info');
        }
        
        if (text === '/info') {
            await bot.sendMessage(chatId, `This is tutorial CRUD bot for testing orders. \nYour options are: \n${
                commands
                    .map(cmd => cmd.toLowerCase())
                    .join('\n')}`);
        }
        
        if (text === '/cancel_command') {
            orderStates.delete(chatId);
            await bot.sendMessage(chatId, 'You cancelled process.');
        }
    } else if (state) {
        // For adding order
        if (state?.waitingForOrderName) {
            orderStates.delete(chatId);
            
            if (!text || text.length === 0) {
                await bot.sendMessage(chatId, 'The name is mandatory.');
                return;
            }
            
            try {
                const order = await orderService.addOrder(text);
                await bot.sendMessage(chatId,
                    `Order ${order.name} with ID ${order.id} successfully added.`);
            } catch (err) {
                console.error(err);
                await bot.sendMessage(chatId, `Failed to add order with error ${err.message}`);
            }
        }
        
        // For deleting order
        if (state?.waitingForOrderId) {
            orderStates.delete(chatId);
            const orderId = text;
            if (!orderId || orderId.trim().length === 0) {
                await bot.sendMessage(chatId, 'The order ID is mandatory!');
                return;
            }
            
            if (!state.availableIds.includes(orderId)) {
                await bot.sendMessage(
                    chatId,
                    `Incorrect IDs. Your IDs are:\n${state.availableIds.join(', ')}`
                );
                return;
            }
            
            try {
                const deletedOrder = await orderService.deleteOrderById(orderId);
                await bot.sendMessage(chatId, `Order ${deletedOrder.name} with ID ${deletedOrder.id} successfully deleted.`, { parse_mode: 'Markdown' });
            } catch (err) {
                console.error(err);
                await bot.sendMessage(chatId, `Failed to add order with error ${err.message}`);
            }
        }
    } else {
        await bot.sendMessage(chatId, 'Use only commands.');
    }
});

bot.onText(/\/add_order/, async (msg) => {
    if (msg.from.is_bot) return;
    const chatId = msg.chat.id;
    
    orderStates.set(chatId, { waitingForOrderName: true });
    await bot.sendMessage(chatId, 'Please, text an order name or text /cancel_command for stop process');
});

bot.onText(/\/delete_by_id/, async (msg) => {
    if (msg.from.is_bot) return;
    const chatId = msg.chat.id;
    const checkAllOrders = []
    
    try {
        const allOrders = await orderService.getAllOrders();
        checkAllOrders.push(...allOrders);
        
        if (checkAllOrders.length === 0) {
            return await bot.sendMessage(chatId, 'No orders found for the list');
        }
        
        // Keep ID available for verification
        orderStates.set(chatId, {
            waitingForOrderId: true,
            availableIds: checkAllOrders.map(order => order.id.toString()),
        });
        
        await bot.sendMessage(chatId, `You cah choose ID from additional orders list or enter your own: \n${checkAllOrders
              .map((order) => `ID: ${order.id}`)
              .join('\n')}`);
    } catch (err) {
        console.error(err);
        await bot.sendMessage(chatId, `Failed to add order with error ${err.message}`);
    }
});

bot.onText(/\/get_orders/, async (msg) => {
    if (msg.from.is_bot) return;
    const chatId = msg.chat.id;

    try {
        const orders = await orderService.getAllOrders();
        if (Object.keys(orders).length === 0) {
            await bot.sendMessage(chatId, 'No orders found.');
            return;
        }
        await bot.sendMessage(
            chatId,
            `Orders (${orders.length}):\n${orders
                .map(order => `• id: ${order.id}\n name: ${order.name}\n date: ${order.date}`)
                .join('\n')}`,
            { parse_mode: 'Markdown' }
        );
    } catch (err) {
        console.error(err);
        await bot.sendMessage(chatId, `Failed to add order with error ${err.message}`);
    }
});

bot.onText(/\/delete_orders/, async (msg) => {
    if (msg.from.is_bot) return;
    const chatId = msg.chat.id;
    
    try {
        const deletedOrdersCount = await orderService.deleteAllOrders();
        if (!deletedOrdersCount || deletedOrdersCount.length === 0) {
            await bot.sendMessage(chatId, `No orders found in the list.`);
            return;
        }
        await bot.sendMessage(chatId,
            `${deletedOrdersCount} ${+deletedOrdersCount === 1 ? 'order' : 'orders'} successfully deleted.`);
    } catch (err) {
        console.error(err);
        await bot.sendMessage(chatId, `Failed to add order with error ${err.message}`);
    }
});
