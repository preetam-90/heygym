'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { photoSrc } from '@/lib/gym-owner';
import type { Gym, GymImage } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Upload, Star, Trash2, ImageIcon } from 'lucide-react';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 5 * 1024 * 1024;

export default function GymPhotosPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [gym, setGym] = useState<Gym | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyPhotoId, setBusyPhotoId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    try {
      const gyms = await api.getMyGyms();
      const first = gyms[0] ?? null;
      if (!first) {
        router.push('/gym-owner/my-gym');
        return;
      }
      setGym(first);
    } catch (err) {
      if (err instanceof Error && err.message === 'Session expired. Please log in again.') {
        router.push('/login?redirect=/gym-owner/my-gym/photos');
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    const gyms = await api.getMyGyms();
    const first = gyms[0] ?? null;
    setGym(first);
    return first;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !gym) return;
    setError(null);
    setNotice(null);
    const current = gym.images?.length ?? 0;
    if (current + files.length > 10) {
      setError(`You can upload at most 10 photos (you have ${current}).`);
      return;
    }
    setUploading(true);
    try {
      let done = 0;
      for (const file of Array.from(files)) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          throw new Error(`"${file.name}" is not a JPG, PNG, or WebP image.`);
        }
        if (file.size > MAX_BYTES) {
          throw new Error(`"${file.name}" exceeds the 5 MB limit.`);
        }
        done += 1;
        setUploadProgress(`Uploading ${done} of ${files.length}...`);
        await api.uploadGymPhoto(gym.id, file);
      }
      await refresh();
      setNotice(files.length === 1 ? 'Photo uploaded.' : `${files.length} photos uploaded.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo upload failed.');
      await refresh().catch(() => undefined);
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSetPrimary = async (photo: GymImage) => {
    if (!gym || photo.isPrimary) return;
    setBusyPhotoId(photo.id);
    setError(null);
    try {
      await api.setPrimaryPhoto(gym.id, photo.id);
      await refresh();
      setNotice('Primary photo updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set primary photo.');
    } finally {
      setBusyPhotoId(null);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!gym) return;
    setBusyPhotoId(photoId);
    setError(null);
    try {
      await api.deleteGymPhoto(gym.id, photoId);
      setConfirmDeleteId(null);
      await refresh();
      setNotice('Photo deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo.');
    } finally {
      setBusyPhotoId(null);
    }
  };

  if (loading) {
    return (
      <div className="container px-4 py-16">
        <div className="flex justify-center" role="status" aria-label="Loading">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4FF4F]" />
        </div>
      </div>
    );
  }

  if (!gym) return null;
  const photos = gym.images ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/gym-owner/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-[#D4FF4F]">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Dashboard
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-white">Gym Photos</h1>
          <p className="mt-1 text-zinc-400">
            {photos.length} of 10 photos · JPG, PNG, or WebP · max 5 MB each
          </p>
        </div>
        <Button onClick={() => fileRef.current?.click()} disabled={uploading || photos.length >= 10}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Upload Photos
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {uploadProgress && (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-[#D4FF4F]/30 bg-[#D4FF4F]/10 p-4 text-sm text-[#D4FF4F]" role="status">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {uploadProgress}
        </div>
      )}
      {error && (
        <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="mt-6 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-green-400" role="status">
          {notice}
        </div>
      )}

      {photos.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-12 text-center">
            <ImageIcon className="mx-auto mb-4 h-16 w-16 text-zinc-600" aria-hidden="true" />
            <h2 className="text-lg font-medium text-white">No gym photos uploaded</h2>
            <p className="mx-auto mt-2 max-w-md text-zinc-400">
              Add photos to make your gym profile more attractive to customers.
            </p>
            <Button className="mt-4" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Photos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => {
            const src = photoSrc(photo.url);
            const busy = busyPhotoId === photo.id;
            return (
              <Card key={photo.id} className="overflow-hidden">
                <div className="relative aspect-video bg-zinc-900">
                  {src && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="Gym photo" className="h-full w-full object-cover" loading="lazy" />
                  )}
                  {photo.isPrimary && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#D4FF4F] px-2 py-1 text-xs font-bold text-black">
                      <Star className="h-3 w-3" aria-hidden="true" />
                      Primary
                    </span>
                  )}
                </div>
                <CardHeader className="flex flex-row items-center justify-between gap-2 p-4">
                  <CardTitle className="text-sm font-medium text-zinc-300">
                    {photo.isPrimary ? 'Cover photo' : 'Photo'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 p-4 pt-0">
                  {!photo.isPrimary && (
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => void handleSetPrimary(photo)}>
                      {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                      Set primary
                    </Button>
                  )}
                  {confirmDeleteId === photo.id ? (
                    <>
                      <Button variant="destructive" size="sm" disabled={busy} onClick={() => void handleDelete(photo.id)}>
                        {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                        Confirm delete
                      </Button>
                      <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirmDeleteId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirmDeleteId(photo.id)}>
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
