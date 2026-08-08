import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const AXIS = {
  tick: { fontSize: 11, fill: '#94a3b8' },
  axisLine: false,
  tickLine: false,
};

function ChartCard({ title, subtitle, unit, children }) {
  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-ink-800">{title}</h3>
      {subtitle && <p className="text-xs text-ink-400 mb-2">{subtitle}</p>}
      {unit && (
        <p className="text-[11px] text-ink-400 mb-2">
          Unidad: <span className="font-medium text-ink-600">{unit}</span>
        </p>
      )}
      <div className="h-40">{children}</div>
    </div>
  );
}

function toChartData(items, getter) {
  return items
    .slice()
    .reverse()
    .map((d) => ({ date: d.date.slice(5), value: getter(d) }))
    .filter((d) => d.value !== null && d.value !== undefined);
}

export default function HealthCharts({ items }) {
  const data = items || [];

  const weight = toChartData(data, (d) => d.weight_kg);
  const bp = toChartData(data, (d) => d.bp_sys);
  const glucose = toChartData(data, (d) => d.glucose);
  const temperature = toChartData(data, (d) => d.temperature);
  const heartRate = toChartData(data, (d) => d.heart_rate);
  const spo2 = toChartData(data, (d) => d.spo2);
  const sleep = toChartData(data, (d) => d.sleep_hours);
  const mood = toChartData(data, (d) => d.mood);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {weight.length > 0 && (
        <ChartCard title="Peso" unit="kg">
          <ResponsiveContainer>
            <AreaChart data={weight} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" {...AXIS} />
              <YAxis {...AXIS} domain={['auto', 'auto']} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#10b981" fill="#d1fae5" strokeWidth={2} name="kg" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {bp.length > 0 && (
        <ChartCard title="Presión arterial" unit="mmHg">
          <ResponsiveContainer>
            <LineChart data={bp} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" {...AXIS} />
              <YAxis {...AXIS} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} name="Sistólica" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {glucose.length > 0 && (
        <ChartCard title="Glucosa" unit="mg/dL">
          <ResponsiveContainer>
            <LineChart data={glucose} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" {...AXIS} />
              <YAxis {...AXIS} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {temperature.length > 0 && (
        <ChartCard title="Temperatura" unit="°C">
          <ResponsiveContainer>
            <LineChart data={temperature} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" {...AXIS} />
              <YAxis {...AXIS} domain={['dataMin - 0.3', 'dataMax + 0.3']} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {heartRate.length > 0 && (
        <ChartCard title="Frecuencia cardíaca" unit="lpm">
          <ResponsiveContainer>
            <LineChart data={heartRate} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" {...AXIS} />
              <YAxis {...AXIS} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {spo2.length > 0 && (
        <ChartCard title="Saturación de oxígeno" unit="%">
          <ResponsiveContainer>
            <LineChart data={spo2} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" {...AXIS} />
              <YAxis {...AXIS} domain={[85, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {sleep.length > 0 && (
        <ChartCard title="Horas de sueño" unit="horas">
          <ResponsiveContainer>
            <BarChart data={sleep} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" {...AXIS} />
              <YAxis {...AXIS} />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {mood.length > 0 && (
        <ChartCard title="Estado de ánimo" unit="1-5">
          <ResponsiveContainer>
            <LineChart data={mood} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" {...AXIS} />
              <YAxis {...AXIS} domain={[0, 5]} tickCount={6} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}
