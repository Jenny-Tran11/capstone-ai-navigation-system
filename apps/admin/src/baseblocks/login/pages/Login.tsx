import { Authenticator } from '@aws-amplify/ui-react';

function Login() {
  return (
    <div className="flex min-h-screen overflow-hidden flex-row flex-auto">
      <div className="flex flex-col flex-auto justify-center items-center">
        <Authenticator />
      </div>
    </div>
  );
}

export default Login;
