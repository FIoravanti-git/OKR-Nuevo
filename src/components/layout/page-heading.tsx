type PageHeadingProps = {
  title: string;
  description?: string;
};

export function PageHeading({ title, description }: PageHeadingProps) {
  return (
    <header className="mb-10 border-b border-border/50 pb-8">
      <h1 className="font-heading text-app-heading font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {description ? (
        <p className="mt-2.5 max-w-3xl text-app-subtitle text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}
