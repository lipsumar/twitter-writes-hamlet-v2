"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongodb_1 = require("mongodb");
var MongoStore = /** @class */ (function () {
    function MongoStore(url, dbName) {
        this.client = new mongodb_1.MongoClient(url, { useNewUrlParser: true });
        this.dbName = dbName;
    }
    MongoStore.prototype.init = function () {
        var _this = this;
        return this.client.connect().then(function () {
            console.log('connected to mongo!');
            _this.db = _this.client.db(_this.dbName);
        });
    };
    MongoStore.prototype.getState = function () {
        return this.collection('state').findOne({ _id: 1 }).then(function (state) {
            if (state === null) {
                throw new Error("Can't load state from db: aborting. Did you seed the db ?");
            }
            return state;
        });
    };
    MongoStore.prototype.collection = function (name) {
        return this.db.collection(name);
    };
    return MongoStore;
}());
exports.default = MongoStore;
