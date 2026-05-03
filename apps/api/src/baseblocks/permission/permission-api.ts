import createApp from '../../util/express-app';
import createAuthenticatedHandler from '../../util/create-authenticated-handler';
import { adminPermissionRouter } from './permission-admin-api';

const app = createApp();
export const handler = createAuthenticatedHandler(app);
export { app };

app.use('/permission/admin', adminPermissionRouter);
