const openingTime = '10:00'
const closingTime = '22:00'

export const site = {
  name: 'CHERKA',
  descriptor: 'BARBER CLUB',
  city: 'Москва',
  address: 'ул. Покровка, 31',
  phone: '+7 (495) 120-45-50',
  phoneHref: '+74951204550',
  openingTime,
  closingTime,
  hours: `Ежедневно · ${openingTime}–${closingTime}`,
  instagram: 'https://www.instagram.com/',
  telegram: 'https://t.me/',
  whatsapp: 'https://wa.me/74951204550',
} as const
