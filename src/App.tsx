import { useState, useMemo, useEffect, useCallback, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea, BarChart, Bar, Cell } from 'recharts';
import { Droplet, Zap, Flame, CheckCircle, TrendingUp, Mail, Phone, MapPin, Lightbulb, UserPlus, Scale, Briefcase, BarChart3, FileCheck, Shield, Landmark, Users, Building2, Megaphone, FlaskConical, Link2, Trophy } from 'lucide-react';

// --- Новые данные для кросс-анализа (Слайд 5) ---
const multiResourceData = [
  { name: '00:00', electricity: 0.3, water: 5, gas: 0.02 },
  { name: '01:00', electricity: 0.2, water: 5, gas: 0.02 },
  { name: '02:00', electricity: 0.2, water: 5, gas: 0.02 },
  { name: '03:00', electricity: 0.2, water: 5, gas: 0.02 },
  { name: '04:00', electricity: 0.2, water: 5, gas: 0.02 },
  { name: '05:00', electricity: 0.3, water: 10, gas: 0.05 },
  { name: '06:00', electricity: 0.5, water: 20, gas: 0.15 },
  { name: '07:00', electricity: 0.9, water: 150, gas: 0.8 }, // Утренний пик
  { name: '08:00', electricity: 0.8, water: 80, gas: 0.4 },
  { name: '09:00', electricity: 0.6, water: 15, gas: 0.1 },
  { name: '10:00', electricity: 0.5, water: 10, gas: 0.05 },
  { name: '11:00', electricity: 0.5, water: 10, gas: 0.05 },
  { name: '12:00', electricity: 0.6, water: 30, gas: 0.3 },
  { name: '13:00', electricity: 0.7, water: 25, gas: 0.35 }, // Обед
  { name: '14:00', electricity: 0.6, water: 15, gas: 0.1 },
  { name: '15:00', electricity: 0.6, water: 10, gas: 0.05 },
  { name: '16:00', electricity: 0.7, water: 10, gas: 0.05 },
  { name: '17:00', electricity: 0.9, water: 15, gas: 0.1 },
  { name: '18:00', electricity: 1.2, water: 40, gas: 0.5 },
  { name: '19:00', electricity: 1.5, water: 90, gas: 0.9 }, // Вечерний пик
  { name: '20:00', electricity: 1.3, water: 50, gas: 0.7 },
  { name: '21:00', electricity: 1.1, water: 20, gas: 0.2 },
  { name: '22:00', electricity: 0.9, water: 15, gas: 0.1 },
  { name: '23:00', electricity: 0.5, water: 10, gas: 0.05 },
];

// Помесячные данные для обычных счётчиков (электричество)
const monthlyElectricityData = [
  { month: 'Янв', kwh: 360 },
  { month: 'Фев', kwh: 300 },
  { month: 'Мар', kwh: 260 },
  { month: 'Апр', kwh: 240 },
  { month: 'Май', kwh: 220 },
  { month: 'Июн', kwh: 210 },
  { month: 'Июл', kwh: 240 },
  { month: 'Авг', kwh: 250 },
  { month: 'Сен', kwh: 230 },
  { month: 'Окт', kwh: 260 },
  { month: 'Ноя', kwh: 320 },
  { month: 'Дек', kwh: 380 },
];

// Недельные данные по воде (литры/день)
const waterWeeklyData = [
  { day: 'Пн', liters: 380 },
  { day: 'Вт', liters: 390 },
  { day: 'Ср', liters: 410 },
  { day: 'Чт', liters: 650 }, // душ/моющие работы
  { day: 'Пт', liters: 420 },
  { day: 'Сб', liters: 780 }, // уборка/души семьи (пик)
  { day: 'Вс', liters: 430 },
];

// Доп. данные
// const weeklySavingsData = [
//   { name: 'Неделя 1', savings: 0 },
//   { name: 'Неделя 2', savings: 350 },
//   { name: 'Неделя 3', savings: 800 },
//   { name: 'Неделя 4', savings: 1250 },
// ];

// удалены comparisonData/COLORS после удаления слайда сравнения

// --- Компонент-макет смартфона ---
const PhoneMockup = ({ imageUrl, altText }: { imageUrl: string; altText: string }) => (
  <div className="relative mx-auto border-gray-600 bg-gray-800 border-[8px] rounded-[2.5rem] h-[450px] w-[220px] md:h-[500px] md:w-[250px] shadow-xl">
    <div className="w-[100px] h-[18px] bg-gray-600 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
    <div className="h-[32px] w-[3px] bg-gray-600 absolute -left-[11px] top-[72px] rounded-l-lg"></div>
    <div className="h-[32px] w-[3px] bg-gray-600 absolute -left-[11px] top-[124px] rounded-l-lg"></div>
    <div className="h-[48px] w-[3px] bg-gray-600 absolute -right-[11px] top-[100px] rounded-r-lg"></div>
    <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white">
      <img
        src={imageUrl}
        className="w-full h-full object-cover object-center"
        alt={altText}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src = 'https://placehold.co/400x800/1a202c/ffffff?text=Image+Error';
        }}
      />
    </div>
  </div>
);

