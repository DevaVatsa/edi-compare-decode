import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";
import { EDIError, ValidationResult } from "@/utils/ediValidator";

interface ErrorSummaryProps {
  validationResult: ValidationResult;
  fileName: string;
}

export const ErrorSummary = ({ validationResult, fileName }: ErrorSummaryProps) => {
  const { isValid, errors, warnings, totalIssues } = validationResult;

  const getErrorIcon = (type: EDIError['type']) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getErrorVariant = (type: EDIError['type']): "destructive" | "default" => {
    switch (type) {
      case 'critical':
        return 'destructive';
      case 'warning':
      case 'info':
      default:
        return 'default';
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          {isValid ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          )}
          Validation Summary - {fileName}
        </h3>
        <div className="flex items-center gap-2">
          {errors.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {errors.length} Error{errors.length > 1 ? 's' : ''}
            </Badge>
          )}
          {warnings.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {warnings.length} Warning{warnings.length > 1 ? 's' : ''}
            </Badge>
          )}
          {isValid && (
            <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
              Valid
            </Badge>
          )}
        </div>
      </div>

      {totalIssues === 0 ? (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            ✅ No validation issues found. This EDI file follows all standard formatting rules.
          </AlertDescription>
        </Alert>
      ) : (
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {[...errors, ...warnings].map((error, index) => (
              <Alert key={error.id || index} variant={getErrorVariant(error.type)}>
                <div className="flex items-start gap-3">
                  {getErrorIcon(error.type)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{error.message}</p>
                      <Badge variant="outline" className="text-xs">
                        Line {error.segment.lineNumber}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {error.description}
                    </p>
                    {error.suggestion && (
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        💡 {error.suggestion}
                      </p>
                    )}
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground">
                        Show segment
                      </summary>
                      <code className="block mt-1 p-2 bg-secondary/50 rounded font-mono">
                        {error.segment.raw}
                      </code>
                    </details>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
};