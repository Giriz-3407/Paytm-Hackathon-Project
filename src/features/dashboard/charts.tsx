'use client';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { Incident, severities, categories } from '@/types/domain';
import { Card } from '@/components/ui/primitives';
import { EmptyState } from '@/components/shared/feedback';
const colors = [
  'var(--severity-critical)',
  'var(--severity-high)',
  'var(--severity-medium)',
  'var(--severity-low)',
  'var(--severity-unknown)',
];
export function SeverityChart({ incidents }: { incidents: Incident[] }) {
  const data = severities
    .map((name, n) => ({
      name,
      value: incidents.filter((i) => i.severity === name).length,
      color: colors[n],
    }))
    .filter((d) => d.value > 0);
  return (
    <Card className="chart-card">
      <div className="panel-title">
        <h2>Severity distribution</h2>
        <span>By current assessment</span>
      </div>
      {!incidents.length ? (
        <EmptyState />
      ) : (
        <div className="donut-layout">
          <div className="donut-chart">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie
                  isAnimationActive={false}
                  data={data}
                  dataKey="value"
                  innerRadius={61}
                  outerRadius={79}
                  paddingAngle={5}
                  stroke="none"
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <strong>{incidents.length}</strong>
              <span>Total incidents</span>
            </div>
          </div>
          <div className="chart-legend">
            {data.map((d) => (
              <div key={d.name}>
                <span>
                  <i style={{ background: d.color }} />
                  {d.name}
                </span>
                <strong>{d.value}</strong>
                <small>{Math.round((d.value / incidents.length) * 100)}%</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
export function CategoryChart({ incidents }: { incidents: Incident[] }) {
  const data = categories
    .map((name) => ({ name, value: incidents.filter((i) => i.category === name).length }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
  return (
    <Card className="chart-card">
      <div className="panel-title">
        <h2>Incidents by category</h2>
        <span>{data.length} categories</span>
      </div>
      {!incidents.length ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={206}>
          <BarChart
            data={data.slice(0, 5)}
            layout="vertical"
            margin={{ left: 8, right: 25, top: 8 }}
          >
            <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: 'var(--muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={93}
              tick={{ fill: 'var(--muted)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            />
            <Bar
              isAnimationActive={false}
              dataKey="value"
              name="Incidents"
              fill="var(--accent)"
              radius={[0, 4, 4, 0]}
              barSize={14}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
