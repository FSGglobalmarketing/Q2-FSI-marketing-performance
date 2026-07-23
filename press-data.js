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

   NO articles block on purpose: without a product-context topic lens the raw
   mention feed for this peer set is dominated by fund notices and stock spam.
   The Coverage toggle shows its empty state until a curated lens exists.
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
};