// --- Компоненты Слайдов ---

const Slide1_Title = () => (
  <div className="flex flex-col items-center justify-center h-full text-center text-white p-8">
    <div className="w-24 h-24 md:w-32 md:h-32 mb-6">
      <img src="/images/main_logo.png" alt="Логотип ESEP" className="object-contain w-full h-full" />
    </div>
    <h1 className="text-6xl md:text-8xl font-bold text-cyan-300 tracking-wider">ESEP AI</h1>
    <p className="mt-4 text-xl md:text-2xl max-w-3xl">
      Национальная цифровая платформа для повышения энергоэффективности и осознанного потребления.
    </p>
    <p className="mt-8 text-lg md:text-xl bg-white/20 px-6 py-2 rounded-full">
      Готовый инструмент для достижения стратегических целей Казахстана.
    </p>
  </div>
);

const Slide2_StatePriorities = () => (
  <div className="p-8 md:p-12 text-white h-full flex flex-col justify-center">
    <h2 className="text-3xl md:text-5xl font-bold text-cyan-300 mb-10 text-center">Государственные Приоритеты</h2>
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div className="bg-white/10 p-6 rounded-lg flex items-start gap-4">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <BarChart3 className="text-cyan-300" />
        </div>
        <div>
          <h3 className="text-xl md:text-2xl font-semibold mb-2">Снижение энергоемкости ВВП</h3>
          <p className="text-gray-300 md:text-lg">Наша платформа — практический инструмент для снижения этого показателя на уровне конечного потребителя.</p>
        </div>
      </div>
      <div className="bg-white/10 p-6 rounded-lg flex items-start gap-4">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileCheck className="text-cyan-300" />
        </div>
        <div>
          <h3 className="text-xl md:text-2xl font-semibold mb-2">Исполнение Нац. Программ</h3>
          <p className="text-gray-300 md:text-lg">ESEP способствует целям Концепции энергосбережения и программе Цифровой Казахстан.</p>
        </div>
      </div>
      <div className="bg-white/10 p-6 rounded-lg flex items-start gap-4">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="text-cyan-300" />
        </div>
        <div>
          <h3 className="text-xl md:text-2xl font-semibold mb-2">Социальная Стабильность</h3>
          <p className="text-gray-300 md:text-lg">Помогаем гражданам сократить расходы, снижая финансовую нагрузку.</p>
        </div>
      </div>
    </div>
  </div>
);

const Slide3_Comparison_Qualitative = () => (
  <div className="p-8 md:p-12 text-white h-full flex flex-col">
    <h2 className="text-3xl md:text-4xl font-bold text-cyan-300 mb-8 text-center">Сравнительный анализ моделей потребления</h2>
    <div className="grid md:grid-cols-3 gap-6 flex-grow">
      <div className="bg-white/10 p-6 rounded-lg border-l-4 border-cyan-400">
        <h3 className="text-2xl font-semibold mb-3 flex items-center"><Landmark className="mr-2 text-cyan-300" />Казахстан</h3>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-center gap-2"><Flame className="text-orange-400 h-4 w-4" />Высокая энергоёмкость.</li>
          <li className="flex items-center gap-2"><Zap className="text-yellow-300 h-4 w-4" />Низкие стимулы к экономии.</li>
          <li className="flex items-center gap-2"><Building2 className="text-cyan-300 h-4 w-4" />Слабые регуляции/инерция.</li>
          <li className="flex items-center gap-2"><Lightbulb className="text-yellow-300 h-4 w-4" />Потенциал быстрых улучшений.</li>
        </ul>
      </div>
      <div className="bg-white/10 p-6 rounded-lg border-l-4 border-emerald-400">
        <h3 className="text-2xl font-semibold mb-3 flex items-center"><Scale className="mr-2 text-emerald-300" />Европа</h3>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-center gap-2"><CheckCircle className="text-emerald-300 h-4 w-4" />Сильная политика и нормы.</li>
          <li className="flex items-center gap-2"><Users className="text-cyan-300 h-4 w-4" />Высокое экосознание.</li>
          <li className="flex items-center gap-2"><TrendingUp className="text-cyan-300 h-4 w-4" />Стабильная эффективность.</li>
          <li className="flex items-center gap-2"><Lightbulb className="text-yellow-300 h-4 w-4" />Фокус на устойчивость.</li>
        </ul>
      </div>
      <div className="bg-white/10 p-6 rounded-lg border-l-4 border-orange-400">
        <h3 className="text-2xl font-semibold mb-3 flex items-center"><FlaskConical className="mr-2 text-orange-300" />США</h3>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-center gap-2"><TrendingUp className="text-cyan-300 h-4 w-4" />Инновации компенсируют спрос.</li>
          <li className="flex items-center gap-2"><Link2 className="text-orange-300 h-4 w-4" />Быстрые внедрения smart‑технологий.</li>
          <li className="flex items-center gap-2"><Building2 className="text-cyan-300 h-4 w-4" />Рыночные драйверы.</li>
          <li className="flex items-center gap-2"><Lightbulb className="text-yellow-300 h-4 w-4" />Рост осознанного потребления.</li>
        </ul>
      </div>
    </div>
  </div>
);

