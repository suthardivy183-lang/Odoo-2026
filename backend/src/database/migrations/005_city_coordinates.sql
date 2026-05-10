-- ============================================================
-- CITY COORDINATES FOR MAP-FIRST ITINERARIES
-- ============================================================

ALTER TABLE cities
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6);

UPDATE cities SET latitude = 48.856600, longitude = 2.352200 WHERE name = 'Paris' AND country = 'France';
UPDATE cities SET latitude = 41.902800, longitude = 12.496400 WHERE name = 'Rome' AND country = 'Italy';
UPDATE cities SET latitude = 41.387400, longitude = 2.168600 WHERE name = 'Barcelona' AND country = 'Spain';
UPDATE cities SET latitude = 50.075500, longitude = 14.437800 WHERE name = 'Prague' AND country = 'Czech Republic';
UPDATE cities SET latitude = 52.367600, longitude = 4.904100 WHERE name = 'Amsterdam' AND country = 'Netherlands';
UPDATE cities SET latitude = 38.722300, longitude = -9.139300 WHERE name = 'Lisbon' AND country = 'Portugal';
UPDATE cities SET latitude = 36.393200, longitude = 25.461500 WHERE name = 'Santorini' AND country = 'Greece';
UPDATE cities SET latitude = 48.208200, longitude = 16.373800 WHERE name = 'Vienna' AND country = 'Austria';
UPDATE cities SET latitude = 35.676200, longitude = 139.650300 WHERE name = 'Tokyo' AND country = 'Japan';
UPDATE cities SET latitude = 13.756300, longitude = 100.501800 WHERE name = 'Bangkok' AND country = 'Thailand';
UPDATE cities SET latitude = -8.340500, longitude = 115.092000 WHERE name = 'Bali' AND country = 'Indonesia';
UPDATE cities SET latitude = 41.008200, longitude = 28.978400 WHERE name = 'Istanbul' AND country = 'Turkey';
UPDATE cities SET latitude = 35.011600, longitude = 135.768100 WHERE name = 'Kyoto' AND country = 'Japan';
UPDATE cities SET latitude = 1.352100, longitude = 103.819800 WHERE name = 'Singapore' AND country = 'Singapore';
UPDATE cities SET latitude = 26.912400, longitude = 75.787300 WHERE name = 'Jaipur' AND country = 'India';
UPDATE cities SET latitude = 3.202800, longitude = 73.220700 WHERE name = 'Maldives' AND country = 'Maldives';
UPDATE cities SET latitude = 40.712800, longitude = -74.006000 WHERE name = 'New York' AND country = 'USA';
UPDATE cities SET latitude = 49.282700, longitude = -123.120700 WHERE name = 'Vancouver' AND country = 'Canada';
UPDATE cities SET latitude = 25.204800, longitude = 55.270800 WHERE name = 'Dubai' AND country = 'UAE';
UPDATE cities SET latitude = -33.924900, longitude = 18.424100 WHERE name = 'Cape Town' AND country = 'South Africa';
UPDATE cities SET latitude = 31.629500, longitude = -7.981100 WHERE name = 'Marrakech' AND country = 'Morocco';
UPDATE cities SET latitude = 30.044400, longitude = 31.235700 WHERE name = 'Cairo' AND country = 'Egypt';
UPDATE cities SET latitude = -33.868800, longitude = 151.209300 WHERE name = 'Sydney' AND country = 'Australia';
UPDATE cities SET latitude = -34.603700, longitude = -58.381600 WHERE name = 'Buenos Aires' AND country = 'Argentina';
UPDATE cities SET latitude = -22.906800, longitude = -43.172900 WHERE name = 'Rio de Janeiro' AND country = 'Brazil';
