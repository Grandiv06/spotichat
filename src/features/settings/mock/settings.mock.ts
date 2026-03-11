export const mockedDevices = [
  {
    id: '1',
    name: 'MacBook Pro (M3)',
    platform: 'macOS',
    browser: 'Chrome',
    lastActive: 'Active now',
    isCurrent: true,
    icon: 'laptop'
  },
  {
    id: '2',
    name: 'iPhone 15 Pro',
    platform: 'iOS',
    browser: 'Safari',
    lastActive: '2 hours ago',
    isCurrent: false,
    icon: 'smartphone'
  },
  {
    id: '3',
    name: 'Windows Desktop',
    platform: 'Windows',
    browser: 'Firefox',
    lastActive: 'Yesterday at 14:30',
    isCurrent: false,
    icon: 'monitor'
  }
];

export const mockedNotificationSettings = {
  enableNotifications: true,
  messageSound: true,
  showPreview: true,
  muteAllChats: false,
  muteGroupChats: false,
};

export const mockedPrivacySettings = {
  phoneNumberOptions: ['Everyone', 'My Contacts', 'Nobody'],
  currentPhoneNumberOption: 'Nobody',
  profilePhotoOptions: ['Everyone', 'My Contacts', 'Nobody'],
  currentProfilePhotoOption: 'My Contacts',
  lastSeenOptions: ['Everyone', 'My Contacts', 'Nobody'],
  currentLastSeenOption: 'My Contacts',
  blockedUsers: [
    { id: 'u12', name: 'John Doe', username: '@johnd' }
  ]
};
