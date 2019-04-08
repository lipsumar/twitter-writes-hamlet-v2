"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var TwitterWritesHamlet_1 = __importDefault(require("./TwitterWritesHamlet"));
var MongoStore_1 = __importDefault(require("./storage/MongoStore"));
var PORT = process.env.PORT || 5000;
var app = express_1.default();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var store = new MongoStore_1.default('mongodb://mongo', 'twh');
loadTwhDependencies()
    .then(function (_a) {
    var store = _a.store;
    console.log('Initializing TWH...');
    var twh = new TwitterWritesHamlet_1.default(store);
    return twh.init().then(function () { return Promise.resolve(twh); });
})
    .then(function (twh) {
    console.log('Setting up server...');
    app.get('/ping', function (req, res) {
        res.send('pong');
    });
    io.on('connection', function (socket) {
        console.log('a user connected');
        socket.emit('state', twh.getState());
    });
    http.listen(PORT, function () {
        console.log("Running on http://localhost:" + PORT);
    });
})
    .catch(function (err) {
    console.log("Unhandled error: " + err.message);
    console.log(err);
    process.exit(1);
});
function loadTwhDependencies() {
    console.log('load deps...');
    return Promise.all([
        store.init()
    ])
        .then(function () {
        console.log('...deps loaded');
    })
        .then(function () { return ({ store: store }); });
}
