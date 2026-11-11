'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MoreVertical,
  Pencil,
  PowerOff,
  Power,
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

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Manajemen Laboratorium
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Daftar master ruangan laboratorium, lokasi, dan kontrol status aktif.
          </p>
        </div>
        <Link
          href="/admin/labs/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
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
              className={`relative rounded-lg border border-slate-200 bg-white p-5 shadow-xs transition-all flex flex-col justify-between ${
                !lab.isActive ? 'opacity-70 bg-slate-50/50' : 'hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header Row: Lab Icon + Status Pill + Kebab Dropdown */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-bold text-sm">
                      {lab.name.charAt(0)}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        lab.isActive
                          ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20'
                          : 'bg-slate-100 text-slate-600 ring-1 ring-slate-300'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          lab.isActive ? 'bg-emerald-500' : 'bg-slate-400'
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
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Opsi Pengaturan Lab"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 z-30 mt-1 w-40 origin-top-right rounded-md border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95">
                        <Link
                          href={`/admin/labs/${lab.id}/edit`}
                          onClick={() => setActiveMenuId(null)}
                          className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5 text-slate-400" />
                          <span>Edit Lab</span>
                        </Link>

                        <div className="border-t border-slate-100 my-1" />

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(lab)}
                          className={`flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium transition-colors ${
                            lab.isActive
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {lab.isActive ? (
                            <>
                              <PowerOff className="h-3.5 w-3.5" />
                              <span>Nonaktifkan</span>
                            </>
                          ) : (
                            <>
                              <Power className="h-3.5 w-3.5" />
                              <span>Aktifkan</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lab Title & Specs */}
                <h3 className="mt-3.5 font-semibold text-slate-900 text-sm">
                  {lab.name}
                </h3>

                <div className="mt-2 space-y-1 text-xs text-slate-500 font-medium">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{lab.location}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Kapasitas: {lab.capacity} Kursi</span>
                  </p>
                  {lab.facilityCount > 0 && (
                    <p className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{lab.facilityCount} fasilitas terdaftar</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer: Subtle preview link */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/labs/${lab.id}`}
                  className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
                >
                  Lihat halaman publik →
                </Link>
                {isLoading && (
                  <span className="text-[11px] text-slate-400 animate-pulse">
                    Menyimpan...
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {labs.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-16 text-center shadow-xs">
          <FlaskConical className="h-8 w-8 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-slate-500 text-sm font-medium mb-3">
            Belum ada laboratorium terdaftar.
          </p>
          <Link
            href="/admin/labs/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah laboratorium pertama
          </Link>
        </div>
      )}
    </div>
  )
}

