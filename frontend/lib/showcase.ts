/**
 * HeyGym Discovery showcase data layer.
 *
 * Holds the gym catalogue, ratings, pricing, amenities, coaches, reviews and
 * comparison matrix exactly as specified in the Stitch "HeyGym Discovery
 * Platform" design (project 17179772152660000713).
 *
 * Real backend gyms (via /api/v1/gyms) are merged with this enrichment where
 * possible; these entries act as the display-ready fallback catalogue so the
 * UI matches the Stitch spec even before backend data exists for a field.
 */

export interface ShowcaseCoach {
  name: string;
  role: string;
  bio: string;
  certs: string[];
  image: string;
}

export interface ShowcaseReview {
  name: string;
  badge: string;
  when: string;
  stars: number;
  text: string;
  helpful: number;
  avatar: string;
  ownerReply?: string;
}

export interface ShowcaseGym {
  slug: string;
  name: string;
  tag: string;
  area: string;
  distanceKm: number;
  distanceLabel: string;
  rating: number;
  reviews: number;
  priceMonthly: number;
  priceLabel: string;
  description: string;
  amenities: string[];
  openLabel: string;
  openDetail: string;
  crowdLabel: string;
  crowdPct: number;
  crowdTone: 'emerald' | 'amber';
  image: string;
  mapPrice: string;
  pinTop: string;
  pinLeft: string;
}

const AIDA = 'https://lh3.googleusercontent.com/aida-public';

