import React from 'react';
import { Activity, CheckCircle2, AlertCircle, BarChart3, Database, Shield, Box } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { useApp } from '../../../context/OmniLink';
import { StatCard, EmptyState } from '../common';
import { PIE_COLORS, COLORS } from '../../../constants/OmniLink';

export function DashboardView() {
  const { records, stats } = useApp();

  if (!stats || records.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-12">
        <EmptyState icon={<BarChart3 />} title="Pas encore de données"
          description="Créez des points INS pour voir les statistiques" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Database />} label="Total Points" value={stats.total} color={COLORS.primary} />
        <StatCard icon={<Shield />} label="Points SIS" value={stats.byLoopType.find(l => l.name === 'SIS')?.value || 0}
          sub="Sécurité instrumentée" color={COLORS.sis} />
        <StatCard icon={<Activity />} label="Complétude I/O" value={`${stats.completeness}%`}
          sub={`${stats.missingIO} adresses manquantes`} color={stats.completeness > 80 ? COLORS.success : COLORS.warning} />
        <StatCard icon={<Box />} label="JB manquantes" value={stats.missingJB}
          sub="Points sans boîte de jonction" color={stats.missingJB > 0 ? COLORS.warning : COLORS.success} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loop Type Distribution */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-[#00375A] mb-4">Répartition par Loop Type</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={stats.byLoopType} cx="50%" cy="50%" outerRadius={90} innerRadius={50}
                paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                {stats.byLoopType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* System Distribution */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-[#00375A] mb-4">Répartition par Système</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.bySystem}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#0091D5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Function Distribution (Top 15) */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-[#00375A] mb-4">Top Functions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.byFunction} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={140} />
              <Tooltip />
              <Bar dataKey="value" fill="#00375A" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Signal Type Distribution */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-[#00375A] mb-4">Types de Signaux</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.bySig}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {stats.bySig.map((entry, i) => (
                  <Cell key={i} fill={
                    entry.name.startsWith('AI') ? '#0091D5' :
                    entry.name.startsWith('DI') ? '#10B981' :
                    entry.name.startsWith('AO') ? '#F59E0B' :
                    entry.name.startsWith('DO') ? '#EF4444' : '#6B7280'
                  } />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Location Distribution */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-[#00375A] mb-4">Répartition par Localisation</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={stats.byLoc}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#00375A" fill="#00375A" fillOpacity={0.15} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TAB: LOOP DIAGRAM (Preview SVG)
// ─────────────────────────────────────────────────────────

