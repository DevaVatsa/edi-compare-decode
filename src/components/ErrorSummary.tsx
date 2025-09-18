import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, AlertCircle, Info, CheckCircle, FileText } from "lucide-react";
import { parseEDIContent } from "@/utils/ediParser";
import { validateEDITransaction } from "@/utils/ediValidator";

interface ErrorSummaryProps {
  files: Array<{
    id: string;
    name: string;
    content: string;
    type: '834' | '820' | 'unknown';
  }>;
}

export const ErrorSummary = ({ files }: ErrorSummaryProps) => {
  if (!files.length) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Analysis Dashboard</h3>
          <p className="text-muted-foreground">Upload EDI files to analyze errors and data quality</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Error Summary & Data Quality</h2>
          <p className="text-muted-foreground">Comprehensive analysis of EDI file errors and compliance issues</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {files.map((file, index) => {
          try {
            const parsed = parseEDIContent(file.content);
            const validation = validateEDITransaction(parsed);
            const { isValid, errors, warnings, totalIssues } = validation;

            return (
              <Card key={file.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    {isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    )}
                    {file.name}
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
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {[...errors, ...warnings].slice(0, 5).map((error, errorIndex) => (
                      <Alert key={error.id || errorIndex} variant={error.type === 'critical' ? 'destructive' : 'default'}>
                        <div className="flex items-start gap-3">
                          {error.type === 'critical' ? (
                            <AlertCircle className="h-4 w-4" />
                          ) : error.type === 'warning' ? (
                            <AlertTriangle className="h-4 w-4" />
                          ) : (
                            <Info className="h-4 w-4" />
                          )}
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
                          </div>
                        </div>
                      </Alert>
                    ))}
                    {totalIssues > 5 && (
                      <p className="text-sm text-muted-foreground text-center">
                        ... and {totalIssues - 5} more issues
                      </p>
                    )}
                  </div>
                )}
              </Card>
            );
          } catch (error) {
            return (
              <Card key={file.id} className="p-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error analyzing {file.name}: Invalid file format
                  </AlertDescription>
                </Alert>
              </Card>
            );
          }
        })}
      </div>
    </div>
  );
};