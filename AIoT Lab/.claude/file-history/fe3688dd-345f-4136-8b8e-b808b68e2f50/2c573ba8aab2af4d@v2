import React, { useState, useEffect, useRef } from 'react';
import { X, Check, AlertCircle, Sparkles, Folder, FileText } from 'lucide-react';

interface HierarchyPromptModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  placeholder?: string;
  defaultValue?: string;
  submitLabel?: string;
  type?: 'category' | 'file';
  onClose: () => void;
  onSubmit: (value: string) => Promise<void> | void;
}

export const HierarchyPromptModal: React.FC<HierarchyPromptModalProps> = ({
  isOpen,
  title,
  subtitle,
  placeholder = 'Enter name...',
  defaultValue = '',
  submitLabel = 'Confirm',
  type = 'category',
  onClose,
  onSubmit,
}) => {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError(null);
      setIsSubmitting(false);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const validate = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return 'Name cannot be empty.';
    if (trimmed.length > 120) return 'Name must be 120 characters or fewer.';
    if (/[<>:"/\\|?*\x00-\x1F]/.test(trimmed) || /[. ]$/.test(trimmed)) {
      return 'Name cannot contain path characters (/, \\) or Windows reserved characters (< > : " | ? *), or end in a dot/space.';
    }
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(trimmed)) {
      return 'That name is reserved by the operating system.';
    }
    return null;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const validationError = validate(value);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(value.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-hazard-card border-2 border-hazard-gold/60 shadow-2xl p-6 flex flex-col gap-4 animate-scaleUp text-left"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-hazard-gold/10 border border-hazard-gold/30 text-hazard-gold shadow-sm">
              {type === 'category' ? <Folder className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-hazard-textBright font-mono">
                {title}
              </h3>
              {subtitle && <p className="text-xs text-hazard-textMuted font-mono mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border border-hazard-border text-hazard-textMuted hover:text-white hover:bg-hazard-cardHover transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-hazard-textMuted">
              {type === 'category' ? 'Category Folder Name' : 'Table File Name (.json)'}
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-hazard-void border border-hazard-border focus-within:border-hazard-gold transition">
              <input
                ref={inputRef}
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onClose();
                }}
                className="w-full bg-transparent text-xs font-mono text-hazard-textBright placeholder:text-hazard-textMuted/40 outline-none"
              />
            </div>
          </div>

          {/* Validation Error Message */}
          {error && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-hazard-border/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-hazard-textMuted hover:text-white hover:bg-hazard-card transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-hazard-gold to-hazard-gold hover:brightness-110 text-black shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{isSubmitting ? 'Saving...' : submitLabel}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
