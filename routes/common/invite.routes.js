import express from 'express';
import { getInviteCodes, regenerateInviteCode, redeemInviteCode } from '../../controllers/common/inviteCode.controller.js';
import authorize from '../../middlewares/auth.middleware.js';

const inviteRouter = express.Router();

inviteRouter.get('/',              authorize, getInviteCodes);
inviteRouter.post('/regenerate',   authorize, regenerateInviteCode);
inviteRouter.post('/redeem',       authorize, redeemInviteCode);

export default inviteRouter;
