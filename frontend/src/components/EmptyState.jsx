import { Card, CardContent } from '@/components/ui/card.jsx';

/** Honest empty state: shown where a feature or data does not exist yet. */
export default function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        {Icon && (
          <span className="glass-control flex h-14 w-14 items-center justify-center rounded-full text-primary">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
        )}
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
        {children}
      </CardContent>
    </Card>
  );
}
