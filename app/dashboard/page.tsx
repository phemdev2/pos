'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';

// ── Types ─────────────────────────────────────────────
interface OrderRow {
  id: string;
  amount: number;
  payment_method: string;
  order_date: string;
  user_name: string;
  branch_name: string;
}

interface DashboardData {
  cash_total: number;
  pos_total: number;
  bank_total: number;
  weekly_total: number;
  monthly_total: number;
  branch_totals: { name: string; total_amount: number; total_orders: number }[];
  recent_orders: OrderRow[];
}

// ── UI CONFIG ─────────────────────────────────────────
const colorMap = {
  purple: "bg-purple-100 text-purple-800 border-purple-200",
  green: "bg-green-100 text-green-800 border-green-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
  indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
  red: "bg-red-100 text-red-800 border-red-200",
};

// ── Components ────────────────────────────────────────
const StatCard = ({ title, amount, icon, color }: any) => {
  return (
    <div className={`${colorMap[color]} border shadow-sm rounded-xl p-4 hover:shadow-md transition`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <i className={`fas fa-${icon}`}></i>
      </div>
      <p className="text-xl font-bold">₦{amount}</p>
    </div>
  );
};

const Table = ({ data }: { data: OrderRow[] }) => {
  const formatter = useMemo(() => new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
  }), []);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
          <tr>
            {['Order ID', 'Store', 'User', 'Payment', 'Amount', 'Date'].map(h => (
              <th key={h} className="px-4 py-3 text-left">{h}</th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y">
          {data.map((item, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-2 font-medium">POS/{item.id}</td>
              <td className="px-4 py-2">{item.branch_name || 'N/A'}</td>
              <td className="px-4 py-2">{item.user_name || 'Unknown'}</td>
              <td className="px-4 py-2 capitalize">{item.payment_method}</td>
              <td className="px-4 py-2">₦{formatter.format(item.amount)}</td>
              <td className="px-4 py-2">
                {new Date(item.order_date).toLocaleString('en-NG')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { profile, fetchProfile } = useAuthStore();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Fetch Profile
  useEffect(() => {
    fetchProfile();
  }, []);

  // Redirect non-admin safely
  useEffect(() => {
    if (profile && profile.role?.toLowerCase() !== 'admin') {
      router.push('/pos');
    }
  }, [profile]);

  // Fetch Dashboard Data
  useEffect(() => {
    if (!profile?.company_id) return;

    if (profile.role?.toLowerCase() === 'admin') {
      fetchStats();
    }
  }, [profile?.company_id]);

  const fetchStats = async () => {
    setLoading(true);

    const { data, error } = await supabase.rpc('get_admin_dashboard', {
      comp_id: profile?.company_id,
    });

    if (error) {
      console.error(error);
      setData(null);
    } else {
      setData(data);
    }

    setLoading(false);
  };

  // Guards
  if (!profile) return <div className="p-8 text-center text-gray-400">Loading session...</div>;
  if (profile.role?.toLowerCase() !== 'admin') return null;
  if (loading) return <div className="p-8 text-center text-gray-400">Loading analytics...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load data.</div>;

  // Computed
  const formatter = new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 });

  const totalAmount =
    data.cash_total + data.pos_total + data.bank_total;

  const filteredOrders =
    filter === 'all'
      ? data.recent_orders
      : data.recent_orders.filter(
          o => o.payment_method.toLowerCase() === filter
        );

  // ── Render ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Cash" amount={formatter.format(data.cash_total)} icon="money-bill" color="purple" />
          <StatCard title="POS" amount={formatter.format(data.pos_total)} icon="credit-card" color="green" />
          <StatCard title="Bank" amount={formatter.format(data.bank_total)} icon="university" color="blue" />
          <StatCard title="Total" amount={formatter.format(totalAmount)} icon="wallet" color="yellow" />
          <StatCard title="Weekly" amount={formatter.format(data.weekly_total)} icon="calendar-week" color="indigo" />
          <StatCard title="Monthly" amount={formatter.format(data.monthly_total)} icon="calendar-alt" color="red" />
        </div>

        {/* ── Branch Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.branch_totals.map((branch, i) => (
            <div key={i} className="bg-white border rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-2">{branch.name}</h3>
              <p className="text-sm text-gray-600">
                Orders: <span className="font-bold">{branch.total_orders}</span>
              </p>
              <p className="text-sm text-gray-600">
                Amount: <span className="font-bold">₦{formatter.format(branch.total_amount)}</span>
              </p>
            </div>
          ))}
        </div>

        {/* ── Table Section ── */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-3">
            <h2 className="text-lg font-semibold text-gray-800">Orders</h2>

            <div className="flex gap-2">
              <select
                className="border rounded-md px-3 py-2 text-sm"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="cash">Cash</option>
                <option value="pos">POS</option>
                <option value="bank">Bank</option>
                <option value="credit">Credit</option>
              </select>

              <button
                onClick={() => router.push('/pos')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
              >
                Open POS
              </button>
            </div>
          </div>

          {filteredOrders.length > 0 ? (
            <Table data={filteredOrders} />
          ) : (
            <p className="text-center text-gray-500 py-6">
              No orders found.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}