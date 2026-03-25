// Mock data enhancement for testing new collection page features
export const enhanceAmenityWithMockData = (amenity: any) => {
  // Add mock rating (3.5-4.8)
  const rating = 3.5 + Math.random() * 1.3;

  // Add mock walking times
  const walkingTimes = ['2 min walk', '5 min walk', '8 min walk', '3 min walk', '6 min walk'];
  const walkingTime = walkingTimes[Math.floor(Math.random() * walkingTimes.length)];

  // Add mock status based on current time
  const hour = new Date().getHours();
  let status: 'open' | 'closed' | 'closing_soon' = 'open';
  if (hour < 6 || hour > 22) {
    status = 'closed';
  } else if (hour > 21) {
    status = 'closing_soon';
  }

  // Add mock levels
  const levels = ['1', '2', '3', 'B1', 'Departure', 'Arrival'];
  const level = levels[Math.floor(Math.random() * levels.length)];

  // Add mock gate proximity
  const gates = ['A1-A10', 'B5-B15', 'C20-C30', 'D1-D8'];
  const gateProximity = Math.random() > 0.6 ? gates[Math.floor(Math.random() * gates.length)] : undefined;

  return {
    ...amenity,
    rating: Math.round(rating * 10) / 10,
    walking_time: walkingTime,
    status,
    level,
    gate_proximity: gateProximity
  };
};

export const enhanceAmenitiesArray = (amenities: any[]) => {
  return amenities.map(enhanceAmenityWithMockData);
};