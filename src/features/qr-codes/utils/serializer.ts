import {
  QrContentType,
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
} from '../types'

export function serializeQrData(
  type: QrContentType,
  data: {
    upi: UpiFormData
    url: UrlFormData
    vcard: VcardFormData
    whatsapp: WhatsappFormData
    wifi: WifiFormData
    text: TextFormData
    phone: PhoneFormData
    email: EmailFormData
    location: LocationFormData
    event: EventFormData
  }
): string {
  switch (type) {
    case 'upi': {
      const { vpa, payeeName, amount, transactionNote } = data.upi
      if (!vpa) return 'upi://pay'
      const params = new URLSearchParams()
      params.append('pa', vpa.trim())
      if (payeeName.trim()) params.append('pn', payeeName.trim())
      if (amount.trim() && !isNaN(Number(amount)) && Number(amount) > 0) {
        params.append('am', Number(amount).toFixed(2))
      }
      params.append('cu', 'INR')
      if (transactionNote.trim()) params.append('tn', transactionNote.trim())
      return `upi://pay?${params.toString()}`
    }

    case 'url': {
      const rawUrl = data.url.url.trim()
      if (!rawUrl) return 'https://organization.local'
      if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
        return `https://${rawUrl}`
      }
      return rawUrl
    }

    case 'vcard': {
      const v = data.vcard
      const fullName = `${v.firstName} ${v.lastName}`.trim() || 'Contact Person'
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${v.lastName};${v.firstName};;;`,
        `FN:${fullName}`,
        v.organization ? `ORG:${v.organization}` : '',
        v.title ? `TITLE:${v.title}` : '',
        v.phone ? `TEL;TYPE=CELL:${v.phone}` : '',
        v.email ? `EMAIL;TYPE=INTERNET:${v.email}` : '',
        v.website ? `URL:${v.website}` : '',
        v.address ? `ADR;TYPE=WORK:;;${v.address};;;;` : '',
        'END:VCARD',
      ]
        .filter(Boolean)
        .join('\n')
    }

    case 'whatsapp': {
      const { countryCode, phone, message } = data.whatsapp
      const cleanCode = countryCode.replace(/\D/g, '') || '91'
      const cleanPhone = phone.replace(/\D/g, '')
      if (!cleanPhone) return 'https://wa.me/'
      const fullPhone = cleanPhone.startsWith(cleanCode) ? cleanPhone : `${cleanCode}${cleanPhone}`
      const encodedMsg = encodeURIComponent(message || '')
      return encodedMsg
        ? `https://wa.me/${fullPhone}?text=${encodedMsg}`
        : `https://wa.me/${fullPhone}`
    }

    case 'wifi': {
      const { ssid, password, encryption, hidden } = data.wifi
      if (!ssid) return 'WIFI:S:MyNetwork;;'
      const enc = encryption === 'nopass' ? 'nopass' : encryption
      return `WIFI:T:${enc};S:${ssid};P:${password || ''};H:${hidden ? 'true' : 'false'};;`
    }

    case 'text': {
      return data.text.text || 'Enterprise QR Portal'
    }

    case 'phone': {
      const p = data.phone.phoneNumber.trim()
      return p ? `tel:${p}` : 'tel:+919876543210'
    }

    case 'email': {
      const { email, subject, body } = data.email
      if (!email) return 'mailto:info@organization.local'
      const params = new URLSearchParams()
      if (subject) params.append('subject', subject)
      if (body) params.append('body', body)
      const q = params.toString()
      return q ? `mailto:${email}?${q}` : `mailto:${email}`
    }

    case 'location': {
      const { latitude, longitude } = data.location
      const lat = latitude.trim() || '27.5750'
      const lng = longitude.trim() || '77.6740'
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    }

    case 'event': {
      const e = data.event
      const formatIcsDate = (d: string) => {
        if (!d) return '20260101T000000Z'
        return new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      }
      return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Organization QR Management//EN',
        'BEGIN:VEVENT',
        `SUMMARY:${e.title || 'Temple Program / Event'}`,
        e.location ? `LOCATION:${e.location}` : '',
        e.description ? `DESCRIPTION:${e.description}` : '',
        `DTSTART:${formatIcsDate(e.startDate)}`,
        `DTEND:${formatIcsDate(e.endDate || e.startDate)}`,
        'END:VEVENT',
        'END:VCALENDAR',
      ]
        .filter(Boolean)
        .join('\n')
    }

    default:
      return 'https://organization.local'
  }
}
