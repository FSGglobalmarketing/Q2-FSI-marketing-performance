/* ============================================================
   press-data.js — competitor share of voice from Signal AI.
   Snapshot cut from the signal-api repo's parquet (metrics_volume_sentiment +
   metrics_competitors, synced 23 Jul 2026); the FSI peer set merges the "FSI
   Domestic" (Australia) and "First Sentier Investors" (EMEA) lists and now
   matches the BrightEdge SEO competitor register (source of truth).
   Regenerate by re-running that repo's `sync` and re-cutting.
   t = total mentions, p/u/g = positive/neutral/negative.

   READ WITH CARE: S&P Global's total is mostly index/ratings newsflow, and
   UBS, BlackRock and Vanguard are global giants whose coverage is
   overwhelmingly not about Australian funds management — context, not a
   like-for-like race.

   articles: a curated Coverage lens over the AU-retail peer set, cut from the
   signal-api search_competitor_mentions parquet. Genuine editorial coverage only
   (fund launches and closures, research, awards, personnel) across 2026; the raw
   feed's regulatory filings, factsheets and stock spam are filtered out. m = the
   competitor's article-level sentiment from Signal; u = Signal reader link.
   ============================================================ */
window.MI_PRESS = {
  generatedAt: '2026-07-23',
  source: 'Signal AI · metrics_volume_sentiment + metrics_competitors',
  quarters: {
    q1: [
      { n:'S&P Global', t:508210, p:85887, u:416918, g:5405 },
      { n:'UBS', t:258855, p:70915, u:171988, g:15952 },
      { n:'BlackRock', t:178789, p:74596, u:82332, g:21861 },
      { n:'Vanguard', t:70566, p:35019, u:31000, g:4547 },
      { n:'Macquarie Group', t:38017, p:9436, u:27968, g:613 },
      { n:'KKR', t:38002, p:13214, u:22111, g:2677 },
      { n:'EQT', t:26579, p:12218, u:13458, g:903 },
      { n:'T. Rowe Price', t:17161, p:5750, u:10954, g:457 },
      { n:'Schroders', t:15342, p:6870, u:7792, g:680 },
      { n:'PIMCO', t:13432, p:3045, u:9514, g:873 },
      { n:'Partners Group', t:8876, p:3817, u:4354, g:705 },
      { n:'J.P. Morgan', t:8466, p:3132, u:5329, g:5 },
      { n:'Fidelity International', t:6656, p:2272, u:4327, g:57 },
      { n:'Federated Hermes', t:4952, p:2413, u:2271, g:268 },
      { n:'Ardian', t:2752, p:1394, u:1274, g:84 },
      { n:'IFM Investors', t:2695, p:802, u:1864, g:29 },
      { n:'Robeco', t:2220, p:1021, u:1167, g:32 },
      { n:'Fisher Investments', t:2181, p:1330, u:812, g:39 },
      { n:'BetaShares', t:2137, p:676, u:1417, g:44 },
      { n:'ClearBridge Investments', t:1194, p:151, u:1023, g:20 },
      { n:'Magellan Financial Group', t:1183, p:512, u:551, g:120 },
      { n:'First Sentier Investors', t:1045, p:289, u:750, g:6, us:true },
      { n:'Pendal Group', t:398, p:43, u:336, g:19 },
      { n:'Colonial First State', t:223, p:61, u:159, g:3 },
      { n:'Platinum Asset Management', t:97, p:14, u:52, g:31 },
    ],
    q2: [
      { n:'UBS', t:255478, p:79309, u:161388, g:14781 },
      { n:'BlackRock', t:147196, p:66381, u:68421, g:12394 },
      { n:'S&P Global', t:124785, p:31023, u:92307, g:1455 },
      { n:'Vanguard', t:66739, p:33265, u:27716, g:5758 },
      { n:'KKR', t:42442, p:14482, u:21484, g:6476 },
      { n:'Macquarie Group', t:36652, p:9368, u:26431, g:853 },
      { n:'EQT', t:28576, p:13156, u:13171, g:2249 },
      { n:'T. Rowe Price', t:17177, p:6698, u:9937, g:542 },
      { n:'PIMCO', t:12133, p:4156, u:7379, g:598 },
      { n:'Schroders', t:11920, p:4713, u:6907, g:300 },
      { n:'Partners Group', t:11278, p:4443, u:3693, g:3142 },
      { n:'Fidelity International', t:6142, p:2163, u:3924, g:55 },
      { n:'Federated Hermes', t:4011, p:1913, u:1923, g:175 },
      { n:'Ardian', t:3236, p:2090, u:1116, g:30 },
      { n:'Robeco', t:2621, p:1205, u:1360, g:56 },
      { n:'IFM Investors', t:2348, p:831, u:1257, g:260 },
      { n:'BetaShares', t:2244, p:791, u:1392, g:61 },
      { n:'Fisher Investments', t:1686, p:1096, u:504, g:86 },
      { n:'ClearBridge Investments', t:1506, p:311, u:1147, g:48 },
      { n:'J.P. Morgan', t:1468, p:244, u:1222, g:2 },
      { n:'Magellan Financial Group', t:1240, p:488, u:628, g:124 },
      { n:'First Sentier Investors', t:875, p:137, u:733, g:5, us:true },
      { n:'Colonial First State', t:464, p:94, u:368, g:2 },
      { n:'Pendal Group', t:277, p:87, u:185, g:5 },
      { n:'Platinum Asset Management', t:103, p:39, u:46, g:18 },
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
