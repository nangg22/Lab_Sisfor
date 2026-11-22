'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MoreVertical,
  Pencil,
  PowerOff,
  Power,
  Trash2,
  MapPin,
  Users,
  Layers,
  FlaskConical,
  Plus,
} from 'lucide-react'

interface LabWithCount {
  id: string
  name: string
  location: string
  capacity: number
  description: string | null
  isActive: boolean
  facilityCount: number
}

interface Props {
  labs: LabWithCount[]
}

export function AdminLabsList({ labs }: Props) {
  const router = useRouter()
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleToggleStatus(lab: LabWithCount) {
    setActiveMenuId(null)
    const nextState = !lab.isActive
    const msg = lab.isActive
      ? `Nonaktifkan ${lab.name}? Mahasiswa tidak akan dapat mengajukan peminjaman ke lab ini.`
      : `Aktifkan kembali ${lab.name}?`

    if (!confirm(msg)) return

    setLoadingId(lab.id)
    try {
      const res = await fetch(`/api/admin/labs/${lab.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextState }),
      })

      if (res.ok) {
        router.refresh()
      } else {
        alert('Gagal mengubah status laboratorium.')
      }
    } catch {
      alert('Terjadi kesalahan jaringan.')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleDeleteLab(lab: LabWithCount) {
    setActiveMenuId(null)
    const msg = `Apakah Anda yakin ingin MENGHAPUS permanen ${lab.name}? Seluruh riwayat fasilitas dan jadwal peminjaman di ruangan ini akan ikut terhapus.`
    if (!confirm(msg)) return

    setLoadingId(lab.id)
    try {
      const res = await fetch(`/api/admin/labs/${lab.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.refresh()
      } else {
        alert('Gagal menghapus laboratorium.')
      }
    } catch {
      alert('Terjadi kesalahan saat menghapus data.')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            Manajemen Laboratorium
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-bold mt-0.5">
            Daftar master ruangan laboratorium, lokasi, dan kontrol status aktif atau hapus lab.
          </p>
        </div>
        <Link
          href="/admin/labs/new"
          className="neo-btn neo-btn-primary px-3.5 py-2 text-xs font-black"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          <span>Tambah Lab Baru</span>
        </Link>
      </div>

      {/* Grid of Lab Cards with Top-Right Kebab Dropdowns */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {labs.map((lab) => {
          const isMenuOpen = activeMenuId === lab.id
          const isLoading = loadingId === lab.id

          return (
            <div
              key={lab.id}
              className={`relative neo-card p-5 transition-all flex flex-col justify-between ${
                !lab.isActive ? 'opacity-70 bg-slate-50' : 'bg-white'
              }`}
            >
              <div>
                {/* Header Row: Lab Icon + Status Pill + Kebab Dropdown */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-300 border border-slate-200 text-slate-950 font-black text-sm shadow-sm">
                      {lab.name.charAt(0)}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full border border-slate-200 shadow-sm ${
                        lab.isActive
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          lab.isActive ? 'bg-slate-950' : 'bg-slate-500'
                        }`}
                      />
                      {lab.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  {/* Kebab Menu at Top-Right Corner */}
                  <div
                    className="relative"
                    ref={isMenuOpen ? menuRef : undefined}
                  >
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setActiveMenuId(isMenuOpen ? null : lab.id)}
                      className="neo-btn neo-btn-white h-8 w-8 p-0 justify-center disabled:opacity-50"
                      title="Opsi Pengaturan Lab"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 z-40 mt-1 w-44 origin-top-right neo-card overflow-hidden shadow-[4px_4px_0px_0px_#0f172a]">
                        <Link
                          href={`/admin/labs/${lab.id}/edit`}
                          onClick={() => setActiveMenuId(null)}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-amber-50 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5 text-slate-500" />
                          Edit Lab
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(lab)}
                          className={`flex w-full items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors ${
                            lab.isActive ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {lab.isActive ? <><PowerOff className="h-3.5 w-3.5" />Nonaktifkan</> : <><Power className="h-3.5 w-3.5" />Aktifkan</>}
                        </button>

                        <div className="border-t-2 border-slate-100" />

                        <button
                          type="button"
                          onClick={() => handleDeleteLab(lab)}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />Hapus Ruangan
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lab Title & Specs */}
                <h3 className="mt-4 font-black text-slate-900 text-base">
                  {lab.name}
                </h3>

                <div className="mt-2.5 space-y-1.5 text-xs text-slate-700 font-bold">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                    <span>{lab.location}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-500 shrink-0" />
                    <span>Kapasitas: {lab.capacity} Kursi</span>
                  </p>
                  {lab.facilityCount > 0 && (
                    <p className="flex items-center gap-2 text-slate-600">
                      <Layers className="h-4 w-4 text-slate-500 shrink-0" />
                      <span>{lab.facilityCount} fasilitas terdaftar</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3 border-t-2 border-slate-100 flex items-center justify-between">
                <Link
                  href={`/labs/${lab.id}`}
                  className="text-xs font-black text-blue-600 hover:underline transition-colors"
                >
                  Lihat halaman publik →
                </Link>
                {isLoading && (
                  <span className="text-[11px] font-bold text-slate-500 animate-pulse">
                    Memproses...
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {labs.length === 0 && (
        <div className="neo-card p-12 text-center bg-white">
          <FlaskConical className="h-10 w-10 text-slate-400 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-slate-800 text-sm font-black mb-4">
            Belum ada laboratorium terdaftar.
          </p>
          <Link
            href="/admin/labs/new"
            className="neo-btn neo-btn-primary px-4 py-2 text-xs font-black"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah laboratorium pertama</span>
          </Link>
        </div>
      )}
    </div>
  )
}
