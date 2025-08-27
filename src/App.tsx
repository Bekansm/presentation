import { useState, useMemo, useEffect, useCallback, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';
import { Droplet, Zap, Flame, CheckCircle, TrendingUp, Mail, Phone, MapPin, Lightbulb, UserPlus, Scale, Briefcase, BarChart3, FileCheck, Shield, Landmark, Users, Building2, Megaphone, FlaskConical, Link2, Trophy, Globe, TrendingDown, Target, Wrench, DollarSign, Leaf, Smartphone, Heart, Send, MessageSquare } from 'lucide-react';

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

// (не используется) почасовые данные для примера электричества — удалены

// Помесячные данные по электричеству: "Схожие потребители" и "Вы" (кВт⋅ч)
// peers — усреднённое потребление схожих домохозяйств (зима выше, лето ниже)
// you — тот же профиль, но с аномалиями в Июле (AC) и Декабре (отопление/гирлянды)
const monthlyElectricityData = [
  { month: 'Янв', peers: 340, you: 360 },
  { month: 'Фев', peers: 300, you: 305 },
  { month: 'Мар', peers: 270, you: 260 },
  { month: 'Апр', peers: 250, you: 245 },
  { month: 'Май', peers: 230, you: 235 },
  { month: 'Июн', peers: 220, you: 225 },
  { month: 'Июл', peers: 230, you: 280 }, // аномалия: кондиционер/обогреватель
  { month: 'Авг', peers: 240, you: 255 },
  { month: 'Сен', peers: 250, you: 255 },
  { month: 'Окт', peers: 280, you: 295 },
  { month: 'Ноя', peers: 310, you: 330 },
  { month: 'Дек', peers: 350, you: 400 }, // аномалия: отопление/гирлянды/доп. нагрузка
];

// Почасовое потребление воды (литры/час): схожие потребители и вы
const waterHourlyData = [
  { hour: '00:00', peers: 6,  you: 8 },
  { hour: '01:00', peers: 5,  you: 8 },
  { hour: '02:00', peers: 5,  you: 10 }, // аномально выше — возможная утечка
  { hour: '03:00', peers: 5,  you: 10 }, // аномально выше — возможная утечка
  { hour: '04:00', peers: 5,  you: 8 },
  { hour: '05:00', peers: 8,  you: 10 },
  { hour: '06:00', peers: 20, you: 30 },
  { hour: '07:00', peers: 80, you: 120 }, // утренний душ — пик
  { hour: '08:00', peers: 40, you: 60 },
  { hour: '09:00', peers: 15, you: 18 },
  { hour: '10:00', peers: 12, you: 14 },
  { hour: '11:00', peers: 10, you: 12 },
  { hour: '12:00', peers: 20, you: 24 },
  { hour: '13:00', peers: 18, you: 20 },
  { hour: '14:00', peers: 15, you: 16 },
  { hour: '15:00', peers: 15, you: 16 },
  { hour: '16:00', peers: 18, you: 20 },
  { hour: '17:00', peers: 20, you: 22 },
  { hour: '18:00', peers: 40, you: 50 },
  { hour: '19:00', peers: 70, you: 90 }, // вечерние дела — пик
  { hour: '20:00', peers: 60, you: 85 },
  { hour: '21:00', peers: 30, you: 35 },
  { hour: '22:00', peers: 20, you: 22 },
  { hour: '23:00', peers: 10, you: 12 },
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
      Цифровая платформа для повышения энергоэффективности и осознанного потребления.
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
    <div className="p-8 md:p-12 text-white h-full flex flex-col justify-center">
        <h2 className="text-3xl md:text-5xl font-bold text-cyan-300 mb-12 text-center">Три модели потребления: менталитет и механизмы</h2>
        <div className="grid md:grid-cols-3 gap-8 flex-grow max-w-7xl mx-auto w-full">
            <div className="bg-white/10 p-8 rounded-lg border-l-4 border-cyan-400">
                <h3 className="text-2xl md:text-3xl font-semibold mb-4 flex items-center"><Globe className="mr-3" />Казахстан</h3>
                <p className="text-lg md:text-xl font-bold mb-3">Наследие изобилия</p>
                <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-lg border border-cyan-400/30">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingDown className="text-red-400 h-5 w-5" />
                            <span className="font-semibold text-cyan-200">Низкие цены устраняют стимулы к экономии</span>
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border border-cyan-400/30">
                        <div className="flex items-center gap-3 mb-2">
                            <BarChart3 className="text-orange-400 h-5 w-5" />
                            <span className="font-semibold text-cyan-200">Высокое потребление при низкой эффективности</span>
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border border-cyan-400/30">
                        <div className="flex items-center gap-3 mb-2">
                            <Target className="text-yellow-400 h-5 w-5" />
                            <span className="font-semibold text-cyan-200">Драйвер - экономическая необходимость, а не экология</span>
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border border-cyan-400/30">
                        <div className="flex items-center gap-3 mb-2">
                            <Wrench className="text-gray-400 h-5 w-5" />
                            <span className="font-semibold text-cyan-200">Устаревшая инфраструктура</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-white/10 p-8 rounded-lg border-l-4 border-emerald-400">
                <h3 className="text-2xl md:text-3xl font-semibold mb-4 flex items-center"><Scale className="mr-3" />Европа</h3>
                <p className="text-lg md:text-xl font-bold mb-3">Культура эффективности</p>
                <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-lg border border-emerald-400/30">
                        <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="text-green-400 h-5 w-5" />
                            <span className="font-semibold text-emerald-200">Высокие цены как постоянный стимул</span>
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border border-emerald-400/30">
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="text-blue-400 h-5 w-5" />
                            <span className="font-semibold text-emerald-200">Сильная государственная политика и регулирование</span>
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border border-emerald-400/30">
                        <div className="flex items-center gap-3 mb-2">
                            <Leaf className="text-green-400 h-5 w-5" />
                            <span className="font-semibold text-emerald-200">Глубокое экологическое сознание</span>
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border border-emerald-400/30">
                        <div className="flex items-center gap-3 mb-2">
                            <Target className="text-emerald-400 h-5 w-5" />
                            <span className="font-semibold text-emerald-200">Фокус на устойчивости и энергонезависимости</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-white/10 p-8 rounded-lg border-l-4 border-orange-400">
                <h3 className="text-2xl md:text-3xl font-semibold mb-4 flex items-center"><Zap className="mr-3" />США</h3>
                <p className="text-lg md:text-xl font-bold mb-3">Технологический подход</p>
                <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-lg border border-orange-400/30">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="text-blue-400 h-5 w-5" />
                            <span className="font-semibold text-orange-200">Высокое потребление, компенсируемое инновациями</span>
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border border-orange-400/30">
                        <div className="flex items-center gap-3 mb-2">
                            <Smartphone className="text-purple-400 h-5 w-5" />
                            <span className="font-semibold text-orange-200">Быстрое внедрение "умных" технологий</span>
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border border-orange-400/30">
                        <div className="flex items-center gap-3 mb-2">
                            <BarChart3 className="text-green-400 h-5 w-5" />
                            <span className="font-semibold text-orange-200">Рыночные силы и спрос как драйверы</span>
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border border-orange-400/30">
                        <div className="flex items-center gap-3 mb-2">
                            <Heart className="text-red-400 h-5 w-5" />
                            <span className="font-semibold text-orange-200">Растущее "осознанное потребление"</span>
                        </div>
                    </div>
                </div>
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

const Slide7_LiveDemo_CrossAnalysis = () => {
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

const Slide12_PartnershipModel = () => (
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

const Slide15_Roadmap = () => (
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

const Slide16_Contacts = () => (
  <div className="flex flex-col items-center justify-center h-full text-center text-white p-8">
    <h1 className="text-5xl md:text-7xl font-bold text-cyan-300 tracking-wider">ESEP</h1>
    <p className="mt-4 text-xl md:text-2xl max-w-3xl">Давайте вместе построим цифровой и энергоэффективный Казахстан.</p>
    <div className="mt-12 bg-white/10 p-8 rounded-lg text-left space-y-4">
      <h3 className="text-2xl font-bold text-center">Бекжан Скаков, CEO</h3>
      <div className="flex items-center">
        <Mail className="mr-3 text-cyan-400" /> bekzhan.s@esep.kz
      </div>
      <div className="flex items-center">
        <Phone className="mr-3 text-cyan-400" /> +7 701 796 66 56
      </div>
      <div className="flex items-center">
        <MapPin className="mr-3 text-cyan-400" /> esep.ai
      </div>
    </div>
  </div>
);

// --- Основной компонент приложения ---
export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Массив компонентов-слайдов
  const Slide8_Demo_Combined = () => (
    <div className="p-8 md:p-12 text-white h-full flex flex-col gap-6">
              <h2 className="text-3xl md:text-4xl font-bold text-cyan-300 text-center">Главный Дашборд и Детальный Анализ</h2>
      
      <div className="flex-1 grid md:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col items-center">
          <PhoneMockup imageUrl="/images/demo-dashboard.png" altText="Скриншот главного дашборда приложения ESEP" />
          <div className="mt-3 text-sm text-gray-300">Главный дашборд</div>
        </div>
        <div className="flex flex-col items-center">
          <PhoneMockup imageUrl="/images/demo-details.png" altText="Скриншот детального анализа приложения ESEP" />
          <div className="mt-3 text-sm text-gray-300">Детальный анализ</div>
        </div>
      </div>
    </div>
  );

  // Слайд с детальным анализом объединён с дашбордом в Slide8_Demo_Combined

  // AI-Агент
  const Slide9_Demo_AI_Agent = () => (
    <div className="p-8 md:p-12 text-white h-full flex flex-col md:flex-row items-center justify-center gap-12">
        <div className="md:w-1/2 flex justify-center">
            <div className="relative mx-auto border-gray-600 bg-gray-800 border-[8px] rounded-[2.5rem] h-[550px] w-[280px] md:h-[600px] md:w-[320px] shadow-xl">
                <div className="w-[100px] h-[18px] bg-gray-600 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
                <div className="h-[32px] w-[3px] bg-gray-600 absolute -left-[11px] top-[72px] rounded-l-lg"></div>
                <div className="h-[32px] w-[3px] bg-gray-600 absolute -left-[11px] top-[124px] rounded-l-lg"></div>
                <div className="h-[48px] w-[3px] bg-gray-600 absolute -right-[11px] top-[100px] rounded-r-lg"></div>
                <div className="rounded-[2rem] overflow-hidden w-full h-full bg-gray-900 p-3 flex flex-col">
                    <div className="flex-grow space-y-4 overflow-y-auto">
                        {/* AI Greeting */}
                        <div className="flex">
                            <div className="bg-cyan-600 text-white p-3 rounded-lg max-w-xs">
                                <p className="text-sm">Здравствуйте! Я ваш персональный AI-аналитик. Чем могу помочь?</p>
                            </div>
                        </div>
                        {/* User Question 1 */}
                        <div className="flex justify-end">
                            <div className="bg-gray-700 text-white p-3 rounded-lg max-w-xs">
                                <p className="text-sm">Почему в прошлом месяце счет за свет был таким большим?</p>
                            </div>
                        </div>
                        {/* AI Answer 1 */}
                        <div className="flex">
                            <div className="bg-cyan-600 text-white p-3 rounded-lg max-w-xs">
                                <p className="text-sm">Счет за свет высокий из-за постоянных перепадов базового потребления. Возможная причина - неисправность холодильника. Какая у вас модель холодильника?</p>
                            </div>
                        </div>
                         {/* User Question 2 */}
                        <div className="flex justify-end">
                            <div className="bg-gray-700 text-white p-3 rounded-lg max-w-xs">
                                <p className="text-sm">LG GR-B207JCS</p>
                            </div>
                        </div>
                         {/* AI Answer 2 */}
                         <div className="flex">
                            <div className="bg-cyan-600 text-white p-3 rounded-lg max-w-xs">
                                <p className="text-sm">Ваш холодильник LG 2007 года выпуска. Рекомендую заменить на современную модель класса A+++. Замена окупится за 2-3 года за счет экономии электроэнергии.</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <input type="text" placeholder="Спросите что-нибудь..." className="w-full bg-gray-700 text-white rounded-full py-2 px-4 text-sm focus:outline-none" />
                        <button className="ml-2 p-2 bg-cyan-500 rounded-full"><Send className="h-4 w-4 text-white" /></button>
                    </div>
                </div>
            </div>
        </div>
        <div className="md:w-1/2 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-bold text-cyan-300 mb-6">Ваш AI-Аналитик</h2>
            <p className="text-lg md:text-xl text-gray-300 mb-8">Задайте любой вопрос. Получите мгновенный ответ.</p>
            <ul className="space-y-4">
                <li className="flex items-start"><MessageSquare className="h-8 w-8 text-cyan-400 mr-4 flex-shrink-0" /><p className="text-gray-300 md:text-lg"><b>Естественный язык:</b> Общайтесь с вашими данными так же просто, как с человеком.</p></li>
                <li className="flex items-start"><Lightbulb className="h-8 w-8 text-cyan-400 mr-4 flex-shrink-0" /><p className="text-gray-300 md:text-lg"><b>Глубокий анализ:</b> AI-агент находит скрытые взаимосвязи между вашими привычками и расходами.</p></li>
                <li className="flex items-start"><TrendingUp className="h-8 w-8 text-cyan-400 mr-4 flex-shrink-0" /><p className="text-gray-300 md:text-lg"><b>Проактивные советы:</b> Агент не только отвечает, но и сам предлагает идеи для экономии.</p></li>
            </ul>
        </div>
    </div>
  );

  // Демо 4: Умные рекомендации — удалён по запросу



  // Новый слайд: Анализ обычных счётчиков помесячно
  const Slide5_MonthlyBasic = () => {
    const [notifIds] = useState<number[]>([Date.now() + 11, Date.now() + 12, Date.now() + 13]);
    const [notifs, setNotifs] = useState<Array<{ id: number; title: string; message: string }>>([]);

    const playMsgSound = useCallback(() => {
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = 950;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.01);
        osc.start();
        const stopAt = ctx.currentTime + 0.16;
        osc.stop(stopAt);
        gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);
        setTimeout(() => ctx.close(), 250);
      } catch {}
    }, []);
    useEffect(() => {
      const schedule = [
        { t: 900, title: 'AI‑рекомендация — Июль', message: 'Аномалия от кондиционера: очистите фильтры, поднимите setpoint на 1–2°C, используйте шторы/жалюзи днём. Режим Eco снизит потребление.', id: notifIds[0] },
        { t: 2500, title: 'AI‑рекомендация — Декабрь', message: 'Праздничная подсветка и отопление: поставьте LED‑гирлянды с таймером, проверьте уплотнители окон, задайте бойлер 55–60°C.', id: notifIds[1] },
        { t: 4200, title: 'AI‑рекомендация — Базовая нагрузка', message: 'Полностью отключайте ТВ/приставки и роутер‑USB ночью. Умные розетки помогут убрать 5–7 кВт⋅ч/мес фона.', id: notifIds[2] },
      ];
      const timers = schedule.map((s) => setTimeout(() => {
        setNotifs((prev) => [...prev, { id: s.id, title: s.title, message: s.message }]);
        playMsgSound();
      }, s.t));
      return () => timers.forEach(clearTimeout);
    }, [notifIds, playMsgSound]);
    const notifSlots = [0, 1, 2];
    const chartEl = useMemo(() => (
      <div className="mx-auto w-full max-w-3xl h-[260px] md:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthlyElectricityData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
            <XAxis dataKey="month" stroke="white" />
            <YAxis stroke="white" label={{ value: 'кВт⋅ч', angle: -90, position: 'insideLeft', fill: '#e2e8f0' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }} />
            <Legend />
            <ReferenceArea x1="Июл" x2="Июл" fill="#ef4444" fillOpacity={0.12} stroke="#ef4444" strokeOpacity={0.6} />
            <ReferenceArea x1="Дек" x2="Дек" fill="#ef4444" fillOpacity={0.12} stroke="#ef4444" strokeOpacity={0.6} />
            <Line type="monotone" dataKey="peers" name="Схожие потребители" stroke="#22d3ee" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            <Line type="monotone" dataKey="you" name="Вы" stroke="#facc15" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    ), []);
    return (
      <div className="p-6 md:p-10 text-white h-full flex flex-col relative">
        <h2 className="text-3xl md:text-4xl font-bold text-cyan-300 mb-4 text-center flex items-center justify-center gap-2">
          <Zap className="h-7 w-7 text-yellow-300" />
          Продукт в действии: Обычные счётчики (помесячно)
        </h2>
        <p className="text-center text-gray-300 mb-4">Даже без почасовых данных видны сезонность и аномалии. Мы помогаем выявлять пики и давать простые рекомендации.</p>

        {/* Пуш‑уведомления под заголовком */}
        <div className="mt-2 grid gap-4 md:grid-cols-3 grid-cols-1 max-w-5xl mx-auto w-full">
          {notifSlots.map((i) => {
            const n = notifs[i];
            return (
              <div key={i} className={`rounded-lg shadow-xl border p-4 h-[160px] ${n ? 'animate-fade-in bg-white/10 backdrop-blur border-cyan-400/40' : 'invisible bg-transparent border-transparent'}`}>
                <div className="flex items-start gap-3 h-full">
                  <Lightbulb className={`h-6 w-6 flex-shrink-0 mt-0.5 ${n ? 'text-yellow-300' : 'text-transparent'}`} />
                  <div className="flex flex-col h-full w-full">
                    <div className="font-semibold mb-1">{n?.title ?? ''}</div>
                    <div className="text-sm text-gray-300 leading-snug">{n?.message ?? ''}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Заполнитель, чтобы график был у нижнего края */}
        <div className="flex-1" />

        {/* График внизу */}
        <div className="w-full p-0 relative">
          {chartEl}
          {/* Подсветка аномалий оставлена, текстовый оверлей убран: рекомендации приходят пушами */}
        </div>
      </div>
    );
  };

  // Новый слайд: Анализ отдельного ресурса (вода)
  const Slide6_WaterInsights = () => {
    const [notifIds] = useState<number[]>([Date.now() + 21, Date.now() + 22, Date.now() + 23]);
    const [notifs, setNotifs] = useState<Array<{ id: number; title: string; message: string }>>([]);

    const playMsgSound = useCallback(() => {
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = 900;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.01);
        osc.start();
        const stopAt = ctx.currentTime + 0.16;
        osc.stop(stopAt);
        gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);
        setTimeout(() => ctx.close(), 250);
      } catch {}
    }, []);

    useEffect(() => {
      const schedule = [
        { t: 900, title: 'AI‑рекомендация — Ночь', message: 'Ровное потребление 02:00–03:00 — признак утечки. Проверьте бачок унитаза и смесители, замените арматуру при необходимости.', id: notifIds[0] },
        { t: 2500, title: 'AI‑рекомендация — Утро', message: 'Пик 07:00 выше «схожих». Аэраторы и экономичная лейка душа снижают расход до 20%.', id: notifIds[1] },
        { t: 4200, title: 'AI‑рекомендация — Вечер', message: 'В 19:00 совмещены стирка/мытьё посуды. Разнесите нагрузки, используйте эко‑режимы.', id: notifIds[2] },
      ];
      const timers = schedule.map((s) => setTimeout(() => {
        setNotifs((prev) => [...prev, { id: s.id, title: s.title, message: s.message }]);
        playMsgSound();
      }, s.t));
      return () => timers.forEach(clearTimeout);
    }, [notifIds, playMsgSound]);

    const notifSlots = [0, 1, 2];
    const chartEl = useMemo(() => (
      <div className="mx-auto w-full max-w-3xl h-[260px] md:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={waterHourlyData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
            <XAxis dataKey="hour" stroke="white" />
            <YAxis stroke="white" label={{ value: 'л/час', angle: -90, position: 'insideLeft', fill: '#e2e8f0' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }} />
            <Legend />
            <ReferenceArea x1="02:00" x2="03:00" fill="#ef4444" fillOpacity={0.12} stroke="#ef4444" strokeOpacity={0.6} />
            <ReferenceArea x1="07:00" x2="07:00" fill="#ef4444" fillOpacity={0.12} stroke="#ef4444" strokeOpacity={0.6} />
            <ReferenceArea x1="19:00" x2="19:00" fill="#ef4444" fillOpacity={0.12} stroke="#ef4444" strokeOpacity={0.6} />
            <Line type="monotone" dataKey="peers" name="Схожие потребители" stroke="#22d3ee" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            <Line type="monotone" dataKey="you" name="Вы" stroke="#4fd1c5" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    ), []);

    return (
      <div className="p-6 md:p-10 text-white h-full flex flex-col relative">
        <h2 className="text-3xl md:text-4xl font-bold text-cyan-300 mb-4 text-center flex items-center justify-center gap-2">
          <Droplet className="h-7 w-7 text-cyan-300" />
          Анализ ресурса: Вода (почасово)
        </h2>
        <p className="text-center text-gray-300 mb-4">Сравнение со схожими домохозяйствами, подсветка аномалий и практичные рекомендации.</p>

        {/* Пуш‑уведомления под заголовком */}
        <div className="mt-2 grid gap-4 md:grid-cols-3 grid-cols-1 max-w-5xl mx-auto w-full">
          {notifSlots.map((i) => {
            const n = notifs[i];
            return (
              <div key={i} className={`rounded-lg shadow-xl border p-4 h-[160px] ${n ? 'animate-fade-in bg-white/10 backdrop-blur border-cyan-400/40' : 'invisible bg-transparent border-transparent'}`}>
                <div className="flex items-start gap-3 h-full">
                  <Lightbulb className={`h-6 w-6 flex-shrink-0 mt-0.5 ${n ? 'text-yellow-300' : 'text-transparent'}`} />
                  <div className="flex flex-col h-full w-full">
                    <div className="font-semibold mb-1">{n?.title ?? ''}</div>
                    <div className="text-sm text-gray-300 leading-snug">{n?.message ?? ''}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Заполнитель, чтобы график был у нижнего края */}
        <div className="flex-1" />

        {/* График внизу без фона */}
        <div className="w-full p-0 relative">
          {chartEl}
        </div>
      </div>
    );
  };

  // Слайд "Казахстан в глобальном контексте" — удалён по запросу

  const Slide11_Traction_Updated = () => (
    <div className="p-8 md:p-12 text-white text-center h-full flex flex-col justify-center">
      <h2 className="text-3xl md:text-4xl font-bold text-cyan-300 mb-12">Наши Первые Достижения</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
        <div className="bg-white/10 p-6 rounded-lg flex flex-col items-center">
          <UserPlus className="h-12 w-12 text-cyan-400 mb-4" />
          <p className="text-4xl font-bold">2,500+</p>
          <p className="text-gray-300 mt-2">Пользователей за первый месяц</p>
        </div>
        <div className="bg-white/10 p-6 rounded-lg flex flex-col items-center">
          <Briefcase className="h-12 w-12 text-cyan-400 mb-4" />
          <p className="text-2xl font-bold">Успешный пилот</p>
          <div className="mt-3">
            <img src="/images/bi_logo.png" alt="BI Group Logo" className="h-12 w-auto object-contain" />
          </div>
        </div>
        <div className="bg-white/10 p-6 rounded-lg flex flex-col items-center">
          <CheckCircle className="h-12 w-12 text-cyan-400 mb-4" />
          <p className="text-2xl font-bold">Интеграции</p>
          <div className="mt-3 space-y-2">
            <div className="bg-cyan-500/20 p-3 rounded-lg border border-cyan-400/40">
              <p className="text-sm font-semibold text-cyan-200">Астана Су Арнасы</p>
            </div>
            <div className="bg-cyan-500/20 p-3 rounded-lg border border-cyan-400/40">
              <p className="text-sm font-semibold text-cyan-200">Көкшетау Су Арнасы</p>
            </div>
          </div>
        </div>
        <div className="bg-white/10 p-6 rounded-lg flex flex-col items-center">
          <TrendingUp className="h-12 w-12 text-cyan-400 mb-4" />
          <p className="text-4xl font-bold">15%</p>
          <p className="text-gray-300 mt-2">Среднее снижение расходов у пользователей</p>
        </div>
      </div>
    </div>
  );

  



  const Slide14_TheAsk = () => (
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
      <Slide5_MonthlyBasic />,
      <Slide6_WaterInsights />,
      <Slide7_LiveDemo_CrossAnalysis />,
      <Slide8_Demo_Combined />,
      <Slide9_Demo_AI_Agent />,
      <Slide11_Traction_Updated />,
      <Slide12_PartnershipModel />,
      <Slide14_TheAsk />,
      <Slide15_Roadmap />,
      <Slide16_Contacts />,
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
