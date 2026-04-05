interface ResultDisplayProps {
  result: unknown | null;
  error: string | null;
  loading?: boolean;
}

export function ResultDisplay({ result, error, loading }: ResultDisplayProps) {
  if (loading) {
    return <div className="result-loading">Processing...</div>;
  }
  if (error) {
    return <div className="result-error">{error}</div>;
  }
  if (result !== null && result !== undefined) {
    return (
      <div className="result-success">
        <pre className="result-json">
          {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
        </pre>
      </div>
    );
  }
  return null;
}
