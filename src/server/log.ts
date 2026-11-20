/**
 * Structured server logging.
 *
 * Writes one JSON object per line, which Cloud Logging parses into severity and fields.
 * Errors carry the Error Reporting type marker so Cloud Error Reporting groups them.
 * Never pass health data, tokens or API keys in `fields`.
 */

type Severity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';

const ERROR_REPORTING_TYPE =
  'type.googleapis.com/google.devtools.clouderrorreporting.v1beta1.ReportedErrorEvent';

function write(severity: Severity, message: string, fields?: Record<string, unknown>): void {
  const entry = { severity, message, time: new Date().toISOString(), ...fields };
  const line = JSON.stringify(entry);
  if (severity === 'ERROR') console.error(line);
  else if (severity === 'WARNING') console.warn(line);
  else console.log(line);
}

export function logInfo(message: string, fields?: Record<string, unknown>): void {
  write('INFO', message, fields);
}

export function logWarning(message: string, fields?: Record<string, unknown>): void {
  write('WARNING', message, fields);
}

/** Logs an exception in the shape Cloud Error Reporting understands. */
export function logError(context: string, error: unknown, fields?: Record<string, unknown>): void {
  const err = error instanceof Error ? error : new Error(String(error));
  write('ERROR', `${context}: ${err.stack || err.message}`, {
    '@type': ERROR_REPORTING_TYPE,
    context: { reportLocation: { functionName: context } },
    ...fields
  });
}

/** Records a product funnel event (for example extraction outcomes) as a structured log line. */
export function logEvent(event: string, fields?: Record<string, unknown>): void {
  write('INFO', `event:${event}`, { event, ...fields });
}
