// src/config/env.js
import dotenv from 'dotenv';
dotenv.config();


export const env = {
NODE_ENV: process.env.NODE_ENV || 'development',
PORT: parseInt(process.env.PORT || '4000', 10),
JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',
ADMIN_RESET_CODE: process.env.ADMIN_RESET_CODE || 'RESET',
};