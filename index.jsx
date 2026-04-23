import { useState, useMemo, useEffect, useRef } from 'react';

const initialData = {
  // NAWTE Aanvrager 1
  a1Naam: '', a1Adres: '', a1Woonplaats: '', a1Telefoon: '', a1Email: '',
  // Partner
  samen: null,
  // NAWTE Aanvrager 2
  a2Naam: '', a2Adres: '', a2Woonplaats: '', a2Telefoon: '', a2Email: '',
  // Historie
  eerderHypotheek: null,
  // Nieuwbouw
  koopsom: '', meerwerk: '', energielabel: '', oplevering: '', nhg: null, huidigeWonen: '',
  // Inkomen A1
  brutoA1: '', contractA1: '', werkgeverA1: '', dienstjarenA1: '', studieA1: '', bkrA1: '',
  // Inkomen A2
  brutoA2: '', contractA2: '', werkgeverA2: '', dienstjarenA2: '', studieA2: '', bkrA2: '',
  // Eigen geld
  spaargeld: '', schenking: '', overwaarde: '',
  // Persoonlijk
  leeftijdA1: '', leeftijdA2: '', kinderen: '', alimentatie: null,
};

const isFilled = (v) => v !== '' && v !== null && v !== undefined;

const calcPercentage = (d) => {
  let s = 22;

  ['a1Naam','a1Adres','a1Woonplaats','a1Telefoon','a1Email'].forEach(k => { if (isFilled(d[k])) s += 1.6; });
  if (isFilled(d.samen)) s += 2;
  if (d.samen === 'ja') {
    ['a2Naam','a2Adres','a2Woonplaats','a2Telefoon','a2Email'].forEach(k => { if (isFilled(d[k])) s += 1.3; });
  }
  if (isFilled(d.eerderHypotheek)) { s += 2.5; if (d.eerderHypotheek === 'ja') s += 2; }

  ['koopsom','meerwerk','energielabel','oplevering','huidigeWonen'].forEach(k => { if (isFilled(d[k])) s += 1.8; });
  if (isFilled(d.nhg)) s += 1.5;
  if (d.nhg === 'ja' && parseFloat(d.koopsom || 0) > 0 && parseFloat(d.koopsom || 0) < 470000) s += 2;
  if (['A++++','A+++','A++','A+'].includes(d.energielabel)) s += 2.5;

  ['brutoA1','contractA1','werkgeverA1','dienstjarenA1','studieA1','bkrA1'].forEach(k => { if (isFilled(d[k])) s += 1.6; });
  if (d.contractA1 === 'vast') s += 3.5;
  else if (d.contractA1 === 'tijdelijk-verklaring') s += 1;
  else if (d.contractA1 === 'tijdelijk') s -= 3;
  else if (d.contractA1 === 'zzp') s -= 0.5;
  if (parseFloat(d.brutoA1 || 0) > 60000) s += 2;
  if (parseFloat(d.dienstjarenA1 || 0) >= 3) s += 1.5;
  if (isFilled(d.studieA1) && parseFloat(d.studieA1) === 0) s += 2;
  else if (parseFloat(d.studieA1 || 0) > 30000) s -= 2;
  if (isFilled(d.bkrA1) && parseFloat(d.bkrA1) === 0) s += 2;
  else if (parseFloat(d.bkrA1 || 0) > 0) s -= 1.5;

  if (d.samen === 'ja') {
    ['brutoA2','contractA2','werkgeverA2','dienstjarenA2','studieA2','bkrA2'].forEach(k => { if (isFilled(d[k])) s += 1.4; });
    if (d.contractA2 === 'vast') s += 3;
    else if (d.contractA2 === 'tijdelijk') s -= 2;
    if (parseFloat(d.brutoA2 || 0) > 40000) s += 1.5;
  }

  ['spaargeld','schenking','overwaarde'].forEach(k => { if (isFilled(d[k])) s += 1.5; });
  if (parseFloat(d.spaargeld || 0) > 20000) s += 2.5;
  if (parseFloat(d.overwaarde || 0) > 50000) s += 3;
  if (parseFloat(d.schenking || 0) > 10000) s += 1.5;

  ['leeftijdA1','kinderen'].forEach(k => { if (isFilled(d[k])) s += 1.2; });
  if (d.samen === 'ja' && isFilled(d.leeftijdA2)) s += 1.2;
  if (isFilled(d.alimentatie)) s += 1.2;
  if (d.alimentatie === 'ja') s -= 3;
  if (parseInt(d.leeftijdA1 || 0) > 58) s -= 2;

  return Math.max(20, Math.min(98, Math.round(s)));
};

