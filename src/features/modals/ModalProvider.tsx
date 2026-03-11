import { AddContactModal } from './AddContactModal';
import { SearchUserModal } from './SearchUserModal';
import { SettingsSheet } from '../settings/SettingsSheet';

export function ModalProvider() {
  return (
    <>
      <SettingsSheet />
      <AddContactModal />
      <SearchUserModal />
    </>
  );
}
