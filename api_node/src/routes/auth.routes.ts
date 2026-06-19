import { Router } from 'express';
import { loginWithGoogle, loginWithApple, loginWithPhone } from '../controllers/auth.controller';

const authRouter = Router();

// Endpoints de Login / Criação de conta
authRouter.post('/google', loginWithGoogle);
authRouter.post('/apple', loginWithApple);
authRouter.post('/phone', loginWithPhone);

export default authRouter;