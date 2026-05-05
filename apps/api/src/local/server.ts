import { app as appConfigApp } from '../baseblocks/app-config/app-config-api';
import { app } from '../baseblocks/admin/admin-api';
import { app as contactApp } from '../baseblocks/contact/contact-api';
import { app as detectionApp } from '../baseblocks/detection/detection-api';
import { app as permissionApp } from '../baseblocks/permission/permission-api';
import { app as transitApp } from '../baseblocks/transit/transit-api';
import { app as userProfileApp } from '../baseblocks/user-profile/user-profile-api';
import { app as workspaceApp } from '../baseblocks/workspace/workspace-api';

const PORT = parseInt(process.env.PORT ?? '4000', 10);

app.use(contactApp);
app.use(detectionApp);
app.use(appConfigApp);
app.use(permissionApp);
app.use(transitApp);
app.use(userProfileApp);
app.use(workspaceApp);

app.listen(PORT, () => {
  console.log(`Local API server: http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop.');
});
