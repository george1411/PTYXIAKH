import { Router } from "express";
import { getUser, getUsers } from "../../controllers/common/user.controller.js";
import authorize from '../../middlewares/auth.middleware.js';
import { reportPain, getMyPain, deleteMyPain } from '../../controllers/trainer/clientPain.controller.js';


const userRouter = Router();

userRouter.get('/', authorize, getUsers);
userRouter.post('/report-pain', authorize, reportPain);
userRouter.get('/pain',          authorize, getMyPain);
userRouter.delete('/pain/:painId', authorize, deleteMyPain);

userRouter.get('/:id',authorize, getUser);

userRouter.post('/', (req,res) => 
    res.send({title : 'CREATE new user'})
);

userRouter.put('/:id', (req,res) => 
    res.send({title : 'UPDATE user'})
);

userRouter.delete('/:id', (req,res) => 
    res.send({title : 'DELETE user'})
);

export default userRouter;