export const SHOWCASE_GYMS: ShowcaseGym[] = [
  {
    slug: 'iron-fortress',
    name: 'Iron Fortress Athletic Compound',
    tag: 'VERIFIED ELITE',
    area: 'SECTOR 62',
    distanceKm: 1.1,
    distanceLabel: '1.1 km away • Block B, Industrial Area, Sector 62',
    rating: 4.9,
    reviews: 418,
    priceMonthly: 2200,
    priceLabel: '₹2,200',
    description:
      'Premier strength hub featuring Eleiko calibrated plates, 8 Olympic deadlift platforms, and dedicated biomechanic recovery.',
    amenities: ['Eleiko Platforms (6)', 'Cold Plunge 4°C', 'Dumbbells to 70kg', 'Finnish Sauna', 'Free Valet'],
    openLabel: 'Open until 11:30 PM',
    openDetail: '• 14,000 sq ft Triple Height',
    crowdLabel: 'Moderate (42%)',
    crowdPct: 42,
    crowdTone: 'emerald',
    image: `${AIDA}/AB6AXuBQqZ7irNWut61EbLBRNT2bhXNQ81GsyGQ2DmGWr7GgFbwQHCK6KqvlYYC1oMhMmzxdIX6ovcYusEpIpViEBk-V3P2tm-aKZAs8rCxapYh3BJVt0DP2IsleU8AIJnmvAZookYf91v1y_U2bzKkotfqeYEw_ngMMeC4ytgrMnNFzg21JuqSpgqtGMdqRaVvrDTsY9sw4Q5lhXw9KCbsDY2XPYM1hf0yPv2xMbXA2Tss_5dtib0TFJm4cvQ`,
    mapPrice: '₹2.2k',
    pinTop: '28%',
    pinLeft: '44%',
  },
  {
    slug: 'kuro-athletics',
    name: 'Kuro Athletics Club',
    tag: 'VERIFIED ELITE',
    area: 'SECTOR 62',
    distanceKm: 1.8,
    distanceLabel: '1.8 km away • Stellar IT Park Tower B, Sector 62',
    rating: 4.8,
    reviews: 290,
    priceMonthly: 2450,
    priceLabel: '₹2,450',
    description:
      'Ultra-modern minimalist athletics club with sled turf, Hyrox lab, curved treadmills and a steam sanctuary.',
    amenities: ['Curved Treadmills', 'Steam Sanctuary', 'Biometric 24/7', 'InBody 770 Scan'],
    openLabel: 'Open 24/7 (Biometric)',
    openDetail: '• Sled Turf & Hyrox Lab',
    crowdLabel: 'Low Traffic (21%)',
    crowdPct: 21,
    crowdTone: 'emerald',
    image: `${AIDA}/AB6AXuAml0lUVO7OY825Ivsxd6YwGjoYNCBDEjYw_HB6AB3alMUmicKhVQPxF2P8AWtOJLl3xs3eWDKk_lrqB-87uuXLjLBc2yJHYYO9v_-yaSlmnkg5MU51tgDoMWp1Kd5e1-zDsoCjIk2n-MshW1fGjYkYciKpcyoPggeVpwn40xefp7B719YvCannMHXOTzXilVykRA4PUYK6loBkKibAa5XpFPkhR_jo_F32YUo78ty2KWKmHFU36DkqJw`,
    mapPrice: '₹2.4k',
    pinTop: '48%',
    pinLeft: '62%',
  },
  {
    slug: 'pulse-performance',
    name: 'Pulse Performance Studio',
    tag: 'VALUE CHAMPION',
    area: 'SECTOR 62',
    distanceKm: 2.4,
    distanceLabel: '2.4 km away • C-Block Market, Sector 62',
    rating: 4.7,
    reviews: 184,
    priceMonthly: 1800,
    priceLabel: '₹1,800',
    description:
      'High-intensity conditioning studio with a full cardio deck, CrossFit rig, lockers, showers and a nutrition bar.',
    amenities: ['Cardio Deck', 'CrossFit Rig', 'Locker & Showers', 'Nutrition Bar'],
    openLabel: 'Open until 11:00 PM',
    openDetail: '• High-Intensity Conditioning',
    crowdLabel: 'Busy (74%)',
    crowdPct: 74,
    crowdTone: 'amber',
    image: `${AIDA}/AB6AXuCvvIMTzzVN8aw9EXN5aNzvH6vgwSRElyz785ZcamyhtKs3Sf68dJB1G9q9gE5qmCu_WdFq6gQhF3crwrbeUWuABKs6kK00abgch1f-dQPtJpVIiHMA70niLSKRREALDD8aIYhSaiFHgFO8M175IfPbBdYriWK-uJl7Yt1oNZGnaaBXOytFl5lnxU2aC1mdW2MY2P2FKppxmNtkX9HhcDQc5Kv4vHY2S6aj0-WYnNjOL8EsHCMXg1Pk6A`,
    mapPrice: '₹1.8k',
    pinTop: '65%',
    pinLeft: '32%',
  },
  {
    slug: 'apex-elite',
    name: 'Apex Elite Strength Barbell',
    tag: 'COMPETITION SPEC',
    area: 'SECTOR 62',
    distanceKm: 3.2,
    distanceLabel: '3.2 km away • Near Electronic City Metro, Sector 62',
    rating: 4.8,
    reviews: 156,
    priceMonthly: 2100,
    priceLabel: '₹2,100',
    description:
      'Competition-spec barbell club with Texas power bars, chalk-friendly platforms, ice bath station and strength coaching.',
    amenities: ['Chalk Allowed', 'Texas Power Bars', 'Ice Bath Station', 'Strength Coaching'],
    openLabel: 'Open until 10:30 PM',
    openDetail: '• Competition Spec Calibrated',
    crowdLabel: 'Moderate (38%)',
    crowdPct: 38,
    crowdTone: 'emerald',
    image: `${AIDA}/AB6AXuBhi9jPSfQG2In6Y9FO5jtrr3lB0mMRulwgr_kMaNrQ33-AIe9_aOJAY7lWivuCQQ2pSVNCjLEusjXqu0l1GEQy3A2W2knmkQuhOTrOVfzvXvCjZ44CSpE6c3YMYIzWsgcjf22LkLCUjyzefk2Z9u69QzevKAhQ2ScjYv1-lMPjSIDMUptOT-0scHZzfwXSD-Twmi1P9hNvxZrteXDBoFjs6soA74kkac7AlAsoYYbEnln1GZh4JL6FnA`,
    mapPrice: '₹2.1k',
    pinTop: '20%',
    pinLeft: '68%',
  },
  {
    slug: 'iron-district',
    name: 'Iron District Club',
    tag: 'VERIFIED ELITE',
    area: 'SECTOR 62',
    distanceKm: 0.8,
    distanceLabel: '0.8 km away • Sector 62',
    rating: 4.9,
    reviews: 342,
    priceMonthly: 2499,
    priceLabel: '₹2,499',
    description:
      'Premier strength hub featuring Eleiko calibrated plates, 8 Olympic deadlift platforms, and dedicated biomechanic recovery.',
    amenities: ['Olympic Lifting', 'Ice Bath', '24/7 RFID'],
    openLabel: 'Open until 11:30 PM',
    openDetail: '• 12,000 sq ft Strength Floor',
    crowdLabel: 'Moderate (45%)',
    crowdPct: 45,
    crowdTone: 'emerald',
    image: `${AIDA}/AB6AXuDTedq_V0wBc1gAQd37gqey_PN-ykkgFd5xGctLN8W1YFHJ3ZHIJejXuWgN2aeyB_3pW2m75-yVGQ8oU6h4MKl9FZriS0ltEsLu4FcaNufPTGlVPvViVqR49XK6BQskOehANRgRtSlyCGsOsMd4RK3R1-IJxtJWLf-157A27maewLM0yQFV332MovgPpgFjPfI5pmjPJZpfB_EKfXVlihJQo6gIPn3GQJkUeVwktpxS64FdXQdfdKmdHw`,
    mapPrice: '₹2.5k',
    pinTop: '38%',
    pinLeft: '22%',
  },
  {
    slug: 'apex-kinetic',
    name: 'Apex Kinetic Athletics',
    tag: 'AFFILIATE HQ',
    area: 'INDIRAPURAM',
    distanceKm: 1.4,
    distanceLabel: '1.4 km away • Indirapuram',
    rating: 4.8,
    reviews: 189,
    priceMonthly: 3200,
    priceLabel: '₹3,200',
    description:
      'High-octane CrossFit & functional mobility sanctuary with certified Level 3 coaches, rig stations, and nutrition lounge.',
    amenities: ['CrossFit Affiliated', 'Steam Room', 'Cafe & Shakes'],
    openLabel: 'Open until 10:00 PM',
    openDetail: '• Rig Stations & Mobility Lab',
    crowdLabel: 'Low Traffic (28%)',
    crowdPct: 28,
    crowdTone: 'emerald',
    image: `${AIDA}/AB6AXuAwx4DhwJF8IUzPpDt_ZXf0fcQLSYGEIpNxPdWSOfVUAoKFHvXiZ0cd5wzhMIza_KHfiYvx5ihU2E7rg0R64ANSYJ2lyDGEBqKfeatXs7g_jjtxqFlyGedCJrauEhvGqByG0qAZVGN4hgEWo3zgMsELuFN2izeNMWPkqCzTr9vLofc4Ap_SaZMMmwTafN1WcWobqQ0ggJlmTECjU95paPGuEOTNbPm_v5Vehjrs9fFrS7Mxsi4ZchH8Tg`,
    mapPrice: '₹3.2k',
    pinTop: '55%',
    pinLeft: '70%',
  },
  {
    slug: 'volta-247',
    name: 'Volta 24/7 Performance',
    tag: '24/7 BIOMETRIC',
    area: 'SECTOR 63',
    distanceKm: 2.1,
    distanceLabel: '2.1 km away • Sector 63',
    rating: 4.7,
    reviews: 512,
    priceMonthly: 1499,
    priceLabel: '₹1,499',
    description:
      'Unrestricted round-the-clock app entry, Matrix cardio lines, full free-weight dumbbell section to 50kg, and pristine private showers.',
    amenities: ['24/7 Open', 'Smart Lockers', 'Cowork Space'],
    openLabel: 'Open 24/7 (Biometric)',
    openDetail: '• App Entry & Matrix Cardio',
    crowdLabel: 'Moderate (52%)',
    crowdPct: 52,
    crowdTone: 'emerald',
    image: `${AIDA}/AB6AXuDScN2sBQ_Ws6CiPo6n7LqskSyN3SEypXpvKBETlQc95CVHHKop0oVpKRM8S5YFF--LiqD5raYHY_6eeODFHIt6dBrsHpD0VWKyaVzOWBZAsnYIfm1ooZFyVat4golRdrKUTJ8Z9aiikmk7gdumwayXRo8p_cZso8e1LRaqp4YGwx5ysv0pAn-sBk6lZzNmHQAUInC10dBH9Ad9WYdtpIvQ5W41zxS9vMlCzBFHSgCPg8JJIOSVD6wyIg`,
    mapPrice: '₹1.5k',
    pinTop: '72%',
    pinLeft: '52%',
  },
];

