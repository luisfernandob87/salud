import { Plus } from 'lucide-react';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      {Icon && (
        <div className="w-16 h-16 rounded-3xl bg-primary-50 text-primary-400 flex items-center justify-center mb-4">
          <Icon size={30} />
        </div>
      )}
      <h3 className="text-base font-semibold text-ink-800">{title}</h3>
      {description && <p className="text-sm text-ink-500 mt-1.5 max-w-xs">{description}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary mt-5">
          <Plus size={16} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
