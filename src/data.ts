export type Service = { id: string; title: string; category: 'Стрижки' | 'Борода' | 'Комплексы'; description: string; price: number; duration: number; image: string }
export type Barber = { id: string; name: string; specialty: string; experience: number; rating: number; image: string }

export const services: Service[] = [
  { id: 'classic', title: 'Мужская стрижка', category: 'Стрижки', description: 'Форма, которая работает на вас. Консультация, стрижка и укладка.', price: 2500, duration: 60, image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=85' },
  { id: 'fade', title: 'Fade / skin fade', category: 'Стрижки', description: 'Идеальный переход и чёткие линии. Внимание к каждому миллиметру.', price: 2800, duration: 60, image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=900&q=85' },
  { id: 'beard', title: 'Моделирование бороды', category: 'Борода', description: 'Форма и контур под черты лица. Горячее полотенце, уход и стайлинг.', price: 1800, duration: 45, image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=85' },
  { id: 'combo', title: 'Стрижка + борода', category: 'Комплексы', description: 'Цельный образ и максимум внимания к деталям — за один визит.', price: 3900, duration: 90, image: 'https://images.unsplash.com/photo-1622286346003-cf4a3e44e8c5?auto=format&fit=crop&w=900&q=85' },
  { id: 'kids', title: 'Детская стрижка', category: 'Стрижки', description: 'Спокойно, бережно и со вкусом. Для джентльменов до 12 лет.', price: 1800, duration: 45, image: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=900&q=85' },
  { id: 'shave', title: 'Королевское бритьё', category: 'Борода', description: 'Классическое бритьё шаветкой и ритуал с горячими полотенцами.', price: 2200, duration: 45, image: 'https://images.unsplash.com/photo-1593702295094-aea8c6a4c5d9?auto=format&fit=crop&w=900&q=85' },
]

export const barbers: Barber[] = [
  { id: 'alex', name: 'Александр', specialty: 'Классика · Fade', experience: 8, rating: 4.9, image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=760&q=85' },
  { id: 'max', name: 'Максим', specialty: 'Борода · Текстура', experience: 6, rating: 5.0, image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=760&q=85' },
  { id: 'artem', name: 'Артём', specialty: 'Современные формы', experience: 5, rating: 4.9, image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=760&q=85' },
]

export const gallery = [
  { src: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1100&q=85', alt: 'Барбер за работой в CHERKA', shape: 'tall' },
  { src: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=900&q=85', alt: 'Точная мужская стрижка', shape: 'wide' },
  { src: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=85', alt: 'Моделирование бороды', shape: 'normal' },
  { src: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=900&q=85', alt: 'Стрижка fade', shape: 'normal' },
  { src: 'https://images.unsplash.com/photo-1622286346003-cf4a3e44e8c5?auto=format&fit=crop&w=1000&q=85', alt: 'Интерьер барбершопа', shape: 'wide' },
]

export const reviews = [
  { name: 'Дмитрий К.', date: '12 мая 2025', rating: 5, text: 'Наконец-то нашёл своего барбера. Александр с первого раза понял, что мне нужно. Атмосфера — отдельное удовольствие.' },
  { name: 'Андрей М.', date: '8 мая 2025', rating: 5, text: 'Сервис на уровне лучших мест Москвы. Записался онлайн за минуту, приняли вовремя. Вернусь и уже рекомендую друзьям.' },
  { name: 'Максим Р.', date: '2 мая 2025', rating: 5, text: 'Делал стрижку и бороду — результат безупречный. Видно, что мастера действительно любят своё дело.' },
]

export const faqs = [
  { question: 'Нужно ли записываться заранее?', answer: 'Советуем записаться заранее, особенно на вечер и выходные. Онлайн-запись занимает меньше минуты; если появится свободное время, мы покажем его сразу.' },
  { question: 'Можно ли прийти со своей идеей стрижки?', answer: 'Конечно. Покажите фотографию — мастер обсудит, как адаптировать форму и укладку под ваш тип волос и образ жизни.' },
  { question: 'Что если я опаздываю?', answer: 'Позвоните нам по номеру +7 (495) 120-45-50. Мы постараемся сохранить запись или подберём ближайшее удобное время.' },
  { question: 'Принимаете ли вы оплату картой?', answer: 'Да, принимаем банковские карты и оплату по QR-коду. Оплата производится после услуги.' },
]
