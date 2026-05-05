import createAuthenticatedHandler from '../../util/create-authenticated-handler';
import createApp from '../../util/express-app';
import { adminAppConfigRouter } from './app-config-admin-api';
import { userAppConfigRouter } from './app-config-user-api';

const app = createApp();
export const handler = createAuthenticatedHandler(app);
export { app };

app.use('/app-config/admin', adminAppConfigRouter);
app.use('/app-config/user', userAppConfigRouter);
