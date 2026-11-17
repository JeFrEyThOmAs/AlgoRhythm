import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  BarChart2, 
  Activity, 
  Clock, 
  Layers, 
  Database, 
  CheckCircle2, 
  TrendingUp, 
  GitBranch,
  BookOpen,
  Code2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import MetricCard from '../components/MetricCard';
import { api } from '../services/api';

export default function ModelInfo() {
  const [modelInfo, setModelInfo] = useState(null);
  const [evaluationData, setEvaluationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [infoRes, evalRes] = await Promise.all([
        api.getModelInfo(),
        api.getEvaluation()
      ]);
      setModelInfo(infoRes);
      setEvaluationData(evalRes?.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const comparison = evaluationData?.comparison_summary || [
    { factors: 20, precision_at_10: 0.1538, recall_at_10: 0.0072, ndcg_at_10: 0.1555, map_at_10: 0.0825, training_time: 2.94 },
    { factors: 50, precision_at_10: 0.1603, recall_at_10: 0.0087, ndcg_at_10: 0.1659, map_at_10: 0.0847, training_time: 4.80 },
    { factors: 100, precision_at_10: 0.1887, recall_at_10: 0.0103, ndcg_at_10: 0.1954, map_at_10: 0.1059, training_time: 17.71 }
  ];

  const current50 = comparison.find(c => c.factors === 50) || comparison[1];

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-dark-800 border border-dark-600 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-purple-400">
          <Cpu className="w-4 h-4" />
          <span>Information Retrieval & Recommender Systems Project • Topic 18</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">
          Model Architecture, Mathematics & Evaluation
        </h1>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          Detailed technical reference and empirical validation of Implicit Alternating Least Squares (ALS)
          evaluated on the Last.fm 1K historical listening benchmark.
        </p>
      </div>

      {/* Production Model Key Metrics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-emerald" />
            <span>Trained Model Benchmark (Factors = 50, Temporal Split)</span>
          </h2>
          <span className="text-xs font-mono text-slate-400 bg-dark-800 px-3 py-1 rounded-lg border border-dark-600">
            Split: Earliest 80% Train / Latest 20% Test
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCard
            label="Precision@10"
            value={(current50.precision_at_10 * 100).toFixed(2) + "%"}
            subtext="1.6+ relevant hits in top 10"
            color="emerald"
          />
          <MetricCard
            label="Recall@10"
            value={(current50.recall_at_10 * 100).toFixed(2) + "%"}
            subtext="Of all future test items"
            color="blue"
          />
          <MetricCard
            label="NDCG@10"
            value={current50.ndcg_at_10.toFixed(4)}
            subtext="Position-discounted rank"
            color="purple"
          />
          <MetricCard
            label="MAP@10"
            value={current50.map_at_10.toFixed(4)}
            subtext="Mean Average Precision"
            color="pink"
          />
          <MetricCard
            label="Train Time"
            value={current50.training_time + "s"}
            subtext="Fast M4 convergence"
            color="purple"
          />
        </div>
      </div>

      {/* Comparison Across Latent Factors (20, 50, 100) */}
      <div className="p-6 rounded-3xl bg-dark-800 border border-dark-600 shadow-xl space-y-6">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-400" />
            <span>Latent Factor Dimension Comparison (k = 20 vs 50 vs 100)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Empirical trade-off between expressive capacity (NDCG/Precision) and training runtime (seconds).
          </p>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparison} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232842" />
              <XAxis dataKey="factors" stroke="#94A3B8" tickFormatter={(f) => `k = ${f} Factors`} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#181C30',
                  borderColor: '#232842',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="precision_at_10" name="Precision@10" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ndcg_at_10" name="NDCG@10" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="map_at_10" name="MAP@10" fill="#EC4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-dark-600 bg-dark-700/50 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Factors (k)</th>
                <th className="py-2.5 px-3">Precision@10</th>
                <th className="py-2.5 px-3">Recall@10</th>
                <th className="py-2.5 px-3">NDCG@10</th>
                <th className="py-2.5 px-3">MAP@10</th>
                <th className="py-2.5 px-3 text-right">Training Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600/60 font-mono">
              {comparison.map((c) => (
                <tr key={c.factors} className={c.factors === 50 ? 'bg-purple-950/20 text-purple-200 font-semibold' : 'text-slate-300'}>
                  <td className="py-2.5 px-3 flex items-center gap-1.5">
                    <span>k = {c.factors}</span>
                    {c.factors === 50 && <span className="text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.2 rounded font-sans">Production Default</span>}
                  </td>
                  <td className="py-2.5 px-3 text-emerald-400">{c.precision_at_10}</td>
                  <td className="py-2.5 px-3">{c.recall_at_10}</td>
                  <td className="py-2.5 px-3 text-purple-300">{c.ndcg_at_10}</td>
                  <td className="py-2.5 px-3 text-pink-400">{c.map_at_10}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{c.training_time}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4 Core Concepts Explained */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-400" />
          <span>Core Mathematical Concepts</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1 */}
          <div className="p-5 rounded-2xl bg-dark-800 border border-dark-600 space-y-2">
            <h3 className="text-sm font-bold text-purple-300">1. Matrix Factorization (MF)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Factorizes the high-dimensional sparse user-song interaction matrix <code className="text-purple-300 bg-dark-900 px-1 py-0.5 rounded font-mono">R ∈ ℝ^(m × n)</code> into user latent factors <code className="text-purple-300 bg-dark-900 px-1 py-0.5 rounded font-mono">X ∈ ℝ^(m × f)</code> and item latent factors <code className="text-purple-300 bg-dark-900 px-1 py-0.5 rounded font-mono">Y ∈ ℝ^(n × f)</code>. Predicted interaction score between user <code className="text-slate-300 font-mono">u</code> and song <code className="text-slate-300 font-mono">i</code> is the dot product <code className="text-purple-300 bg-dark-900 px-1 py-0.5 rounded font-mono">s_ui = x_u^T · y_i</code>.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-2xl bg-dark-800 border border-dark-600 space-y-2">
            <h3 className="text-sm font-bold text-emerald-300">2. Implicit Feedback & Confidence</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Streaming interactions lack explicit 1–5 star ratings. Unobserved entries do not imply dislike; they could simply mean the user has not heard the song. We assign binary preference <code className="text-emerald-300 bg-dark-900 px-1 py-0.5 rounded font-mono">p_ui = 1</code> if play_count &gt; 0, and continuous confidence <code className="text-emerald-300 bg-dark-900 px-1 py-0.5 rounded font-mono">c_ui = 1 + α · log(1 + play_count_ui)</code> (with α = 40).
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-2xl bg-dark-800 border border-dark-600 space-y-2">
            <h3 className="text-sm font-bold text-pink-300">3. Alternating Least Squares (ALS)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Minimizes the loss function <code className="text-pink-300 bg-dark-900 px-1 py-0.5 rounded font-mono">L = ∑ c_ui (p_ui - x_u^T y_i)² + λ (||X||² + ||Y||²)</code>. Because simultaneous optimization of X and Y is non-convex, ALS alternates: holding Y fixed to solve for X analytically in closed form, then holding X fixed to solve for Y.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-5 rounded-2xl bg-dark-800 border border-dark-600 space-y-2">
            <h3 className="text-sm font-bold text-blue-300">4. Cold-Start Fold-In Strategy</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When a new user registers on the website, they have no historical row in the pre-trained offline matrix. Rather than retraining the entire model, we use the closed-form ALS user update step: <code className="text-blue-300 bg-dark-900 px-1 py-0.5 rounded font-mono">x_new = (Y^T C_u Y + λI)^(-1) Y^T C_u p_u</code> using their seed song selections.
            </p>
          </div>
        </div>
      </div>

      {/* Dataset & System Specifications */}
      <div className="p-6 rounded-3xl bg-dark-800 border border-dark-600 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-purple-400" />
          <span>Dataset Details & Production Settings</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-dark-700/60 border border-dark-600">
            <span className="text-slate-400 block">Dataset</span>
            <span className="text-slate-200 font-bold">Last.fm 1K Scrobbles</span>
          </div>
          <div className="p-3 rounded-xl bg-dark-700/60 border border-dark-600">
            <span className="text-slate-400 block">Raw Events</span>
            <span className="text-purple-300 font-bold">16,936,134 logs</span>
          </div>
          <div className="p-3 rounded-xl bg-dark-700/60 border border-dark-600">
            <span className="text-slate-400 block">Catalog Vocabulary</span>
            <span className="text-emerald-300 font-bold">101,309 tracks</span>
          </div>
          <div className="p-3 rounded-xl bg-dark-700/60 border border-dark-600">
            <span className="text-slate-400 block">Matrix Non-Zeros</span>
            <span className="text-pink-300 font-bold">2,316,654 interactions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