export const DETAIL_GALLERY = {
  main: `${AIDA}/AB6AXuAQbSdCiRLFkIaZEikVspNOg5XmxJJclaPTP6kOI7v-nALmBXVNSSCrlXtH8kuqGlDMHPhD-pkckmnDIs77X98QzeFDyKPAoovhky04O-IZlpZ8f220exysl5iOUw-1Aypo9lI2VCV7EK92SxK4eW-CNoUxzfB0YPA9sjwNQ2HtoHg1qU2tH8CHmDFoMAEJmbfeHqYlIE_GyiAwwoGmcURHwQFdI39LlLORO9FD_BLRvtVBkz1H8Zou5A`,
  thumbs: [
    {
      label: 'Cardio Deck',
      src: `${AIDA}/AB6AXuDNiwAKfE5BVTQwHL_TQyRzk23EGYQ9H6r2909jn6DUHYhK_14CJzbQPvLMzcBZuHoWYtUeOZqxjC9H0vKPEPtKzO5yaRoXEHiqm_4q0U2jJbGzIQ6KtzWx0iwzHEhrEHaJJ9JTuxQkaJaMHwi46-hgbXWwrokB9nUS-T27_8_20L1IvZ0c8CVOlfdq1xhilmhS2Gy6tXSIl-5Fyo2qEy-h15oW3U_rIw86wU4rAUMTcz9-lwSGet9upA`,
    },
    {
      label: 'Sauna & Suite',
      src: `${AIDA}/AB6AXuDWiSVyWy0mYtGKJm5dHyIACF8nquDps_thsHyd4kyM1v4koFytkgx3kEifaEGEtNoHsNvOJCkZaKwF8UhEpnk__ATBjDrmVgOEVXFyNOlHNzgCFQCEKrry-mQmTfjvl2pUG5MvUeUQkYqW4PDEEMxDL0bTJ8rHGNGwWpvOLjS_2XBTyQ6qianF8xed4lA8MSeJvHO5o30wo6UIzlYDnFuHx9M0VABUlrUgy2IaRpuSqDVhZPTMtehVQQ`,
    },
    {
      label: 'Functional Rig',
      src: `${AIDA}/AB6AXuB1Mj3OErBvxgS0X-osGY2YYMnAHNmlj37W32W4WtEOFqo0YH-DSqDNGXUM_hstNTQ52wLl3HHYGhztWx_ogZBk-xzItbCIFrzZHuJUVEd2WfSkl51jQWWjEY67z0U7eQTr3RWqmQgvds9II8kcXyyMEaGBfQo5F3X6d9y9zLR3b8euxdx-aeRS50C8QdoND1aH1TuGPdnIAoguwnT3rHTDQKKndZk4M7E9u00u0Vjm2lms3UDnRP5rCw`,
    },
    {
      label: 'Cold Plunge Lab',
      src: `${AIDA}/AB6AXuCH--SPE62P3O5_3xUqROvwtUOpT42gbCOlTBT5qOxzMAhI20tWV1LXikftMuWfs-0CJ4ZXzI73wqzvfc5MUfrxn5jmarv6e7FDfeLMlYNDHqbT2Mkgd2vUTbsIZOvA23IuzYWR5NVqVRqb6YwBcJS0lRZXVCEv5LY3gxGLpHoFaPAC081LPZ3JYzrKHTzk-kZZHGZ4eQ-UlmdRFG8z12nVQtj2Xbk-0zcZgj9LgR1wdJIarOXqUzgpkQ`,
    },
  ],
};

