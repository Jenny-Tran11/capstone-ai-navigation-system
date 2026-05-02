import React, { useState } from 'react';
import { deleteAdmin } from '@baseline/client-api/admin';
import ConfirmDelete from '../../../../components/confirm-delete/ConfirmDelete';
import AddUser from '../add-admin/AddAdmin';
import { getRequestHandler } from '@baseline/client-api/request-handler';
import { Admin } from '@baseline/types/admin';

interface Props {
  admins: Admin[];
}

const AdminList = (props: Props): JSX.Element => {
  const [allAdmins, setAllAdmins] = useState<Admin[]>(props?.admins || []);

  const handleDelete = async (adminSub: string): Promise<void> => {
    await deleteAdmin(getRequestHandler(), { adminId: adminSub });
    setAllAdmins((admins) =>
      admins.filter((admin) => admin.userSub !== adminSub),
    );
  };

  return (
    <div>
      <div
        className="flex items-center justify-between w-full min-w-0 px-12 py-[18px] overflow-hidden bg-white border border-[#bababa] border-b-0"
      >
        <div className="text-base leading-6 mr-2">
          There are {allAdmins.length} people in your team
        </div>
        <AddUser setAllAdmins={setAllAdmins} />
      </div>
      {allAdmins.map((admin) => (
        <div
          key={admin.userSub}
          className="flex items-center justify-between w-full min-w-0 px-12 py-[18px] overflow-hidden bg-white border border-[#bababa] border-t-0 last:border-b"
        >
          <div className="flex-auto min-w-0">
            <div className="mb-2">
              <div className="text-[40px] leading-[49px] font-bold overflow-hidden whitespace-nowrap text-ellipsis md:text-2xl md:leading-8">
                {admin.userEmail}
              </div>
              <div className="text-2xl leading-8 text-[#707070] overflow-hidden whitespace-nowrap text-ellipsis md:text-base md:leading-6">
                {admin.userSub}
              </div>
            </div>
            <div className="inline-block text-base leading-6 px-[18px] py-1.5 border border-[#bababa] rounded-[10px]">
              Admin
            </div>
          </div>
          <div className="flex-none min-w-min ml-4">
            <ConfirmDelete
              itemName={admin.userEmail}
              deleteFunction={async () => {
                await handleDelete(admin.userSub);
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminList;
