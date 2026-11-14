import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  UrlFormData,
  VcardFormData,
  WhatsappFormData,
  WifiFormData,
  TextFormData,
  PhoneFormData,
  EmailFormData,
  LocationFormData,
  EventFormData,
} from '../../types'

export function UrlForm({
  value,
  onChange,
}: {
  value: UrlFormData
  onChange: (val: UrlFormData) => void
}) {
  return (
    <div className='space-y-2'>
      <Label htmlFor='url-input' className='text-xs font-medium'>
        Destination Website URL <span className='text-destructive'>*</span>
      </Label>
      <Input
        id='url-input'
        type='url'
        placeholder='https://organization.local/festivals'
        value={value.url}
        onChange={(e) => onChange({ url: e.target.value })}
        className='text-xs'
      />
      <p className='text-[11px] text-muted-foreground'>
        Enter any public webpage, registration form, or social media link.
      </p>
    </div>
  )
}

export function VcardForm({
  value,
  onChange,
}: {
  value: VcardFormData
  onChange: (val: VcardFormData) => void
}) {
  return (
    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
      <div className='space-y-1.5'>
        <Label className='text-xs font-medium'>First Name</Label>
        <Input
          placeholder='e.g. Rajesh'
          value={value.firstName}
          onChange={(e) => onChange({ ...value, firstName: e.target.value })}
          className='text-xs'
        />
      </div>
      <div className='space-y-1.5'>
        <Label className='text-xs font-medium'>Last Name</Label>
        <Input
          placeholder='e.g. Sharma'
          value={value.lastName}
          onChange={(e) => onChange({ ...value, lastName: e.target.value })}
          className='text-xs'
        />
      </div>
      <div className='space-y-1.5'>
        <Label className='text-xs font-medium'>Organization</Label>
        <Input
          placeholder='e.g. Temple Administration'
          value={value.organization}
          onChange={(e) => onChange({ ...value, organization: e.target.value })}
          className='text-xs'
        />
      </div>
      <div className='space-y-1.5'>
        <Label className='text-xs font-medium'>Designation / Title</Label>
        <Input
          placeholder='e.g. Department Lead'
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          className='text-xs'
        />
      </div>
      <div className='space-y-1.5'>
        <Label className='text-xs font-medium'>Mobile Phone</Label>
        <Input
          placeholder='+91 9876543210'
          value={value.phone}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
          className='text-xs'
        />
      </div>
      <div className='space-y-1.5'>
        <Label className='text-xs font-medium'>Email Address</Label>
        <Input
          type='email'
          placeholder='contact@organization.local'
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
          className='text-xs'
        />
      </div>
      <div className='space-y-1.5 sm:col-span-2'>
        <Label className='text-xs font-medium'>Physical Address</Label>
        <Input
          placeholder='Temple Complex, Vrindavan, Mathura, UP 281121'
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          className='text-xs'
        />
      </div>
    </div>
  )
}

export function WhatsappForm({
  value,
  onChange,
}: {
  value: WhatsappFormData
  onChange: (val: WhatsappFormData) => void
}) {
  return (
    <div className='space-y-3'>
      <div className='grid grid-cols-3 gap-2'>
        <div className='space-y-1.5'>
          <Label className='text-xs font-medium'>Country Code</Label>
          <Input
            placeholder='+91'
            value={value.countryCode}
            onChange={(e) => onChange({ ...value, countryCode: e.target.value })}
            className='text-xs'
          />
        </div>
        <div className='col-span-2 space-y-1.5'>
          <Label className='text-xs font-medium'>WhatsApp Phone Number</Label>
          <Input
            placeholder='9876543210'
            value={value.phone}
            onChange={(e) => onChange({ ...value, phone: e.target.value })}
            className='text-xs'
          />
        </div>
      </div>
      <div className='space-y-1.5'>
        <Label className='text-xs font-medium'>Pre-filled Message (Optional)</Label>
        <Textarea
          rows={3}
          placeholder='Hare Krishna! I would like to inquire about upcoming temple festivals and seva.'
          value={value.message}
          onChange={(e) => onChange({ ...value, message: e.target.value })}
          className='text-xs'
        />
      </div>
    </div>
  )
}

export function WifiForm({
  value,
  onChange,
}: {
  value: WifiFormData
  onChange: (val: WifiFormData) => void
}) {
  return (
    <div className='space-y-3'>
      <div className='space-y-1.5'>
        <Label className='text-xs font-medium'>Network Name (SSID) *</Label>
        <Input
          placeholder='e.g. Temple-Guest-WiFi'
          value={value.ssid}
          onChange={(e) => onChange({ ...value, ssid: e.target.value })}
          className='text-xs'
        />
      </div>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div className='space-y-1.5'>
          <Label className='text-xs font-medium'>Encryption Protocol</Label>
          <Select
            value={value.encryption}
            onValueChange={(val: 'WPA' | 'WEP' | 'nopass') =>
              onChange({ ...value, encryption: val })
            }
          >
            <SelectTrigger className='text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='WPA'>WPA / WPA2 / WPA3 (Standard)</SelectItem>
              <SelectItem value='WEP'>WEP</SelectItem>
              <SelectItem value='nopass'>No Password (Open)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {value.encryption !== 'nopass' && (
          <div className='space-y-1.5'>
            <Label className='text-xs font-medium'>Network Password</Label>
            <Input
              type='password'
              placeholder='Wireless key'
              value={value.password}
              onChange={(e) => onChange({ ...value, password: e.target.value })}
              className='text-xs'
            />
          </div>
        )}
      </div>
      <div className='flex items-center gap-2 pt-1'>
        <Switch
          id='wifi-hidden'
          checked={value.hidden}
          onCheckedChange={(checked) => onChange({ ...value, hidden: checked })}
        />
        <Label htmlFor='wifi-hidden' className='text-xs text-muted-foreground cursor-pointer'>
          Hidden Network (SSID is not broadcasted)
        </Label>
      </div>
    </div>
  )
}

