import createAuthenticatedHandler from '../../util/create-authenticated-handler';
import createApp from '../../util/express-app';
import { adminPermissionRouter } from './permission-admin-api';

const app = createApp();
export const handler = createAuthenticatedHandler(app);
export { app };

app.use('/permission/admin', adminPermissionRouter);
