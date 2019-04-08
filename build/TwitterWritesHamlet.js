"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var State_1 = __importDefault(require("./models/State"));
var TwitterWritesHamlet = /** @class */ (function () {
    function TwitterWritesHamlet(store) {
        this.state = new State_1.default;
        this.store = store;
    }
    TwitterWritesHamlet.prototype.init = function () {
        return this.loadState();
    };
    TwitterWritesHamlet.prototype.loadState = function () {
        var _this = this;
        return this.store.getState().then(function (state) {
            _this.state = state;
            console.log('Loaded state:', state);
        });
    };
    TwitterWritesHamlet.prototype.getState = function () {
        return __assign({}, this.state);
    };
    return TwitterWritesHamlet;
}());
exports.default = TwitterWritesHamlet;
