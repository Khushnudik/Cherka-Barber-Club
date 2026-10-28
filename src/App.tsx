import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  Clock3, Instagram, MapPin, Menu, MessageCircle, Phone, Quote, Scissors, ShieldCheck, Sparkles, Star, X,
} from 'lucide-react'
import { barbers, faqs, gallery, reviews, services } from './data'
import { createRemoteBookingAdapter, getAvailableTimes, getBookingDates, getLocalDate, submitBooking, type BookingAdapter, type BookingRequest } from './booking'
import { site } from './site'

const formatPrice = (price: number) => `${price.toLocaleString('ru-RU')} ₽`
const readableDate = (value: string) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' }).format(new Date(`${value}T12:00:00`))
const dateLabel = (value: string) => new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`))
const categories = ['Все', 'Стрижки', 'Борода', 'Комплексы'] as const
const bookingAdapter: BookingAdapter = import.meta.env.VITE_BOOKING_API_URL
  ? createRemoteBookingAdapter(import.meta.env.VITE_BOOKING_API_URL)
  : submitBooking

function useReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('.reveal')
    if (typeof IntersectionObserver === 'undefined') {
      elements.forEach(element => element.classList.add('is-visible'))
      return
    }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target) }
    }), { threshold: 0.12 })
    elements.forEach(element => observer.observe(element))
    return () => observer.disconnect()
  }, [])
}

function Brand({ light = false }: { light?: boolean }) {
  return <a href="#home" className={`brand${light ? ' brand-light' : ''}`} aria-label={`${site.name} — на главную`}><span className="brand-mark"><span>C</span></span><span className="brand-word"><b>{site.name}</b><small>{site.descriptor}</small></span></a>
}

function SectionHeading({ eyebrow, title, description, centered = false }: { eyebrow: string; title: ReactNode; description?: ReactNode; centered?: boolean }) {
  return <div className={`section-heading reveal${centered ? ' center' : ''}`}><span className="eyebrow"><i />{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>
}

function Header({ onBooking }: { onBooking: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 35)
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const close = () => setMenuOpen(false)
  return <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
    <div className="header-inner"><a href="#home" className="brand" onClick={close}><span className="brand-mark"><span>C</span></span><span className="brand-word"><b>{site.name}</b><small>{site.descriptor}</small></span></a>
      <nav className={`main-nav${menuOpen ? ' open' : ''}`} aria-label="Основная навигация">{[['#about','О нас'],['#services','Услуги'],['#barbers','Барберы'],['#gallery','Атмосфера'],['#contacts','Контакты']].map(([href,label]) => <a href={href} key={href} onClick={close}>{label}</a>)}<a href={`tel:${site.phoneHref}`} className="mobile-phone">{site.phone}</a></nav>
      <div className="header-actions"><a className="header-phone" href={`tel:${site.phoneHref}`}><Phone size={14}/>{site.phone}</a><button className="button button-gold header-cta" onClick={onBooking}>Записаться <ArrowUpRight size={15}/></button></div>
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={menuOpen}>{menuOpen ? <X/> : <Menu/>}</button>
    </div>
  </header>
}

function BookingModal({ initialService, onClose }: { initialService?: string; onClose: () => void }) {
  const [step, setStep] = useState(initialService ? 2 : 1)
  const [serviceId, setServiceId] = useState(initialService ?? '')
  const [barberId, setBarberId] = useState('any')
  const dates = useMemo(() => getBookingDates(14), [])
  const [date, setDate] = useState(() => dates[0] ?? getLocalDate(new Date()))
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState<{ id: string; assignedBarber: string; status: string } | null>(null)
  const modalRef = useRef<HTMLElement>(null)
  const closeRef = useRef(onClose)
  const submittingRef = useRef(submitting)
  const service = services.find(item => item.id === serviceId)
  const availableTimes = useMemo(() => getAvailableTimes(date, service, barberId), [date, service, barberId])
  const labels = ['Услуга', 'Мастер', 'Дата', 'Время', 'Контакты']

  useEffect(() => { closeRef.current = onClose }, [onClose])
  useEffect(() => { submittingRef.current = submitting }, [submitting])

  useEffect(() => {
    document.body.classList.add('modal-open')
    const initialFocus = modalRef.current?.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled])')
    initialFocus?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submittingRef.current) closeRef.current()
      if (event.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(modalRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'))
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (first && last && event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (first && last && !event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => { document.body.classList.remove('modal-open'); window.removeEventListener('keydown', onKey) }
  }, [])

  const next = () => {
    setError('')
    if (step === 1 && !service) return setError('Пожалуйста, выберите услугу.')
    if (step === 4 && !time) return setError('Пожалуйста, выберите удобное время.')
    setStep(value => Math.min(5, value + 1))
  }
  const back = () => { setError(''); setStep(value => Math.max(1, value - 1)) }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('')
    if (!name.trim()) return setError('Укажите ваше имя.')
    if (!consent) return setError('Подтвердите согласие на обработку данных для связи по записи.')
    const cleanPhone = phone.replace(/[^\d+]/g, '')
    if (cleanPhone.replace(/\D/g, '').length < 10) return setError('Проверьте номер телефона — нужно не менее 10 цифр.')
    if (!service || !time) return setError('Проверьте, что выбраны услуга и время.')
    setSubmitting(true)
    const request: BookingRequest = { name: name.trim(), phone: cleanPhone, serviceId, barberId, date, time }
    try {
      const result = await bookingAdapter(request)
      const assigned = barberId === 'any' ? barbers.find(item => item.id === result.barberId)?.name ?? 'Команда CHERKA' : barbers.find(item => item.id === barberId)?.name ?? 'Команда CHERKA'
      setConfirmation({ id: result.id.slice(0, 8).toUpperCase(), assignedBarber: assigned, status: result.status })
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Не удалось сохранить запись. Попробуйте ещё раз.')
    } finally { setSubmitting(false) }
  }

  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !submitting) onClose() }} role="presentation">
    <section ref={modalRef} className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title" aria-describedby={step === 5 && !confirmation ? 'booking-mode-note' : undefined}>
      <div className="booking-modal-top"><Brand/><button className="icon-button modal-close" aria-label="Закрыть форму" onClick={onClose}><X size={19}/></button></div>
      {confirmation ? <div className="booking-success"><div className="success-icon"><CheckCircle2 size={35}/></div><span className="eyebrow"><i/> {confirmation.status === 'confirmed' && bookingAdapter !== submitBooking ? 'СЕРВЕР ПОДТВЕРДИЛ ЗАПИСЬ' : confirmation.status === 'pending' ? 'ЗАЯВКА ОЖИДАЕТ ПОДТВЕРЖДЕНИЯ' : 'СОХРАНЕНА ДЕМО-ЗАЯВКА'}</span><h2>{confirmation.status === 'confirmed' && bookingAdapter !== submitBooking ? 'До встречи.' : 'Заявка сохранена.'}</h2><p>Спасибо, {name}! {confirmation.status === 'confirmed' && bookingAdapter !== submitBooking ? 'Сервер подтвердил запись. Если потребуется уточнить детали визита, мы с вами свяжемся.' : confirmation.status === 'pending' ? 'Заявка передана серверу и ожидает подтверждения. Позвоните нам, чтобы уточнить статус.' : 'Демо-запись сохранена только на этом устройстве, не в барбершопе. Пожалуйста, позвоните, чтобы подтвердить визит.'}</p><div className="confirmation-details"><div><span>УСЛУГА</span><b>{service?.title}</b></div><div><span>МАСТЕР</span><b>{confirmation.assignedBarber}</b></div><div><span>ДАТА И ВРЕМЯ</span><b>{readableDate(date)}, {time}</b></div><div><span>НОМЕР ЗАЯВКИ</span><b>#{confirmation.id}</b></div></div><a href={`tel:${site.phoneHref}`} className="button button-gold full-button"><Phone size={16}/> Подтвердить по телефону</a><button className="text-button close-success" onClick={onClose}>Вернуться на сайт <ArrowRight size={15}/></button><p className="backend-note"><ShieldCheck size={14}/>{confirmation.status === 'confirmed' && bookingAdapter !== submitBooking ? ' Подтверждено сервером' : confirmation.status === 'pending' ? ' Ожидает подтверждения · позвоните в барбершоп' : ' Сохранено локально · не подтверждено'}</p></div> : <>
        <div className="booking-heading"><span className="eyebrow"><i/> ОНЛАЙН-ЗАПИСЬ</span><h2 id="booking-title">Ваш следующий<br/><em>точный образ.</em></h2><p>Шаг {step} из 5 <span>·</span> {labels[step - 1]}</p><div className="progress-track" role="progressbar" aria-valuemin={1} aria-valuemax={5} aria-valuenow={step} aria-label={`Шаг ${step} из 5`}>{labels.map((label, index) => <div key={label} className={`progress-step${index < step ? ' active' : ''}`}><span/><small>{label}</small></div>)}</div></div><form onSubmit={submit} noValidate>
          {step === 1 && <div className="wizard-content"><h3>Выберите услугу</h3><div className="wizard-services">{services.map(item => <button type="button" key={item.id} onClick={() => { setServiceId(item.id); setError('') }} className={`wizard-service${serviceId === item.id ? ' selected' : ''}`}><span><b>{item.title}</b><small>{item.duration} мин · {formatPrice(item.price)}</small></span><span className="radio-mark">{serviceId === item.id && <Check size={14}/>}</span></button>)}</div></div>}
          {step === 2 && <div className="wizard-content"><h3>Выберите барбера</h3><div className="wizard-barbers"><button type="button" className={`wizard-barber any-barber${barberId === 'any' ? ' selected' : ''}`} onClick={() => setBarberId('any')}><span className="any-avatar"><Scissors size={21}/></span><span><b>Любой мастер</b><small>Подберём того, кто свободен</small></span><span className="radio-mark">{barberId === 'any' && <Check size={14}/>}</span></button>{barbers.map(item => <button key={item.id} type="button" className={`wizard-barber${barberId === item.id ? ' selected' : ''}`} onClick={() => setBarberId(item.id)}><img src={item.image} alt=""/><span><b>{item.name}</b><small>{item.specialty}</small></span><span className="radio-mark">{barberId === item.id && <Check size={14}/>}</span></button>)}</div></div>}
          {step === 3 && <div className="wizard-content"><h3>Когда вам удобно?</h3><div className="date-strip">{dates.map((item, index) => <button key={item} type="button" onClick={() => { setDate(item); setTime(''); setError('') }} className={`date-chip${date === item ? ' selected' : ''}`}><small>{index === 0 ? 'СЕГОДНЯ' : index === 1 ? 'ЗАВТРА' : new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(new Date(`${item}T12:00:00`)).toUpperCase()}</small><b>{dateLabel(item)}</b></button>)}</div><div className="selected-day">{readableDate(date)} <span>· {site.hours.split('·')[1]}</span></div><p className="step-helper">{availableTimes.length ? `Есть свободное время: ${availableTimes.length} вариантов. Выберите время на следующем шаге.` : 'На эту дату свободных записей нет. Выберите другой день.'}</p></div>}
          {step === 4 && <div className="wizard-content"><h3>Свободное время</h3><p className="step-helper">{readableDate(date)} · {barberId === 'any' ? 'Любой мастер' : barbers.find(item => item.id === barberId)?.name} · {service?.title}</p><div className="time-grid time-grid-large">{availableTimes.length ? availableTimes.map(slot => <button type="button" key={slot} onClick={() => { setTime(slot); setError('') }} className={`time-chip${time === slot ? ' selected' : ''}`}>{slot}</button>) : <div className="empty-slots"><Clock3 size={20}/><span>На эту дату свободного времени нет. Вернитесь и выберите другой день.</span></div>}</div><div className="booking-recap"><CalendarDays size={15}/><span>{readableDate(date)}{time ? `, ${time}` : ''}</span><span>·</span><span>{service && formatPrice(service.price)}</span></div></div>}
          {step === 5 && <div className="wizard-content"><h3>Оставьте контакты</h3><p className="step-helper" id="booking-mode-note">{bookingAdapter === submitBooking ? 'Демо-режим: заявка сохранится только на этом устройстве, не отправится в барбершоп.' : 'Укажите ваш номер, чтобы мастер связался с вами для подтверждения записи.'}</p><label className="form-label" htmlFor="booking-name">Ваше имя</label><input id="booking-name" autoComplete="name" className="form-input" placeholder="Например, Александр" value={name} onChange={event => setName(event.target.value)} required maxLength={70}/><label className="form-label" htmlFor="booking-phone">Номер телефона</label><input id="booking-phone" autoComplete="tel" className="form-input" type="tel" placeholder="+7 (___) ___-__-__" value={phone} onChange={event => { const value = event.target.value; if (value.length <= 24) setPhone(value) }} required/><div className="booking-recap"><CalendarDays size={15}/><span>{service?.title} · {barberId === 'any' ? 'Любой мастер' : barbers.find(item => item.id === barberId)?.name}</span><span>·</span><span>{readableDate(date)}, {time}</span><b>{service && formatPrice(service.price)}</b></div><label className="consent-note"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} required/><span>Согласен на обработку персональных данных для связи по записи.</span></label><p className="demo-disclosure"><ShieldCheck size={14}/>{bookingAdapter === submitBooking ? ' Заявка будет сохранена только в этом браузере. Сервер не настроен.' : ' Запись отправляется на настроенный сервер бронирования.'}</p></div>}
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="wizard-actions">{step > 1 && <button type="button" className="button button-outline back-button" onClick={back}><ChevronLeft size={16}/> Назад</button>}{step < 5 ? <button type="button" className="button button-gold next-button" onClick={next}>Продолжить <ArrowRight size={15}/></button> : <button type="submit" disabled={submitting} className="button button-gold next-button">{submitting ? 'Сохраняем заявку…' : 'Подтвердить запись'}{!submitting && <ArrowRight size={15}/>}</button>}</div>
        </form><div className="booking-footnote"><ShieldCheck size={14}/> Без предоплаты <span>·</span> Без обязательств</div></>}
    </section></div>
}

function App() {
  const [bookingOpen, setBookingOpen] = useState(false)
  const [bookingService, setBookingService] = useState<string | undefined>()
  const [category, setCategory] = useState<string>('Все')
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  useReveal()
  const filteredServices = category === 'Все' ? services : services.filter(item => item.category === category)
  const openBooking = (serviceId?: string) => { setBookingService(serviceId); setBookingOpen(true) }

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightbox(null)
      if (event.key === 'ArrowRight') setLightbox(value => value === null ? null : (value + 1) % gallery.length)
      if (event.key === 'ArrowLeft') setLightbox(value => value === null ? null : (value - 1 + gallery.length) % gallery.length)
    }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('modal-open')
    return () => { window.removeEventListener('keydown', onKey); document.body.classList.remove('modal-open') }
  }, [lightbox])

  return <>
    <Header onBooking={() => openBooking()}/>
    <main>
      <section className="hero" id="home"><div className="hero-image"/><div className="hero-shade"/><div className="hero-grain"/><div className="hero-inner"><div className="hero-copy"><span className="eyebrow reveal"><i/> {site.city.toUpperCase()} · BARBER CLUB</span><h1 className="reveal">ТВОЙ СТИЛЬ.<br/>ТВОИ <em>ПРАВИЛА.</em></h1><p className="hero-lead reveal">Мужская территория точности. Профессиональный уход, сильная команда и атмосфера, к которой хочется возвращаться.</p><div className="hero-actions reveal"><button onClick={() => openBooking()} className="button button-gold hero-book">Записаться онлайн <ArrowUpRight size={17}/></button><a className="button button-ghost" href="#services">Наши услуги <ArrowDown size={15}/></a></div><div className="hero-rating reveal"><div className="rating-stars">★★★★★</div><span><b>4.9</b> на основе демонстрационных отзывов</span><span className="rating-divider"/><span className="open-now"><i/> Открыты до {site.closingTime}</span></div></div><div className="hero-caption"><span>01 / 03</span><span className="caption-line"/><span>THE ART OF GENTLEMAN</span></div></div><a className="scroll-indicator" href="#about" aria-label="Прокрутить к разделу о нас"><span/> SCROLL TO EXPLORE</a></section>

      <p className="template-notice">Демонстрационная концепция · адреса, контакты, фотографии и профили мастеров замените перед публикацией</p><p className="template-notice">Демонстрационная концепция · адреса, контакты, фотографии и профили мастеров замените перед публикацией</p><section className="ticker" aria-label="Наш подход"><div className="ticker-track">{Array.from({ length: 4 }, (_, i) => <span key={i}>МУЖСКАЯ ТЕРРИТОРИЯ <i>✳</i> ТОЧНОСТЬ В КАЖДОЙ ДЕТАЛИ <i>✳</i> ФОРМА И ХАРАКТЕР <i>✳</i> {site.name} BARBER CLUB <i>✳</i></span>)}</div></section>

      <section className="section about-section" id="about"><div className="container about-grid"><div className="about-image-wrap reveal"><img className="about-image" src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1000&q=85" alt="Рабочее место барбера в премиальном барбершопе" loading="lazy"/><div className="image-label"><span className="brand-mark"><span>C</span></span><div><b>ХАРАКТЕР — В ДЕТАЛЯХ</b><small>EST. 2016 · MOSCOW</small></div></div><span className="about-image-index">№ 001</span></div><div className="about-copy"><SectionHeading eyebrow="О НАС · CHERKA" title={<>Мастерство, которое<br/><em>чувствуется.</em></>} description="CHERKA — больше, чем место для стрижки. Это точка, где стиль становится частью характера, а каждый визит начинается с внимания к вам."/><div className="about-points reveal"><div className="about-point"><span>01</span><div><b>Своя эстетика</b><p>Подбираем форму под вас. Не тренд, а точное попадание.</p></div></div><div className="about-point"><span>02</span><div><b>Деталь за деталью</b><p>Внимание, которое видно в отражении и чувствуется каждый день.</p></div></div><div className="about-point"><span>03</span><div><b>Пространство своих</b><p>Кофе, хорошая музыка и время, которое принадлежит вам.</p></div></div></div><a href="#barbers" className="text-link reveal">Познакомиться с командой <ArrowRight size={15}/></a></div></div></section>
      <section className="stats-band"><div className="container stats-grid">{[{ value: String(services.length), suffix: '', label: 'услуг в демонстрационном меню' }, { value: String(barbers.length), suffix: '', label: 'демонстрационных профиля мастеров' }, { value: `${Math.min(...services.map(item => item.duration))}–${Math.max(...services.map(item => item.duration))}`, suffix: 'мин', label: 'длительность услуг в меню' }, { value: site.openingTime, suffix: `–${site.closingTime}`, label: 'демонстрационные часы работы' }].map(item => <div className="stat-item reveal" key={item.label}><b>{item.value}<em>{item.suffix}</em></b><span>{item.label}</span></div>)}</div></section>

      <section className="section services-section" id="services"><div className="container"><div className="services-top"><SectionHeading eyebrow="МЕНЮ · 01" title={<>Точность в каждой<br/><em>детали.</em></>} description="Никаких лишних жестов. Только мастерство, правильная форма и результат, который говорит за вас."/><a href="#booking" className="text-link services-book-link" onClick={event => { event.preventDefault(); openBooking() }}>Подобрать услугу <ArrowRight size={15}/></a></div><div className="category-tabs" role="group" aria-label="Фильтр услуг">{categories.map(item => <button key={item} aria-pressed={category === item} className={`category-tab${category === item ? ' active' : ''}`} onClick={() => setCategory(item)}>{item}<span>{item === 'Все' ? services.length : services.filter(service => service.category === item).length}</span></button>)}</div><div className="service-grid">{filteredServices.map((item, index) => <article className="service-card reveal" key={item.id} style={{ animationDelay: `${index * 70}ms` }}><button className="service-photo" onClick={() => openBooking(item.id)} aria-label={`Записаться на услугу «${item.title}»`}><img src={item.image} alt={item.title} loading="lazy"/><span className="service-photo-overlay"><span>ЗАПИСАТЬСЯ <ArrowUpRight size={16}/></span></span><span className="service-index">0{services.indexOf(item) + 1}</span></button><div className="service-card-info"><div className="service-name-row"><h3>{item.title}</h3><span>{formatPrice(item.price)}</span></div><p>{item.description}</p><div className="service-meta"><span><Clock3 size={13}/> {item.duration} минут</span><button onClick={() => openBooking(item.id)}>ВЫБРАТЬ <ArrowRight size={13}/></button></div></div></article>)}</div><div className="services-foot"><span>* Все цены указаны в рублях. Консультация мастера входит в стоимость.</span><button className="button button-gold" onClick={() => openBooking()}>Выбрать время <ArrowRight size={15}/></button></div></div></section>

      <section className="statement-band"><div className="statement-photo"/><div className="statement-content reveal"><span className="eyebrow"><i/> THE GENTLEMAN'S CODE</span><blockquote>Стиль — это не то,<br/>что ты носишь.<br/><em>Это то, как ты себя несёшь.</em></blockquote><button onClick={() => openBooking()} className="text-link">Записаться в CHERKA <ArrowRight size={15}/></button></div><span className="statement-no">C. 01</span></section>

      <section className="section barbers-section" id="barbers"><div className="container"><div className="barbers-top"><SectionHeading eyebrow="КОМАНДА · 02" title={<>Мужчины дела.<br/><em>Мастера слова.</em></>} description="Настоящие имена и специализации мастеров можно указать в каталоге. Перед запуском замените демонстрационные профили своей командой."/><span className="barbers-aside"><Star size={15} fill="currentColor"/><b>4.9 / 5</b><small>РЕЙТИНГ КОМАНДЫ</small></span></div><div className="barbers-grid">{barbers.map((barber, index) => <article className="barber-card reveal" key={barber.id}><div className="barber-photo"><img src={barber.image} alt={`Барбер ${barber.name}`} loading="lazy"/><div className="barber-overlay"><button onClick={() => openBooking()} aria-label={`Записаться к мастеру ${barber.name}`}><ArrowUpRight/></button></div><span className="barber-rating"><Star size={12} fill="currentColor"/>{barber.rating.toFixed(1)}</span></div><div className="barber-info"><span className="barber-index">BARBER · 0{index + 1}</span><h3>{barber.name}</h3><span className="barber-specialty">{barber.specialty}</span><div className="barber-footer"><span>{barber.experience} ЛЕТ ОПЫТА</span><button onClick={() => openBooking()}>ВЫБРАТЬ <ArrowUpRight size={13}/></button></div></div></article>)}</div></div></section>

      <section className="section gallery-section" id="gallery"><div className="container"><div className="gallery-top"><SectionHeading eyebrow="АТМОСФЕРА · 03" title={<>Здесь всё <em>на своём месте.</em></>} description="Хороший результат начинается с пространства. Своё кресло, свой ритм, свои люди."/><a className="social-link" href={site.instagram} target="_blank" rel="noreferrer"><Instagram size={17}/><span>ПОДПИСАТЬСЯ В INSTAGRAM</span><ArrowUpRight size={14}/></a></div><div className="gallery-grid">{gallery.map((item, index) => <button className={`gallery-item ${item.shape} reveal`} key={item.src} onClick={() => setLightbox(index)} aria-label={`Открыть фотографию: ${item.alt}`}><img src={item.src} alt={item.alt} loading="lazy"/><span className="gallery-zoom"><ArrowUpRight size={20}/></span><small>CHERKA · 0{index + 1}</small></button>)}</div></div></section>

      <section className="reviews-section"><div className="container"><div className="reviews-top"><SectionHeading eyebrow="СЛОВА ГОСТЕЙ · 04" title={<>Говорят за <em>себя.</em></>}/><div className="review-summary"><div className="rating-stars">★★★★★</div><b>4.9 / 5</b><span>Демонстрационный рейтинг</span></div></div><div className="reviews-grid">{reviews.map(review => <article key={review.name} className="review-card reveal"><div className="review-card-top"><Quote size={20}/><div className="rating-stars">{'★'.repeat(review.rating)}</div></div><p>«{review.text}»</p><div className="review-author"><span className="review-avatar">{review.name[0]}</span><div><b>{review.name}</b><small>{review.date} · ПРИМЕР ОТЗЫВА</small></div></div></article>)}</div><a href={site.instagram} target="_blank" rel="noreferrer" className="reviews-source">Примеры отзывов. Замените перед запуском. <span>Мы в Instagram <ArrowUpRight size={14}/></span></a></div></section>

      <section className="faq-section section"><div className="container faq-grid"><SectionHeading eyebrow="FAQ · 05" title={<>Частые<br/><em>вопросы.</em></>} description="Ничего лишнего. Ответы на то, что важно перед визитом."/><div className="faq-list">{faqs.map((item, index) => <article className={`faq-item${openFaq === index ? ' open' : ''}`} key={item.question}><button aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)}><span><small>0{index + 1}</small>{item.question}</span><ChevronDown size={17}/></button><div className="faq-answer"><p>{item.answer}</p></div></article>)}</div></div></section>

      <section className="booking-banner" id="booking"><div className="booking-banner-image"/><div className="booking-banner-inner container reveal"><span className="eyebrow"><i/> ВРЕМЯ ДЛЯ СЕБЯ</span><h2>Твой образ ждёт.<br/><em>Твоё кресло тоже.</em></h2><p>Выбери мастера, время — и оставь заявку. Серверное подтверждение появится после подключения backend.</p><button className="button button-gold" onClick={() => openBooking()}>Записаться онлайн <ArrowUpRight size={16}/></button><span className="booking-banner-note"><ShieldCheck size={14}/> Без предоплаты · Отмена — по телефону</span></div><span className="booking-banner-side">RESERVE YOUR CHAIR · MOSCOW · {site.name} ·</span></section>

      <section className="section contact-section" id="contacts"><div className="container"><div className="contacts-top"><SectionHeading eyebrow="НАЙТИ СВОИХ · 06" title={<>Дверь <em>открыта.</em></>} description="Будем рядом, когда вам удобно. В самом центре — и всегда на связи."/><button className="button button-outline" onClick={() => openBooking()}>Записаться к нам <ArrowUpRight size={15}/></button></div><div className="contact-grid"><div className="contact-detail-list"><div className="contact-detail"><span className="contact-icon"><MapPin size={18}/></span><div><small>НАШ АДРЕС</small><b>{site.city}, {site.address}</b><span>Укажите фактический ориентир и станцию метро перед публикацией</span><a href={`https://maps.google.com/?q=${encodeURIComponent(`${site.city}, ${site.address}`)}`} target="_blank" rel="noreferrer">Построить маршрут <ArrowUpRight size={13}/></a></div></div><div className="contact-detail"><span className="contact-icon"><Phone size={17}/></span><div><small>МЫ НА СВЯЗИ</small><a className="contact-main-link" href={`tel:${site.phoneHref}`}>{site.phone}</a><span>Ответим на вопросы и поможем выбрать время</span></div></div><div className="contact-detail"><span className="contact-icon"><Clock3 size={18}/></span><div><small>КОГДА ЖДЁМ</small><b>{site.hours}</b><span>Последняя запись — за час до закрытия</span></div></div><div className="contact-socials"><a href={site.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={17}/></a><a href={site.telegram} target="_blank" rel="noreferrer" aria-label="Telegram"><MessageCircle size={17}/></a><a href={site.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp"><Phone size={16}/></a><span>СЛЕДИТЕ ЗА НАМИ</span></div></div><div className="map-card"><iframe title="Демонстрационная карта: адрес CHERKA в Москве" src={`https://maps.google.com/maps?q=${encodeURIComponent(`${site.city}, ${site.address}`)}&t=&z=14&ie=UTF8&iwloc=&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/><a href={`https://maps.google.com/?q=${encodeURIComponent(`${site.city}, ${site.address}`)}`} target="_blank" rel="noreferrer" className="map-label"><span className="map-pin"><MapPin size={17}/></span><span><b>{site.name} BARBER CLUB</b><small>{site.address} · МОСКВА</small></span><ArrowUpRight size={16}/></a></div></div></div></section>
    </main>

    <footer className="footer"><div className="container"><div className="footer-main"><div className="footer-brand"><Brand light/><p>Для тех, кто выбирает не просто стрижку.<br/>Для тех, кто знает себе цену.</p><div className="footer-socials"><a href={site.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={16}/></a><a href={site.telegram} target="_blank" rel="noreferrer" aria-label="Telegram"><MessageCircle size={16}/></a><a href={site.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp"><Phone size={15}/></a></div></div><div className="footer-nav"><b>НАВИГАЦИЯ</b><a href="#about">О нас</a><a href="#services">Услуги</a><a href="#barbers">Барберы</a><a href="#gallery">Атмосфера</a><a href="#contacts">Контакты</a></div><div className="footer-contact"><b>НАЙТИ CHERKA</b><span><MapPin size={13}/> {site.city}, {site.address}</span><a href={`tel:${site.phoneHref}`}><Phone size={13}/> {site.phone}</a><span><Clock3 size={13}/> {site.hours}</span><button onClick={() => openBooking()}>Записаться онлайн <ArrowUpRight size={14}/></button></div><div className="footer-newsletter"><span className="eyebrow"><i/> БЫТЬ В КУРСЕ</span><h3>Без лишнего.<br/><em>Только своё.</em></h3><p>Новые работы, события и поводы заглянуть к нам.</p><a className="newsletter-link" href={site.instagram} target="_blank" rel="noreferrer">Следить за новостями <ArrowUpRight size={14}/></a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} CHERKA BARBER CLUB. ВСЕ ПРАВА ЗАЩИЩЕНЫ.</span><span>СДЕЛАНО С ХАРАКТЕРОМ <Sparkles size={12}/></span><a href="#home">НАВЕРХ ↑</a></div><div className="footer-wordmark">{site.name}</div></div></footer>

    {bookingOpen && <BookingModal initialService={bookingService} onClose={() => { setBookingOpen(false); setBookingService(undefined) }}/>}
    {lightbox !== null && <div className="lightbox" role="dialog" aria-modal="true" aria-label="Просмотр фотографии" onMouseDown={event => { if (event.target === event.currentTarget) setLightbox(null) }}><button className="icon-button lightbox-close" onClick={() => setLightbox(null)} aria-label="Закрыть фотографию"><X/></button><button className="lightbox-nav prev" onClick={() => setLightbox((lightbox - 1 + gallery.length) % gallery.length)} aria-label="Предыдущая фотография"><ChevronLeft/></button><figure><img src={gallery[lightbox].src.replace('w=1100', 'w=1800').replace('w=1000', 'w=1800').replace('w=900', 'w=1800')} alt={gallery[lightbox].alt}/><figcaption>{gallery[lightbox].alt} <span>0{lightbox + 1} / 0{gallery.length}</span></figcaption></figure><button className="lightbox-nav next" onClick={() => setLightbox((lightbox + 1) % gallery.length)} aria-label="Следующая фотография"><ChevronRight/></button></div>}
  </>
}

export default App
