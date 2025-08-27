import { FileText, GitCompare } from "lucide-react";

export const Header = () => {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <GitCompare className="h-6 w-6 text-primary" />
          <FileText className="h-6 w-6 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">EDI Compare Tool</h1>
          <p className="text-sm text-muted-foreground">Professional EDI 834/820 File Comparison & Decoder</p>
        </div>
      </div>
    </header>
  );
};