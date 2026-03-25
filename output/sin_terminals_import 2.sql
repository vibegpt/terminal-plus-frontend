-- SIN Terminal Amenities Import SQL
-- Generated on: 2025-08-12T20:11:42.582Z
-- Total amenities: 411

-- NOTE: This is a minimal schema - please adjust column names to match your actual table
-- Common basic columns: id, name, description, terminal_code, airport_code

-- Clear existing SIN amenities (optional - uncomment if needed)
-- DELETE FROM amenity_detail WHERE airport_code = 'SIN';

-- Insert amenity_detail records
INSERT INTO amenity_detail (
  id,
  name,
  description,
  terminal_code,
  airport_code,
  status,
  created_at,
  updated_at
) VALUES
(
  gen_random_uuid(),
  'Mother and Child',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Saga Seed',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Travelling Family',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Electronics Computers by Sprint-Cass',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Fragrance Bak Kwa',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Garrett Popcorn Shops®',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Gassan Watches',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Giordano',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Guardian Health & Beauty - Level 2 Shop 16',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Guardian Health & Beauty - Level 2 Shop 69',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Gucci',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'HERMÈS',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Irvins Salted Egg',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Kaboom',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Lindt',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Longchamp',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LOTTE DUTY FREE WINES & SPIRITS - Level 1 Shop 10',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LOTTE DUTY FREE WINES & SPIRITS - Level 1 Shop 23',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LOTTE DUTY FREE WINES & SPIRITS - Level 2 Shop 53',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LOTTE DUTY FREE WINES & SPIRITS - Level 2 Shop 68',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LOTTE DUTY FREE WINES & SPIRITS - Level 2 Shop 22',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LOTTE DUTY FREE WINES & SPIRITS - Level 2 Shop 46',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Louis Vuitton',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lululemon',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Sunglass Hut',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Swarovski',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Tiffany & Co.',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Times Travel',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Tory Burch',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Travelex Money Changer',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'TWG Tea Boutique',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Uniqlo',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Victoria''s Secret Beauty & Accessories',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'WH Smith - Before Security Level 1 Shop 84',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'WH Smith - Level 2 Shop 67',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'WH Smith - Level 2 Shop 41',
  '',
  'SIN-T1',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'electronics-computers-sprint-cass-t1',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'fragrance-bak-kwa-t1',
  'Shopping amenity in SIN-T1',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'garrett-popcorn-t1',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'gassan-watches-t1',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'giordano-sin-t1',
  'Shopping amenity in SIN-T1',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'guardian-health-beauty-sin-t1-16',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'guardian-health-beauty-sin-t1-69',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'gucci-t1',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'hermes-t1',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'irvins-salted-egg-t1',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'kaboom-t1',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lindt',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'longchamp-t1',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t1-level-1-10',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t1-level-1-23',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t1-level-2-53',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t1-level-2-68',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t1-level-2-22',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t1-level-2-46',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'louis-vuitton-t1',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lululemon',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'mother-and-child',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'saga-seed',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'spirit-of-man',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'sunglass-hut-t1',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'swarovski-t1',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'tiffany-co',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'times-travel',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'tory-burch-t1',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'travelex-money-changer-t1',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'twg-tea-boutique-t1',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'uniqlo-t1',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'victorias-secret-beauty-accessories-t1',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'whsmith-t1-level-1-84',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'whsmith-t1-level-2-67',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'whsmith-t1-level-2-41',
  '',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Manulife Sky Nets',
  'Walking and bouncing nets suspended in the air',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Mirror Maze',
  'Immersive mirror maze experience',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Rain Vortex',
  'The world''s tallest indoor waterfall',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Shiseido Forest Valley',
  'Lush indoor forest with walking trails',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Entertainment Deck',
  'Games and entertainment zone',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Butterfly Garden',
  'Tropical butterfly habitat with flowering plants',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Cactus Garden',
  'Outdoor roof garden with over 100 species of cacti',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Koi Pond',
  'Tranquil pond with Japanese koi fish',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Sunflower Garden',
  'Rooftop garden with viewing gallery',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Tiger Street Lab',
  'Craft beer and local fare',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Din Tai Fung',
  'Renowned Taiwanese restaurant famous for xiaolongbao',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Paradise Dynasty',
  'Known for signature colorful xiaolongbao',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Bee Cheng Hiang',
  'Famous for its barbecued pork jerky',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Koi Thé',
  'Premium Taiwanese bubble tea',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Sushi Tei',
  'Premium sushi and Japanese cuisine',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Song Fa Bak Kut Teh',
  'Award-winning pork rib soup',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Crowne Plaza Changi Airport',
  'Luxury hotel connected to Terminal 3',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Ambassador Transit Hotel',
  'In-terminal hotel for transiting passengers',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Singapore Airlines SilverKris Lounge',
  'Premium lounge for Singapore Airlines first and business class passengers',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'SATS Premier Lounge',
  'Comfortable lounge with shower facilities',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'dnata Lounge',
  'Modern lounge with extensive food options',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'UOB Currency Exchange',
  'Competitive rates for currency exchange',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Telecommunications Kiosk',
  'SIM cards and mobile services',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'TRS Tax Refund',
  'Tourist refund scheme counter',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Spa Express',
  'Quick massage and spa treatments',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Lotte Duty Free',
  'Korean duty-free retailer',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Uniqlo',
  'Japanese casual wear designer',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Zara',
  'Spanish fast fashion retailer',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Eu Yan Sang',
  'Traditional Chinese medicine',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Muji',
  'Minimalist Japanese home goods',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Tokyu Hands',
  'Japanese lifestyle store',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Fish Spa',
  'Unique fish spa experience with Garra Rufa fish for natural exfoliation',
  'SIN-T1',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Spirit of Man (Success and Achievement)',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'The Memory of Lived Space',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Vessel',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Eu Yan Sang ',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Fragrance Bak Kwa',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Gassan Watches',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Guardian Health & Beauty - Before Security Level 2 Shop 13',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Guardian Health & Beauty - Level 2 Shop 155',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Gucci',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'HERMÈS',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Irvins Salted Egg',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Kaboom',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Kering Eyewear x Lagardere',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Longchamp',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LOTTE DUTY FREE WINES & SPIRITS - Level 1 Shop 176',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LOTTE DUTY FREE WINES & SPIRITS - Level 2 Shop 401',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LOTTE DUTY FREE WINES & SPIRITS - Level 2 Shop 91',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LOTTE DUTY FREE WINES & SPIRITS - Level 1 Shop 151',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LOTTE DUTY FREE WINES & SPIRITS - Level 3 Shop 189',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LOTTE DUTY FREE WINES & SPIRITS - Level 2 Shop 197',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Sunglass Hut',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Swarovski',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'The Digital Gadgets',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Tod''s',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Tommy Hilfiger',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Tory Burch',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Travelex Money Changer',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'TUMI',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'TWG Tea Boutique',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Unity',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'UOB Gold',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Victoria''s Secret Beauty & Accessories',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'WH Smith - Before Security Level 1 Shop 26',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'WH Smith - Level 2 Shop 207',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'ZEGNA',
  '',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'eu-yan-sang',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'fila-kids-t2',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'fragrance-bak-kwa-t2',
  'Shopping amenity in SIN-T2',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'gassan-watches-t2',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'guardian-health-beauty-sin-t2-13',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'guardian-health-beauty-sin-t2-155',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'gucci-t2',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'hermes-t2',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'kaboom-t2',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'kering-eyewear-lagardere',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'longchamp-t2',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t2-level-1-176',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t2-level-2-91',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t2-level-1-151',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t2-level-2-401',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t2-level-3-189',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t2-level-2-197',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'sunglass-hut-t2',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'swarovski-t2',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'tods',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'tommy-hilfiger',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'tory-burch-t2',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'travelex-money-changer-t2',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'tumi',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'twg-tea-boutique-t2',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'unity',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'uob-gold',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'victorias-secret-beauty-accessories-t2',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'whsmith-t2-level-1-26',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'whsmith-t2-level-2-207',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'zegna',
  '',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Foggy Bowls',
  'Mist-filled play areas for children',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Mirror Maze',
  'Immersive mirror maze experience',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Rain Vortex',
  'The world''s tallest indoor waterfall',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Entertainment Deck',
  'Games and entertainment zone',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Butterfly Garden',
  'Tropical butterfly habitat with flowering plants',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Cactus Garden',
  'Outdoor roof garden with over 100 species of cacti',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Koi Pond',
  'Tranquil pond with Japanese koi fish',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Sunflower Garden',
  'Rooftop garden with viewing gallery',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Bengawan Solo',
  'Traditional Singaporean cakes and kueh',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Tiger Street Lab',
  'Craft beer and local fare',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Din Tai Fung',
  'Renowned Taiwanese restaurant famous for xiaolongbao',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Paradise Dynasty',
  'Known for signature colorful xiaolongbao',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Koi Thé',
  'Premium Taiwanese bubble tea',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Old Chang Kee',
  'Local curry puffs and fried snacks',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Song Fa Bak Kut Teh',
  'Award-winning pork rib soup',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Aerotel Singapore',
  'Airport transit hotel with swimming pool',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'YOTELAIR Singapore Changi',
  'Modern capsule-style transit hotel inside the terminal',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Cathay Pacific Lounge',
  'Elegant lounge for Cathay Pacific passengers',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Singapore Airlines SilverKris Lounge',
  'Premium lounge for Singapore Airlines first and business class passengers',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'dnata Lounge',
  'Modern lounge with extensive food options',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Travelex',
  'Global foreign exchange services',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'UOB Currency Exchange',
  'Competitive rates for currency exchange',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Telecommunications Kiosk',
  'SIM cards and mobile services',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'TRS Tax Refund',
  'Tourist refund scheme counter',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Kinokuniya',
  'Comprehensive Japanese bookstore',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Uniqlo',
  'Japanese casual wear designer',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Zara',
  'Spanish fast fashion retailer',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Irvins Salted Egg',
  'Popular salted egg fish skin and chips',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Eu Yan Sang',
  'Traditional Chinese medicine',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Muji',
  'Minimalist Japanese home goods',
  'SIN-T2',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Canopy Park',
  'Indoor park with nets, mazes and slides',
  'SIN-T2',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Birds in Flight',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Coming Home',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Electronics Computers by Sprint-Cass',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Eu Yan Sang',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Fragrance Bak Kwa',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Furla',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Goldheart',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Guardian Health & Beauty - Before Security Basement Shop 24',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Guardian Health & Beauty - Level 2 Shop 66',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Guardian Health & Beauty - Level 2 Shop 29',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'HERMÈS',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Irvins Salted Egg',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Kaboom',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Kunthaville',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LEGO® Airport Store',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Longchamp',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LOTTE DUTY FREE WINES & SPIRITS - Level 1 Shop 29',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LOTTE DUTY FREE WINES & SPIRITS - Level 1 Shop 19',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LOTTE DUTY FREE WINES & SPIRITS - Level 2 Shop 65',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LOTTE DUTY FREE WINES & SPIRITS - Level 2 Shop 10',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LOTTE DUTY FREE WINES & SPIRITS - Level 2 Shop 37',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LOTTE DUTY FREE WINES & SPIRITS - Level 3 Shop 7',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Louis Vuitton',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Sunglass Hut',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Swarovski',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Tiffany & Co.',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Time Emporium',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Travelex Money Changer',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'TWG Tea Boutique',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'WH Smith - Level 2 Shop 43',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'WH Smith - Level 2 Shop 7',
  '',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'apple-store',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'cabin-bar-dfs',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'charles-keith',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'coach',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'electronics-computers-sprint-cass-t2',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'fragrance-bak-kwa-t3',
  'Shopping amenity in SIN-T3',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'furla-t3',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'guardian-health-beauty-sin-t3-basement-24',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'guardian-health-beauty-sin-t3-66',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'guardian-health-beauty-sin-t3-29',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'gucci-t3',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'hermes-t3',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'istudio',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'kaboom-t3',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lacoste',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'longchamp-t3',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t3-level-1-19',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t3-level-1-29',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t3-level-2-65',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t3-level-2-65',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t3-level-2-37',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t3-level-3-7',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'louis-vuitton-t3',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'michael-kors',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'montblanc',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'rituals',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'the-cocoa-trees',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'timberland',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'vessel',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'watches-of-switzerland',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'whsmith-t3-level-2-43',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'whsmith-t3-level-2-7',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'memory-of-lived-space',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t3-level-2-10',
  '',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'The Slide@T3',
  'World''s tallest slide in an airport',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Foggy Bowls',
  'Mist-filled play areas for children',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'The Slide@T3',
  'World''s tallest slide in an airport',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Changi Experience Studio',
  'Interactive digital attraction about Changi Airport',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Entertainment Deck',
  'Games and entertainment zone',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Butterfly Garden',
  'Tropical butterfly habitat with flowering plants',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Cactus Garden',
  'Outdoor roof garden with over 100 species of cacti',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Koi Pond',
  'Tranquil pond with Japanese koi fish',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Sunflower Garden',
  'Rooftop garden with viewing gallery',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Bengawan Solo',
  'Traditional Singaporean cakes and kueh',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Tiger Street Lab',
  'Craft beer and local fare',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Din Tai Fung',
  'Renowned Taiwanese restaurant famous for xiaolongbao',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Paradise Dynasty',
  'Known for signature colorful xiaolongbao',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Bee Cheng Hiang',
  'Famous for its barbecued pork jerky',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Ya Kun Kaya Toast',
  'Traditional Singaporean breakfast sets',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Sushi Tei',
  'Premium sushi and Japanese cuisine',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Aerotel Singapore',
  'Airport transit hotel with swimming pool',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'YOTELAIR Singapore Changi',
  'Modern capsule-style transit hotel inside the terminal',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Cathay Pacific Lounge',
  'Elegant lounge for Cathay Pacific passengers',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'SATS Premier Lounge',
  'Comfortable lounge with shower facilities',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'dnata Lounge',
  'Modern lounge with extensive food options',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'UOB Currency Exchange',
  'Competitive rates for currency exchange',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Telecommunications Kiosk',
  'SIM cards and mobile services',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'TRS Tax Refund',
  'Tourist refund scheme counter',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Spa Express',
  'Quick massage and spa treatments',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Kinokuniya',
  'Comprehensive Japanese bookstore',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Lotte Duty Free',
  'Korean duty-free retailer',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Uniqlo',
  'Japanese casual wear designer',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Irvins Salted Egg',
  'Popular salted egg fish skin and chips',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Muji',
  'Minimalist Japanese home goods',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Tokyu Hands',
  'Japanese lifestyle store',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Canopy Park',
  'Indoor park with nets, mazes and slides',
  'SIN-T3',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'A&W Root Beer',
  'Nostalgic American fast food chain, famous for root beer floats',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Cultural Performances Stage',
  'Regular cultural performances showcasing Asian heritage',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Jewel Waterfall Viewpoint',
  'Access point to view the famous Jewel Changi waterfall via Skytrain',
  'SIN-T3',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Chandelier',
  '',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Heritage Zone',
  '',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Immersive Wall',
  '',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Petalclouds',
  '',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Steel in Bloom',
  '',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Garrett Popcorn Shops®',
  '',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Irvins Salted Egg',
  '',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'KASHKHA',
  '',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LEGO® Airport Store',
  '',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LOTTE DUTY FREE WINES & SPIRITS - Level 2 Shop 25',
  '',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LOTTE DUTY FREE WINES & SPIRITS - Level 1 Shop 12',
  '',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'LOTTE DUTY FREE WINES & SPIRITS - Level 2 Shop 57',
  '',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Sunglass Hut',
  '',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Taste Singapore',
  '',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'The Digital Gadgets',
  '',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'The Fashion Place',
  '',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Travelex Money Changer',
  '',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'TWG Tea Boutique',
  '',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'WH Smith - Level 2 Shop 59',
  '',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'ZAKKASG',
  '',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'chandelier',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'fila-t4',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'garrett-popcorn-t4',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'heritage-zone',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'immersive-wall',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'irvins-salted-egg-t4',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'kashkha',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lego-airport-store',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t4-level-1-12',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t4-level-2-25',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'lotte-duty-free-wines-spirits-t4-level-2-57',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'petalclouds',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'steel-in-bloom',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'sunglass-hut-t3',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'taste-singapore',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'the-digital-gadgets-t4',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'the-fashion-place',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'travelex-money-changer-t3',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'travelling-family',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'twg-tea-boutique-t3',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'whsmith-t4-level-2-59',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'zakkasg',
  '',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Manulife Sky Nets',
  'Walking and bouncing nets suspended in the air',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Mirror Maze',
  'Immersive mirror maze experience',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Changi Experience Studio',
  'Interactive digital attraction about Changi Airport',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Entertainment Deck',
  'Games and entertainment zone',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Butterfly Garden',
  'Tropical butterfly habitat with flowering plants',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Cactus Garden',
  'Outdoor roof garden with over 100 species of cacti',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Koi Pond',
  'Tranquil pond with Japanese koi fish',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Sunflower Garden',
  'Rooftop garden with viewing gallery',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Tiger Street Lab',
  'Craft beer and local fare',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Din Tai Fung',
  'Renowned Taiwanese restaurant famous for xiaolongbao',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Paradise Dynasty',
  'Known for signature colorful xiaolongbao',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Koi Thé',
  'Premium Taiwanese bubble tea',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Ya Kun Kaya Toast',
  'Traditional Singaporean breakfast sets',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Sushi Tei',
  'Premium sushi and Japanese cuisine',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Song Fa Bak Kut Teh',
  'Award-winning pork rib soup',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Ambassador Transit Hotel',
  'In-terminal hotel for transiting passengers',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'YOTELAIR Singapore Changi',
  'Modern capsule-style transit hotel inside the terminal',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Singapore Airlines SilverKris Lounge',
  'Premium lounge for Singapore Airlines first and business class passengers',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Plaza Premium Lounge',
  'Award-winning independent airport lounge',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'SATS Premier Lounge',
  'Comfortable lounge with shower facilities',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'UOB Currency Exchange',
  'Competitive rates for currency exchange',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Telecommunications Kiosk',
  'SIM cards and mobile services',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'TRS Tax Refund',
  'Tourist refund scheme counter',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Spa Express',
  'Quick massage and spa treatments',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Lotte Duty Free',
  'Korean duty-free retailer',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Charles & Keith',
  'Singaporean footwear and accessories brand',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Zara',
  'Spanish fast fashion retailer',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Irvins Salted Egg',
  'Popular salted egg fish skin and chips',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'TWG Tea',
  'Luxury tea brand',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Tokyu Hands ',
  'Japanese lifestyle store',
  'SIN-T4',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Canopy Park',
  'Indoor park with nets, mazes and slides',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Tokyu Hands',
  'Japanese lifestyle store',
  'SIN-T4',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Rhythm of Nature',
  '',
  'SIN-JEWEL',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'FILA',
  '',
  'SIN-JEWEL',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Furla',
  '',
  'SIN-JEWEL',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Irvins Salted Egg',
  '',
  'SIN-JEWEL',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'The Digital Gadgets',
  '',
  'SIN-JEWEL',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Uniqlo',
  '',
  'SIN-JEWEL',
  'SIN',
  'undefined',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'fila-jewel',
  '',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'furla-jewel',
  '',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'irvins-salted-egg-jewel',
  '',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'rhythm-of-nature',
  '',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'the-digital-gadgets-jewel',
  '',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'uniqlo-jewel',
  '',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Canopy Park',
  'Indoor park with nets, mazes and slides',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Foggy Bowls',
  'Mist-filled play areas for children',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Hedge Maze',
  'Singapore''s largest hedge maze',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Manulife Sky Nets',
  'Walking and bouncing nets suspended in the air',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Mirror Maze',
  'Immersive mirror maze experience',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Rain Vortex',
  'The world''s tallest indoor waterfall',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Shiseido Forest Valley',
  'Lush indoor forest with walking trails',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Changi Experience Studio',
  'Interactive digital attraction about Changi Airport',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Social Tree',
  'Interactive installation for photo sharing',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Bengawan Solo',
  'Traditional Singaporean cakes and kueh',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Tiger Street Lab',
  'Craft beer and local fare',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Din Tai Fung',
  'Renowned Taiwanese restaurant famous for xiaolongbao',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Koi Thé',
  'Premium Taiwanese bubble tea',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Song Fa Bak Kut Teh',
  'Award-winning pork rib soup',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Travelex',
  'Global foreign exchange services',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'UOB Currency Exchange',
  'Competitive rates for currency exchange',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Telecommunications Kiosk',
  'SIM cards and mobile services',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'TRS Tax Refund',
  'Tourist refund scheme counter',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Spa Express',
  'Quick massage and spa treatments',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Kinokuniya',
  'Comprehensive Japanese bookstore',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Zara',
  'Spanish fast fashion retailer',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Irvins Salted Egg',
  'Popular salted egg fish skin and chips',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Eu Yan Sang',
  'Traditional Chinese medicine',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Muji',
  'Minimalist Japanese home goods',
  'SIN-JEWEL',
  'SIN',
  'active',
  NOW(),
  NOW()
);

