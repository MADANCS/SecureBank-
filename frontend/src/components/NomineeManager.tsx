import { useState, useEffect } from 'react';
import { getNominees, addNominee, removeNominee } from '../api/newFeaturesService';

export default function NomineeManager({ accountNumber }: { accountNumber: string }) {
  const [nominees, setNominees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ nomineeName: '', relationship: '', dateOfBirth: '', phone: '' });

  const fetchNominees = async () => {
    try {
      const res = await getNominees(accountNumber);
      setNominees(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNominees();
  }, [accountNumber]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await addNominee(accountNumber, { ...form, sharePercentage: 100 });
      setForm({ nomineeName: '', relationship: '', dateOfBirth: '', phone: '' });
      await fetchNominees();
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await removeNominee(accountNumber, id);
      await fetchNominees();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="animate-pulse h-10 bg-slate-100 rounded-xl" />;

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Nominees</h4>
      </div>
      
      {nominees.length === 0 ? (
        <p className="text-xs text-slate-400 mb-3">No nominees added for this account.</p>
      ) : (
        <div className="space-y-2 mb-4">
          {nominees.map(n => (
            <div key={n.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg text-sm">
              <div>
                <p className="font-medium text-slate-800">{n.nomineeName}</p>
                <p className="text-[10px] text-slate-500">{n.relationship} • {n.phone}</p>
              </div>
              <button onClick={() => handleRemove(n.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
            </div>
          ))}
        </div>
      )}

      {nominees.length === 0 && (
        <form onSubmit={handleAdd} className="space-y-2">
          <input required type="text" placeholder="Full Name" value={form.nomineeName} onChange={e => setForm({...form, nomineeName: e.target.value})} className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200" />
          <div className="flex gap-2">
            <input required type="text" placeholder="Relationship" value={form.relationship} onChange={e => setForm({...form, relationship: e.target.value})} className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200" />
            <input required type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <input required type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 text-slate-500" />
          <button type="submit" disabled={adding} className="w-full text-xs bg-slate-900 text-white font-medium py-2 rounded-lg disabled:opacity-50">
            {adding ? 'Adding...' : 'Add Nominee'}
          </button>
        </form>
      )}
    </div>
  );
}
