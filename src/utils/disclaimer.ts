/**
 * Utility to sanitize assistant responses and strip clinical advisory / medical disclaimer boilerplate.
 * The medical disclaimer is presented via the dedicated top-right Medical Disclaimer chip in the UI.
 */

export function stripClinicalDisclaimer(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // Match and strip any Clinical Advisory / Medical Disclaimer markdown header or text block
  cleaned = cleaned.replace(
    /(?:(?:\*{1,3}|_{1,3})?\s*(?:\*{2}|_{2})?Clinical Advisory:?(?:\*{2}|_{2})?:?\s*)?(?:Medical Disclaimer:?\s*)?ViskotuN1 provides educational routine extraction grounded strictly in human interventional clinical literature[\s\S]*?(?:licensed physician or physical therapist\.?)/gi,
    ''
  );

  // Match and strip any generic residual "Clinical Advisory:" / "Medical Disclaimer:" headers
  cleaned = cleaned.replace(
    /(?:(?:\*{1,3}|_{1,3})?\s*(?:\*{2}|_{2})?Clinical Advisory:?(?:\*{2}|_{2})?:?\s*)/gi,
    ''
  );

  // Strip leading and trailing markdown divider artifacts or whitespace left over
  cleaned = cleaned.replace(/^[\s\*\-_:]+/, '').replace(/[\s\*\-_]+$/, '').trim();

  return cleaned;
}