export const SHOWCASE_COACHES: ShowcaseCoach[] = [
  {
    name: 'Kabir Rawat',
    role: 'Head S&C Coach',
    bio: 'CSCS certified with 9+ years mentoring national powerlifters. Specializes in biomechanical bar path correction and conjugate programming.',
    certs: ['NSCA - CSCS', 'IPF Level 2'],
    image: `${AIDA}/AB6AXuDrheFIzeWjhUloXoAZihTlhvVEd4Rx12FDClrBRsBgEDmLEclhSp2k4LvpEv_T1LW7hHFrqe37_4ltERVO9fUTR3DM6aqNGYXjUu5tBgqfwskMbFCVd0cG5HGeeUPI55IaNdRc7jks38Zr8u-S38srypxI8s_KET1b3E5dYeakNnMUaKnA6eM1b-cE6h4ZWHS_H4-qd3ftvU75ccw7HLqqKdY45bboV0qlkM4g4Nq6HwSHbpPEOZQzQw`,
  },
  {
    name: 'Ananya Seth',
    role: 'Olympic Specialist',
    bio: 'Former state weightlifter and USAW Level 2. Leads Snatch and Clean & Jerk clinics, focusing on overhead thoracic mobility and ankle dorsiflexion.',
    certs: ['USAW L-2', 'FRC Mobility'],
    image: `${AIDA}/AB6AXuBz9iPPMPuvodrUk3awO1p1oVNBUizhP525yi4ym989IPk2QqNoS6nlpWYq5Nvs0v3R-OdWNlyKNYq9puO-fx3DOREryqkMaY4Tha0tvshCJTSDwgHwGDJ4HPfjw0hHXC4x_D40jf1AemjDSyUUrJfoZiD7IAcassAbnOVVSOpiY-Mzaofh2VmBsS-SIBlHzTeMP_vx2jQE2anEpgEl7MX6hh98vQxkAFmHCNmRcu1Ci6J0uTX_cCRuJA`,
  },
  {
    name: 'Rohan Verma',
    role: 'Rehab & Hypertrophy',
    bio: 'Masters in Sports Rehab with emphasis on spine and shoulder return-to-load protocols following heavy tendon stress.',
    certs: ['MPT Rehab', 'EXOS Perf.'],
    image: `${AIDA}/AB6AXuDbzikZcD_ZbMbgJHr7Af07iBQaO8GhihrP196QuSMxSlBBMd1BQZg_7ThD6zzx_VoG20iG4HrEt_5kx_HtoYBIOAgLbxrPlMz4T7whlHL9P-vDFkAae-ZcnJnC7QfTOM5PTCL7N1JA1u9EWKqc7q93omKSXq-TS-1mAqMSUoUekT-3t6dWxff6ZVZshKUYMnBuVPKV-_N4Mscmm1wW_InNjbLRRD0Z_jzK5nZnrb5Xi2aCFmiN7Mo_qA`,
  },
];

