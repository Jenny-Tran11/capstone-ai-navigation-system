import { checkAdmin } from '@baseline/client-api/admin';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { useEffect } from 'react';
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  redirect,
} from 'react-router-dom';
import '@aws-amplify/ui-react/styles.css';
import {
  createRequestHandler,
  getRequestHandler,
} from '@baseline/client-api/request-handler';
import type { AxiosRequestConfig } from 'axios';
import Dashboard from './baseblocks/dashboard/pages/Dashboard';
import DetectionDetail, {
  detectionDetailLoader,
} from './baseblocks/detection/pages/DetectionDetail';
import Detections, {
  detectionListLoader,
} from './baseblocks/detection/pages/Detections';
import ModelStatus from './baseblocks/detection/pages/ModelStatus';
import AppConfigPage from './baseblocks/app-config/pages/AppConfig';
import Login from './baseblocks/login/pages/Login';
import NotAdmin from './baseblocks/not-admin/pages/NotAdmin';
import Permissions, {
  permissionListLoader,
} from './baseblocks/permission/pages/Permissions';
import User, { userLoader } from './baseblocks/user/pages/User';
import UserDetailAdminPage from './baseblocks/user/pages/UserDetailAdmin';
import UserEditAdminPage from './baseblocks/user/pages/UserEditAdmin';
import UserPreferencesAdminPage from './baseblocks/user/pages/UserPreferencesAdmin';
import Workspaces, {
  workspaceListLoader,
} from './baseblocks/workspace/pages/Workspaces';
import Layout from './components/layout/Layout';
import Loader from './components/page-content/loader/Loader';

// Redirect Cognito API calls to local MiniStack endpoint when set
if (process.env.REACT_APP_COGNITO_ENDPOINT) {
  const localEndpoint = process.env.REACT_APP_COGNITO_ENDPOINT;
  const cognitoPattern = /https:\/\/cognito-idp\.[^.]+\.amazonaws\.com/;
  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (cognitoPattern.test(url)) {
      const patched = url.replace(cognitoPattern, localEndpoint);
      return originalFetch(patched, init);
    }
    return originalFetch(input, init);
  };
}

Amplify.configure({
  Auth: {
    Cognito: {
      signUpVerificationMethod: 'code',
      identityPoolId: process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID ?? '',
      userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID ?? '',
      userPoolClientId:
        process.env.REACT_APP_COGNITO_USER_POOL_WEB_CLIENT_ID ?? '',
      loginWith: { email: true },
    },
  },
});

export default function App() {
  useEffect(() => {
    return Hub.listen('auth', (data) => {
      console.debug('auth event', data.payload.event);
      switch (data.payload.event) {
        case 'signedIn':
          router.navigate('/dashboard').catch((e) => console.error(e));
          break;
        case 'signedOut':
          router.navigate('/login').catch((e) => console.error(e));
          break;
        case 'signInWithRedirect_failure':
          break;
        case 'tokenRefresh':
          break;
        default:
          console.debug(`Unhandled event: ${data.payload.event}`);
      }
    });
  }, []);

  return (
    <RouterProvider
      router={router}
      fallbackElement={<Loader hasStartedLoading={true} />}
    />
  );
}

async function protectedLoader() {
  console.debug('protected loader');
  if (!getRequestHandler()) {
    console.debug('creating request handler');
    createRequestHandler(
      async (config: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
        const authSession = await fetchAuthSession();
        if (!config.headers) config.headers = {};
        config.headers.Authorization = `Bearer ${authSession?.tokens?.idToken?.toString()}`;
        return config;
      },
    );
  }
  const authSession = await fetchAuthSession();
  if (!authSession?.tokens?.idToken) {
    return redirect('/login');
  }
  const isAdmin = await checkAdmin(getRequestHandler());
  if (!isAdmin) {
    return redirect('/not-admin');
  }
  return null;
}

async function loginLoader() {
  console.debug('login loader');
  const authSession = await fetchAuthSession();
  if (authSession?.tokens?.idToken) {
    console.debug('redirecting to dashboard');
    return redirect('/dashboard');
  }
  return null;
}

async function rootRedirectLoader() {
  return redirect('/dashboard');
}

const router = createBrowserRouter([
  {
    id: 'public',
    path: '/',
    Component: Outlet,
    children: [
      { path: '/', index: true, loader: rootRedirectLoader },
      { path: '/not-admin', Component: NotAdmin },
      { path: '/login', Component: Login, loader: loginLoader },
    ],
  },
  {
    id: 'protected',
    path: '/',
    Component: Layout,
    loader: protectedLoader,
    children: [
      { path: '/dashboard', Component: Dashboard },
      {
        path: '/workspaces',
        Component: Workspaces,
        loader: workspaceListLoader,
      },
      {
        path: '/permissions',
        Component: Permissions,
        loader: permissionListLoader,
      },
      {
        path: '/detections',
        Component: Detections,
        loader: detectionListLoader,
      },
      {
        path: '/detections/:detectionId',
        Component: DetectionDetail,
        loader: detectionDetailLoader,
      },
      { path: '/model', Component: ModelStatus },
      { path: '/runtime-config', Component: AppConfigPage },
      { path: '/users', Component: UserPreferencesAdminPage },
      { path: '/users/:userId', Component: UserDetailAdminPage },
      { path: '/users/:userId/edit', Component: UserEditAdminPage },
      { path: '/settings', Component: User, loader: userLoader },
    ],
  },
]);
