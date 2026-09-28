'use client';

import type { Gym } from '@/lib/types';

interface GymDetailDrawerProps {
  gym: Gym | null;
  onClose: () => void;
}

export default function GymDetailDrawer({ gym, onClose }: GymDetailDrawerProps) {
  if (!gym) return null;

  const plans = gym.membershipPlans ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${gym.name}`}
    >
      <aside
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-[#151518] p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{gym.name}</h2>
            <p className="mt-1 text-sm text-zinc-400">
              {gym.city} &middot; submitted {new Date(gym.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:border-white/25"
          >
            Close
          </button>
        </div>

        {gym.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gym.imageUrl}
            alt={`${gym.name} photo`}
            className="mt-6 h-48 w-full rounded-xl border border-white/10 object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="mt-6 flex h-24 w-full items-center justify-center rounded-xl border border-white/10 bg-[#09090B] text-sm text-zinc-500"
          >
            No photo available
          </div>
        )}

        <dl className="mt-6 flex flex-col gap-4 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Description</dt>
            <dd className="mt-1 text-zinc-200">{gym.description ?? 'No description provided.'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Address</dt>
            <dd className="mt-1 text-zinc-200">
              {gym.address}, {gym.city}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Contact</dt>
            <dd className="mt-1 text-zinc-200">
              {[gym.phone, gym.email].filter(Boolean).join(' · ') || 'No contact details provided.'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Owner</dt>
            <dd className="mt-1 text-zinc-200">
              {gym.owner ? `${gym.owner.name} (${gym.owner.email})` : 'Unknown owner'}
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Membership plans ({plans.length})
          </h3>
          {plans.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-400">This gym has no membership plans yet.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {plans.map((plan) => (
                <li
                  key={plan.id}
                  className="rounded-lg border border-white/10 bg-[#09090B] p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-zinc-100">{plan.name}</span>
                    <span className="text-zinc-300">${plan.price} / {plan.duration}d</span>
                  </div>
                  {plan.description && (
                    <p className="mt-1 text-xs text-zinc-400">{plan.description}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