const Slide4_HowItHelps = () => (
  <div className="p-6 md:p-8 text-white h-full flex flex-col overflow-hidden">
    <h2 className="text-3xl md:text-4xl font-bold text-cyan-300 mb-4 text-center">ESEP: Мост между Государством и Гражданами</h2>
    {/* Cropped image: cut 100px top/bottom, fit inside 1920x1080 */}
    <div className="w-full max-w-4xl mx-auto mb-4 overflow-hidden rounded-lg shadow-2xl" style={{ height: '460px' }}>
      <img
        src="/images/slide5.png"
        alt="Мост ESEP"
        className="w-full object-cover"
        style={{ height: '520px', objectPosition: 'center center' }}
      />
    </div>
    <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
      <div className="flex-1 bg-white/10 p-6 rounded-lg">
        <h3 className="text-2xl font-semibold mb-4 text-center flex items-center justify-center gap-2" role="presentation"><Building2 className="text-cyan-300" />Для Государства и Госкомпаний</h3>
        <ul className="space-y-3 text-gray-300">
          <li className="flex items-start gap-2">
            <BarChart3 className="text-cyan-400 mt-1 flex-shrink-0" />Сбор точных, почасовых данных для прогнозирования и
            планирования нагрузки на сети.
          </li>
          <li className="flex items-start gap-2">
            <Zap className="text-yellow-300 mt-1 flex-shrink-0" />Инструмент управления спросом для сглаживания пиковых
            нагрузок.
          </li>
          <li className="flex items-start gap-2">
            <Megaphone className="text-cyan-400 mt-1 flex-shrink-0" />Прямой канал коммуникации с потребителями для
            информирования о госпрограммах.
          </li>
        </ul>
      </div>
      <div className="flex-1 bg-white/10 p-6 rounded-lg">
        <h3 className="text-2xl font-semibold mb-4 text-center flex items-center justify-center gap-2" role="presentation"><Users className="text-cyan-300" />Для Граждан</h3>
        <ul className="space-y-3 text-gray-300">
          <li className="flex items-start gap-2">
            <CheckCircle className="text-cyan-400 mt-1 flex-shrink-0" />Реальная экономия семейного бюджета за счет выявления
            скрытых перерасходов.
          </li>
          <li className="flex items-start gap-2">
            <Lightbulb className="text-yellow-300 mt-1 flex-shrink-0" />Прозрачность и понимание, на что уходит каждый
            киловатт-час.
          </li>
          <li className="flex items-start gap-2">
            <Trophy className="text-cyan-400 mt-1 flex-shrink-0" />Вовлеченность в процесс экономии через геймификацию и
            персональные цели.
          </li>
        </ul>
      </div>
    </div>
  </div>
);

