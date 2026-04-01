import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ModulePlaceholderProps = {
  title: string;
  description: string;
};

export function ModulePlaceholder({ title, description }: ModulePlaceholderProps) {
  return (
    <Card className="border-dashed border-border/70 bg-muted/20 shadow-none dark:bg-muted/10">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Próximo paso: conectar datos reales y permisos por rol para completar este módulo.
      </CardContent>
    </Card>
  );
}