-- Insert collection_amenities records
INSERT INTO collection_amenities (
  collection_id,
  amenity_detail_id,
  priority,
  is_featured,
  created_at
) VALUES
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-mother-and-child'),
  1,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-saga-seed'),
  1,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-travelling-family'),
  1,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-electronics-computers-sprint-cass'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-fragrance-bak-kwa'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-garrett-popcorn'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-gassan-watches'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-giordano'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-guardian-health-beauty-level-2-shop-16'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-guardian-health-beauty-level-2-shop-69'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-gucci'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-hermes'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-irvins-salted-egg'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-kaboom'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-lindt'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-longchamp'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-lotte-duty-free-wines-spirits-level-1-shop-10'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-lotte-duty-free-wines-spirits-level-1-shop-23'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-lotte-duty-free-wines-spirits-level-2-shop-53'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-lotte-duty-free-wines-spirits-level-2-shop-68'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-lotte-duty-free-wines-spirits-level-2-shop-22'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-lotte-duty-free-wines-spirits-level-2-shop-46'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-louis-vuitton'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-lululemon'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-sunglass-hut'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-swarovski'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-tiffany-co'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-times-travel'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-tory-burch'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-travelex-money-changer'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-twg-tea-boutique'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-uniqlo'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-victorias-secret-beauty-accessories'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-wh-smith-before-security-level-1-shop-84'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-wh-smith-level-2-shop-67'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-wh-smith-level-2-shop-41'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-electronics-computers-sprint-cass-t1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-fragrance-bak-kwa-t1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-garrett-popcorn-t1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-gassan-watches-t1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-giordano-sin-t1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-guardian-health-beauty-sin-t1-16'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-guardian-health-beauty-sin-t1-69'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-gucci-t1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-hermes-t1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'quick-bites'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-irvins-salted-egg-t1'),
  3,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-kaboom-t1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-lindt-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-longchamp-t1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-lotte-duty-free-wines-spirits-t1-level-1-10'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-lotte-duty-free-wines-spirits-t1-level-1-23'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-lotte-duty-free-wines-spirits-t1-level-2-53'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-lotte-duty-free-wines-spirits-t1-level-2-68'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-lotte-duty-free-wines-spirits-t1-level-2-22'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-lotte-duty-free-wines-spirits-t1-level-2-46'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-louis-vuitton-t1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-lululemon-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-mother-and-child-1'),
  1,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-saga-seed-1'),
  1,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-spirit-of-man'),
  1,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-sunglass-hut-t1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-swarovski-t1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-tiffany-co-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-times-travel-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-tory-burch-t1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-travelex-money-changer-t1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'quick-bites'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-twg-tea-boutique-t1'),
  3,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-uniqlo-t1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-victorias-secret-beauty-accessories-t1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-whsmith-t1-level-1-84'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-whsmith-t1-level-2-67'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-whsmith-t1-level-2-41'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-manulife-sky-nets'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-mirror-maze'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-rain-vortex'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-shiseido-forest-valley'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-entertainment-deck'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-butterfly-garden'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-cactus-garden'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-koi-pond'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-sunflower-garden'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-tiger-street-lab'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-din-tai-fung'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-paradise-dynasty'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-bee-cheng-hiang'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-koi-th'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-sushi-tei'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-song-fa-bak-kut-teh'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-crowne-plaza-changi-airport'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-ambassador-transit-hotel'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-singapore-airlines-silverkris-lounge'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-sats-premier-lounge'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-dnata-lounge'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-uob-currency-exchange'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-telecommunications-kiosk'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-trs-tax-refund'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-spa-express'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-lotte-duty-free'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-uniqlo-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-zara'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-eu-yan-sang'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-muji'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-tokyu-hands'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'wellness'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t1-fish-spa-t1'),
  3,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-spirit-of-man'),
  1,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-memory-of-lived-space'),
  1,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-vessel'),
  1,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-eu-yan-sang'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-fragrance-bak-kwa'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-gassan-watches'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-guardian-health-beauty-before-security-level-2-shop-13'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-guardian-health-beauty-level-2-shop-155'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-gucci'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-hermes'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-irvins-salted-egg'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-kaboom'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-kering-eyewear-lagardere'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-longchamp'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-lotte-duty-free-wines-spirits-level-1-shop-176'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-lotte-duty-free-wines-spirits-level-2-shop-401'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-lotte-duty-free-wines-spirits-level-2-shop-91'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-lotte-duty-free-wines-spirits-level-1-shop-151'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-lotte-duty-free-wines-spirits-level-3-shop-189'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-lotte-duty-free-wines-spirits-level-2-shop-197'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-sunglass-hut'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-swarovski'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-the-digital-gadgets'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-tods'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-tommy-hilfiger'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-tory-burch'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-travelex-money-changer'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-tumi'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-twg-tea-boutique'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-unity'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-uob-gold'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-victorias-secret-beauty-accessories'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-wh-smith-before-security-level-1-shop-26'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-wh-smith-level-2-shop-207'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-zegna'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-eu-yan-sang-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-fila-kids-t2'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-fragrance-bak-kwa-t2'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-gassan-watches-t2'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-guardian-health-beauty-sin-t2-13'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-guardian-health-beauty-sin-t2-155'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-gucci-t2'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-hermes-t2'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-kaboom-t2'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-kering-eyewear-lagardere-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-longchamp-t2'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-lotte-duty-free-wines-spirits-t2-level-1-176'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-lotte-duty-free-wines-spirits-t2-level-2-91'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-lotte-duty-free-wines-spirits-t2-level-1-151'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-lotte-duty-free-wines-spirits-t2-level-2-401'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-lotte-duty-free-wines-spirits-t2-level-3-189'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-lotte-duty-free-wines-spirits-t2-level-2-197'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-sunglass-hut-t2'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-swarovski-t2'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-tods-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-tommy-hilfiger-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-tory-burch-t2'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-travelex-money-changer-t2'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-tumi-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'quick-bites'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-twg-tea-boutique-t2'),
  3,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-unity-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-uob-gold-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-victorias-secret-beauty-accessories-t2'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-whsmith-t2-level-1-26'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-whsmith-t2-level-2-207'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-zegna-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-foggy-bowls'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-mirror-maze'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-rain-vortex'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-entertainment-deck'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-butterfly-garden'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-cactus-garden'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-koi-pond'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-sunflower-garden'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-bengawan-solo'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-tiger-street-lab'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-din-tai-fung'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-paradise-dynasty'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-koi-th'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-old-chang-kee'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-song-fa-bak-kut-teh'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-aerotel-singapore'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-yotelair-singapore-changi'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-cathay-pacific-lounge'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-singapore-airlines-silverkris-lounge'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-dnata-lounge'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-travelex'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-uob-currency-exchange'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-telecommunications-kiosk'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-trs-tax-refund'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-kinokuniya'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-uniqlo'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-zara'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'quick-bites'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-irvins-salted-egg-1'),
  3,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-eu-yan-sang-2'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-muji'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t2-canopy-park-t2'),
  2,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-birds-in-flight'),
  1,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-coming-home'),
  1,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-electronics-computers-sprint-cass'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-eu-yan-sang'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-fragrance-bak-kwa'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-furla'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-goldheart'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-guardian-health-beauty-before-security-basement-shop-24'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-guardian-health-beauty-level-2-shop-66'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-guardian-health-beauty-level-2-shop-29'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-hermes'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-irvins-salted-egg'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-kaboom'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-kunthaville'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-lego-airport-store'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-longchamp'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-lotte-duty-free-wines-spirits-level-1-shop-29'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-lotte-duty-free-wines-spirits-level-1-shop-19'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-lotte-duty-free-wines-spirits-level-2-shop-65'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-lotte-duty-free-wines-spirits-level-2-shop-10'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-lotte-duty-free-wines-spirits-level-2-shop-37'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-lotte-duty-free-wines-spirits-level-3-shop-7'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-louis-vuitton'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-sunglass-hut'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-swarovski'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-tiffany-co'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-time-emporium'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-travelex-money-changer'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-twg-tea-boutique'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-wh-smith-level-2-shop-43'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-wh-smith-level-2-shop-7'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-apple-store'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-cabin-bar-dfs'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-charles-keith'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-coach'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-electronics-computers-sprint-cass-t2'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-fragrance-bak-kwa-t3'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-furla-t3'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-guardian-health-beauty-sin-t3-basement-24'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-guardian-health-beauty-sin-t3-66'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-guardian-health-beauty-sin-t3-29'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-gucci-t3'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-hermes-t3'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-istudio'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-kaboom-t3'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-lacoste'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-longchamp-t3'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-lotte-duty-free-wines-spirits-t3-level-1-19'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-lotte-duty-free-wines-spirits-t3-level-1-29'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-lotte-duty-free-wines-spirits-t3-level-2-65'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-lotte-duty-free-wines-spirits-t3-level-2-65-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-lotte-duty-free-wines-spirits-t3-level-2-37'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-lotte-duty-free-wines-spirits-t3-level-3-7'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-louis-vuitton-t3'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-michael-kors'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-montblanc'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-rituals'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-the-cocoa-trees'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-timberland'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-vessel'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-watches-of-switzerland'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-whsmith-t3-level-2-43'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-whsmith-t3-level-2-7'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-memory-of-lived-space'),
  1,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-lotte-duty-free-wines-spirits-t3-level-2-10'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-the-slide-t3'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-foggy-bowls'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-the-slide-t3-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-changi-experience-studio'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-entertainment-deck'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-butterfly-garden'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-cactus-garden'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-koi-pond'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-sunflower-garden'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-bengawan-solo'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-tiger-street-lab'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-din-tai-fung'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-paradise-dynasty'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-bee-cheng-hiang'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-ya-kun-kaya-toast'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-sushi-tei'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-aerotel-singapore'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-yotelair-singapore-changi'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-cathay-pacific-lounge'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-sats-premier-lounge'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-dnata-lounge'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-uob-currency-exchange'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-telecommunications-kiosk'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-trs-tax-refund'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-spa-express'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-kinokuniya'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-lotte-duty-free'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-uniqlo'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'quick-bites'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-irvins-salted-egg-1'),
  3,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-muji'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-tokyu-hands'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-canopy-park-t3'),
  2,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'quick-bites'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-aw-root-beer-t3'),
  4,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'entertainment'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-cultural-stage-t3'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t3-jewel-viewpoint-t3'),
  1,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-chandelier'),
  1,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-heritage-zone'),
  1,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-immersive-wall'),
  1,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-petalclouds'),
  1,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-steel-in-bloom'),
  1,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-garrett-popcorn'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-irvins-salted-egg'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-kashkha'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-lego-airport-store'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-lotte-duty-free-wines-spirits-level-2-shop-25'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-lotte-duty-free-wines-spirits-level-1-shop-12'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-lotte-duty-free-wines-spirits-level-2-shop-57'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-sunglass-hut'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-taste-singapore'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-the-digital-gadgets'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-the-fashion-place'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-travelex-money-changer'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-twg-tea-boutique'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-wh-smith-level-2-shop-59'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-zakkasg'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-chandelier-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-fila-t4'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-garrett-popcorn-t4'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-heritage-zone-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-immersive-wall-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'quick-bites'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-irvins-salted-egg-t4'),
  3,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-kashkha-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-lego-airport-store-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-lotte-duty-free-wines-spirits-t4-level-1-12'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-lotte-duty-free-wines-spirits-t4-level-2-25'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-lotte-duty-free-wines-spirits-t4-level-2-57'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-petalclouds-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-steel-in-bloom-1'),
  1,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-sunglass-hut-t3'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-taste-singapore-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-the-digital-gadgets-t4'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-the-fashion-place-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-travelex-money-changer-t3'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-travelling-family'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'quick-bites'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-twg-tea-boutique-t3'),
  3,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-whsmith-t4-level-2-59'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-zakkasg-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-manulife-sky-nets'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-mirror-maze'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-changi-experience-studio'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-entertainment-deck'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-butterfly-garden'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-cactus-garden'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-koi-pond'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-sunflower-garden'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-tiger-street-lab'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-din-tai-fung'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-paradise-dynasty'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-koi-th'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-ya-kun-kaya-toast'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-sushi-tei'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-song-fa-bak-kut-teh'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-ambassador-transit-hotel'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-yotelair-singapore-changi'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-singapore-airlines-silverkris-lounge'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-plaza-premium-lounge'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-sats-premier-lounge'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-uob-currency-exchange'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-telecommunications-kiosk'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-trs-tax-refund'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-spa-express'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-lotte-duty-free'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-charles-keith'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-zara'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'quick-bites'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-irvins-salted-egg-1'),
  3,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'quick-bites'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-twg-tea'),
  3,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-tokyu-hands'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-canopy-park-t4'),
  2,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-t4-tokyu-hands-t4'),
  2,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-rhythm-of-nature'),
  1,
  true,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-fila'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-furla'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-irvins-salted-egg'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-the-digital-gadgets'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-uniqlo'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-fila-jewel'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-furla-jewel'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'quick-bites'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-irvins-salted-egg-jewel'),
  3,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-rhythm-of-nature-1'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-the-digital-gadgets-jewel'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-uniqlo-jewel'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-canopy-park'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-foggy-bowls'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-hedge-maze'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-manulife-sky-nets'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-mirror-maze'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-rain-vortex'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-shiseido-forest-valley'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-changi-experience-studio'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-social-tree'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-bengawan-solo'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-tiger-street-lab'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-din-tai-fung'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-koi-th'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-song-fa-bak-kut-teh'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-travelex'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'explore'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-uob-currency-exchange'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-telecommunications-kiosk'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-trs-tax-refund'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-spa-express'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-kinokuniya'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-zara'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'quick-bites'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-irvins-salted-egg-1'),
  3,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-eu-yan-sang'),
  1,
  false,
  NOW()
),
(
  (SELECT id FROM collections WHERE collection_id = 'duty-free'),
  (SELECT id FROM amenity_detail WHERE amenity_slug = 'sin-jewel-muji'),
  1,
  false,
  NOW()
);