const Slide5_LiveDemo_CrossAnalysis = () => {
  const [showInsight, setShowInsight] = useState(false);
  const [visibility, setVisibility] = useState({
    electricity: true,
    water: true,
    gas: true,
  });

  type ResourceKey = 'electricity' | 'water' | 'gas';

  useEffect(() => {
    const timer = setTimeout(() => setShowInsight(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const toggleVisibility = (key: ResourceKey) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-4 md:p-8 text-white h-full flex flex-col">
      <h2 className="text-3xl md:text-4xl font-bold text-cyan-300 mb-4 text-center">
        Продукт в Действии: Кросс-ресурсный AI-Анализ
      </h2>
      <div className="flex-grow w-full bg-white/10 rounded-lg p-4 relative flex flex-col">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={multiResourceData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" />
            <XAxis dataKey="name" stroke="white" />
            <YAxis
              yAxisId="left"
              stroke="#63b3ed"
              label={{ value: 'кВт⋅ч / м³', angle: -90, position: 'insideLeft', fill: '#63b3ed' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#4fd1c5"
              label={{ value: 'Литры', angle: 90, position: 'insideRight', fill: '#4fd1c5' }}
            />
            <Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }} />
            <Legend content={() => null} />
            {visibility.electricity && (
              <Line yAxisId="left" type="monotone" dataKey="electricity" name="Электричество (кВт⋅ч)" stroke="#63b3ed" strokeWidth={2} dot={false} />
            )}
            {visibility.gas && (
              <Line yAxisId="left" type="monotone" dataKey="gas" name="Газ (м³)" stroke="#f6ad55" strokeWidth={2} dot={false} />
            )}
            {visibility.water && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="water"
                name="Вода (л)"
                stroke="#4fd1c5"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
              />
            )}
            {showInsight && <ReferenceArea yAxisId="left" x1="07:00" x2="08:00" stroke="red" strokeOpacity={0.5} />}
          </LineChart>
        </ResponsiveContainer>
        {showInsight && (
          <div className="absolute top-1/4 left-1/4 transform -translate-x-1/4 -translate-y-1/4 bg-red-800/90 text-white p-4 rounded-lg shadow-2xl max-w-sm animate-fade-in border-2 border-red-400 z-10">
            <h4 className="font-bold text-lg mb-2">Кросс-ресурсный AI-Анализ!</h4>
            <p className="text-sm">
              В <strong>07:00</strong> зафиксирован одновременный пик потребления <strong>воды (150 л)</strong> и <strong>газа (0.8 м³)</strong>.
            </p>
            <p className="text-sm mt-2">
              <strong>Вероятный сценарий:</strong> утренний душ и приготовление завтрака. Длительность пика на 20% выше вашего среднего показателя.
            </p>
            <p className="text-sm mt-2 font-semibold text-yellow-300">
              <strong>Рекомендация:</strong> Сокращение времени в душе на 2 минуты может сэкономить до <strong>3 000 тенге</strong> в месяц на счетах за воду и газ.
            </p>
          </div>
        )}
      </div>
      <div className="flex justify-center items-center space-x-4 mt-4">
        <button
          onClick={() => toggleVisibility('electricity')}
          className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${visibility.electricity ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}`}
        >
          <Zap className="inline-block mr-2 h-4 w-4" />Электричество
        </button>
        <button
          onClick={() => toggleVisibility('water')}
          className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${visibility.water ? 'bg-teal-500 text-white' : 'bg-gray-700 text-gray-400'}`}
        >
          <Droplet className="inline-block mr-2 h-4 w-4" />Вода
        </button>
        <button
          onClick={() => toggleVisibility('gas')}
          className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${visibility.gas ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-400'}`}
        >
          <Flame className="inline-block mr-2 h-4 w-4" />Газ
        </button>
      </div>
    </div>
  );
};

// Устаревший слайд, заменён обновлённой версией

const Slide7_PartnershipModel = () => (
  <div className="p-8 md:p-12 text-white">
    <h2 className="text-3xl md:text-4xl font-bold text-cyan-300 mb-8">Модель Сотрудничества</h2>
    <p className="text-lg mb-8 text-center">
      Приложение ESEP всегда будет <strong>бесплатным для граждан</strong>. Наша устойчивость основана на партнерстве с
      государством и бизнесом.
    </p>
    <div className="grid md:grid-cols-2 gap-8">
      <div className="bg-white/10 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">B2G (Business-to-Government)</h3>
        <ul className="list-disc list-inside text-gray-300">
          <li>Контракты на предоставление анонимных аналитических отчетов.</li>
          <li>Использование платформы как канала для информирования населения.</li>
        </ul>
      </div>
      <div className="bg-white/10 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">B2B (Business-to-Business)</h3>
        <ul className="list-disc list-inside text-gray-300">
          <li>Подписка для энергокомпаний на дашборды для анализа и управления спросом.</li>
          <li>Лицензии для застройщиков для интеграции SANA в системы "умного дома".</li>
        </ul>
      </div>
    </div>
  </div>
);

// Устаревший слайд команды заменён новой версией

// Устаревший слайд просьбы заменён новой версией

const Slide10_Roadmap = () => (
  <div className="p-8 md:p-12 text-white">
    <h2 className="text-3xl md:text-4xl font-bold text-cyan-300 mb-8 text-center">Дорожная Карта Партнерства</h2>
    <div className="relative border-l-2 border-cyan-400 ml-4">
      <div className="mb-8 ml-8">
        <div className="absolute -left-4 mt-1.5 h-7 w-7 bg-cyan-400 rounded-full border-4 border-gray-800"></div>
        <h3 className="text-lg font-semibold text-cyan-300">1-3 Месяцы</h3>
        <p className="text-gray-300">Подписание меморандумов, запуск инфо-кампании. Цель: 100,000 пользователей.</p>
      </div>
      <div className="mb-8 ml-8">
        <div className="absolute -left-4 mt-1.5 h-7 w-7 bg-cyan-400 rounded-full border-4 border-gray-800"></div>
        <h3 className="text-lg font-semibold text-cyan-300">4-9 Месяцы</h3>
        <p className="text-gray-300">Расширение пилотных проектов на 5 крупных городов, анализ результатов. Цель: 500,000 пользователей.</p>
      </div>
      <div className="ml-8">
        <div className="absolute -left-4 mt-1.5 h-7 w-7 bg-cyan-400 rounded-full border-4 border-gray-800"></div>
        <h3 className="text-lg font-semibold text-cyan-300">10-12 Месяцы</h3>
        <p className="text-gray-300">Планирование общенационального развертывания, интеграция с госсистемами. Цель: 1,000,000 пользователей.</p>
      </div>
    </div>
  </div>
);

const Slide11_Contacts = () => (
  <div className="flex flex-col items-center justify-center h-full text-center text-white p-8">
    <h1 className="text-5xl md:text-7xl font-bold text-cyan-300 tracking-wider">ESEP</h1>
    <p className="mt-4 text-xl md:text-2xl max-w-3xl">Давайте вместе построим цифровой и энергоэффективный Казахстан.</p>
    <div className="mt-12 bg-white/10 p-8 rounded-lg text-left space-y-4">
      <h3 className="text-2xl font-bold text-center">[Имя Фамилия], CEO</h3>
      <div className="flex items-center">
        <Mail className="mr-3 text-cyan-400" /> email@esep.kz
      </div>
      <div className="flex items-center">
        <Phone className="mr-3 text-cyan-400" /> +7 7XX XXX XX XX
      </div>
      <div className="flex items-center">
        <MapPin className="mr-3 text-cyan-400" /> esep.kz
      </div>
    </div>
  </div>
);

// --- Основной компонент приложения ---
export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Массив компонентов-слайдов
  const Slide7_Demo_Dashboard = () => (
    <div className="p-8 md:p-12 text-white h-full flex flex-col md:flex-row items-center justify-center gap-8">
      <div className="md:w-1/2 text-center md:text-left">
        <h2 className="text-3xl md:text-4xl font-bold text-cyan-300 mb-4">Демо 2: Главный Дашборд</h2>
        <p className="text-lg text-gray-300 mb-4">Наглядная и понятная сводка по всем ресурсам. Пользователь сразу видит общую картину, прогноз расходов и свой индекс эффективности.</p>
        <p className="text-gray-400">Скриншот берётся из папки images.</p>
      </div>
      <div className="md:w-1/2 flex justify-center">
        <PhoneMockup imageUrl="/images/slide7.png" altText="Скриншот главного дашборда приложения ESEP" />
      </div>
    </div>
  );

  const Slide8_Demo_Details = () => (
    <div className="p-8 md:p-12 text-white h-full flex flex-col md:flex-row-reverse items-center justify-center gap-8">
      <div className="md:w-1/2 text-center md:text-left">
        <h2 className="text-3xl md:text-4xl font-bold text-cyan-300 mb-4">Демо 3: Детальный Анализ</h2>
        <p className="text-lg text-gray-300 mb-4">Почасовые графики позволяют углубиться в детали и понять свои паттерны потребления. AI автоматически подсвечивает аномалии и важные моменты.</p>
        <p className="text-gray-400">Скриншот возьмём из папки images.</p>
      </div>
      <div className="md:w-1/2 flex justify-center">
        <PhoneMockup imageUrl="/images/slide8.png" altText="Скриншот экрана аналитики приложения ESEP" />
      </div>
    </div>
  );

  // Демо 4: Умные рекомендации — удалён по запросу

  const Slide10_Demo_Gamification = () => (
    <div className="p-8 md:p-12 text-white h-full flex flex-col md:flex-row items-center justify-center gap-8">
      <div className="md:w-1/2 text-center md:text-left">
        <h2 className="text-3xl md:text-4xl font-bold text-cyan-300 mb-4">Демо 5: Вовлечение и Геймификация</h2>
        <p className="text-lg text-gray-300 mb-4">Челленджи, рейтинги и достижения превращают экономию в увлекательный процесс. Пользователи соревнуются с соседями и получают награды за успехи.</p>
        <p className="text-gray-400">Скриншот возьмём из папки images.</p>
      </div>
      <div className="md:w-1/2 flex justify-center">
        <PhoneMockup imageUrl="/images/slide10.png" altText="Скриншот экрана геймификации приложения ESEP" />
      </div>
    </div>
  );

  // Новый слайд: Анализ обычных счётчиков помесячно
  const Slide_MonthlyBasic = () => {
    const [showInsight, setShowInsight] = useState(false);
    useEffect(() => {
      const t = setTimeout(() => setShowInsight(true), 1500);
      return () => clearTimeout(t);
    }, []);
    return (
      <div className="p-6 md:p-10 text-white h-full flex flex-col">
        <h2 className="text-3xl md:text-4xl font-bold text-cyan-300 mb-4 text-center">Продукт в действии: Обычные счётчики (помесячно)</h2>
        <p className="text-center text-gray-300 mb-4">Даже без почасовых данных видны сезонность и аномалии. Мы помогаем выявлять пики и давать простые рекомендации.</p>
        <div className="flex-1 w-full bg-white/10 rounded-lg p-4 relative">
          <div className="pointer-events-none w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyElectricityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                <XAxis dataKey="month" stroke="white" />
                <YAxis stroke="white" />
                {/* Без Tooltip/Legend; подсветка отключена */}
                <ReferenceArea x1="Дек" x2="Дек" fill="red" fillOpacity={0.1} stroke="red" strokeOpacity={0.5} />
                <ReferenceArea x1="Янв" x2="Янв" fill="red" fillOpacity={0.1} stroke="red" strokeOpacity={0.5} />
                <Bar dataKey="kwh" name="Электроэнергия (кВт⋅ч)" fill="#22d3ee" isAnimationActive={false}>
                  {monthlyElectricityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.kwh > 300 ? '#f59e0b' : '#22d3ee'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {showInsight && (
            <div className="absolute top-1/4 left-2/3 transform -translate-x-1/3 -translate-y-1/4 bg-red-800/90 text-white p-4 rounded-lg shadow-2xl max-w-sm animate-fade-in border-2 border-red-400 z-10">
              <h4 className="font-bold mb-1">Сезонный пик</h4>
              <p className="text-sm">Декабрь–январь выше нормы. Советы: утепление, настройки отопления, оптимизация бойлера.</p>
            </div>
          )}
        </div>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <div className="bg-white/10 p-4 rounded-lg">
            <h4 className="font-semibold mb-1 flex items-center gap-2"><TrendingUp className="text-cyan-300" />Сезонные пики</h4>
            <p className="text-sm text-gray-300">Зима (дек–янв) — повышенное потребление. Рекомендация: утепление окон/дверей, проверка режимов отопления.</p>
          </div>
          <div className="bg-white/10 p-4 rounded-lg">
            <h4 className="font-semibold mb-1 flex items-center gap-2"><Lightbulb className="text-yellow-300" />Быстрые победы</h4>
            <p className="text-sm text-gray-300">LED‑лампы, отключение из розетки неиспользуемых приборов — до 10% экономии.</p>
          </div>
          <div className="bg-white/10 p-4 rounded-lg">
            <h4 className="font-semibold mb-1 flex items-center gap-2"><CheckCircle className="text-cyan-400" />Аномалии</h4>
            <p className="text-sm text-gray-300">Внезапный рост в межсезонье — проверяем настройки бойлера/кондиционера.</p>
          </div>
        </div>
      </div>
    );
  };

  // Новый слайд: Анализ отдельного ресурса (вода)
  const Slide_WaterInsights = () => {
    const [showInsight, setShowInsight] = useState(false);
    useEffect(() => {
      const t = setTimeout(() => setShowInsight(true), 1500);
      return () => clearTimeout(t);
    }, []);
    return (
      <div className="p-6 md:p-10 text-white h-full flex flex-col">
        <h2 className="text-3xl md:text-4xl font-bold text-cyan-300 mb-4 text-center">Анализ ресурса: Вода</h2>
        <p className="text-center text-gray-300 mb-4">Выявляем утечки, неэффективные привычки и даём прикладные рекомендации.</p>
        <div className="flex-1 w-full bg-white/10 rounded-lg p-4 relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={waterWeeklyData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
              <XAxis dataKey="day" stroke="white" />
              <YAxis stroke="white" />
              <Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }} />
              <Legend />
              <ReferenceArea x1="Чт" x2="Сб" fill="red" fillOpacity={0.06} stroke="red" strokeOpacity={0.4} />
              <Line type="monotone" dataKey="liters" name="Литры/день" stroke="#4fd1c5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          {showInsight && (
            <div className="absolute top-1/4 left-1/3 transform -translate-x-1/3 -translate-y-1/4 bg-red-800/90 text-white p-4 rounded-lg shadow-2xl max-w-sm animate-fade-in border-2 border-red-400 z-10">
              <h4 className="font-bold mb-1">Пик расхода воды</h4>
              <p className="text-sm">Чт–Сб: повышенная нагрузка (уборка/души). Советы: аэраторы на смесителях, экономичные насадки для душа, контроль длительности.</p>
            </div>
          )}
        </div>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <div className="bg-white/10 p-4 rounded-lg">
            <h4 className="font-semibold mb-1 flex items-center gap-2"><Droplet className="text-cyan-300" />Утечки</h4>
            <p className="text-sm text-gray-300">Ночной стабильно ровный расход — признак подтекания бачка/крана. Рекомендация: замена арматуры.</p>
          </div>
          <div className="bg-white/10 p-4 rounded-lg">
            <h4 className="font-semibold mb-1 flex items-center gap-2"><Flame className="text-orange-300" />Горячая вода</h4>
            <p className="text-sm text-gray-300">Снижение температуры бойлера с 80° до 60° — экономия воды и газа/электричества.</p>
          </div>
          <div className="bg-white/10 p-4 rounded-lg">
            <h4 className="font-semibold mb-1 flex items-center gap-2"><Lightbulb className="text-yellow-300" />Привычки</h4>
            <p className="text-sm text-gray-300">Душ вместо ванны, аэраторы на кранах — до 20% экономии.</p>
          </div>
        </div>
      </div>
    );
  };

  // Слайд "Казахстан в глобальном контексте" — удалён по запросу

  const Slide12_Traction_Updated = () => (
    <div className="p-8 md:p-12 text-white text-center h-full flex flex-col justify-center">
      <h2 className="text-3xl md:text-4xl font-bold text-cyan-300 mb-12">Наши Первые Достижения</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
        <div className="bg-white/10 p-6 rounded-lg flex flex-col items-center">
          <UserPlus className="h-12 w-12 text-cyan-400 mb-4" />
          <p className="text-4xl font-bold">2,000+</p>
          <p className="text-gray-300 mt-2">Пользователей за первый месяц</p>
        </div>
        <div className="bg-white/10 p-6 rounded-lg flex flex-col items-center">
          <Briefcase className="h-12 w-12 text-cyan-400 mb-4" />
          <p className="text-2xl font-bold">Успешный пилот</p>
          <p className="text-gray-300 mt-2">с лидером рынка BI Group</p>
        </div>
        <div className="bg-white/10 p-6 rounded-lg flex flex-col items-center">
          <CheckCircle className="h-12 w-12 text-cyan-400 mb-4" />
          <p className="text-2xl font-bold">Интеграции</p>
          <p className="text-gray-300 mt-2">с Астана Су Арнасы и Көкшетау Су Арнасы</p>
        </div>
        <div className="bg-white/10 p-6 rounded-lg flex flex-col items-center">
          <TrendingUp className="h-12 w-12 text-cyan-400 mb-4" />
          <p className="text-4xl font-bold">15%</p>
          <p className="text-gray-300 mt-2">Среднее снижение расходов у пользователей</p>
        </div>
      </div>
    </div>
  );

  const Slide13_PartnershipModel_New = Slide7_PartnershipModel;

  const Slide14_Team_New = () => (
    <div className="p-8 md:p-12 text-white">
      <h2 className="text-3xl md:text-4xl font-bold text-cyan-300 mb-8 text-center">Наша Команда</h2>
      <div className="grid md:grid-cols-3 gap-8 text-center">
        <div className="bg-white/10 p-6 rounded-lg">
          <img src="/images/team-ceo.png" alt="CEO" className="rounded-full mx-auto mb-4 border-4 border-cyan-400" />
          <h3 className="text-xl font-semibold">[Имя Фамилия]</h3>
          <p className="text-cyan-400">CEO</p>
          <p className="text-sm text-gray-300 mt-2">Опыт в управлении IT-проектами в Казахстане.</p>
        </div>
        <div className="bg-white/10 p-6 rounded-lg">
          <img src="/images/team-cto.png" alt="CTO" className="rounded-full mx-auto mb-4 border-4 border-cyan-400" />
          <h3 className="text-xl font-semibold">[Имя Фамилия]</h3>
          <p className="text-cyan-400">CTO</p>
          <p className="text-sm text-gray-300 mt-2">Ведущий специалист по AI и анализу больших данных.</p>
        </div>
        <div className="bg-white/10 p-6 rounded-lg">
          <img src="/images/team-gr.png" alt="GR Director" className="rounded-full mx-auto mb-4 border-4 border-cyan-400" />
          <h3 className="text-xl font-semibold">[Имя Фамилия]</h3>
          <p className="text-cyan-400">GR-директор</p>
          <p className="text-sm text-gray-300 mt-2">Опыт взаимодействия с государственными органами.</p>
        </div>
      </div>
    </div>
  );

  const Slide15_TheAsk_New = () => (
    <div className="p-8 md:p-12 text-white">
      <h2 className="text-3xl md:text-4xl font-bold text-cyan-300 mb-8 text-center">Наше Предложение: Партнерство</h2>
      <p className="text-lg mb-6 text-center">Мы не просим финансирования. Мы просим поддержки для масштабирования доказавшего свою эффективность решения на всю страну.</p>
      <div className="space-y-4">
        <div className="bg-white/10 p-4 rounded-lg flex items-center">
          <div className="bg-cyan-500 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold text-xl mr-4">1</div>
          <div>
            <h3 className="font-semibold text-lg">Информационная Поддержка</h3>
            <p className="text-sm text-gray-300">Официальный статус "Рекомендованного инструмента", совместные инфо-кампании.</p>
          </div>
        </div>
        <div className="bg-white/10 p-4 rounded-lg flex items-center">
          <div className="bg-cyan-500 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold text-xl mr-4">2</div>
          <div>
            <h3 className="font-semibold text-lg">Пилотные Проекты</h3>
            <p className="text-sm text-gray-300">Запуск совместных проектов в 2-3 регионах с поддержкой акиматов.</p>
          </div>
        </div>
        <div className="bg-white/10 p-4 rounded-lg flex items-center">
          <div className="bg-cyan-500 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold text-xl mr-4">3</div>
          <div>
            <h3 className="font-semibold text-lg">Стратегическая Интеграция</h3>
            <p className="text-sm text-gray-300">Интеграция ESEP с порталом eGov.kz, рассмотрение как национального стандарта.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const slides = useMemo<ReactElement[]>(
    () => [
      <Slide1_Title />,
      <Slide2_StatePriorities />,
      <Slide3_Comparison_Qualitative />,
      <Slide4_HowItHelps />,
      <Slide_MonthlyBasic />,
      <Slide_WaterInsights />,
      <Slide5_LiveDemo_CrossAnalysis />,
      <Slide7_Demo_Dashboard />,
      <Slide8_Demo_Details />,
      <Slide10_Demo_Gamification />,
      <Slide12_Traction_Updated />,
      <Slide13_PartnershipModel_New />,
      <Slide14_Team_New />,
      <Slide15_TheAsk_New />,
      <Slide10_Roadmap />,
      <Slide11_Contacts />,
    ],
    [],
  );

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Экспорт всех слайдов в PDF
  const exportSlidesToPdf = useCallback(async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 0; i < slides.length; i += 1) {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-10000px';
      container.style.top = '0';
      container.style.width = '1280px';
      container.style.height = '720px';
      container.style.background = '#111827';
      container.style.padding = '16px';
      container.style.boxSizing = 'border-box';
      container.style.overflow = 'hidden';
      document.body.appendChild(container);

      const root = createRoot(container);
      root.render(
        <div className="w-full h-full bg-gray-900/50 flex flex-col overflow-hidden">
          <div className="flex-grow p-4 overflow-hidden">{slides[i]}</div>
        </div>,
      );

      // дождаться рендера
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 60));

      // снимок
      // eslint-disable-next-line no-await-in-loop
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 1280,
        windowHeight: 720,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgW = pageWidth;
      const imgH = (canvas.height * imgW) / canvas.width;
      const scaledW = imgH > pageHeight ? (pageHeight * canvas.width) / canvas.height : imgW;
      const scaledH = imgH > pageHeight ? pageHeight : imgH;
      const offsetX = (pageWidth - scaledW) / 2;
      const offsetY = (pageHeight - scaledH) / 2;

      if (i > 0) doc.addPage();
      doc.addImage(imgData, 'PNG', offsetX, offsetY, scaledW, scaledH, undefined, 'FAST');

      root.unmount();
      container.remove();
    }

    doc.save('ESEP-presentation.pdf');
  }, [slides]);

  // Клики по свободной области переключают слайды, клики по интерактивным элементам игнорируются
  const handleRootClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    let el = e.target as HTMLElement | null;
    const stopAt = e.currentTarget as HTMLElement;
    while (el && el !== stopAt) {
      const tag = el.tagName.toLowerCase();
      if (
        tag === 'button' ||
        tag === 'a' ||
        tag === 'input' ||
        tag === 'select' ||
        tag === 'textarea' ||
        tag === 'label' ||
        tag === 'video' ||
        tag === 'audio' ||
        el.getAttribute('role') === 'button' ||
        el.getAttribute('data-interactive') === 'true'
      ) {
        return;
      }
      el = el.parentElement;
    }
    nextSlide();
  }, [nextSlide]);

  // Навигация клавишами влево/вправо и F11 для фуллскрина
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'ArrowRight') nextSlide();
      if (ev.key === 'ArrowLeft') prevSlide();
      if (ev.key === 'F11') {
        ev.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
      if (ev.key === 'F10') {
        ev.preventDefault();
        // fallback: window.print();
        exportSlidesToPdf();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nextSlide, prevSlide, exportSlidesToPdf]);

  // Динамический ключ для анимации перехода
  const slideKey = `slide-${currentSlide}`;

  return (
    <div className="bg-gray-800 font-sans w-full h-screen flex flex-col overflow-hidden" title="esep" role="presentation">
      <style>{`
                @keyframes slide-in {
                    from { opacity: 0; transform: translateX(50px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .slide-animate {
                    animation: slide-in 0.5s ease-out forwards;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>

      <div className="w-full h-full bg-gray-900/50 flex flex-col relative overflow-hidden" onClick={handleRootClick}>
        {/* Содержимое слайда */}
        <div key={slideKey} className="flex-grow p-4 overflow-y-auto slide-animate">
          {slides[currentSlide]}
        </div>
      </div>
      
    </div>
  );
}
