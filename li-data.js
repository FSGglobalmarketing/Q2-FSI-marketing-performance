/* LinkedIn competitor ads, FSI Australian retail peers (advertiser-tagged, public
   Ad Library). `activity` = live-ad counts per competitor for the share-of-voice
   chart; `creatives` = example ads with real copy + creative scraped from the public
   ad-detail pages (tools/scrape_ad_copy.py in the linkedin-mi-pipeline repo).
   Screened to FSI's space (Australian retail funds: ETFs, small caps, listed
   infrastructure, cash and fixed income). Coverage is limited to the AU peers the
   Ad Library scrape captured cleanly (Betashares, Perpetual, Macquarie); Vanguard
   and iShares AU need a targeted entity scrape before they can be added. */
window.MI_LINKEDIN = {
  "generatedAt": "2026-08-19",
  "source": "LinkedIn Ad Library, FSI Australian retail peers",
  "activity": [
    {"name":"Macquarie","v":17,"color":"var(--c-a)"},
    {"name":"Betashares","v":9,"color":"var(--c-b)"},
    {"name":"Perpetual","v":9,"color":"var(--c-c)"}
  ],
  "creatives": [
    {"competitor":"Betashares","advertiser":"Betashares","color":"var(--c-b)","image":"li-ads/betashares_2.jpg","copy":"Betashares Direct is now available to Macquarie Group employees. Invest with $0 brokerage in 500+ shares and all ASX ETFs. Automated investing. Insights and education. Low cost managed portfolios.","preview":"https://www.linkedin.com/ad-library/detail/1389402596","platform":"linkedin","type":"SPONSORED_STATUS_UPDATE"},
    {"competitor":"Betashares","advertiser":"Betashares","color":"var(--c-b)","image":"li-ads/betashares_3.jpg","copy":"Betashares Direct provides accountants with the exact tax and CGT reports needed for SMSF administration: - Tax statements with full component breakdowns - CGT summaries and parcel-level detail - Holdings statements and independent assurance report - Transaction downloads - Cost-base adjustments - Direct datafeeds with BGL and Class And more… Everything that you need for efficient SMSF return preparation.","preview":"https://www.linkedin.com/ad-library/detail/1342069316","platform":"linkedin","type":"SPONSORED_STATUS_UPDATE"},
    {"competitor":"Betashares","advertiser":"Betashares","color":"var(--c-b)","image":"li-ads/betashares_6.jpg","copy":"Our founder and CEO, Alex Vynokur, recently joined Lauren Sams on the AFR’s 𝑯𝒐𝒘 𝑰 𝑴𝒂𝒅𝒆 𝑰𝒕 podcast to share the story behind Betashares. Alex reflects on the decisions, challenges and defining moments that have shaped our business - from our beginnings to becoming one of Australia’s leading financial services companies. Thank you, Lauren Sams and The Australian Financial Review for capturing Alex's story. Listen here: https://lnkd.in/gTzGnsdk","preview":"https://www.linkedin.com/ad-library/detail/1528233766","platform":"linkedin","type":"SPONSORED_STATUS_UPDATE"},
    {"competitor":"Macquarie","advertiser":"Macquarie Asset Management","color":"var(--c-a)","image":"li-ads/macquarie_2.jpg","copy":"Infrastructure is a high-yielding asset class. It can offer a yield materially above that of other equity and comparable to low-risk debt. Find out how infrastructure yields compare to other asset classes.","preview":"https://www.linkedin.com/ad-library/detail/1532738396","platform":"linkedin","type":"SPONSORED_STATUS_UPDATE"},
    {"competitor":"Macquarie","advertiser":"Macquarie Asset Management","color":"var(--c-a)","image":"li-ads/macquarie_5.jpg","copy":"From digital connectivity to electrification, the trends driving today's infrastructure opportunity are deep, lasting, and increasingly relevant. Rooted in structural shifts rather than market cycles, the opportunity creates a compelling case for real assets in long term wealth portfolios. Read our latest insight.","preview":"https://www.linkedin.com/ad-library/detail/1532747646","platform":"linkedin","type":"SPONSORED_STATUS_UPDATE"},
    {"competitor":"Perpetual","advertiser":"Perpetual Limited","color":"var(--c-c)","image":null,"copy":"Perpetual’s small-cap team outlines why passively investing in the small-cap index is not always the best approach. https://lnkd.in/g84Fxpgg #smallcaps #ASX #activeinvesting","preview":"https://www.linkedin.com/ad-library/detail/1432265616","platform":"linkedin","type":"SPONSORED_VIDEO"},
    {"competitor":"Perpetual","advertiser":"Perpetual Limited","color":"var(--c-c)","image":"li-ads/perpetual_6.jpg","copy":"The Federal Budget strips tax advantages from real assets and shares - meaning the case for fixed income and credit is sharper. Vivek Prabhu explains. https://lnkd.in/gutWC5-h #fixedincome #Budget2026 #portfoliopositioning","preview":"https://www.linkedin.com/ad-library/detail/1426451306","platform":"linkedin","type":"SPONSORED_STATUS_UPDATE"}
  ]
};
