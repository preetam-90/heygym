'use client';

import { useEffect, useState } from 'react';
import { api, friendlyError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Enquiry, EnquiryStatus } from '@/types';
import { EnquiryStatusBadge } from '@/components/status-badge';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui-states';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

export default function OwnerEnquiriesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<Enquiry[]>([]);
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.listOwnerEnquiries({ pageSize: 48 });
      setItems(r.enquiries);
      if (r.enquiries.length && !selected) {
        const full = await api.getOwnerEnquiry(r.enquiries[0].id);
        setSelected(full);
        setResponse(full.response ?? '');
      }
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) void load();
    else if (!authLoading) setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const select = async (id: string) => {
    const full = await api.getOwnerEnquiry(id);
    setSelected(full);
    setResponse(full.response ?? '');
    setItems((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'READ' as EnquiryStatus } : e)));
  };

  const update = async (status?: EnquiryStatus, sendResponse = false) => {
    if (!selected) return;
    setBusy(true);
    try {
      const updated = await api.updateOwnerEnquiry(selected.id, {
        ...(status ? { status } : {}),
        ...(sendResponse ? { response, status: 'RESPONDED' as EnquiryStatus } : {}),
      });
      setSelected(updated);
      setItems((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || loading) return <LoadingSkeleton lines={4} />;
  if (!user) return <EmptyState title="Log in as a gym owner" action={<Link href="/login"><Button>Log in</Button></Link>} />;
  if (error && items.length === 0) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-50">Enquiry inbox</h1>
      {items.length === 0 ? (
        <div className="mt-4"><EmptyState title="No enquiries" hint="Share your public gym page to start receiving leads." /></div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="space-y-2">
            {items.map((e) => (
              <button key={e.id} onClick={() => select(e.id)} className={`w-full rounded-2xl border p-3 text-left ${selected?.id === e.id ? 'border-lime-300/40 bg-lime-300/[0.05]' : 'border-white/10 bg-white/[0.02]'}`}>
                <p className="flex items-center justify-between gap-2 text-[14px] font-medium text-zinc-100">
                  {e.user?.name ?? 'Member'} <EnquiryStatusBadge status={e.status} />
                </p>
                <p className="mt-1 line-clamp-2 text-[13px] text-zinc-400">{e.message}</p>
                <p className="mt-1 text-[12px] text-zinc-600">{e.gym?.name}</p>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            {!selected ? (
              <p className="text-[14px] text-zinc-500">Select an enquiry.</p>
            ) : (
              <>
                <p className="text-[16px] font-semibold text-zinc-100">{selected.user?.name}</p>
                <p className="text-[13px] text-zinc-500">{selected.gym?.name} · {new Date(selected.createdAt).toLocaleString()}</p>
                <p className="mt-3 rounded-xl bg-white/5 p-3 text-[14px] text-zinc-200">{selected.message}</p>
                <label className="mb-1.5 mt-4 block text-[13px] text-zinc-400" htmlFor="owner-response">Response</label>
                <Textarea id="owner-response" value={response} onChange={(e) => setResponse(e.target.value)} rows={3} />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button disabled={busy} onClick={() => update(undefined, true)}>Respond</Button>
                  <Button variant="outline" disabled={busy} onClick={() => update('CLOSED')}>Close</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
