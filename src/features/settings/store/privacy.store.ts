import { create } from 'zustand';

export type PrivacyScopeOption = 'Everybody' | 'My Contacts' | 'Nobody';

export interface PrivacyRule {
  option: PrivacyScopeOption;
  /**
   * Used when option === 'My Contacts'
   * Contacts in this list will NOT be able to see the field.
   */
  exceptContacts: string[];
  /**
   * Used when option === 'Nobody'
   * Only contacts in this list will be able to see the field.
   */
  allowContacts: string[];
}

export type PrivacyField = 'phoneNumber' | 'lastSeen' | 'profilePhoto';

interface PrivacySettingsState {
  phoneNumber: PrivacyRule;
  lastSeen: PrivacyRule;
  profilePhoto: PrivacyRule;
  blockedUsers: { id: string; name: string; username?: string }[];

  setOption: (field: PrivacyField, option: PrivacyScopeOption) => void;
  setExceptContacts: (field: PrivacyField, contactIds: string[]) => void;
  setAllowContacts: (field: PrivacyField, contactIds: string[]) => void;
}

const defaultRule: PrivacyRule = {
  option: 'My Contacts',
  exceptContacts: [],
  allowContacts: [],
};

export const usePrivacySettingsStore = create<PrivacySettingsState>((set) => ({
  phoneNumber: {
    ...defaultRule,
    option: 'Nobody',
  },
  lastSeen: {
    ...defaultRule,
    option: 'My Contacts',
  },
  profilePhoto: {
    ...defaultRule,
    option: 'My Contacts',
  },
  blockedUsers: [
    { id: 'u12', name: 'John Doe', username: '@johnd' },
  ],

  setOption: (field, option) =>
    set((state) => ({
      ...state,
      [field]: {
        ...(state as any)[field],
        option,
      },
    })),

  setExceptContacts: (field, contactIds) =>
    set((state) => ({
      ...state,
      [field]: {
        ...(state as any)[field],
        exceptContacts: contactIds,
      },
    })),

  setAllowContacts: (field, contactIds) =>
    set((state) => ({
      ...state,
      [field]: {
        ...(state as any)[field],
        allowContacts: contactIds,
      },
    })),
}));

