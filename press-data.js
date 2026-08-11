/* ============================================================
   press-data.js — competitor share of voice from Signal AI.
   Snapshot cut from the signal-api repo's parquet (metrics_volume_sentiment +
   metrics_competitors, synced 23 Jul 2026); the FSI peer set merges the "FSI
   Domestic" (Australia) and "First Sentier Investors" (EMEA) lists and now
   matches the BrightEdge SEO competitor register (source of truth).
   Regenerate by re-running that repo's `sync` and re-cutting.
   quarters: share of voice SCOPED TO STRATEGY TOPICS. Document counts are summed
   over the funds-management lens only (Asset Management, Savings & Pensions,
   Sustainability, Emerging Markets, Fixed Income, Infrastructure), cut from
   data/metrics_by_topic — so the global giants (BlackRock, Vanguard, UBS) are
   sized by their funds-management footprint, not their total index/ratings
   newsflow. t = strategy mentions, p/u/g = positive/neutral/negative.

   articles: a curated Coverage lens over the AU-retail peer set, cut from the
   signal-api search_competitor_mentions parquet. Genuine editorial coverage only
   (fund launches and closures, research, awards, personnel) across 2026; the raw
   feed's regulatory filings, factsheets and stock spam are filtered out. m = the
   competitor's article-level sentiment from Signal; u = Signal reader link.
   ============================================================ */
window.MI_PRESS = {
  generatedAt: '2026-07-23',
  source: 'Signal AI · metrics_by_topic (strategy-scoped)',
  quarters: {
    q1: [
      { n:'BlackRock', t:21201, p:10799, u:8220, g:2182 },
      { n:'Vanguard', t:15477, p:7217, u:6620, g:1640 },
      { n:'UBS', t:11996, p:2872, u:8619, g:505 },
      { n:'Partners Group', t:2873, p:2070, u:684, g:119 },
      { n:'EQT', t:2656, p:1360, u:1282, g:14 },
      { n:'Fidelity', t:1881, p:633, u:1236, g:12 },
      { n:'Robeco', t:791, p:361, u:424, g:6 },
      { n:'BetaShares', t:321, p:90, u:223, g:8 },
      { n:'Magellan', t:118, p:55, u:54, g:9 },
      { n:'ClearBridge', t:108, p:15, u:87, g:6 },
      { n:'Pendal', t:83, p:3, u:80, g:0 },
      { n:'Colonial First State', t:80, p:16, u:64, g:0 },
      { n:'First Sentier Investors', t:451, p:64, u:387, g:0, us:true },
    ],
    q2: [
      { n:'BlackRock', t:20204, p:11260, u:7133, g:1811 },
      { n:'Vanguard', t:15511, p:8293, u:5721, g:1497 },
      { n:'UBS', t:11876, p:3813, u:7742, g:321 },
      { n:'EQT', t:2511, p:1386, u:1063, g:62 },
      { n:'Partners Group', t:2374, p:1416, u:340, g:618 },
      { n:'Fidelity', t:1303, p:475, u:798, g:30 },
      { n:'Robeco', t:973, p:384, u:564, g:25 },
      { n:'BetaShares', t:362, p:256, u:90, g:16 },
      { n:'Colonial First State', t:322, p:65, u:257, g:0 },
      { n:'ClearBridge', t:119, p:22, u:87, g:10 },
      { n:'Magellan', t:112, p:63, u:26, g:23 },
      { n:'Pendal', t:90, p:53, u:34, g:3 },
      { n:'First Sentier Investors', t:360, p:21, u:339, g:0, us:true },
    ],
  },
  articles: [
    { c:'ClearBridge', t:'Non-US equities become more attractive: ClearBridge Investments advises a prudent allocation to markets outside the US', s:'Yes Media', y:'Taiwan', d:'2026-06-29', m:'positive', k:['Fiscal Responsibility','Press Releases'], u:'https://article.signal-ai.com/7bb4b0cd-d1a8-33c9-aaad-9e26ab07d417?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web' },
    { c:'Pendal', t:'Pendal shutters Global Select Fund', s:'Financial Standard', y:'Australia', d:'2026-06-24', m:'negative', k:['Futures Market','Long Term Outlook'], u:'https://article.signal-ai.com/176f1f8a-0bfd-3c72-9c5d-6c0ef9c8384b?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web' },
    { c:'Colonial First State', t:'Australians working extra four years to afford a decent retirement, new Colonial First State research reveals', s:'Albany Advertiser', y:'Australia', d:'2026-05-31', m:'neutral', k:['Thought leadership','Financial Literacy'], u:'https://article.signal-ai.com/de74ba26-014e-30cc-838b-9de43c2af80a?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web' },
    { c:'Colonial First State', t:'Colonial First State taps Challenger and Generation Life for retiree yield | the advisory', s:'ausbiz', y:'Australia', d:'2026-05-20', m:'positive', k:['Financial Literacy','Asset Management / Wealth Management'], u:'https://article.signal-ai.com/af6ff628-7331-3509-93ed-8e4f0cf862fd?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web' },
    { c:'Pendal', t:'Pendal invests to boost social, low-carbon transportation pipelines', s:'FS Sustainability', y:'Australia', d:'2026-05-14', m:'positive', k:['Press Releases','Construction'], u:'https://article.signal-ai.com/bf5f540b-06dc-38bb-9dcf-9b8b455c8de1?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web' },
    { c:'Magellan', t:'Douglass Reveals Crisis Behind Magellan Departure', s:'ShareCafe', y:'Australia', d:'2026-04-19', m:'negative', k:['Ownership Change','Asset Management / Wealth Management'], u:'https://article.signal-ai.com/d6fc556c-7841-393c-89dd-cd4a1ed2c28d?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web' },
    { c:'Fidelity', t:'2026 Leopard Taiwan Fund Awards’ Fidelity International wins the competition in cross-asset placement', s:'Chinatimes CN', y:'Taiwan', d:'2026-04-09', m:'positive', k:['Fiscal Responsibility','Market size'], u:'https://article.signal-ai.com/f4468c74-a416-344b-b225-2066c4e06163?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web' },
    { c:'Fidelity', t:'AI powers corporate rebound as cost pressures rise and geopolitical risks intensify - Fidelity International 2026 Analyst Survey', s:'Wealth DFM Magazine', y:'United Kingdom', d:'2026-03-30', m:'neutral', k:['Fiscal Responsibility','Thought leadership'], u:'https://article.signal-ai.com/be71be4b-335c-3a8c-8f65-4ad30391de64?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web' },
  ],
};
