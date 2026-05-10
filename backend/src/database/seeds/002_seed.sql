-- ============================================================
-- Traveloop Seed Data — 25 Cities, 60 Activities
-- ============================================================

-- ============================================================
-- CITIES
-- ============================================================

INSERT INTO cities (name, country, region, description, cost_index, popularity_score, image_url) VALUES

-- Europe
('Paris',         'France',         'Europe',        'The City of Light, famous for the Eiffel Tower, world-class cuisine, and art museums.',                              150.00, 98, 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800'),
('Rome',          'Italy',          'Europe',        'The Eternal City blending ancient ruins, Renaissance art, and vibrant street life.',                                 130.00, 95, 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800'),
('Barcelona',     'Spain',          'Europe',        'A vibrant Mediterranean city known for Gaudí architecture, beaches, and tapas culture.',                             120.00, 92, 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800'),
('Prague',        'Czech Republic', 'Europe',        'A fairy-tale city with a stunning medieval old town, castles, and legendary Czech beer.',                             80.00, 88, 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800'),
('Amsterdam',     'Netherlands',    'Europe',        'A canal-laced city famed for its artistic heritage, cycling culture, and golden age museums.',                       140.00, 87, 'https://images.unsplash.com/photo-1534351590666-13e3e96b5702?w=800'),
('Lisbon',        'Portugal',       'Europe',        'A hilly coastal city with historic trams, dramatic viewpoints, and the finest custard tarts in the world.',           90.00, 85, 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800'),
('Santorini',     'Greece',         'Europe',        'A volcanic Greek island celebrated for white-washed buildings, blue domes, and breathtaking sunsets.',               160.00, 93, 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800'),
('Vienna',        'Austria',        'Europe',        'The imperial capital of Austria, rich in classical music, coffee house culture, and grand palaces.',                 130.00, 86, 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800'),

-- Asia
('Tokyo',         'Japan',          'Asia',          'A dazzling megacity where ultra-modern technology meets deep-rooted samurai tradition.',                             120.00, 97, 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800'),
('Bangkok',       'Thailand',       'Asia',          'A bustling Thai capital of ornate shrines, vibrant street food, and energetic nightlife.',                            60.00, 91, 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800'),
('Bali',          'Indonesia',      'Asia',          'A tropical paradise of terraced rice paddies, Hindu temples, yoga retreats, and surf beaches.',                       50.00, 94, 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800'),
('Istanbul',      'Turkey',         'Asia',          'A transcontinental city straddling Europe and Asia, with magnificent mosques and a legendary bazaar.',                70.00, 89, 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800'),
('Kyoto',         'Japan',          'Asia',          'Japan''s ancient imperial capital, home to thousands of Buddhist temples, geisha districts, and zen gardens.',       110.00, 90, 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800'),
('Singapore',     'Singapore',      'Asia',          'A gleaming city-state that masterfully blends futuristic architecture with rich multicultural heritage.',             130.00, 88, 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800'),
('Jaipur',        'India',          'Asia',          'The Pink City of Rajasthan, famous for its stunning forts, vibrant bazaars, and royal heritage.',                    35.00, 82, 'https://images.unsplash.com/photo-1524613032530-449a5d94c285?w=800'),
('Maldives',      'Maldives',       'Asia',          'A tropical archipelago of crystal-clear lagoons, pristine coral reefs, and overwater bungalows.',                   300.00, 91, 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800'),

-- North America
('New York',      'USA',            'North America', 'The city that never sleeps — iconic skyline, world-class museums, Broadway shows, and endless food scenes.',         200.00, 99, 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800'),
('Vancouver',     'Canada',         'North America', 'A Pacific coast gem surrounded by mountains and ocean, known for outdoor adventures and cultural diversity.',         150.00, 83, 'https://images.unsplash.com/photo-1559511260-66a654ae982a?w=800'),

-- Middle East
('Dubai',         'UAE',            'Middle East',   'A futuristic desert metropolis of record-breaking skyscrapers, luxury shopping, and thrilling desert adventures.',   180.00, 90, 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800'),

-- Africa
('Cape Town',     'South Africa',   'Africa',        'A stunning coastal city framed by Table Mountain, golden beaches, and world-renowned wine lands.',                    65.00, 86, 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800'),
('Marrakech',     'Morocco',        'Africa',        'A sensory feast of labyrinthine souks, ornate palaces, fragrant spice markets, and rooftop terraces.',                45.00, 84, 'https://images.unsplash.com/photo-1597212618440-806262de1464?w=800'),
('Cairo',         'Egypt',          'Africa',        'Home to the last surviving wonder of the ancient world — the iconic Pyramids of Giza and the Great Sphinx.',           40.00, 87, 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800'),

-- Oceania
('Sydney',        'Australia',      'Oceania',       'Australia''s harbour city, famous for its iconic Opera House, golden beaches, and laid-back lifestyle.',             160.00, 92, 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800'),

-- South America
('Buenos Aires',  'Argentina',      'South America', 'The Paris of South America — a city of passionate tango, sizzling steaks, and European-style boulevards.',            55.00, 83, 'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=800'),
('Rio de Janeiro','Brazil',         'South America', 'A breathtaking city of lush mountains, dazzling beaches, carnival spirit, and the iconic Christ the Redeemer.',       70.00, 88, 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800');


-- ============================================================
-- ACTIVITIES  (60 total)
-- ============================================================

INSERT INTO activities (city_id, name, description, type, duration_hours, cost, image_url) VALUES

-- Paris (id=1) — 3 activities
(1, 'Eiffel Tower Visit',            'Ascend the iconic iron lattice tower for panoramic views of Paris from three observation levels.',                           'sightseeing', 2.0,  30.00, 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=600'),
(1, 'Louvre Museum Tour',            'Explore the world''s largest art museum, home to the Mona Lisa, Venus de Milo, and thousands of masterpieces.',             'culture',     3.0,  25.00, 'https://images.unsplash.com/photo-1565799557248-b7d7e3b8b7b8?w=600'),
(1, 'Seine River Cruise',            'Float past iconic Parisian landmarks including Notre-Dame, the Musée d''Orsay, and the Eiffel Tower on a scenic boat ride.','sightseeing', 1.5,  20.00, 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600'),

-- Rome (id=2) — 3 activities
(2, 'Colosseum & Roman Forum Tour',  'Walk through the greatest amphitheater of antiquity and explore the ancient heart of the Roman Republic.',                   'culture',     3.0,  25.00, 'https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=600'),
(2, 'Vatican Museums & Sistine Chapel','Marvel at Michelangelo''s breathtaking ceiling fresco and centuries of papal art collections.',                           'culture',     4.0,  35.00, 'https://images.unsplash.com/photo-1569143849020-f4b1f9d1d5c5?w=600'),
(2, 'Trastevere Food & Wine Walk',   'Wander cobblestone alleys sampling supplì, artisanal gelato, and local wines in Rome''s most charming neighbourhood.',      'food',        3.0,  45.00, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600'),

-- Barcelona (id=3) — 3 activities
(3, 'Sagrada Família Guided Tour',   'Discover Gaudí''s unfinished masterpiece — a UNESCO basilica of soaring spires and stained-glass kaleidoscopes.',           'culture',     2.0,  35.00, 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600'),
(3, 'La Boqueria Market & Tapas Walk','Sample jamón ibérico, fresh seafood, and pintxos at Barcelona''s most famous covered market.',                             'food',        2.0,  25.00, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600'),
(3, 'Gothic Quarter Walking Tour',   'Navigate narrow medieval lanes, hidden plazas, and 2,000-year-old Roman ruins in the Barri Gòtic.',                         'sightseeing', 2.0,   0.00, 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600'),

-- Prague (id=4) — 3 activities
(4, 'Prague Castle Complex Tour',    'Visit the largest ancient castle in the world, housing St. Vitus Cathedral and the Old Royal Palace.',                       'sightseeing', 3.0,  15.00, 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=600'),
(4, 'Old Town Square & Astronomical Clock','Watch the medieval Orloj chime and explore the stunning Gothic and Baroque architecture of Staré Město.',             'sightseeing', 1.5,   0.00, 'https://images.unsplash.com/photo-1562729025-5e1c1e77b9f7?w=600'),
(4, 'Czech Beer & Food Tasting Tour','Sample world-famous Czech pilsners alongside svíčková and trdelník in authentic Prague taverns.',                            'food',        3.0,  30.00, 'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=600'),

-- Amsterdam (id=5) — 2 activities
(5, 'Rijksmuseum & Van Gogh Museum', 'Admire Rembrandt''s Night Watch and Van Gogh''s Starry Night in two of Europe''s finest art museums.',                     'culture',     4.0,  35.00, 'https://images.unsplash.com/photo-1534351590666-13e3e96b5702?w=600'),
(5, 'Amsterdam Canal Boat Tour',     'Glide through UNESCO-listed canal rings past 17th-century merchant houses and iconic narrow bridges.',                       'sightseeing', 1.5,  20.00, 'https://images.unsplash.com/photo-1576924542622-772281b13ee5?w=600'),

-- Lisbon (id=6) — 2 activities
(6, 'Belém Tower & Pastéis Tasting', 'Visit the iconic 16th-century riverside fortress and taste the world''s original pastel de nata at Pastéis de Belém.',     'sightseeing', 2.5,  12.00, 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600'),
(6, 'Sintra Palaces Day Trip',       'Journey to the enchanted hilltop village of Sintra to explore fairy-tale palaces, Moorish castles, and lush gardens.',     'sightseeing', 6.0,  30.00, 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600'),

-- Santorini (id=7) — 2 activities
(7, 'Oia Sunset & Caldera Walk',     'Stroll through the island''s most picturesque village and witness the legendary Santorini sunset over the caldera.',        'sightseeing', 3.0,   0.00, 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600'),
(7, 'Catamaran Sailing & Hot Springs','Sail the caldera on a luxury catamaran, swim in volcanic hot springs, and snorkel in crystal-clear Aegean waters.',        'adventure',   6.0,  95.00, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600'),

-- Vienna (id=8) — 2 activities
(8, 'Schönbrunn Palace & Gardens',   'Explore the Habsburg imperial summer residence — 1,441 rooms, baroque gardens, and sweeping city views from the Gloriette.','culture',     3.0,  28.00, 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=600'),
(8, 'Vienna Philharmonic Concert',   'Experience the world''s finest orchestra perform Mozart and Beethoven in the opulent Musikverein golden hall.',              'culture',     2.5,  85.00, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600'),

-- Tokyo (id=9) — 3 activities
(9, 'Shibuya Crossing & Harajuku',   'Experience the world''s busiest pedestrian crossing and explore the quirky street fashion of Harajuku''s Takeshita Street.','sightseeing', 2.0,   0.00, 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600'),
(9, 'Tsukiji Outer Market Food Tour','Taste fresh sushi, tamagoyaki, and rare Japanese ingredients at the world''s most famous fish market district.',             'food',        2.0,  15.00, 'https://images.unsplash.com/photo-1569144157591-c60f3f82f137?w=600'),
(9, 'Akihabara Electronics District','Browse multi-floor arcades, anime merchandise, and cutting-edge gadgets in the global capital of otaku culture.',            'shopping',    2.5,   0.00, 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600'),

-- Bangkok (id=10) — 3 activities
(10,'Grand Palace & Wat Phra Kaew',  'Marvel at the dazzling royal complex housing Thailand''s most sacred Buddhist temple and the Emerald Buddha.',              'culture',     2.5,  18.00, 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600'),
(10,'Damnoen Saduak Floating Market','Navigate wooden boats through colorful canal markets selling tropical fruits, pad thai, and handmade souvenirs.',            'food',        3.0,  25.00, 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600'),
(10,'Thai Cooking Class',            'Learn to balance sweet, sour, salty, and spicy as you cook authentic pad thai, green curry, and mango sticky rice.',        'food',        4.0,  40.00, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600'),

-- Bali (id=11) — 3 activities
(11,'Ubud Sacred Monkey Forest',     'Wander through an ancient temple complex inhabited by hundreds of long-tailed macaques amidst lush jungle.',                'nature',      2.0,   5.00, 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600'),
(11,'Tanah Lot Temple Sunset',       'Watch the sun dip behind the dramatic sea temple of Tanah Lot perched on a rocky outcrop in the Indian Ocean.',            'sightseeing', 2.0,   5.00, 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600'),
(11,'Balinese Cooking Class in Ubud','Visit a morning market then cook 8 traditional dishes using spices and techniques passed down through generations.',         'food',        4.0,  35.00, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600'),

-- Istanbul (id=12) — 2 activities
(12,'Hagia Sophia & Blue Mosque',    'Step inside two of the world''s most magnificent religious buildings — a Byzantine marvel and an Ottoman masterpiece.',      'culture',     3.0,   0.00, 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600'),
(12,'Bosphorus Sunset Cruise',       'Sail between two continents as the sun sets over Istanbul''s mosques and palaces reflecting in the glittering strait.',     'sightseeing', 2.0,  20.00, 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600'),

-- Kyoto (id=13) — 2 activities
(13,'Fushimi Inari Shrine Hike',     'Hike through 10,000 vermillion torii gates winding up a sacred mountain behind the iconic Shinto shrine.',                  'nature',      3.0,   0.00, 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600'),
(13,'Arashiyama Bamboo Grove',       'Walk through towering green bamboo stalks and visit Tenryu-ji, a UNESCO zen garden beside the Oi River.',                   'sightseeing', 2.0,   5.00, 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600'),

-- Singapore (id=14) — 2 activities
(14,'Gardens by the Bay Supertrees', 'Stroll beneath 18-storey solar-powered Supertrees and experience the stunning OCBC Skyway walkway at night.',               'nature',      3.0,  30.00, 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600'),
(14,'Hawker Centre Street Food Crawl','Feast on chicken rice, char kway teow, laksa, and chilli crab at Singapore''s legendary open-air food courts.',            'food',        2.0,  15.00, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600'),

-- Jaipur (id=15) — 2 activities
(15,'Amber Fort Tour',               'Explore the majestic hilltop fortress of the Kachhwaha Rajputs, with its ornate Sheesh Mahal mirror palace.',               'sightseeing', 3.0,  12.00, 'https://images.unsplash.com/photo-1524613032530-449a5d94c285?w=600'),
(15,'Jaipur Street Food Walk',       'Taste dal baati churma, kachori, lassi, and ghewar on a guided walk through the bazaars of the walled Pink City.',          'food',        2.0,   8.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600'),

-- Maldives (id=16) — 2 activities
(16,'Snorkeling & Marine Life Tour', 'Swim alongside manta rays, sea turtles, and vibrant coral gardens in some of the world''s clearest waters.',                'adventure',   4.0,  80.00, 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600'),
(16,'Overwater Bungalow Sunset Dinner','Dine on a private deck above the turquoise lagoon as the sky turns gold over the Indian Ocean horizon.',                  'food',        3.0, 150.00, 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600'),

-- New York (id=17) — 3 activities
(17,'Central Park Highlights Walk',  'Explore Bethesda Fountain, the Boathouse, Strawberry Fields, and the Reservoir on a guided walk through Manhattan''s lung.','nature',      2.5,  20.00, 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600'),
(17,'Statue of Liberty & Ellis Island','Ferry to Liberty Island to visit America''s most iconic monument and explore the moving immigration museum.',              'sightseeing', 4.0,  25.00, 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=600'),
(17,'Chelsea & High Line Walk',      'Stroll the elevated linear park built on a former freight railway, lined with art installations and Hudson River views.',    'sightseeing', 2.0,   0.00, 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600'),

-- Vancouver (id=18) — 2 activities
(18,'Stanley Park Seawall Ride',     'Cycle or walk the scenic 10km seawall around Vancouver''s 400-hectare old-growth rainforest park with mountain backdrops.', 'nature',      3.0,  15.00, 'https://images.unsplash.com/photo-1559511260-66a654ae982a?w=600'),
(18,'Granville Island Market Visit', 'Browse artisan cheeses, fresh Pacific salmon, craft beers, and handmade arts at Vancouver''s beloved public market.',        'food',        2.0,  10.00, 'https://images.unsplash.com/photo-1559511260-66a654ae982a?w=600'),

-- Dubai (id=19) — 3 activities
(19,'Burj Khalifa At the Top',       'Ascend to the 148th-floor observation deck of the world''s tallest building for 360° views across the desert and Gulf.',    'sightseeing', 2.0,  50.00, 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600'),
(19,'Desert Safari with BBQ Dinner', 'Dune bash in a 4x4, ride camels, watch a belly dance show, and feast under the stars in the Arabian desert.',               'adventure',   6.0,  85.00, 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=600'),
(19,'Gold & Spice Souk Walk',        'Haggle for saffron and frankincense in the spice souk then marvel at glittering gold jewelry in the dazzling gold souk.',    'shopping',    2.0,   0.00, 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600'),

-- Cape Town (id=20) — 2 activities
(20,'Table Mountain Hike',           'Hike or cable-car to the top of Cape Town''s iconic flat-topped mountain for sweeping views of the Atlantic and city.',     'nature',      4.0,  30.00, 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600'),
(20,'Cape Peninsula & Good Hope',    'Drive the dramatic peninsula past Boulder''s penguin colony to the rocky tip where two oceans meet at Cape Point.',          'adventure',   7.0,  55.00, 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600'),

-- Marrakech (id=21) — 2 activities
(21,'Medina Souks & Djemaa el-Fna', 'Navigate the labyrinthine souks selling leather goods and lanterns, then watch snake charmers at the famous main square.',    'shopping',    3.0,   0.00, 'https://images.unsplash.com/photo-1597212618440-806262de1464?w=600'),
(21,'Traditional Hammam Spa',        'Surrender to an ancient cleansing ritual of steam, black soap, kessa scrub, and argan oil massage in an ornate bathhouse.', 'wellness',    2.0,  30.00, 'https://images.unsplash.com/photo-1597212618440-806262de1464?w=600'),

-- Cairo (id=22) — 2 activities
(22,'Pyramids of Giza & Great Sphinx','Stand before the last surviving wonder of the ancient world and gaze into the eyes of the Great Sphinx at sunset.',         'sightseeing', 4.0,  20.00, 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=600'),
(22,'Egyptian Museum of Antiquities','Explore 5,000 years of pharaonic history including Tutankhamun''s golden death mask and a hall of royal mummies.',           'culture',     3.0,  12.00, 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=600'),

-- Sydney (id=23) — 3 activities
(23,'Sydney Opera House Tour',       'Go backstage on a guided tour of Jørn Utzon''s architectural masterpiece perched on Bennelong Point in the harbour.',       'culture',     1.5,  40.00, 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600'),
(23,'Bondi to Coogee Coastal Walk',  'Hike the spectacular 6km cliff-top path linking four famous beaches with rock pools, ocean baths, and sea views.',           'nature',      3.0,   0.00, 'https://images.unsplash.com/photo-1523428096881-5bd79d043006?w=600'),
(23,'Sydney Harbour Bridge Climb',   'Scale the iconic coathanger arch 134 metres above the harbour for a panoramic view that''s second to none in Australia.',   'adventure',   3.5, 130.00, 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600'),

-- Buenos Aires (id=24) — 2 activities
(24,'Tango Show & Dinner in San Telmo','Watch world-class dancers perform the passionate Argentine tango over a dinner of empanadas and Malbec wine.',             'culture',     3.0,  65.00, 'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=600'),
(24,'La Boca & Recoleta Tour',       'Explore the colourful Caminito street art district and visit Eva Perón''s elaborate tomb in the world''s most beautiful cemetery.','sightseeing',3.0,15.00, 'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=600'),

-- Rio de Janeiro (id=25) — 2 activities
(25,'Christ the Redeemer & Corcovado','Ride the cog railway through Tijuca rainforest to the 38-metre Art Deco statue with panoramic views of Rio and Guanabara Bay.','sightseeing',3.0,20.00, 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=600'),
(25,'Sugarloaf Mountain Cable Car',  'Take the iconic cable car in two stages to the summit of Pão de Açúcar for sweeping views of Copacabana and the bay.',      'nature',      2.5,  25.00, 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=600');
