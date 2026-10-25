/** Google's certification authority ID, as published in Google's ads.txt guidance. */
const GOOGLE_TAG_ID = "f08c47fec0942fa0";

/** ads.txt content from the AdSense client ID (ca-pub-… → pub-…). Empty without an ID. */
export function adsTxt(clientId: string | undefined): string {
  const pub = clientId?.match(/^ca-(pub-\d{10,20})$/)?.[1];
  return pub ? `google.com, ${pub}, DIRECT, ${GOOGLE_TAG_ID}\n` : "";
}
