import express from 'express';
import { getInviteCodes, generateInviteCode, deleteInviteCode, redeemInviteCode } from '../controllers/inviteCode.controller.js';
import authorize from '../middlewares/auth.middleware.js';

const inviteRouter = express.Router();

inviteRouter.get('/',         authorize, getInviteCodes);
inviteRouter.post('/',        authorize, generateInviteCode);
inviteRouter.delete('/:id',   authorize, deleteInviteCode);
inviteRouter.post('/redeem',  authorize, redeemInviteCode);

export default inviteRouter;
