import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { usePrivacySettingsStore, type PrivacyField, type PrivacyScopeOption } from '../store/privacy.store';
import { type SettingsView, useSettingsStore } from '../store/settings.store';
import { Users } from 'lucide-react';

interface PrivacyDetailViewProps {
  field: PrivacyField;
  title: string;
  description: string;
  backView?: SettingsView;
}

const OPTION_LABELS: PrivacyScopeOption[] = [
  'Everybody',
  'My Contacts',
  'Nobody',
];

export function PrivacyDetailView({
  field,
  title,
  description,
}: PrivacyDetailViewProps) {
  const { navigate } = useSettingsStore();
  const { phoneNumber, lastSeen, profilePhoto, setOption, setPickerContext } =
    usePrivacySettingsStore();

  const currentRule =
    field === 'phoneNumber' ? phoneNumber : field === 'lastSeen' ? lastSeen : profilePhoto;

  const handleSelect = (option: PrivacyScopeOption) => {
    setOption(field, option);
  };

  const renderExceptionsDescription = () => {
    if (currentRule.option === 'My Contacts') {
      const count = currentRule.exceptContacts.length;
      if (!count) return 'Everybody in your contacts can see this.';
      return `Everybody in your contacts except ${count} contact${count > 1 ? 's' : ''}.`;
    }
    if (currentRule.option === 'Nobody') {
      const count = currentRule.allowContacts.length;
      if (!count) return 'Nobody can see this.';
      return `Only ${count} contact${count > 1 ? 's' : ''} can see this.`;
    }
    return 'Everybody can see this.';
  };

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-2 duration-300 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-1">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <SettingsSection title="Who can see this?">
        {OPTION_LABELS.map((option) => (
          <SettingsRow
            key={option}
            label={option}
            description={
              option === 'Everybody'
                ? 'All users will be able to see it.'
                : option === 'My Contacts'
                ? 'Only people in your contacts.'
                : 'Nobody by default.'
            }
            onClick={() => handleSelect(option)}
            rightElement={
              <div className="w-4 h-4 rounded-full border border-primary flex items-center justify-center">
                {currentRule.option === option && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
            }
          />
        ))}
      </SettingsSection>

      {(currentRule.option === 'My Contacts' ||
        currentRule.option === 'Nobody') && (
        <SettingsSection
          title={
            currentRule.option === 'My Contacts'
              ? 'Exceptions'
              : 'Always allow'
          }
          description={renderExceptionsDescription()}
        >
          <SettingsRow
            icon={<Users className="h-5 w-5" />}
            label={
              currentRule.option === 'My Contacts'
                ? 'Everybody except...'
                : 'Only these contacts...'
            }
            description="Tap to choose specific contacts."
            onClick={() => {
              const mode = currentRule.option === 'My Contacts' ? 'except' : 'allow';
              setPickerContext(field, mode);
              navigate('privacy-contacts-picker');
            }}
          />
        </SettingsSection>
      )}
    </div>
  );
}

