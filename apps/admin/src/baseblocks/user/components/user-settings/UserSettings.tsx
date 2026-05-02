import {
  signOut,
  updateUserAttributes,
  confirmUserAttribute,
  fetchUserAttributes,
} from 'aws-amplify/auth';
import React, { useState } from 'react';
import { Input } from '@baseline/ui/primitives/input';
import { Label } from '@baseline/ui/primitives/label';

interface Props {
  user: { email: string; email_verified: boolean };
}

const UserSettings = (props: Props): JSX.Element => {
  const [email, setEmail] = useState<string>(props?.user?.email);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(
    props?.user?.email_verified,
  );
  const [isCodeInvalid, setIsCodeInvalid] = useState<undefined | boolean>();
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
    } catch {
      console.log('Invalid code');
      setIsCodeInvalid(true);
    }
  };

  return (
    <div>
      <h1 className="text-[40px] leading-[49px] font-bold mb-8 md:text-2xl md:leading-8">Account settings</h1>
      <div className="text-base leading-6 w-full px-12 py-[18px] bg-white border border-[#bababa] space-y-4 md:px-3">
        <div className="space-y-2">
          <Label htmlFor="email" className="font-semibold">Email</Label>
          <div className="flex">
            <Input
              name="email"
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              disabled={!isChangingEmail}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-none"
            />
            <button
              disabled={!isEmailVerified}
              className="px-6 py-3 bg-white border border-[#bababa] border-l-0 text-base leading-6 disabled:opacity-40 cursor-pointer hover:bg-muted transition-colors"
              onClick={() => {
                if (isChangingEmail) { void handleEmailChange(); }
                else { setIsChangingEmail(true); }
              }}
            >
              {isChangingEmail ? 'Update' : 'Edit'}
            </button>
          </div>
        </div>
        {!isEmailVerified && (
          <div className="space-y-2">
            <Label htmlFor="code">Check your email for a code</Label>
            <div className="flex">
              <Input
                name="code"
                id="code"
                type="text"
                placeholder="Code"
                value={changingEmailCode}
                onChange={(e) => setChangingEmailCode(e.target.value)}
                className={`rounded-none ${isCodeInvalid ? 'border-destructive' : ''}`}
              />
              <button
                className="px-6 py-3 bg-white border border-[#bababa] border-l-0 text-base leading-6 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => { void finalizeEmailChange(); }}
              >
                Submit
              </button>
              <button
                className="px-6 py-3 bg-white border border-[#bababa] border-l-0 text-base leading-6 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => { setIsEmailVerified(true); setIsChangingEmail(true); }}
              >
                Cancel
              </button>
            </div>
            {isCodeInvalid && (
              <p className="text-sm text-destructive">Code is invalid</p>
            )}
          </div>
        )}
        <button
          className="text-base leading-6 cursor-pointer bg-transparent border-0 text-foreground hover:underline"
          onClick={() => { void signOut(); }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

export default UserSettings;
