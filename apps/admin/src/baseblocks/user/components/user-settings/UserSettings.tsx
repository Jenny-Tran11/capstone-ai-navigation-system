import { Button } from '@baseline/ui/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@baseline/ui/primitives/card';
import { Input } from '@baseline/ui/primitives/input';
import { Label } from '@baseline/ui/primitives/label';
import { Separator } from '@baseline/ui/primitives/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@baseline/ui/primitives/tabs';
import { IconLogout, IconMail, IconShieldLock } from '@tabler/icons-react';
import {
  confirmUserAttribute,
  fetchUserAttributes,
  signOut,
  updateUserAttributes,
} from 'aws-amplify/auth';
import { useState } from 'react';

interface Props {
  user: { email: string; email_verified: boolean };
}

const UserSettings = (props: Props): JSX.Element => {
  const [email, setEmail] = useState<string>(props?.user?.email ?? '');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(
    props?.user?.email_verified,
  );
  const [isCodeInvalid, setIsCodeInvalid] = useState<boolean | undefined>();
  const [changingEmailCode, setChangingEmailCode] = useState('');

  const handleEmailChange = async () => {
    const attributes = await fetchUserAttributes();
    setIsChangingEmail(false);
    if (attributes.email !== email) {
      setIsEmailVerified(false);
      await updateUserAttributes({
        userAttributes: {
          email: email,
        },
      });
    }
  };

  const finalizeEmailChange = async () => {
    try {
      await confirmUserAttribute({
        userAttributeKey: 'email',
        confirmationCode: changingEmailCode,
      });
      setIsEmailVerified(true);
      setChangingEmailCode('');
      setIsCodeInvalid(false);
    } catch {
      setIsCodeInvalid(true);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-semibold text-3xl tracking-tight md:text-4xl">
          Account settings
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Your Baseline administrator profile and sign-in email.
        </p>
      </header>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <IconMail className="size-5 text-muted-foreground" />
                Email
              </CardTitle>
              <CardDescription>
                Email used to sign in. Changing it triggers a verification code
                to your inbox.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-foreground">
                  Email address
                </Label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <Input
                    name="email"
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    disabled={!isChangingEmail}
                    onChange={(e) => setEmail(e.target.value)}
                    className="sm:flex-1"
                  />
                  <Button
                    type="button"
                    variant={isChangingEmail ? 'default' : 'outline'}
                    disabled={!isEmailVerified && !isChangingEmail}
                    className="sm:shrink-0"
                    onClick={() => {
                      if (isChangingEmail) {
                        void handleEmailChange();
                      } else {
                        setIsChangingEmail(true);
                      }
                    }}
                  >
                    {isChangingEmail ? 'Save email' : 'Edit'}
                  </Button>
                </div>
                {!isEmailVerified && !isChangingEmail && (
                  <p className="text-amber-600 text-sm dark:text-amber-500">
                    This address is pending verification — check your inbox for
                    a code below.
                  </p>
                )}
              </div>

              {!isEmailVerified && (
                <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
                  <Label htmlFor="code" className="text-foreground">
                    Verification code
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Enter the code from the verification email Cognito sent you.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                    <Input
                      name="code"
                      id="code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="6-digit code"
                      value={changingEmailCode}
                      onChange={(e) => {
                        setChangingEmailCode(e.target.value);
                        setIsCodeInvalid(false);
                      }}
                      className={`sm:flex-1 ${
                        isCodeInvalid ? 'border-destructive' : ''
                      }`}
                      aria-invalid={isCodeInvalid ? true : undefined}
                    />
                    <div className="flex gap-2 sm:shrink-0">
                      <Button
                        type="button"
                        onClick={() => void finalizeEmailChange()}
                      >
                        Verify
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEmailVerified(true);
                          setIsChangingEmail(true);
                          setChangingEmailCode('');
                          setIsCodeInvalid(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                  {isCodeInvalid && (
                    <p className="text-destructive text-sm" role="alert">
                      That code doesn&apos;t match. Try again or request a new
                      code by saving your email again.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <IconShieldLock className="size-5 text-muted-foreground" />
                Session
              </CardTitle>
              <CardDescription>
                End your current admin session on this device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void signOut();
                }}
              >
                <IconLogout />
                Sign out
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive text-xl">
                Danger zone
              </CardTitle>
              <CardDescription>
                Irreversible actions. Ask another admin to remove your account
                if needed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Separator className="mb-4 bg-destructive/40" />
              <p className="text-muted-foreground text-sm">
                Self-deletion is disabled by design. Contact another admin on
                the Admins page to remove your account.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                type="button"
                variant="destructive"
                disabled
                className="opacity-70"
              >
                Delete admin account
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserSettings;
