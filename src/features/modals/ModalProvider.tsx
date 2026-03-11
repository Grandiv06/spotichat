import { ProfileModal } from './ProfileModal';
import { AddContactModal } from './AddContactModal';
import { SearchUserModal } from './SearchUserModal';

export function ModalProvider() {
  return (
    <>
      <ProfileModal />
      <AddContactModal />
      <SearchUserModal />
    </>
  );
}
