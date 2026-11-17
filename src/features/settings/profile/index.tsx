import { ContentSection } from '../components/content-section'
import { ProfileForm } from './profile-form'

export function SettingsProfile() {
  return (
    <ContentSection
      title='Personal Profile'
      desc='Manage your personal details, contact information, and organizational profile.'
    >
      <ProfileForm />
    </ContentSection>
  )
}
