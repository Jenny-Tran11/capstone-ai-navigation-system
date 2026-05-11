import createAuthenticatedHandler from '../../util/create-authenticated-handler';
import createApp from '../../util/express-app';
import { adminUserProfileRouter } from './user-profile-admin-api';
import { userProfileUserRouter } from './user-profile-user-api';

const app = createApp();
export const handler = createAuthenticatedHandler(app);
export { app };

app.use('/user-profile/admin', adminUserProfileRouter);
app.use('/user-profile/user', userProfileUserRouter);
