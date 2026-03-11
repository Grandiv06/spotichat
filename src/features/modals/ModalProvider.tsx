import { AddContactModal } from './AddContactModal';
import { SearchUserModal } from './SearchUserModal';
import { CreateGroupModal } from './CreateGroupModal';
import { CreateChannelModal } from './CreateChannelModal';
import { SettingsSheet } from '../settings/SettingsSheet';

export function ModalProvider() {
  return (
    <>
      <SettingsSheet />
      <AddContactModal />
      <SearchUserModal />
      <CreateGroupModal />
      <CreateChannelModal />
    </>
  );
}