export function TextForm({
  value,
  onChange,
}: {
  value: TextFormData
  onChange: (val: TextFormData) => void
}) {
  return (
    <div className='space-y-2'>
      <Label className='text-xs font-medium'>Plain Text Content</Label>
      <Textarea
        rows={4}
        placeholder='Notice: Daily evening aarti at 7:00 PM followed by prasadam distribution in the main hall.'
        value={value.text}
        onChange={(e) => onChange({ text: e.target.value })}
        className='text-xs'
      />
    </div>
  )
}

export function PhoneForm({
  value,
  onChange,
}: {
  value: PhoneFormData
  onChange: (val: PhoneFormData) => void
}) {
  return (
    <div className='space-y-2'>
      <Label className='text-xs font-medium'>Telephone Number</Label>
      <Input
        type='tel'
        placeholder='+91 9876543210'
        value={value.phoneNumber}
        onChange={(e) => onChange({ phoneNumber: e.target.value })}
        className='text-xs'
      />
      <p className='text-[11px] text-muted-foreground'>
        Scanning prompts the visitor to dial this number instantly.
      </p>
    </div>
  )
}

export function EmailForm({
  value,
  onChange,
}: {
  value: EmailFormData
  onChange: (val: EmailFormData) => void
}) {
  return (
    <div className='space-y-3'>
      <div className='space-y-1.5'>
        <Label className='text-xs font-medium'>Recipient Email Address</Label>
        <Input
          type='email'
          placeholder='seva@organization.local'
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
          className='text-xs'
        />
      </div>
      <div className='space-y-1.5'>
        <Label className='text-xs font-medium'>Subject Line</Label>
        <Input
          placeholder='Inquiry regarding Festival Seva'
          value={value.subject}
          onChange={(e) => onChange({ ...value, subject: e.target.value })}
          className='text-xs'
        />
      </div>
      <div className='space-y-1.5'>
        <Label className='text-xs font-medium'>Email Body</Label>
        <Textarea
          rows={3}
          placeholder='Please send details regarding the upcoming festival sponsorship.'
          value={value.body}
          onChange={(e) => onChange({ ...value, body: e.target.value })}
          className='text-xs'
        />
      </div>
    </div>
  )
}

export function LocationForm({
  value,
  onChange,
}: {
  value: LocationFormData
  onChange: (val: LocationFormData) => void
}) {
  return (
    <div className='space-y-3'>
      <div className='space-y-1.5'>
        <Label className='text-xs font-medium'>Facility / Location Name</Label>
        <Input
          placeholder='e.g. Main Temple Gate 1 / Guest Reception'
          value={value.locationName}
          onChange={(e) => onChange({ ...value, locationName: e.target.value })}
          className='text-xs'
        />
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-1.5'>
          <Label className='text-xs font-medium'>Latitude</Label>
          <Input
            placeholder='27.5750'
            value={value.latitude}
            onChange={(e) => onChange({ ...value, latitude: e.target.value })}
            className='font-mono text-xs'
          />
        </div>
        <div className='space-y-1.5'>
          <Label className='text-xs font-medium'>Longitude</Label>
          <Input
            placeholder='77.6740'
            value={value.longitude}
            onChange={(e) => onChange({ ...value, longitude: e.target.value })}
            className='font-mono text-xs'
          />
        </div>
      </div>
    </div>
  )
}

export function EventForm({
  value,
  onChange,
}: {
  value: EventFormData
  onChange: (val: EventFormData) => void
}) {
  return (
    <div className='space-y-3'>
      <div className='space-y-1.5'>
        <Label className='text-xs font-medium'>Event Title</Label>
        <Input
          placeholder='e.g. Annual Ratha Yatra Festival'
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          className='text-xs'
        />
      </div>
      <div className='space-y-1.5'>
        <Label className='text-xs font-medium'>Location</Label>
        <Input
          placeholder='e.g. Temple Auditorium / Courtyard'
          value={value.location}
          onChange={(e) => onChange({ ...value, location: e.target.value })}
          className='text-xs'
        />
      </div>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div className='space-y-1.5'>
          <Label className='text-xs font-medium'>Start Date & Time</Label>
          <Input
            type='datetime-local'
            value={value.startDate}
            onChange={(e) => onChange({ ...value, startDate: e.target.value })}
            className='text-xs'
          />
        </div>
        <div className='space-y-1.5'>
          <Label className='text-xs font-medium'>End Date & Time</Label>
          <Input
            type='datetime-local'
            value={value.endDate}
            onChange={(e) => onChange({ ...value, endDate: e.target.value })}
            className='text-xs'
          />
        </div>
      </div>
      <div className='space-y-1.5'>
        <Label className='text-xs font-medium'>Event Description</Label>
        <Textarea
          rows={2}
          placeholder='Grand celebrations, kirtan, abhishek, and feast prasadam distribution.'
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          className='text-xs'
        />
      </div>
    </div>
  )
}
