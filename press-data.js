/* ============================================================
   press-data.js — competitor share of voice from Signal AI.
   Snapshot cut from the signal-api repo's parquet (metrics_volume_sentiment +
   metrics_competitors, synced Jul 2026); the FSI peer set merges the "FSI
   Domestic" (Australia) and "First Sentier Investors" (EMEA) lists. Regenerate
   by re-running that repo's `sync` and re-cutting.
   t = total mentions, p/u/g = positive/neutral/negative.

   READ WITH CARE: UBS, BlackRock and Vanguard are global giants whose coverage
   is overwhelmingly not about Australian funds management — context, not a
   like-for-like race.

   NO articles block on purpose: without a product-context topic lens the raw
   mention feed for this peer set is dominated by fund notices and stock spam.
   The Coverage toggle shows its empty state until a curated lens exists.
   ============================================================ */
window.MI_PRESS = {
  generatedAt: '2026-07-23',
  source: 'Signal AI · metrics_volume_sentiment + metrics_competitors',
  quarters: {
    q1: [
      { n:'UBS', t:258870, p:70915, u:172002, g:15953 },
      { n:'BlackRock', t:178789, p:74594, u:82334, g:21861 },
      { n:'Vanguard', t:70564, p:35019, u:30998, g:4547 },
      { n:'EQT', t:26581, p:12218, u:13460, g:903 },
      { n:'Partners Group', t:8876, p:3817, u:4354, g:705 },
      { n:'Fidelity International', t:6656, p:2272, u:4327, g:57 },
      { n:'Robeco', t:2220, p:1021, u:1167, g:32 },
      { n:'BetaShares', t:2137, p:676, u:1417, g:44 },
      { n:'ClearBridge Investments', t:1194, p:151, u:1023, g:20 },
      { n:'Magellan Financial Group', t:1183, p:512, u:551, g:120 },
      { n:'First Sentier Investors', t:1045, p:289, u:750, g:6, us:true },
      { n:'Pendal Group', t:398, p:43, u:336, g:19 },
      { n:'Colonial First State', t:223, p:61, u:159, g:3 },
    ],
    q2: [
      { n:'UBS', t:255480, p:79311, u:161388, g:14781 },
      { n:'BlackRock', t:147202, p:66381, u:68427, g:12394 },
      { n:'Vanguard', t:66739, p:33265, u:27716, g:5758 },
      { n:'EQT', t:28576, p:13156, u:13171, g:2249 },
      { n:'Partners Group', t:11278, p:4443, u:3693, g:3142 },
      { n:'Fidelity International', t:6141, p:2163, u:3923, g:55 },
      { n:'Robeco', t:2621, p:1205, u:1360, g:56 },
      { n:'BetaShares', t:2244, p:791, u:1392, g:61 },
      { n:'ClearBridge Investments', t:1506, p:311, u:1147, g:48 },
      { n:'Magellan Financial Group', t:1240, p:488, u:628, g:124 },
      { n:'First Sentier Investors', t:875, p:137, u:733, g:5, us:true },
      { n:'Colonial First State', t:464, p:94, u:368, g:2 },
      { n:'Pendal Group', t:277, p:87, u:185, g:5 },
    ],
  },
};
