'use client';

import { redirect } from 'next/navigation';

export default function OwnerGymEditPage({ params }: { params: { id: string } }) {
  redirect(`/owner/gyms/${params.id}`);
}
