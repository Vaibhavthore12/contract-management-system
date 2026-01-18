'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import Button from '@/components/Button';
import { ContractStatus, STATUS_FILTERS, StatusFilter } from '@/lib/types';
import { getAllowedTransitions, getTransitionConfig } from '@/lib/lifecycle';

interface Contract {
  id: string;
  name: string;
  status: ContractStatus;
  createdAt: string;
  blueprint: {
    id: string;
    name: string;
  };
}

interface Blueprint {
  id: string;
  name: string;
  _count: {
    contracts: number;
  };
}

export default function Dashboard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [contractsRes, blueprintsRes] = await Promise.all([
        fetch(`/api/contracts?filter=${filter}`),
        fetch('/api/blueprints'),
      ]);

      const contractsData = await contractsRes.json();
      const blueprintsData = await blueprintsRes.json();

      if (contractsData.success) setContracts(contractsData.data);
      if (blueprintsData.success) setBlueprints(blueprintsData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleTransition = async (contractId: string, targetStatus: ContractStatus) => {
    setTransitioning(contractId);
    try {
      const res = await fetch(`/api/contracts/${contractId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStatus }),
      });

      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error transitioning contract:', error);
    } finally {
      setTransitioning(null);
    }
  };

  // Calculate stats
  const stats = {
    total: contracts.length,
    active: contracts.filter(c => ['created', 'approved', 'sent'].includes(c.status)).length,
    signed: contracts.filter(c => c.status === 'signed' || c.status === 'locked').length,
    blueprints: blueprints.length,
  };

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All Contracts' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'signed', label: 'Signed' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-slate-400">Manage your contracts and blueprints</p>
        </div>
        <div className="flex gap-3">
          <Link href="/blueprints/new">
            <Button variant="secondary">+ New Blueprint</Button>
          </Link>
          <Link href="/contracts/new">
            <Button>+ New Contract</Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-indigo-500/20 flex items-center justify-center text-2xl">
              📄
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Contracts</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-2xl">
              ⚡
            </div>
            <div>
              <p className="text-sm text-slate-400">Active</p>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-2xl">
              ✅
            </div>
            <div>
              <p className="text-sm text-slate-400">Signed</p>
              <p className="text-2xl font-bold text-white">{stats.signed}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-2xl">
              📋
            </div>
            <div>
              <p className="text-sm text-slate-400">Blueprints</p>
              <p className="text-2xl font-bold text-white">{stats.blueprints}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Contracts</h2>
          <div className="flex gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === option.value
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-700 text-slate-400 hover:text-white'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading...</div>
        ) : contracts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 mb-4">No contracts found</p>
            <Link href="/contracts/new">
              <Button>Create Your First Contract</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Contract Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Blueprint</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {contracts.map((contract) => {
                  const allowedTransitions = getAllowedTransitions(contract.status);

                  return (
                    <tr key={contract.id} className="hover:bg-slate-700/30">
                      <td className="px-6 py-4">
                        <Link href={`/contracts/${contract.id}`} className="text-white hover:text-indigo-400 font-medium">
                          {contract.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{contract.blueprint.name}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={contract.status} />
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(contract.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link href={`/contracts/${contract.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                          {allowedTransitions.map((status) => {
                            const config = getTransitionConfig(status);
                            return (
                              <Button
                                key={status}
                                variant={config.variant}
                                size="sm"
                                onClick={() => handleTransition(contract.id, status)}
                                isLoading={transitioning === contract.id}
                              >
                                {config.label}
                              </Button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