export const SHOWCASE_REVIEWS: ShowcaseReview[] = [
  {
    name: 'Devansh M.',
    badge: 'Annual Member',
    when: 'Verified Visit • 4 days ago',
    stars: 5,
    text: 'Hands down the most serious gym in the NCR region. No crowded influencers recording TikTok dances in front of the squat racks. Genuine calibrated Eleiko plates and you never have to wait for a power rack even at 7 PM. The contrast bath recovery in the basement is unmatched.',
    helpful: 34,
    avatar: `${AIDA}/AB6AXuBb6s8HCFGysvRuyHPO7-wNKnNnKvlXcrnfJdKDrh8gMO6gV4kyxlIdybOKUlPjkbF2D54UaFOuHlgD5VmxVIRReWO_O60A5-T7BbW5rqEqvNGc5m9bM52lYpD32LFlRS5VkeKHyHUixhkLlu2z7haasMl2jmyBtru1V7Bj1km9gQTZgJQTzMBpsUHuNXM8MBL3qpK4-e48Hp7Xc0RrbzdjDcG0VyhhawnoXHlxXpI7DmMXHykNluQFkQ`,
    ownerReply:
      'Appreciate the words Devansh! Maintaining rack availability and lifter etiquette is our top priority. Good luck with the upcoming state championships.',
  },
  {
    name: 'Pooja Sharma',
    badge: 'Quarterly Member',
    when: 'Verified Visit • 2 weeks ago',
    stars: 5,
    text: "Cleanliness is top notch. The women's changing suite is huge, well-lit, and the infrared sauna has helped massively with DOMS. Coach Kabir was very generous with pointers on my deadlift hinge during open hours.",
    helpful: 19,
    avatar: `${AIDA}/AB6AXuC1QxvwNatWygARTBINUGYz7D50RhB5hHS9ix4PmEj0yEFOrmlA52KKS9mSQS2ozCVDtz6xkCG6KOmC_M3hgi_QEUqDridjOVjPwfi5pgp_R5lrlh8HuQjFQobbfP1rIr3pzdbzcc32XPwJYHeBNY2EoVX7gzbpZ8YkProMWTNdl3dKUPZ8kQrCbXO-RUA1bKWJ6UktO1Mc-q8Z5ROr7eASFIEpeoNqsunVF9UGaGavr2DAs7PKGxYZYA`,
  },
];

export const MAP_BACKDROP = `${AIDA}/AB6AXuAqoQgZ-Dn3eQP8bCmQJ13vzPxEHtlbVmOAItnjwbSfuD2AxGGYZYEgTFM1gjcIfz87bd8yW9IGew8bzJaPntC5vcWHWtwoUbk60ePgjgBKjtU9dBS3kQ2o0mXz_SePePLXdYco3rEjJ8CyItTvxAHj-8lKp6USNqoiGk4GBmB72VlxQkJzp1zi9eKBbKIKPNevlDBkEXN6ULIGNWwaQ4kCaxoWNol9KRgQ42aKP1Kvc8Sl372C239MUg`;

