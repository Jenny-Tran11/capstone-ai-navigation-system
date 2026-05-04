import createAuthenticatedHandler from '../../util/create-authenticated-handler';
import createApp from '../../util/express-app';
import { adminDetectionRouter } from './detection-admin-api';
import { userDetectionRouter } from './detection-user-api';

const app = createApp();
export const handler = createAuthenticatedHandler(app);
export { app };

app.use('/detection/admin', adminDetectionRouter);
app.use('/detection/user', userDetectionRouter);
