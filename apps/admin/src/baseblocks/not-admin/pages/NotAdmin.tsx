import React from 'react';
import { signOut } from 'aws-amplify/auth';
import { redirect } from 'react-router-dom';

async function signOutButton() {
  await signOut();
  redirect('/');
}

function NotAdmin() {
  return (
    <div className="flex min-h-screen overflow-hidden flex-row flex-auto">
      <div className="flex flex-col flex-auto justify-center items-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Please contact your system administrator</h1>
          <p className="text-muted-foreground">You do not have permission to view this content</p>
          <button
            onClick={() => { void signOutButton(); }}
            className="inline-block px-[108px] py-3 text-white bg-[#3a3838] border-2 border-[#3a3838] rounded-[32px] transition-[background-color,color] duration-150 ease-in-out hover:text-[#3a3838] hover:bg-white"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotAdmin;
