import { Highlighter } from './ui/highlighter';
import { NumberTicker } from './ui/number-ticker';

const Stats = () => {
  const stats = [
    { label: "Max Radius", value: 11, suffix: "k" },
    { label: "Call Limit", value: 3, suffix: "min" },
    { label: "Local Gigs", value: 1.2, suffix: "k+", decimalPlaces: 1 },
  ];

  return (
    <section className="bg-surface-container-low py-20">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="max-w-md">
          <h2 className="text-3xl font-headline font-extrabold mb-4">Fastest Matching.</h2>
          <p className="text-on-surface-variant">
            We prioritize{' '}
            <Highlighter action="underline" color="#10B981" animationDuration={800} isView={true}>
              proximity
            </Highlighter>
            {' '}and{' '}
            <Highlighter action="highlight" color="#87cefa" animationDuration={800} isView={true}>
              personality
            </Highlighter>
            .
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <p className="text-4xl font-headline font-extrabold text-primary flex items-center justify-center">
                <NumberTicker value={stat.value} decimalPlaces={stat.decimalPlaces || 0} />
                <span>{stat.suffix}</span>
              </p>
              <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;