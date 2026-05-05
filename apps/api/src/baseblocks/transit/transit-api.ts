import createAuthenticatedHandler from '../../util/create-authenticated-handler';
import createApp from '../../util/express-app';
import { userTransitRouter } from './transit-user-api';

const app = createApp();
export const handler = createAuthenticatedHandler(app);
export { app };

app.use('/transit/user', userTransitRouter);
