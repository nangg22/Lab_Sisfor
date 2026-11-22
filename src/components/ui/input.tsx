import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[11px] font-black uppercase tracking-wide text-slate-700">
            {label}
            {props.required && <span className="ml-1 text-rose-500">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'block w-full rounded-lg border-2 border-slate-900 bg-white px-3 py-2 text-sm font-medium text-slate-900',
            'shadow-[2px_2px_0px_0px_#0f172a]',
            'placeholder:text-slate-400 placeholder:font-normal',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20',
            'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60',
            error && 'border-rose-600 shadow-[2px_2px_0px_0px_#e11d48]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
        {hint && !error && <p className="text-xs font-bold text-slate-500">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[11px] font-black uppercase tracking-wide text-slate-700">
            {label}
            {props.required && <span className="ml-1 text-rose-500">*</span>}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          rows={3}
          className={cn(
            'block w-full rounded-lg border-2 border-slate-900 bg-white px-3 py-2 text-sm font-medium text-slate-900',
            'shadow-[2px_2px_0px_0px_#0f172a] resize-none',
            'placeholder:text-slate-400 placeholder:font-normal',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20',
            'disabled:cursor-not-allowed disabled:bg-slate-50',
            error && 'border-rose-600 shadow-[2px_2px_0px_0px_#e11d48]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
        {hint && !error && <p className="text-xs font-bold text-slate-500">{hint}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
