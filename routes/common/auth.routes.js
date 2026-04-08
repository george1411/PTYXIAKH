import { Router } from "express";
import { getMe, signIn, signOut, signUp, updateProfile, changePassword, deleteAccount, uploadAvatar, uploadAvatarHandler, forgotPassword, resetPassword } from "../../controllers/common/auth.controller.js";
import authorize from "../../middlewares/auth.middleware.js";


const authRouter = Router();

authRouter.post('/sign-up', signUp);
authRouter.post('/sign-in', signIn);
authRouter.post('/sign-out', signOut);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);
authRouter.get('/me', authorize, getMe);
authRouter.put('/profile', authorize, updateProfile);
authRouter.put('/change-password', authorize, changePassword);
authRouter.delete('/delete-account', authorize, deleteAccount);
authRouter.post('/avatar', authorize, uploadAvatar.single('avatar'), uploadAvatarHandler);

export default authRouter;