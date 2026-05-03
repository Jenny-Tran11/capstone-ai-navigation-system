import createAuthenticatedHandler from '../../util/create-authenticated-handler';
import createApp from '../../util/express-app';
import { adminWorkspaceRouter } from './workspace-admin-api';
import { userWorkspaceRouter } from './workspace-user-api';

const app = createApp();
export const handler = createAuthenticatedHandler(app);
export { app };

app.use('/workspace/admin', adminWorkspaceRouter);
app.use('/workspace/user', userWorkspaceRouter);
