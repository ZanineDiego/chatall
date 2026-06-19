    import { Router } from 'express';
import { registerUser } from '../controllers/userController';

const router = Router();

// Rota POST para registrar um novo usuário anônimo
router.post('/users/register', registerUser);

export default router;