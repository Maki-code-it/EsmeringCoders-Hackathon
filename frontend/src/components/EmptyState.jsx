import { Card, CardContent } from '@/components/ui/card.jsx';

/** Honest empty state: shown where a feature or data does not exist yet. */
export default function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        {Icon && (
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
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
