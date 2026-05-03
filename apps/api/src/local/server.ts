import { app } from '../baseblocks/admin/admin-api';
import { app as contactApp } from '../baseblocks/contact/contact-api';
import { app as permissionApp } from '../baseblocks/permission/permission-api';
import { app as workspaceApp } from '../baseblocks/workspace/workspace-api';

const PORT = parseInt(process.env.PORT ?? '4000', 10);

app.use(contactApp);
app.use(permissionApp);
app.use(workspaceApp);

app.listen(PORT, () => {
  console.log(`Local API server: http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop.');
});
