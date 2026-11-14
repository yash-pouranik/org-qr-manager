import { useState, useMemo, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Sparkles,
  ArrowLeft,
  Palette,
  Image as ImageIcon,
  Type,
  Building2,
  Save,
  CheckCircle2,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  QrContentType,
  QrStyleOptions,
  UpiFormData,
  UrlFormData,
  VcardFormData,
  WhatsappFormData,
  WifiFormData,
  TextFormData,
  PhoneFormData,
  EmailFormData,
  LocationFormData,
  EventFormData,
} from './types'
import { serializeQrData } from './utils/serializer'
import { QrTypeSelector } from './components/qr-type-selector'
import { UpiForm } from './components/forms/upi-form'
import {
  UrlForm,
  VcardForm,
  WhatsappForm,
  WifiForm,
  TextForm,
  PhoneForm,
  EmailForm,
  LocationForm,
  EventForm,
} from './components/forms/standard-forms'
import { QrStylePanel } from './components/qr-style-panel'
import { QrLogoFramePanel } from './components/qr-logo-frame-panel'
import { QrPreviewCard } from './components/qr-preview-card'
import { departmentService } from '@/services/department-service'
import { qrService } from '@/services/qr-service'
import { useAuthUser } from '@/context/auth-context'

export function QrGeneratorPage() {
  const { isSuperAdmin, canCreateQr, assignedDepartmentId } = useAuthUser()

  // General Metadata
  const [qrName, setQrName] = useState('Temple General Seva QR')
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(
    assignedDepartmentId || ''
  )
  const [category, setCategory] = useState<'dynamic' | 'static'>('static')
  const [isSaving, setIsSaving] = useState(false)

  // Selected Content Type
  const [contentType, setContentType] = useState<QrContentType>('upi')

  // Form States for Each Content Type
  const [upiData, setUpiData] = useState<UpiFormData>({
    vpa: 'temple.seva@okhdfcbank',
    payeeName: 'Temple Management Trust',
    amount: '',
    transactionNote: 'General Seva & Annadhanam Contribution',
  })

  const [urlData, setUrlData] = useState<UrlFormData>({
    url: 'https://organization.local/festivals',
  })

  const [vcardData, setVcardData] = useState<VcardFormData>({
    firstName: 'Rajesh',
    lastName: 'Sharma',
    organization: 'Temple Administration',
    title: 'Department Lead',
    phone: '+91 9876543210',
    email: 'rajesh@organization.local',
    website: 'https://organization.local',
    address: 'Temple Complex, Mathura, UP 281121',
  })

  const [whatsappData, setWhatsappData] = useState<WhatsappFormData>({
    countryCode: '91',
    phone: '9876543210',
    message: 'Hare Krishna! I would like to inquire about upcoming temple seva and festival darshan.',
  })

  const [wifiData, setWifiData] = useState<WifiFormData>({
    ssid: 'Temple-Guest-WiFi',
    password: 'SevaPassword2026',
    encryption: 'WPA',
    hidden: false,
  })

  const [textData, setTextData] = useState<TextFormData>({
    text: 'Daily temple darshan timings: 4:30 AM to 1:00 PM and 4:30 PM to 8:30 PM. Grand evening aarti at 7:00 PM.',
  })

  const [phoneData, setPhoneData] = useState<PhoneFormData>({
    phoneNumber: '+91 9876543210',
  })

  const [emailData, setEmailData] = useState<EmailFormData>({
    email: 'seva@organization.local',
    subject: 'Festival Sponsorship Inquiry',
    body: 'Please send information regarding donor receipts and upcoming festival sponsorship.',
  })

  const [locationData, setLocationData] = useState<LocationFormData>({
    locationName: 'Main Temple Complex',
    latitude: '27.5750',
    longitude: '77.6740',
  })

  const [eventData, setEventData] = useState<EventFormData>({
    title: 'Grand Annual Festival & Abhishek',
    location: 'Main Temple Courtyard',
    description: 'Vedic chants, sacred abhishek, cultural performances, and evening prasadam feast.',
    startDate: '2026-08-25T16:00',
    endDate: '2026-08-25T21:00',
  })

  // Style Customization Options
  const [styleOptions, setStyleOptions] = useState<QrStyleOptions>({
    dotsType: 'rounded',
    dotsColor: '#166534', // Deep Forest Green
    cornersSquareType: 'extra-rounded',
    cornersSquareColor: '#166534',
    cornersDotType: 'dot',
    cornersDotColor: '#E9A23B', // Warm Saffron Gold
    backgroundColor: '#FFFFFF',
    useGradient: true,
    gradientType: 'linear',
    gradientColor1: '#166534',
    gradientColor2: '#15803D',
    logoUrl: undefined,
    logoSize: 0.25,
    logoMargin: 4,
    hideBackgroundDots: true,
    frameStyle: 'bottom-banner',
    frameText: 'SCAN TO PAY / SEVA',
    frameColor: '#166534',
    frameTextColor: '#FFFFFF',
  })

  // Departments for Scope Assignment
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getAll(),
  })

  // Sync selected department
  useEffect(() => {
    if (departments.length > 0) {
      if (!isSuperAdmin && assignedDepartmentId) {
        setSelectedDepartmentId(assignedDepartmentId)
      } else if (!selectedDepartmentId) {
        setSelectedDepartmentId(departments[0].id)
      }
    }
  }, [departments, isSuperAdmin, assignedDepartmentId, selectedDepartmentId])

  // Dynamic QR Serialization
  const serializedData = useMemo(() => {
    return serializeQrData(contentType, {
      upi: upiData,
      url: urlData,
      vcard: vcardData,
      whatsapp: whatsappData,
      wifi: wifiData,
      text: textData,
      phone: phoneData,
      email: emailData,
      location: locationData,
      event: eventData,
    })
  }, [
    contentType,
    upiData,
    urlData,
    vcardData,
    whatsappData,
    wifiData,
    textData,
    phoneData,
    emailData,
    locationData,
    eventData,
  ])

  // Save to Directory
  const handleSaveToDirectory = async () => {
    if (!canCreateQr) {
      toast.error('You do not have permission to generate QR codes.')
      return
    }
    const finalDepartmentId = isSuperAdmin
      ? selectedDepartmentId
      : (assignedDepartmentId || selectedDepartmentId)

    if (!finalDepartmentId) {
      toast.error('Please assign a department for this QR code')
      return
    }

    try {
      setIsSaving(true)
      await qrService.create({
        name: qrName.trim(),
        category,
        type:
          category === 'dynamic'
            ? contentType === 'upi'
              ? 'dynamic_donation'
              : 'dynamic_url'
            : `static_${contentType}`,
        destinationUrl: serializedData,
        departmentId: finalDepartmentId,
        styleOptions,
        donationConfig:
          contentType === 'upi'
            ? {
                payeeVpa: upiData.vpa,
                payeeName: upiData.payeeName,
                defaultAmounts: [101, 251, 501, 1100, 5001],
                sevaNote: upiData.transactionNote,
              }
            : undefined,
      })
      toast.success(`QR "${qrName}" saved to directory successfully!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save QR')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-2 px-2 text-sm font-medium text-muted-foreground'>
          <Link to='/qr-codes' className='hover:text-foreground'>
            QR Directory
          </Link>
          <span>/</span>
          <span className='font-semibold text-foreground'>Designer Studio</span>
        </div>
        <div className='ms-auto flex items-center space-x-2'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='space-y-6'>
        {/* Top Breadcrumb & Page Header */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <div className='mb-1 flex items-center gap-2'>
              <Button
                asChild
                variant='ghost'
                size='sm'
                className='-ms-2 h-7 px-2 text-muted-foreground'
              >
                <Link to='/qr-codes'>
                  <ArrowLeft className='me-1 size-3.5' />
                  Back
                </Link>
              </Button>
              <span className='inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground'>
                <Sparkles className='size-3 text-accent' />
                Static Designer Studio
              </span>
            </div>
            <h1 className='text-2xl font-bold tracking-tight text-foreground'>
              Generate Designer QR Code
            </h1>
            <p className='text-sm text-muted-foreground'>
              Design styled static QR codes, direct UPI payment codes, and printable desk standees.
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              onClick={handleSaveToDirectory}
              disabled={isSaving || !canCreateQr}
              size='sm'
              className='gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
            >
              <Save className='size-4' />
              {isSaving ? 'Saving...' : 'Save to Directory'}
            </Button>
          </div>
        </div>

        {/* Studio Grid: Config Tabs (Col 7) vs Sticky Live Preview (Col 5) */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
          {/* Left Column: Configuration Workspace */}
          <div className='space-y-6 lg:col-span-7'>
            {/* Metadata Card: Name, Department & Mode */}
            <Card className='border-border/60 shadow-xs'>
              <CardContent className='grid grid-cols-1 gap-4 p-4 sm:grid-cols-3'>
                <div className='space-y-1.5'>
                  <Label htmlFor='qr-title' className='text-xs font-medium'>
                    QR Asset Name <span className='text-destructive'>*</span>
                  </Label>
                  <Input
                    id='qr-title'
                    value={qrName}
                    onChange={(e) => setQrName(e.target.value)}
                    placeholder='e.g. Donation Counter Gate 2'
                    className='text-xs'
                  />
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-xs font-medium'>Routing Mode</Label>
                  <Select
                    value={category}
                    onValueChange={(val: 'dynamic' | 'static') => setCategory(val)}
                  >
                    <SelectTrigger className='text-xs'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='static'>Direct Static (Offline)</SelectItem>
                      <SelectItem value='dynamic'>Dynamic (Tracked & Editable)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-xs font-medium'>Assigned Department</Label>
                  <Select
                    value={selectedDepartmentId}
                    onValueChange={setSelectedDepartmentId}
                    disabled={!isSuperAdmin}
                  >
                    <SelectTrigger className='text-xs'>
                      <SelectValue placeholder='Select department' />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          <span className='flex items-center gap-1.5'>
                            <Building2 className='size-3.5 text-primary' />
                            {dept.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Studio Tabs: Content, Design, Logo & Frame */}
            <Tabs defaultValue='content' className='w-full'>
              <TabsList className='grid w-full grid-cols-3 bg-muted/60 p-1'>
                <TabsTrigger value='content' className='gap-1.5 text-xs'>
                  <Type className='size-3.5' />
                  <span>1. Content Type</span>
                </TabsTrigger>
                <TabsTrigger value='style' className='gap-1.5 text-xs'>
                  <Palette className='size-3.5' />
                  <span>2. Colors & Style</span>
                </TabsTrigger>
                <TabsTrigger value='frame' className='gap-1.5 text-xs'>
                  <ImageIcon className='size-3.5' />
                  <span>3. Logo & Banner</span>
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Content Type & Dynamic Form */}
              <TabsContent value='content' className='space-y-5 pt-3'>
                <Card className='border-border/60 shadow-xs'>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-sm font-semibold'>
                      Select QR Content Type
                    </CardTitle>
                    <CardDescription className='text-xs'>
                      Direct UPI is recommended for donation counters. Standard formats are scannable by all devices.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <QrTypeSelector
                      selectedType={contentType}
                      onSelectType={(t) => {
                        setContentType(t)
                        // Adjust banner text for UPI
                        if (t === 'upi') {
                          setStyleOptions((prev) => ({
                            ...prev,
                            frameText: 'SCAN TO PAY / SEVA',
                          }))
                        }
                      }}
                    />

                    {/* Specific Sub-Form */}
                    <div className='rounded-xl border border-border/70 bg-muted/10 p-4'>
                      {contentType === 'upi' && (
                        <UpiForm value={upiData} onChange={setUpiData} />
                      )}
                      {contentType === 'url' && (
                        <UrlForm value={urlData} onChange={setUrlData} />
                      )}
                      {contentType === 'vcard' && (
                        <VcardForm value={vcardData} onChange={setVcardData} />
                      )}
                      {contentType === 'whatsapp' && (
                        <WhatsappForm
                          value={whatsappData}
                          onChange={setWhatsappData}
                        />
                      )}
                      {contentType === 'wifi' && (
                        <WifiForm value={wifiData} onChange={setWifiData} />
                      )}
                      {contentType === 'text' && (
                        <TextForm value={textData} onChange={setTextData} />
                      )}
                      {contentType === 'phone' && (
                        <PhoneForm value={phoneData} onChange={setPhoneData} />
                      )}
                      {contentType === 'email' && (
                        <EmailForm value={emailData} onChange={setEmailData} />
                      )}
                      {contentType === 'location' && (
                        <LocationForm
                          value={locationData}
                          onChange={setLocationData}
                        />
                      )}
                      {contentType === 'event' && (
                        <EventForm value={eventData} onChange={setEventData} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 2: Design, Palette & Gradients */}
              <TabsContent value='style' className='pt-3'>
                <Card className='border-border/60 shadow-xs'>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-sm font-semibold'>
                      Visual Design & Pattern Customization
                    </CardTitle>
                    <CardDescription className='text-xs'>
                      Personalize pattern shapes, corner eyes, Deep Forest Green & Saffron Gold presets.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <QrStylePanel
                      options={styleOptions}
                      onChange={setStyleOptions}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 3: Logo, Emblem & CTA Frame */}
              <TabsContent value='frame' className='pt-3'>
                <Card className='border-border/60 shadow-xs'>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-sm font-semibold'>
                      Emblem Branding & Call-to-Action Banner
                    </CardTitle>
                    <CardDescription className='text-xs'>
                      Embed center emblems and add a high-visibility CTA ribbon for visitors.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <QrLogoFramePanel
                      options={styleOptions}
                      onChange={setStyleOptions}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column: Sticky Live Interactive Preview & Exporters */}
          <div className='lg:col-span-5'>
            <div className='sticky top-20 space-y-4'>
              <QrPreviewCard
                serializedData={serializedData}
                contentType={contentType}
                styleOptions={styleOptions}
                qrName={qrName}
              />

              {/* Security & Offline Guarantee Pill */}
              <div className='flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground'>
                <CheckCircle2 className='size-4 shrink-0 text-primary' />
                <span>
                  <strong>100% Offline Static Guarantee:</strong> Static QR codes store data directly inside the visual matrix. They never expire and function forever without internet.
                </span>
              </div>
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}