export default function HypotheekTool() {
  const [data, setData] = useState(initialData);
  const [active, setActive] = useState('a1');
  const [bump, setBump] = useState({ delta: 0, k: 0 });
  const prevPct = useRef(calcPercentage(initialData));

  const pct = useMemo(() => calcPercentage(data), [data]);

  useEffect(() => {
    if (pct > prevPct.current) {
      setBump({ delta: pct - prevPct.current, k: Date.now() });
    }
    prevPct.current = pct;
  }, [pct]);

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  const sectionComplete = {
    a1: ['a1Naam','a1Adres','a1Woonplaats','a1Telefoon','a1Email'].every(k => isFilled(data[k])),
    partner: isFilled(data.samen),
    a2: data.samen === 'nee' || ['a2Naam','a2Adres','a2Woonplaats','a2Telefoon','a2Email'].every(k => isFilled(data[k])),
    historie: isFilled(data.eerderHypotheek),
    woning: ['koopsom','meerwerk','energielabel','oplevering','huidigeWonen'].every(k => isFilled(data[k])) && isFilled(data.nhg),
    inkomen1: ['brutoA1','contractA1','werkgeverA1','dienstjarenA1','studieA1','bkrA1'].every(k => isFilled(data[k])),
    inkomen2: data.samen === 'nee' || ['brutoA2','contractA2','werkgeverA2','dienstjarenA2','studieA2','bkrA2'].every(k => isFilled(data[k])),
    geld: ['spaargeld','schenking'].every(k => isFilled(data[k])),
    persoonlijk: isFilled(data.leeftijdA1) && isFilled(data.kinderen) && isFilled(data.alimentatie),
  };
  const allDone = Object.values(sectionComplete).every(Boolean);

  const next = (nextId) => setActive(nextId);

  const inputBase =
    'w-full bg-transparent border border-stone-300/60 focus:border-[#0C3B2A] focus:bg-white outline-none px-4 py-3 text-[15px] rounded-lg transition-all placeholder:text-stone-400';
  const labelBase = 'block text-[11px] font-medium text-stone-600 mb-1.5 tracking-wide';

  const Field = ({ label, k, type = 'text', placeholder = '', cols = 1, prefix }) => (
    <div style={{ gridColumn: `span ${cols}` }}>
      <label className={labelBase}>{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-[15px] pointer-events-none">{prefix}</span>}
        <input
          type={type}
          value={data[k]}
          onChange={(e) => set(k, e.target.value)}
          placeholder={placeholder}
          className={`${inputBase} ${prefix ? 'pl-9' : ''}`}
        />
      </div>
    </div>
  );

  const Select = ({ label, k, options, cols = 1 }) => (
    <div style={{ gridColumn: `span ${cols}` }}>
      <label className={labelBase}>{label}</label>
      <select
        value={data[k]}
        onChange={(e) => set(k, e.target.value)}
        className={`${inputBase} cursor-pointer appearance-none`}
        style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%230C3B2A' d='M6 8L0 0h12z'/></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
      >
        <option value="">Selecteer…</option>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );

  const Choice = ({ label, k, options, cols = 2 }) => (
    <div style={{ gridColumn: `span ${cols}` }}>
      <label className={labelBase}>{label}</label>
      <div className="flex gap-2 flex-wrap">
        {options.map(o => (
          <button
            key={o.v}
            onClick={() => set(k, o.v)}
            className="px-5 py-2.5 rounded-full border text-sm font-medium transition-all"
            style={{
              backgroundColor: data[k] === o.v ? '#0C3B2A' : 'white',
              color: data[k] === o.v ? '#C4F54E' : '#0A0D0B',
              borderColor: data[k] === o.v ? '#0C3B2A' : 'rgba(10,13,11,0.15)',
            }}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );

  const Section = ({ id, num, title, subtitle, done, children, onNext, nextId }) => {
    const isOpen = active === id;
    return (
      <section
        className="rounded-2xl transition-all duration-300 overflow-hidden"
        style={{
          backgroundColor: isOpen ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
          border: `1px solid ${isOpen ? 'rgba(12,59,42,0.15)' : 'rgba(10,13,11,0.08)'}`,
          boxShadow: isOpen ? '0 1px 2px rgba(10,13,11,0.04), 0 8px 32px rgba(10,13,11,0.06)' : 'none',
        }}
      >
        <button
          onClick={() => setActive(isOpen ? null : id)}
          className="w-full flex items-center justify-between px-7 py-6 text-left hover:bg-stone-50/50 transition-colors"
        >
          <div className="flex items-center gap-5">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
              style={{
                backgroundColor: done ? '#C4F54E' : isOpen ? '#0C3B2A' : 'rgba(12,59,42,0.06)',
                color: done ? '#0C3B2A' : isOpen ? '#C4F54E' : '#0C3B2A',
              }}
            >
              {done ? '✓' : num}
            </div>
            <div>
              <div className="text-[17px] font-medium text-[#0A0D0B] leading-tight">{title}</div>
              <div className="text-[13px] text-stone-500 mt-0.5">{subtitle}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {done && !isOpen && <span className="text-[11px] font-medium text-[#0C3B2A] bg-[#C4F54E]/40 px-2.5 py-1 rounded-full">ingevuld</span>}
            <svg width="20" height="20" viewBox="0 0 20 20" style={{ transform: isOpen ? 'rotate(180deg)' : '', transition: 'transform 0.3s' }}>
              <path d="M5 8l5 5 5-5" stroke="#0A0D0B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        </button>
        {isOpen && (
          <div className="px-7 pb-7 pt-2 animate-[slideDown_0.3s_ease-out]">
            {children}
            {nextId && (
              <div className="mt-6 pt-5 flex justify-between items-center" style={{ borderTop: '1px solid rgba(10,13,11,0.08)' }}>
                <div className="text-[12px] text-stone-500">Elke vraag die je beantwoordt = hoger slagingspercentage</div>
                <button
                  onClick={() => next(nextId)}
                  disabled={!done}
                  className="px-6 py-3 rounded-full font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#0C3B2A', color: '#C4F54E' }}
                >
                  Volgende →
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    );
  };

  const pctColor = pct < 40 ? '#B45309' : pct < 65 ? '#0C3B2A' : '#0C3B2A';
  const ringOffset = 283 - (283 * pct) / 100;

  return (
    <div style={{ backgroundColor: '#F4F1EA', minHeight: '100vh', color: '#0A0D0B', fontFamily: "'Geist', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300..800&family=Geist+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
        .serif-it { font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; }
        .mono { font-family: 'Geist Mono', monospace; font-feature-settings: 'tnum' 1; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.08); } 100% { transform: scale(1); } }
        @keyframes floatUp { 0% { opacity: 0; transform: translateY(8px); } 20% { opacity: 1; transform: translateY(0); } 80% { opacity: 1; transform: translateY(-24px); } 100% { opacity: 0; transform: translateY(-36px); } }
        .ring-anim { transition: stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1); }
        .pct-bump { animation: pulse 0.5s ease-out; }
        .delta-float { animation: floatUp 1.5s ease-out forwards; }
        input, select { font-family: 'Geist', sans-serif; }
      `}</style>

      {/* STICKY HEADER */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{ backgroundColor: 'rgba(244, 241, 234, 0.85)', borderBottom: '1px solid rgba(10,13,11,0.08)' }}
      >
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0C3B2A' }}>
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#C4F54E' }} />
            </div>
            <div>
              <div className="text-[15px] font-semibold tracking-tight leading-none">hypotheek<span style={{ color: '#0C3B2A' }}>.ai</span></div>
              <div className="text-[10px] text-stone-500 mt-0.5 tracking-wide">Nieuwbouw · Slagingsmeter</div>
            </div>
          </div>

          {/* BIG PERCENTAGE RIGHT TOP */}
          <div className="flex items-center gap-4 relative">
            <div className="hidden sm:block text-right">
              <div className="text-[10px] text-stone-500 tracking-widest uppercase">Jouw slagingskans</div>
              <div className="text-[11px] text-stone-600 mt-0.5">
                {pct < 40 ? 'Vul meer in voor een betere inschatting' : pct < 65 ? 'Op de goede weg' : pct < 85 ? 'Sterke kans' : 'Uitstekende kans'}
              </div>
            </div>
            <div className="relative" key={bump.k}>
              <svg width="72" height="72" className={bump.k ? 'pct-bump' : ''}>
                <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(12,59,42,0.1)" strokeWidth="5" />
                <circle
                  cx="36" cy="36" r="30" fill="none" stroke={pctColor} strokeWidth="5" strokeLinecap="round"
                  strokeDasharray="188.5" strokeDashoffset={188.5 - (188.5 * pct) / 100}
                  transform="rotate(-90 36 36)" className="ring-anim"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col leading-none">
                <span className="text-[22px] font-semibold mono" style={{ color: pctColor }}>{pct}</span>
                <span className="text-[9px] text-stone-500 mono mt-0.5">%</span>
              </div>
              {bump.delta > 0 && (
                <div
                  key={bump.k}
                  className="delta-float absolute -right-2 -top-1 text-[11px] font-semibold mono px-2 py-0.5 rounded-full pointer-events-none"
                  style={{ backgroundColor: '#C4F54E', color: '#0C3B2A' }}
                >
                  +{bump.delta}%
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 pt-14 pb-10">
        <div className="text-[12px] tracking-widest text-stone-500 uppercase mb-4">AI-inschatting · Nieuwbouwwoning · Zonder bankkoppeling</div>
        <h1 className="text-[44px] md:text-[64px] leading-[0.95] font-medium tracking-tight max-w-4xl">
          Hoe groot is de kans<br />
          dat <span className="serif-it" style={{ color: '#0C3B2A' }}>jouw droomnieuwbouw </span>
          <br className="hidden md:block" />
          daadwerkelijk van jou wordt?
        </h1>
        <p className="text-stone-600 text-[17px] mt-6 max-w-2xl leading-relaxed">
          Beantwoord onze vragen over jullie situatie en de woning. Hoe vollediger het beeld,
          hoe preciezer we jullie slagingspercentage kunnen bepalen. Je ziet rechtsboven live
          hoe je score groeit.
        </p>
      </div>

      {/* MAIN */}
      <main className="max-w-[1200px] mx-auto px-6 md:px-10 pb-24 space-y-3">
        {/* 01 — AANVRAGER 1 */}
        <Section id="a1" num="01" title="Over jou" subtitle="Aanvrager 1 — NAWTE gegevens"
          done={sectionComplete.a1} nextId="partner">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Volledige naam" k="a1Naam" placeholder="Voornaam Achternaam" cols={2} />
            <Field label="Straat en huisnummer" k="a1Adres" placeholder="Bijv. Kruiskade 12" />
            <Field label="Woonplaats" k="a1Woonplaats" placeholder="Rotterdam" />
            <Field label="Telefoonnummer" k="a1Telefoon" placeholder="06 …" type="tel" />
            <Field label="E-mailadres" k="a1Email" placeholder="naam@voorbeeld.nl" type="email" />
          </div>
        </Section>

        {/* 02 — PARTNER */}
        <Section id="partner" num="02" title="Samen kopen?" subtitle="Koop je de woning met een partner?"
          done={sectionComplete.partner} nextId={data.samen === 'ja' ? 'a2' : 'historie'}>
          <Choice k="samen" label="" cols={2}
            options={[{ v: 'ja', l: 'Ja, met partner' }, { v: 'nee', l: 'Nee, ik koop alleen' }]} />
          {data.samen === 'nee' && (
            <div className="mt-4 text-sm text-stone-600 bg-stone-50 rounded-xl p-4 border border-stone-200">
              Alleenverdieners krijgen strengere acceptatie — we houden daar rekening mee.
            </div>
          )}
        </Section>

        {/* 03 — AANVRAGER 2 */}
        {data.samen === 'ja' && (
          <Section id="a2" num="03" title="Over je partner" subtitle="Aanvrager 2 — NAWTE gegevens"
            done={sectionComplete.a2} nextId="historie">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Volledige naam" k="a2Naam" placeholder="Voornaam Achternaam" cols={2} />
              <Field label="Straat en huisnummer" k="a2Adres" placeholder="Indien zelfde, herhaal" />
              <Field label="Woonplaats" k="a2Woonplaats" />
              <Field label="Telefoonnummer" k="a2Telefoon" type="tel" />
              <Field label="E-mailadres" k="a2Email" type="email" />
            </div>
          </Section>
        )}

        {/* 04 — HISTORIE */}
        <Section id="historie" num={data.samen === 'ja' ? '04' : '03'} title="Hypotheek historie"
          subtitle="Heb je ooit eerder een hypotheek gehad?"
          done={sectionComplete.historie} nextId="woning">
          <Choice k="eerderHypotheek" label="" cols={2}
            options={[{ v: 'ja', l: 'Ja, eerder gehad' }, { v: 'nee', l: 'Nee, dit wordt de eerste' }]} />
          {data.eerderHypotheek === 'ja' && (
            <div className="mt-4 text-sm bg-[#C4F54E]/20 rounded-xl p-4" style={{ border: '1px solid rgba(12,59,42,0.2)' }}>
              <strong style={{ color: '#0C3B2A' }}>+ Pluspunt.</strong> Ervaring met hypotheken weegt mee: geldverstrekkers zien jullie als minder risicovol.
            </div>
          )}
          {data.eerderHypotheek === 'nee' && (
            <div className="mt-4 text-sm text-stone-600 bg-stone-50 rounded-xl p-4 border border-stone-200">
              Als starter kom je mogelijk in aanmerking voor een <strong>starterslening</strong> van je gemeente.
            </div>
          )}
        </Section>

        {/* 05 — WONING */}
        <Section id="woning" num={data.samen === 'ja' ? '05' : '04'} title="De nieuwbouwwoning"
          subtitle="Details van het project"
          done={sectionComplete.woning} nextId="inkomen1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Koop-/aanneemsom" k="koopsom" placeholder="450.000" type="number" prefix="€" />
            <Field label="Meerwerk (geschat)" k="meerwerk" placeholder="25.000" type="number" prefix="€" />
            <Select label="Energielabel" k="energielabel" options={[
              { v: 'A++++', l: 'A++++ (NOM / nul-op-de-meter)' },
              { v: 'A+++', l: 'A+++' }, { v: 'A++', l: 'A++' },
              { v: 'A+', l: 'A+' }, { v: 'A', l: 'A' }, { v: 'B', l: 'B of lager' },
            ]} />
            <Field label="Verwachte oplevering" k="oplevering" placeholder="Bijv. Q3 2026" />
            <Select label="Huidige woonsituatie" k="huidigeWonen" options={[
              { v: 'huur', l: 'Huurwoning' }, { v: 'koop', l: 'Eigen koopwoning' },
              { v: 'ouders', l: 'Bij ouders / familie' }, { v: 'anders', l: 'Anders' },
            ]} />
            <Choice k="nhg" label="NHG gewenst?" cols={1}
              options={[{ v: 'ja', l: 'Ja' }, { v: 'nee', l: 'Nee' }, { v: 'weet-niet', l: 'Weet niet' }]} />
          </div>
          {parseFloat(data.koopsom || 0) > 470000 && data.nhg === 'ja' && (
            <div className="mt-4 text-sm rounded-xl p-4" style={{ backgroundColor: '#FEF3E2', border: '1px solid #F59E0B40' }}>
              ⚠ Koopsom boven NHG-grens (€470.000 in 2026) — NHG niet mogelijk op volledig bedrag.
            </div>
          )}
        </Section>

        {/* 06 — INKOMEN A1 */}
        <Section id="inkomen1" num={data.samen === 'ja' ? '06' : '05'} title="Inkomen Aanvrager 1"
          subtitle={data.a1Naam ? `Financiële positie van ${data.a1Naam.split(' ')[0]}` : 'Financiële positie van jou'}
          done={sectionComplete.inkomen1} nextId={data.samen === 'ja' ? 'inkomen2' : 'geld'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Bruto jaarinkomen" k="brutoA1" placeholder="52.000" type="number" prefix="€" />
            <Select label="Type dienstverband" k="contractA1" options={[
              { v: 'vast', l: 'Vast contract' },
              { v: 'tijdelijk-verklaring', l: 'Tijdelijk + intentieverklaring' },
              { v: 'tijdelijk', l: 'Tijdelijk zonder verklaring' },
              { v: 'zzp', l: 'ZZP / ondernemer' },
              { v: 'dga', l: 'DGA / eigen BV' },
            ]} />
            <Field label="Werkgever / bedrijf" k="werkgeverA1" placeholder="Naam werkgever" />
            <Field label="Dienstjaren / jaren als ZZP'er" k="dienstjarenA1" placeholder="5" type="number" />
            <Field label="Studieschuld (oorspronkelijk)" k="studieA1" placeholder="0 als geen" type="number" prefix="€" />
            <Field label="BKR kredietlimiet (creditcard/rood)" k="bkrA1" placeholder="0 als geen" type="number" prefix="€" />
          </div>
        </Section>

        {/* 07 — INKOMEN A2 */}
        {data.samen === 'ja' && (
          <Section id="inkomen2" num="07" title="Inkomen Aanvrager 2"
            subtitle={data.a2Naam ? `Financiële positie van ${data.a2Naam.split(' ')[0]}` : 'Financiële positie partner'}
            done={sectionComplete.inkomen2} nextId="geld">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Bruto jaarinkomen" k="brutoA2" placeholder="42.000" type="number" prefix="€" />
              <Select label="Type dienstverband" k="contractA2" options={[
                { v: 'vast', l: 'Vast contract' },
                { v: 'tijdelijk-verklaring', l: 'Tijdelijk + intentieverklaring' },
                { v: 'tijdelijk', l: 'Tijdelijk zonder verklaring' },
                { v: 'zzp', l: 'ZZP / ondernemer' },
                { v: 'dga', l: 'DGA / eigen BV' },
              ]} />
              <Field label="Werkgever / bedrijf" k="werkgeverA2" />
              <Field label="Dienstjaren" k="dienstjarenA2" type="number" />
              <Field label="Studieschuld (oorspronkelijk)" k="studieA2" placeholder="0 als geen" type="number" prefix="€" />
              <Field label="BKR kredietlimiet" k="bkrA2" placeholder="0 als geen" type="number" prefix="€" />
            </div>
          </Section>
        )}

        {/* 08 — EIGEN GELD */}
        <Section id="geld" num={data.samen === 'ja' ? '08' : '06'} title="Eigen middelen"
          subtitle="Spaargeld, schenking, overwaarde"
          done={sectionComplete.geld} nextId="persoonlijk">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Spaargeld voor kosten koper" k="spaargeld" placeholder="15.000" type="number" prefix="€" />
            <Field label="Schenking van familie" k="schenking" placeholder="0" type="number" prefix="€" />
            {data.eerderHypotheek === 'ja' && (
              <Field label="Verwachte overwaarde huidige woning" k="overwaarde" placeholder="80.000" type="number" prefix="€" cols={2} />
            )}
          </div>
          <div className="mt-4 text-[13px] text-stone-500 bg-stone-50/80 rounded-xl p-4 border border-stone-200">
            Bij nieuwbouw zijn de <strong>kosten koper lager</strong> dan bij bestaande bouw — geen overdrachtsbelasting, geen taxatiekosten. Reken op ~3% van de koopsom.
          </div>
        </Section>

        {/* 09 — PERSOONLIJK */}
        <Section id="persoonlijk" num={data.samen === 'ja' ? '09' : '07'} title="Persoonlijke situatie"
          subtitle="Een paar laatste vragen"
          done={sectionComplete.persoonlijk} nextId={allDone ? null : 'result'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Leeftijd aanvrager 1" k="leeftijdA1" placeholder="32" type="number" />
            {data.samen === 'ja' && <Field label="Leeftijd aanvrager 2" k="leeftijdA2" placeholder="30" type="number" />}
            <Select label="Kinderen" k="kinderen" cols={data.samen === 'ja' ? 2 : 1} options={[
              { v: '0', l: 'Geen kinderen' }, { v: '1', l: '1 kind' },
              { v: '2', l: '2 kinderen' }, { v: '3+', l: '3 of meer' },
            ]} />
            <Choice k="alimentatie" label="Betalen jullie alimentatie?" cols={2}
              options={[{ v: 'ja', l: 'Ja' }, { v: 'nee', l: 'Nee' }]} />
          </div>
        </Section>

        {/* RESULT */}
        {allDone && (
          <div
            id="result"
            className="rounded-3xl p-8 md:p-12 mt-8"
            style={{ backgroundColor: '#0C3B2A', color: '#F4F1EA' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
              <div className="md:col-span-3">
                <div className="text-[11px] tracking-widest uppercase opacity-60 mb-3">Jouw slagingspercentage</div>
                <div className="flex items-baseline gap-3">
                  <span className="text-[120px] md:text-[160px] font-medium leading-none tracking-tighter" style={{ color: '#C4F54E' }}>
                    {pct}
                  </span>
                  <span className="text-[40px] md:text-[56px] opacity-80 mono">%</span>
                </div>
                <p className="serif-it text-[22px] md:text-[28px] mt-4 leading-tight opacity-90">
                  {pct >= 85
                    ? 'Uitstekend. De kans op een passende nieuwbouwhypotheek is zeer hoog.'
                    : pct >= 65
                    ? 'Sterke kans. Met wat finetuning wordt dit een succesvolle aanvraag.'
                    : pct >= 45
                    ? 'Redelijk. Laat een adviseur meekijken om je kans te vergroten.'
                    : 'De basis staat — maar de acceptatie wordt spannend.'}
                </p>
              </div>
              <div className="md:col-span-2 space-y-2 text-[14px]">
                <div className="text-[11px] tracking-widest uppercase opacity-60 mb-3">Wat weegt mee</div>
                {data.contractA1 === 'vast' && <Tag pos>{data.a1Naam.split(' ')[0] || 'A1'} vast contract</Tag>}
                {data.contractA2 === 'vast' && <Tag pos>{data.a2Naam.split(' ')[0] || 'A2'} vast contract</Tag>}
                {parseFloat(data.brutoA1 || 0) + parseFloat(data.brutoA2 || 0) > 80000 && <Tag pos>Sterk gezamenlijk inkomen</Tag>}
                {['A++++','A+++','A++','A+'].includes(data.energielabel) && <Tag pos>Energielabel {data.energielabel} — extra leenruimte</Tag>}
                {data.eerderHypotheek === 'ja' && <Tag pos>Ervaring met hypotheek</Tag>}
                {parseFloat(data.overwaarde || 0) > 50000 && <Tag pos>Substantiële overwaarde</Tag>}
                {data.nhg === 'ja' && parseFloat(data.koopsom || 0) < 470000 && <Tag pos>Binnen NHG-grens</Tag>}
                {parseFloat(data.spaargeld || 0) > 20000 && <Tag pos>Goede spaarpositie</Tag>}

                {data.contractA1 === 'tijdelijk' && <Tag>Tijdelijk contract A1</Tag>}
                {parseFloat(data.studieA1 || 0) > 30000 && <Tag>Studieschuld weegt mee</Tag>}
                {parseFloat(data.bkrA1 || 0) > 0 && <Tag>BKR-registratie</Tag>}
                {data.alimentatie === 'ja' && <Tag>Alimentatieverplichting</Tag>}
                {parseInt(data.leeftijdA1 || 0) > 58 && <Tag>Leeftijd nabij pensioen</Tag>}
              </div>
            </div>
            <div className="mt-10 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4" style={{ borderTop: '1px solid rgba(244,241,234,0.15)' }}>
              <div className="text-[13px] opacity-70 max-w-xl">
                Dit is een AI-inschatting op basis van jullie antwoorden — geen bindend advies.
                Voor een definitief oordeel hebben we salarisstroken, werkgeversverklaring en koop-/aanneemovereenkomst nodig.
              </div>
              <button className="px-7 py-3.5 rounded-full font-medium text-[15px] whitespace-nowrap" style={{ backgroundColor: '#C4F54E', color: '#0C3B2A' }}>
                Plan gesprek met adviseur →
              </button>
            </div>
          </div>
        )}

        {/* FOOTER NOTE */}
        <div className="pt-6 text-center text-[12px] text-stone-400">
          hypotheek.ai · indicatief instrument · geen financieel advies
        </div>
      </main>
    </div>
  );
}

const Tag = ({ children, pos }) => (
  <div
    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] mr-1.5 mb-1.5"
    style={{
      backgroundColor: pos ? 'rgba(196,245,78,0.15)' : 'rgba(244,241,234,0.08)',
      color: pos ? '#C4F54E' : 'rgba(244,241,234,0.7)',
      border: `1px solid ${pos ? 'rgba(196,245,78,0.3)' : 'rgba(244,241,234,0.15)'}`,
    }}
  >
    <span>{pos ? '+' : '−'}</span>
    <span>{children}</span>
  </div>
);
