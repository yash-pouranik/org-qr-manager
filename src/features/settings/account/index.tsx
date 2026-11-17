import { ContentSection } from '../components/content-section'
import { AccountForm } from './account-form'

export function SettingsAccount() {
  return (
    <ContentSection
      title='Account & Security'
      desc='Manage your security credentials, update your password, and view session details.'
    >
      <AccountForm />
    </ContentSection>
  )
}
