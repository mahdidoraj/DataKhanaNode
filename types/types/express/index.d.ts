// types/express/index.d.ts
import { JwtPayload } from '../../src/middleware/auth';

declare global {
	namespace Express {
		interface Request {
			user?: JwtPayload;
		}
	}
}