export interface CompareColumn {
  slug: string;
  name: string;
  area: string;
  rating: string;
  reviewsLabel: string;
  monthly: string;
  image: string;
  focusTag: string;
  focusTone: 'lime' | 'mint' | 'muted';
  featured?: boolean;
  featuredPill?: string;
  cta: string;
}

export const COMPARE_GYMS: CompareColumn[] = [
  {
    slug: 'iron-fortress',
    name: 'Iron Fortress Strength Club',
    area: 'Sector 62, Block B • 0.8 km away',
    rating: '4.8',
    reviewsLabel: '(184 reviews)',
    monthly: '₹2,499',
    image: `${AIDA}/AB6AXuDK9Jkxm5yVKn7x2E3Nt0odcPyCNNt8lEXH8mkyd0JQTJ0vOkhjrFqLU_UnOv93Mx4fZyQZyCLkA55DTgQOx1BIjAtwU0Lc1y4yrf5EbdBlcpdMhsHMBzV2zMaIEkmGW5KXvkiM8oOT9Efr58AF32Yp7CrHQhlC0exQQdaOXPGRX9m_fZdd5OZy3vPFmbfq0W869EwiQQlDQp_YxSjlEkqVJxqOEEDI3S5Y35bqj1dNpZgvfLmPeDjh_g`,
    focusTag: 'Strength Focus',
    focusTone: 'lime',
    cta: 'Choose & Enquire',
  },
  {
    slug: 'kuro-athletics',
    name: 'Kuro Athletics Club',
    area: 'Sector 62, Phase 2 • 1.4 km away',
    rating: '4.9',
    reviewsLabel: '(312 reviews)',
    monthly: '₹3,200',
    image: `${AIDA}/AB6AXuBDCuRjYxJwK5b86NYcBNsAcIl-aBIduLqmmsq3uvhTpcU8MPeQmeEcnnmYzbr14Pc4jOHK2G5B_DaykBFA676tIyZxaXrBMeWpoToi67AGwUYS1iG359xeiE9rD3jNcco8PSzL_Mxs_QBqgAlphL9ARmKDREcs3NHgfh4ooUFdD36TJ_raZkenwabRruov7LGa26Zu2jXZi0FPQ4DT5H0SdaAQfu41UYx9xGT1FrU2A3arhG-Yfzc93Q`,
    focusTag: 'Premium Recovery',
    focusTone: 'mint',
    featured: true,
    featuredPill: 'Top Rated Wellness',
    cta: 'Choose & Enquire',
  },
  {
    slug: 'pulse-performance',
    name: 'Pulse Fitness Studio',
    area: 'Sector 62, Commercial Hub • 0.4 km away',
    rating: '4.4',
    reviewsLabel: '(94 reviews)',
    monthly: '₹1,699',
    image: `${AIDA}/AB6AXuDiO6wFOq4hAU2DVoGfJ3-8Xq6TXcGFitfjvm_WTuRC1hDSsD9J8Ln0fNnlsA0GbgnY2nhkK3gcsYhP4838MIjQ6Lumm4hxLtcdDWTIZZw7cBxi5Oqwm7EvL_vzvea1lXZHM4kCKltl9ny7x1ao1kIEQZEP3kqpV3QvCCIo4aV0bZ14-GBIiSAnKLHxR4TrEMz8KiYHk52uLO-rjb3Q8hzrnjB9ALMR6PT9W0PUP3ZqY88uIXZOEbIl2Q`,
    focusTag: 'HIIT & Cardio',
    focusTone: 'muted',
    cta: 'Choose & Enquire',
  },
];

export const AVATAR_FALLBACK =
  'https://lh3.googleusercontent.com/aida/AB6AXuBVazCmeaAXRR38POvpFbiyjQMbJfCuFiOb4JyhtxRIsXcVEIG-cN8GcRkflPmdvZnhO2PA58v3xKmqSmD6wOXgqKUNcWwYe25iCBlIasrGQhdhDVMsXON3cItBlC3CE5JSJK8C79tNvYjZ2R3DykFm5JOAtJq3G6HdJiqqA7i9QhD_LKtwBRU_-UypACkXmqSxkMox4W6JYx59lTtrGpAynZiHyqiowGHLGAKhRZDx2Uyn7DipunZZMA';
