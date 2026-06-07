"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiClient = createApiClient;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("./config");
function createApiClient() {
    const config = (0, config_1.getConfig)();
    return axios_1.default.create({
        baseURL: config.apiUrl,
        headers: {
            'Authorization': config.apiKey ? `Bearer ${config.apiKey}` : '',
            'Content-Type': 'application/json'
        }
    });
}
//# sourceMappingURL=api.js.map