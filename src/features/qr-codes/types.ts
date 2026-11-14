export type QrContentType =
  | 'upi'
  | 'url'
  | 'vcard'
  | 'whatsapp'
  | 'wifi'
  | 'text'
  | 'phone'
  | 'email'
  | 'location'
  | 'event'

export interface UpiFormData {
  vpa: string
  payeeName: string
  amount: string
  transactionNote: string
}

export interface UrlFormData {
  url: string
}

export interface VcardFormData {
  firstName: string
  lastName: string
  organization: string
  title: string
  phone: string
  email: string
  website: string
  address: string
}

export interface WhatsappFormData {
  countryCode: string
  phone: string
  message: string
}

export interface WifiFormData {
  ssid: string
  password: string
  encryption: 'WPA' | 'WEP' | 'nopass'
  hidden: boolean
}

export interface TextFormData {
  text: string
}

export interface PhoneFormData {
  phoneNumber: string
}

export interface EmailFormData {
  email: string
  subject: string
  body: string
}

export interface LocationFormData {
  latitude: string
  longitude: string
  locationName: string
}

export interface EventFormData {
  title: string
  location: string
  description: string
  startDate: string
  endDate: string
}

export type DotStyleType = 'square' | 'dots' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded'
export type CornerSquareStyleType = 'square' | 'dot' | 'extra-rounded'
export type CornerDotStyleType = 'square' | 'dot'

export interface QrStyleOptions {
  dotsType: DotStyleType
  dotsColor: string
  cornersSquareType: CornerSquareStyleType
  cornersSquareColor: string
  cornersDotType: CornerDotStyleType
  cornersDotColor: string
  backgroundColor: string
  useGradient: boolean
  gradientType: 'linear' | 'radial'
  gradientColor1: string
  gradientColor2: string
  logoUrl?: string
  logoSize: number
  logoMargin: number
  hideBackgroundDots: boolean
  frameStyle: 'none' | 'bottom-banner' | 'top-banner' | 'card'
  frameText: string
  frameColor: string
  frameTextColor: string
}

export interface StandeeOptions {
  organizationName: string
  headerSubtitle: string
  callToAction: string
  footerNote: string
  paperSize: 'a4' | 'a5'
}
