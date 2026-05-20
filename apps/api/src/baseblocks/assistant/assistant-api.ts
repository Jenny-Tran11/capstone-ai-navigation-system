import createAuthenticatedHandler from '../../util/create-authenticated-handler';
import createApp from '../../util/express-app';
import { userAssistantRouter } from './assistant-user-api';

const app = createApp();
export const handler = createAuthenticatedHandler(app);
export { app };

app.use('/assistant/user', userAssistantRouter);

