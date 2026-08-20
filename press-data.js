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
	{"c":"Pendal","t":"Pendal shutters Global Select Fund","s":"Financial Standard","y":"Australia","d":"2026-06-24","m":"negative","k":["Futures Market","Long Term Outlook","Asset Management / Wealth Management"],"u":"https://article.signal-ai.com/176f1f8a-0bfd-3c72-9c5d-6c0ef9c8384b?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Colonial First State","t":"Change in substantial holding for SDF","s":"Listcorp","y":"Australia","d":"2026-06-16","m":"neutral","k":["Asset Management / Wealth Management","Financial and Business Services","Credit"],"u":"https://article.signal-ai.com/f78f89b0-2ab1-3c23-a82e-6d602818d15d?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Colonial First State","t":"Becoming a substantial holder","s":"Listcorp","y":"Australia","d":"2026-06-09","m":"neutral","k":["Asset Management / Wealth Management","Financial and Business Services","Credit"],"u":"https://article.signal-ai.com/7a12329c-18c0-3b3f-a813-ac814be72941?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Colonial First State","t":"Australians working extra four years to afford a decent retirement, new Colonial First State research reveals","s":"Albany Advertiser","y":"Australia","d":"2026-05-31","m":"neutral","k":["Thought leadership","Financial Literacy","Personal Finance"],"u":"https://article.signal-ai.com/de74ba26-014e-30cc-838b-9de43c2af80a?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Colonial First State","t":"Colonial First State taps Challenger and Generation Life for retiree yield | the advisory","s":"ausbiz","y":"Australia","d":"2026-05-20","m":"positive","k":["Financial Literacy","Asset Management / Wealth Management","Financial and Business Services"],"u":"https://article.signal-ai.com/859ce7f3-70ba-3cd5-9669-6d0277c5b914?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Pendal","t":"Development Of Drama Pendal Near Gole Chowk. </br> Drama Pendal [Al Bawaba Business]","s":"Al Bawaba","y":"Jordan","d":"2026-05-16","m":"neutral","k":["Tender","Privatisation"],"u":"https://article.signal-ai.com/b7758806-66e1-39a9-a058-0e05010a9335?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Pendal","t":"Pendal invests to boost social, low-carbon transportation pipelines","s":"FS Sustainability","y":"Australia","d":"2026-05-14","m":"positive","k":["Press Releases","Construction","Impact investing"],"u":"https://article.signal-ai.com/bf5f540b-06dc-38bb-9dcf-9b8b455c8de1?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Colonial First State","t":"Becoming a substantial holder for HUB","s":"Listcorp","y":"Australia","d":"2026-04-30","m":"neutral","k":["Asset Management / Wealth Management","Financial and Business Services","Credit"],"u":"https://article.signal-ai.com/5f087ac1-0d1e-3fec-8b58-5825bce55fe9?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Pendal","t":"Former Pendal Group CEO Named New CIO for Australia's Future Fund","s":"Sovereign Wealth Fund Institute","y":"United States","d":"2026-04-23","m":"neutral","k":["Corporate Alumni","Futures Market","Risk Management"],"u":"https://article.signal-ai.com/4ce6a351-ea98-3f8e-b36e-37b18c9c06e3?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Magellan","t":"Magellan's former star Hamish Douglass opens up about his sexuality","s":"MyPressToday.com","y":"United States","d":"2026-04-20","m":"neutral","k":["Misconduct","Digital Resiliency","Business Resilience"],"u":"https://article.signal-ai.com/dae3f7f6-d5a5-3cdb-a847-34f0a4dbf34b?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Magellan","t":"Douglass Reveals Crisis Behind Magellan Departure","s":"ShareCafe","y":"Australia","d":"2026-04-19","m":"negative","k":["Ownership Change","Asset Management / Wealth Management","Investment"],"u":"https://article.signal-ai.com/d6fc556c-7841-393c-89dd-cd4a1ed2c28d?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Colonial First State","t":"Colonial First State allocates A$370m to global infrastructure strategy with Morrison","s":"Institutional Real Estate","y":"United States","d":"2026-04-15","m":"positive","k":["Long Term Outlook","Asset Management / Wealth Management","Alternative Investments"],"u":"https://article.signal-ai.com/4846a266-7c93-3d43-bffe-4ffb9d1a1aac?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"ClearBridge","t":"Clearbridge Mid Cap Strategy Added Somnigroup International (SGI) Amid Mixed Growth Drivers ClearBridge Investments, a global equity manager, recently published first-quarter 2026 commentary for its “Mid Cap Strategy”. A copy of the letter can be download","s":"Yahoo! 7 Finance","y":"Australia","d":"2026-04-10","m":"neutral","k":["Futures Market","Investment Deals","Asset Management / Wealth Management"],"u":"https://article.signal-ai.com/74ce80bb-9bed-30ca-a230-0241b6b26ab1?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"ClearBridge","t":"Charles River Laboratories International (CRL) Positioned to Benefit from Preclinical Research Activity and Biotech Funding Recovery ClearBridge Investments, a global equity manager, recently published first-quarter 2026 commentary for its “Small Cap Grow","s":"Yahoo! 7 Finance","y":"Australia","d":"2026-04-10","m":"neutral","k":["Futures Market","Investment Deals","Asset Management / Wealth Management"],"u":"https://article.signal-ai.com/df9e0061-aa88-33a8-b927-0bd3776f4810?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"ClearBridge","t":"ClearBridge Investments Small Cap Growth Strategy's Q1 2026 Investor Letter","s":"Niftygpt","y":"India","d":"2026-04-09","m":"neutral","k":["Thought leadership","Long Term Outlook","Asset Management / Wealth Management"],"u":"https://article.signal-ai.com/3ac539e1-d694-3c4b-a167-f3f48058a0f7?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Pendal","t":"Construction Of Play Field Roof Pendal Cum Toilet At Village Kuturma </br> Construction Of Play Field Roof Pendal Cum Toilet At Village Kuturmagp Jhurimal Naikpada Playground At Ntpc Darlipali. [TendersInfo (India)]","s":"TendersInfo","y":"India","d":"2026-04-03","m":"neutral","k":["Tender","Privatisation"],"u":"https://article.signal-ai.com/e11eb771-2152-3a86-a6d1-d4a384ede759?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Pendal","t":"Construction Of 1 No Open Pendal At Govt.polytechnic Berhampur [Al Bawaba Business]","s":"Al Bawaba","y":"Jordan","d":"2026-03-25","m":"neutral","k":["Tender","Privatisation"],"u":"https://article.signal-ai.com/dee7ed6e-ef22-30f5-b0d1-de988f3db73c?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Colonial First State","t":"Colonial First State Unifies Operations via Oracle Cloud","s":"B2b Daily","y":"United States","d":"2026-03-25","m":"neutral","k":["Press Releases","Industrial insurance","Thought leadership"],"u":"https://article.signal-ai.com/6341a4be-e943-3796-97d9-50c3e34ac54b?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Colonial First State","t":"Colonial First State moves finance & HR to Oracle cloud Australian","s":"Channel Life Australia","y":"Australia","d":"2026-03-24","m":"positive","k":["Digital Interoperability","Risk Management","Asset Management / Wealth Management"],"u":"https://article.signal-ai.com/d4cd9299-7e6a-3213-a802-7e0c61d50c61?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Colonial First State","t":"Colonial First State bets on AI process overhaul, cuts call times 26%, pushes advisers to scale client reach as productivity gains emerge","s":"Mi3 Australia","y":"Australia","d":"2026-03-24","m":"positive","k":["Press Releases","Reliable Production","UX Design"],"u":"https://article.signal-ai.com/a35da8ca-fd13-30aa-890c-66efeff6df93?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Magellan","t":"Magellan Financial Group Reports Daily Gross Short Sales (Australia) [Australian Government]","s":"Australian Government","y":"Australia","d":"2026-03-21","m":"neutral","k":["Market size","Asset Management / Wealth Management","Credit"],"u":"https://article.signal-ai.com/1f431ca6-2fd2-3539-821b-9067b0adb6bd?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Pendal","t":"Providing Pendal Tents Green Mats, Fans, Generators And Sound Systems Etc At Edgha And Quilla Gadda On The Occasion Of Ramzan Festival In Jagtial Town Under Municipal General Funds For The Year 2026. [Al Bawaba Business]","s":"Al Bawaba","y":"Jordan","d":"2026-03-10","m":"neutral","k":["Tender","Privatisation"],"u":"https://article.signal-ai.com/8ff0db4e-fcd0-36ac-a883-10a62c95b028?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Pendal","t":"Providing Pendal Tents Green Mats, Fans, Generators And Sound Systems Etc At Edgha And Quilla Gadda On The Occasion Of Ramzan Festival In Jagtial Town Under Municipal General Funds For The Year 2026. [TendersInfo (India)]","s":"TendersInfo","y":"India","d":"2026-03-10","m":"neutral","k":["Tender","Privatisation"],"u":"https://article.signal-ai.com/13d217ff-2592-3c2d-b8af-30dbdb6a3ffb?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Pendal","t":"Providing Pendal Tents Green Mats, Fans, Generators And Sound Systems Etc At Edgha And Quilla Gadda On The Occasion Of Ramzan Festival In Jagtial Town Under Municipal General Funds For The Year 2026., Jagitial-Telangana","s":"Tender Detail","y":"India","d":"2026-03-09","m":"neutral","k":["Tender","Privatisation"],"u":"https://article.signal-ai.com/fa0593db-2ce0-3677-874b-a8f25ab9fcce?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Fidelity","t":"Visa, Fidelity International and Others Successfully Completed e-HKD Pilot with Chainlink","s":"Tekedia","y":"United States","d":"2026-03-07","m":"positive","k":["Cryptocurrencies","Risk Management","Enterprise Software"],"u":"https://article.signal-ai.com/1f5223d5-ef97-3f5b-bf63-d4ce37f54d01?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Pendal","t":"Tender For Erection Of Temporary Waterproof Pendal And Other Arrangement For Chavath Bazar At K.T.C. Bus Stand In Canacona Taluka, Canacona-Goa","s":"Tender Detail","y":"India","d":"2026-02-27","m":"neutral","k":["Tender","Privatisation"],"u":"https://article.signal-ai.com/728824c1-0f3a-3628-ba40-05b07265fd6f?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Colonial First State","t":"Becoming a substantial holder for AFG","s":"Listcorp","y":"Australia","d":"2026-02-25","m":"neutral","k":["Asset Management / Wealth Management","Financial and Business Services","Stock Offering"],"u":"https://article.signal-ai.com/bc383b78-7929-3741-aa2e-023d5eaf93e0?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Magellan","t":"Magellan Financial's fumbling exit for chief stock picker","s":"Australian Financial Review","y":"Australia","d":"2026-02-15","m":"negative","k":["Workplace Malpractice","Stock market noise","Integrity in the Workplace"],"u":"https://article.signal-ai.com/3d967567-9357-3a2d-9c29-71ab493f3295?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Colonial First State","t":"Becoming a substantial holder for KAR","s":"Listcorp","y":"Australia","d":"2026-02-04","m":"neutral","k":["Asset Management / Wealth Management","Financial and Business Services","Stock Offering"],"u":"https://article.signal-ai.com/a708c819-1311-3b5d-80ee-75ccdb9ca44b?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"ClearBridge","t":"ClearBridge Investments veteran drops portfolio responsibilities as team reshuffled","s":"MyPressToday.com","y":"United States","d":"2026-02-02","m":"negative","k":["Asset Management / Wealth Management","Financial and Business Services","Investment"],"u":"https://article.signal-ai.com/b5e410c9-70e4-3739-b58c-99d7e381783f?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Magellan","t":"Dubai Hedge Fund: Magellan Capital Launches $975M Fund","s":"Time News","y":"India","d":"2026-01-28","m":"positive","k":["Press Releases","Market size","Futures Market"],"u":"https://article.signal-ai.com/776e23c2-f25f-3160-9003-c2855ab85dc1?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Pendal","t":"Tender Invited For Dental Diaphragam Repair , Dental Chair Water Bottle Replacement , Multi Function Foot Pendal Repari , Denttal Chair Glass Water Filter Replacement , Labour Charge##quantity: 5## [Al Bawaba Business]","s":"Al Bawaba","y":"Jordan","d":"2026-01-18","m":"neutral","k":["Tender","Consumer Products","Privatisation"],"u":"https://article.signal-ai.com/280d42b5-949c-3aa2-aa89-3678b769df66?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"ClearBridge","t":"On Holding AG (ONON) Soared Following Growth in International Markets ClearBridge Investments, an investment management company, released its “ClearBridge Growth Strategy” fourth-quarter 2025 investor letter. A copy of the letter can be downloaded here. U","s":"Yahoo! 7 Finance","y":"Australia","d":"2026-01-12","m":"neutral","k":["Market size","Futures Market","Long Term Outlook"],"u":"https://article.signal-ai.com/ac849bba-5799-304e-9a3e-8b3ba9b4dd63?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"},
	{"c":"Colonial First State","t":"AMP weighs entry into Colonial First State auction; bankers up","s":"Australian Financial Review","y":"Australia","d":"2026-01-11","m":"neutral","k":["Ownership Change","Asset Management / Wealth Management","Financial and Business Services"],"u":"https://article.signal-ai.com/70b559ff-76fe-3d9f-931a-09dbd2fc3466?u=7bcd402b-4e3a-448f-8d99-ede8ad39769d&origin=signal-api&v=web"}
]
};
