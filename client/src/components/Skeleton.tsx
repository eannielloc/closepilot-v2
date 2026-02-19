import { cn } from '../lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-white/10 rounded', className)} />;
}

export function CardSkeleton() {
  return (
    <div className="glass p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-64" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-1.5 w-48 rounded-full" />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Skeleton className="h-4 w-32" />
      <div className="glass p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10" />)}
        </div>
        <Skeleton className="h-2 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="glass p-6 space-y-3">
          <Skeleton className="h-6 w-32" />
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
        <div className="glass p-6 space-y-3">
          <Skeleton className="h-6 w-32" />
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-white/20 mb-4 flex justify-center">{icon}</div>
      <h3 className="text-lg font-semibold text-white/60 mb-2">{title}</h3>
      <p className="text-white/40 text-sm max-w-md mx-auto mb-6">{description}</p>
      {action}
    </div>
  );
}
