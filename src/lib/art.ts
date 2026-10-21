/** Real Chog art through our proxy route (gateway fallback, immutable cache). */
export const artUrl = (tokenId: number) => `/api/art/${tokenId}`;