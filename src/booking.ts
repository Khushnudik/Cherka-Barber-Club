import { services, type Service } from './data'
import { site } from './site'

export type BookingRequest = { name: string; phone: string; serviceId: string; barberId: string; date: string; time: string }
export type BookingRecord = BookingRequest & { id: string; status: 'confirmed'; createdAt: string }
export type BookingAdapter = (request: BookingRequest) => Promise<{ id: string; status: string; barberId: string }>
export type BookingDay = { date: string; openMinute: number; closeMinute: number; closed: boolean }
export type SlotReservation = { date: string; startMinute: number; duration: number; barberId: string }

/** Server contract: resolve the business opening hours and exceptions for a given date. */
export type BookingAvailabilityProvider = (date: string) => Promise<BookingDay>
/** Server contract: atomically test and reserve the selected provider's full appointment interval. */
export type SlotReservationProvider = (slot: SlotReservation) => Promise<boolean>

export const createRemoteBookingAdapter = (endpoint: string, fetcher: typeof fetch = fetch): BookingAdapter => async request => {
  const response = await fetcher(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  const result = await response.json().catch(() => null) as { id?: string; status?: string; barberId?: string; error?: string } | null
  if (!response.ok || !result?.id || !result.barberId) {
    throw new Error(result?.error || 'Не удалось сохранить запись. Попробуйте ещё раз.')
  }
  return { id: result.id, status: result.status ?? 'pending', barberId: result.barberId }
}

const STORAGE_KEY = 'cherka-bookings-v1'
const TAKEN_KEY = 'cherka-booking-slots-v1'
const defaultSchedule: BookingDay = {
  date: '',
  openMinute: Number(site.openingTime.slice(0, 2)) * 60 + Number(site.openingTime.slice(3, 5)),
  closeMinute: Number(site.closingTime.slice(0, 2)) * 60 + Number(site.closingTime.slice(3, 5)),
  closed: false,
}
const openingHour = defaultSchedule.openMinute / 60
const closingHour = defaultSchedule.closeMinute / 60

export const getLocalDate = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getBookingDates = (days = 14) => Array.from({ length: days }, (_, index) => {
  const date = new Date()
  date.setDate(date.getDate() + index)
  return getLocalDate(date)
})

export const getAvailableTimes = (date: string, service: Service | undefined, barberId: string) => {
  if (!service) return []
  const taken = getTakenSlots()
  const interval = 30
  const slots = [] as string[]
  for (let minutes = openingHour * 60; minutes + service.duration <= closingHour * 60; minutes += interval) {
    const time = `${`${Math.floor(minutes / 60)}`.padStart(2, '0')}:${`${minutes % 60}`.padStart(2, '0')}`
    const candidates = barberId === 'any' ? ['alex', 'max', 'artem'] : [barberId]
    const available = candidates.some(candidate => !hasConflict(taken, date, minutes, service.duration, candidate))
    if (available && !taken.includes(`${date}|${time}|any`)) slots.push(time)
  }
  if (date === getLocalDate(new Date())) {
    const now = new Date()
    const minTime = now.getHours() * 60 + now.getMinutes() + 60
    return slots.filter(time => {
      const [hour, minute] = time.split(':').map(Number)
      return hour * 60 + minute >= minTime
    })
  }
  return slots
}

const getTakenSlots = (): string[] => {
  try {
    const stored = localStorage.getItem(TAKEN_KEY)
    return stored ? JSON.parse(stored) as string[] : []
  } catch {
    return []
  }
}

const setTakenSlots = (slots: string[]) => {
  localStorage.setItem(TAKEN_KEY, JSON.stringify(slots))
}

const hasConflict = (taken: string[], date: string, startMinutes: number, duration: number, barberId: string) => {
  for (let minutes = startMinutes; minutes < startMinutes + duration; minutes += 30) {
    const time = `${`${Math.floor(minutes / 60)}`.padStart(2, '0')}:${`${minutes % 60}`.padStart(2, '0')}`
    if (taken.includes(`${date}|${time}|${barberId}`) || taken.includes(`${date}|${time}|any`)) return true
  }
  return false
}

const availableMaster = (request: BookingRequest, service: Service, taken: string[]) => {
  const startMinutes = Number(request.time.slice(0, 2)) * 60 + Number(request.time.slice(3, 5))
  return ['alex', 'max', 'artem'].find(barberId => !hasConflict(taken, request.date, startMinutes, service.duration, barberId))
}

const reserveSlot = (slots: string[], request: BookingRequest, barberId: string, service: Service) => {
  const startMinutes = Number(request.time.slice(0, 2)) * 60 + Number(request.time.slice(3, 5))
  const additions: string[] = []
  for (let minutes = startMinutes; minutes < startMinutes + service.duration; minutes += 30) {
    additions.push(`${request.date}|${`${Math.floor(minutes / 60)}`.padStart(2, '0')}:${`${minutes % 60}`.padStart(2, '0')}|${barberId}`)
  }
  return [...slots, ...additions]
}

const getBookings = (): BookingRecord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) as BookingRecord[] : []
  } catch {
    return []
  }
}

/** Replace with a Supabase Edge Function or your booking API when a backend is configured. */
export const submitBooking: BookingAdapter = async request => {
  await new Promise(resolve => window.setTimeout(resolve, 450))
  const service = services.find(item => item.id === request.serviceId)
  if (!service) throw new Error('Услуга больше недоступна. Пожалуйста, выберите другую.')
  if (request.barberId !== 'any' && !['alex', 'max', 'artem'].includes(request.barberId)) {
    throw new Error('Выберите мастера из списка.')
  }
  if (!/^\d{2}:\d{2}$/.test(request.time)) throw new Error('Проверьте выбранное время.')
  const [selectedHour, selectedMinute] = request.time.split(':').map(Number)
  if (selectedMinute >= 60 || selectedHour * 60 + selectedMinute < defaultSchedule.openMinute || selectedHour * 60 + selectedMinute + service.duration > defaultSchedule.closeMinute) {
    throw new Error('Выберите время работы барбершопа с учётом длительности услуги.')
  }
  const dates = getBookingDates()
  if (!dates.includes(request.date)) throw new Error('Выберите дату в ближайшие 14 дней.')
  const times = getAvailableTimes(request.date, service, request.barberId)
  const taken = getTakenSlots()
  if (!times.includes(request.time)) throw new Error('Это время уже занято. Пожалуйста, выберите другое.')
  const assignedBarberId = request.barberId === 'any' ? availableMaster(request, service, taken) : request.barberId
  if (!assignedBarberId) throw new Error('Сейчас нет свободных мастеров на это время. Пожалуйста, выберите другое.')
  try {
    const record: BookingRecord = { ...request, barberId: assignedBarberId, id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`, status: 'confirmed', createdAt: new Date().toISOString() }
    const updatedBookings = [...getBookings(), record]
    const updatedSlots = reserveSlot(taken, request, assignedBarberId, service)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBookings))
    try {
      setTakenSlots(updatedSlots)
    } catch (storageError) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(getBookings().filter(booking => booking.id !== record.id)))
      throw storageError
    }
    return { id: record.id, status: record.status, barberId: assignedBarberId }
  } catch {
    throw new Error('Не удалось сохранить заявку в этом браузере. Освободите место в хранилище и попробуйте ещё раз.')
  }
}
