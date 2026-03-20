import express from 'express';
import { getConversations, getChatHistory, sendMessage, getUnreadCount, markAsRead } from '../controllers/chat.controller.js';
import authorize from '../middlewares/auth.middleware.js';

const chatRouter = express.Router();

chatRouter.get('/conversations', authorize, getConversations);
chatRouter.get('/unread', authorize, getUnreadCount);
chatRouter.post('/mark-read', authorize, markAsRead);
chatRouter.get('/', authorize, getChatHistory);
chatRouter.post('/', authorize, sendMessage);

export default chatRouter;
