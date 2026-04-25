import { Router } from 'express';
import authorize from '../../middlewares/auth.middleware.js';
import {
    getMyGroups,
    getGroup,
    createGroup,
    updateGroup,
    deleteGroup,
    addMember,
    removeMember,
    getGroupMessages,
    sendGroupMessage,
} from '../../controllers/common/groups.controller.js';

const groupsRouter = Router();

groupsRouter.get('/',                          authorize, getMyGroups);
groupsRouter.post('/',                         authorize, createGroup);
groupsRouter.get('/:groupId',                  authorize, getGroup);
groupsRouter.put('/:groupId',                  authorize, updateGroup);
groupsRouter.delete('/:groupId',               authorize, deleteGroup);
groupsRouter.post('/:groupId/members',         authorize, addMember);
groupsRouter.delete('/:groupId/members/:userId', authorize, removeMember);
groupsRouter.get('/:groupId/messages',         authorize, getGroupMessages);
groupsRouter.post('/:groupId/messages',        authorize, sendGroupMessage);

export default groupsRouter;
