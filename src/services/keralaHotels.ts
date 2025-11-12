export interface HotelData {
  id: string;
  name: string;
  location: {
    address: string;
    city: string;
    district: string;
    coordinates: { lat: number; lng: number };
  };
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  category: 'budget' | 'mid-range' | 'luxury';
  type: 'hotel' | 'resort' | 'homestay' | 'ktdc' | 'pwd';
  rating: number;
  reviewCount: number;
  amenities: string[];
  contact: {
    phone: string;
    email?: string;
    website?: string;
  };
  bookingLinks: {
    bookingCom?: string;
    agoda?: string;
    makeMyTrip?: string;
    direct?: string;
  };
  nearbyAttractions: string[];
  transportHubs: string[];
  images: string[];
  description: string;
  checkIn: string;
  checkOut: string;
  policies: string[];
}

export const keralaHotels: HotelData[] = [
  // Thiruvananthapuram Hotels
  {
    id: 'tvm-001',
    name: 'Vivanta by Taj - Malabar',
    location: {
      address: 'Willingdon Island, Kochi',
      city: 'Kochi',
      district: 'Ernakulam',
      coordinates: { lat: 9.9312, lng: 76.2673 }
    },
    priceRange: { min: 15000, max: 25000, currency: 'INR' },
    category: 'luxury',
    type: 'hotel',
    rating: 4.5,
    reviewCount: 1250,
    amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Parking', 'AC', 'Room Service', 'Gym'],
    contact: {
      phone: '+91-484-2668222',
      email: 'malabar.kochi@tajhotels.com',
      website: 'https://www.tajhotels.com'
    },
    bookingLinks: {
      bookingCom: 'https://www.booking.com/hotel/in/vivanta-malabar.html',
      agoda: 'https://www.agoda.com/vivanta-by-taj-malabar/hotel/kochi-in.html',
      makeMyTrip: 'https://www.makemytrip.com/hotels/vivanta-by-taj-malabar-details-kochi.html'
    },
    nearbyAttractions: ['Fort Kochi', 'Chinese Fishing Nets', 'Jew Town', 'Mattancherry Palace'],
    transportHubs: ['Kochi Airport (30km)', 'Ernakulam Junction (5km)', 'Kochi Port'],
    images: ['/images/hotels/vivanta-malabar-1.jpg', '/images/hotels/vivanta-malabar-2.jpg'],
    description: 'Luxury hotel on Willingdon Island with stunning harbor views and world-class amenities.',
    checkIn: '14:00',
    checkOut: '12:00',
    policies: ['Free cancellation up to 24 hours', 'Pet-friendly', 'Airport shuttle available']
  },
  {
    id: 'tvm-002',
    name: 'Ginger Trivandrum',
    location: {
      address: 'Technopark Campus, Trivandrum',
      city: 'Thiruvananthapuram',
      district: 'Thiruvananthapuram',
      coordinates: { lat: 8.5241, lng: 76.9366 }
    },
    priceRange: { min: 3000, max: 6000, currency: 'INR' },
    category: 'mid-range',
    type: 'hotel',
    rating: 4.2,
    reviewCount: 850,
    amenities: ['WiFi', 'Restaurant', 'Parking', 'AC', 'Business Center', 'Laundry'],
    contact: {
      phone: '+91-471-2700000',
      email: 'trivandrum@gingerhotels.com',
      website: 'https://www.gingerhotels.com'
    },
    bookingLinks: {
      bookingCom: 'https://www.booking.com/hotel/in/ginger-trivandrum.html',
      makeMyTrip: 'https://www.makemytrip.com/hotels/ginger-trivandrum-details.html'
    },
    nearbyAttractions: ['Technopark', 'Kovalam Beach (25km)', 'Padmanabhaswamy Temple (15km)'],
    transportHubs: ['Trivandrum Airport (8km)', 'Thiruvananthapuram Central (12km)'],
    images: ['/images/hotels/ginger-tvm-1.jpg'],
    description: 'Modern business hotel with excellent connectivity to IT parks and city center.',
    checkIn: '14:00',
    checkOut: '11:00',
    policies: ['Free WiFi', 'Business facilities', 'Airport transfer available']
  },

  // Kochi Hotels
  {
    id: 'kochi-001',
    name: 'Hotel Aiswarya',
    location: {
      address: 'Pallimukku, MG Road, Kochi',
      city: 'Kochi',
      district: 'Ernakulam',
      coordinates: { lat: 9.9668, lng: 76.2450 }
    },
    priceRange: { min: 1500, max: 3000, currency: 'INR' },
    category: 'budget',
    type: 'hotel',
    rating: 3.8,
    reviewCount: 420,
    amenities: ['WiFi', 'AC', 'Parking', 'Restaurant', 'Room Service'],
    contact: {
      phone: '+91-484-2381234',
      email: 'info@hotelaiswarya.com'
    },
    bookingLinks: {
      bookingCom: 'https://www.booking.com/hotel/in/aiswarya-kochi.html',
      makeMyTrip: 'https://www.makemytrip.com/hotels/hotel-aiswarya-details-kochi.html'
    },
    nearbyAttractions: ['MG Road', 'Marine Drive (2km)', 'Fort Kochi (5km)'],
    transportHubs: ['Ernakulam Junction (1km)', 'Kochi Airport (25km)'],
    images: ['/images/hotels/aiswarya-1.jpg'],
    description: 'Budget-friendly hotel in the heart of Kochi with clean rooms and friendly service.',
    checkIn: '12:00',
    checkOut: '11:00',
    policies: ['Free WiFi', '24-hour front desk', 'Luggage storage']
  },

  // Munnar Hotels
  {
    id: 'munnar-001',
    name: 'The Panoramic Getaway',
    location: {
      address: 'Munnar, Idukki District',
      city: 'Munnar',
      district: 'Idukki',
      coordinates: { lat: 10.0889, lng: 77.0595 }
    },
    priceRange: { min: 8000, max: 15000, currency: 'INR' },
    category: 'luxury',
    type: 'resort',
    rating: 4.6,
    reviewCount: 680,
    amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Parking', 'AC', 'Room Service', 'Gym', 'Mountain View'],
    contact: {
      phone: '+91-4865-230000',
      email: 'info@panoramicgetaway.com',
      website: 'https://www.panoramicgetaway.com'
    },
    bookingLinks: {
      bookingCom: 'https://www.booking.com/hotel/in/panoramic-getaway-munnar.html',
      agoda: 'https://www.agoda.com/panoramic-getaway/hotel/munnar-in.html'
    },
    nearbyAttractions: ['Tea Gardens', 'Eravikulam National Park', 'Mattupetty Dam', 'Echo Point'],
    transportHubs: ['Munnar Bus Stand (3km)', 'Kochi Airport (110km)'],
    images: ['/images/hotels/panoramic-munnar-1.jpg', '/images/hotels/panoramic-munnar-2.jpg'],
    description: 'Luxury resort with panoramic views of tea plantations and misty hills.',
    checkIn: '15:00',
    checkOut: '11:00',
    policies: ['Free cancellation', 'Pet-friendly', 'Mountain view rooms', 'Spa services']
  },
  {
    id: 'munnar-002',
    name: 'Sterling Munnar',
    location: {
      address: 'Chithirapuram, Munnar',
      city: 'Munnar',
      district: 'Idukki',
      coordinates: { lat: 10.0889, lng: 77.0595 }
    },
    priceRange: { min: 5000, max: 10000, currency: 'INR' },
    category: 'mid-range',
    type: 'resort',
    rating: 4.3,
    reviewCount: 920,
    amenities: ['WiFi', 'Pool', 'Restaurant', 'Parking', 'AC', 'Room Service', 'Garden'],
    contact: {
      phone: '+91-4865-230500',
      email: 'munnar@sterlingholidays.com',
      website: 'https://www.sterlingholidays.com'
    },
    bookingLinks: {
      bookingCom: 'https://www.booking.com/hotel/in/sterling-munnar.html',
      makeMyTrip: 'https://www.makemytrip.com/hotels/sterling-munnar-details.html'
    },
    nearbyAttractions: ['Tea Museum', 'Pothamedu Viewpoint', 'Attukal Waterfalls'],
    transportHubs: ['Munnar Bus Stand (5km)', 'Kochi Airport (120km)'],
    images: ['/images/hotels/sterling-munnar-1.jpg'],
    description: 'Comfortable resort with modern amenities and scenic tea garden views.',
    checkIn: '14:00',
    checkOut: '11:00',
    policies: ['Free WiFi', 'Pet-friendly', 'Garden view', 'Tea plantation tours']
  },

  // Wayanad Hotels
  {
    id: 'wayanad-001',
    name: 'Klov Resort & Spa',
    location: {
      address: 'Near Thirunelly Temple, Wayanad',
      city: 'Wayanad',
      district: 'Wayanad',
      coordinates: { lat: 11.8058, lng: 76.0020 }
    },
    priceRange: { min: 6000, max: 12000, currency: 'INR' },
    category: 'mid-range',
    type: 'resort',
    rating: 4.4,
    reviewCount: 750,
    amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Parking', 'AC', 'Garden', 'Bike Rental'],
    contact: {
      phone: '+91-4936-220000',
      email: 'info@klovresort.com',
      website: 'https://www.klovresort.com'
    },
    bookingLinks: {
      bookingCom: 'https://www.booking.com/hotel/in/klov-resort-wayanad.html',
      agoda: 'https://www.agoda.com/klov-resort-spa/hotel/wayanad-in.html'
    },
    nearbyAttractions: ['Thirunelly Temple', 'Banasura Sagar Dam', 'Chembra Peak', 'Edakkal Caves'],
    transportHubs: ['Kalpetta Bus Stand (15km)', 'Kozhikode Airport (100km)'],
    images: ['/images/hotels/klov-wayanad-1.jpg'],
    description: 'Eco-friendly resort with spa services and close proximity to ancient temples.',
    checkIn: '15:00',
    checkOut: '11:00',
    policies: ['Free bike rental', 'Spa packages', 'Temple visits', 'Nature walks']
  },

  // Thekkady Hotels
  {
    id: 'thekkady-001',
    name: 'Thekkady Gavi Suites',
    location: {
      address: 'Vandiperiyar, Thekkady',
      city: 'Thekkady',
      district: 'Idukki',
      coordinates: { lat: 9.5833, lng: 77.1667 }
    },
    priceRange: { min: 2500, max: 5000, currency: 'INR' },
    category: 'budget',
    type: 'hotel',
    rating: 3.9,
    reviewCount: 380,
    amenities: ['WiFi', 'Restaurant', 'Parking', 'AC', 'Garden', '24-hour Front Desk'],
    contact: {
      phone: '+91-4869-222000',
      email: 'info@gavisuites.com'
    },
    bookingLinks: {
      bookingCom: 'https://www.booking.com/hotel/in/gavi-suites-thekkady.html',
      makeMyTrip: 'https://www.makemytrip.com/hotels/gavi-suites-details.html'
    },
    nearbyAttractions: ['Periyar National Park', 'Spice Plantations', 'Kumily Market'],
    transportHubs: ['Kumily Bus Stand (5km)', 'Kochi Airport (160km)'],
    images: ['/images/hotels/gavi-suites-1.jpg'],
    description: 'Budget accommodation near Periyar National Park with garden views.',
    checkIn: '12:00',
    checkOut: '11:00',
    policies: ['Free WiFi', 'Garden view', 'Wildlife safari booking', 'Spice plantation tours']
  },

  // Alappuzha Hotels
  {
    id: 'alappuzha-001',
    name: 'Marari Beach Bungalow Resort',
    location: {
      address: 'Marari Beach, Alappuzha',
      city: 'Alappuzha',
      district: 'Alappuzha',
      coordinates: { lat: 9.4981, lng: 76.3388 }
    },
    priceRange: { min: 12000, max: 20000, currency: 'INR' },
    category: 'luxury',
    type: 'resort',
    rating: 4.7,
    reviewCount: 1100,
    amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Parking', 'AC', 'Beach Access', 'Water Sports'],
    contact: {
      phone: '+91-478-2860000',
      email: 'info@mararibeachresort.com',
      website: 'https://www.mararibeachresort.com'
    },
    bookingLinks: {
      bookingCom: 'https://www.booking.com/hotel/in/marari-beach-resort.html',
      agoda: 'https://www.agoda.com/marari-beach-resort/hotel/alappuzha-in.html'
    },
    nearbyAttractions: ['Marari Beach', 'Alleppey Backwaters', 'Kumarakom Bird Sanctuary'],
    transportHubs: ['Alappuzha Railway Station (15km)', 'Kochi Airport (80km)'],
    images: ['/images/hotels/marari-beach-1.jpg', '/images/hotels/marari-beach-2.jpg'],
    description: 'Luxury beachfront resort with traditional Kerala architecture and modern amenities.',
    checkIn: '15:00',
    checkOut: '11:00',
    policies: ['Beach access', 'Water sports', 'Ayurvedic treatments', 'Backwater cruises']
  },

  // KTDC Hotels
  {
    id: 'ktdc-001',
    name: 'KTDC Hotel Mascot',
    location: {
      address: 'Thiruvananthapuram Central',
      city: 'Thiruvananthapuram',
      district: 'Thiruvananthapuram',
      coordinates: { lat: 8.4842, lng: 76.9202 }
    },
    priceRange: { min: 2000, max: 4000, currency: 'INR' },
    category: 'budget',
    type: 'ktdc',
    rating: 3.5,
    reviewCount: 650,
    amenities: ['WiFi', 'Restaurant', 'Parking', 'AC', 'Room Service'],
    contact: {
      phone: '+91-471-2330031',
      email: 'mascot@ktdc.com',
      website: 'https://www.ktdc.com'
    },
    bookingLinks: {
      direct: 'https://www.ktdc.com/hotels/mascot',
      makeMyTrip: 'https://www.makemytrip.com/hotels/ktdc-mascot-details.html'
    },
    nearbyAttractions: ['Padmanabhaswamy Temple (2km)', 'Kovalam Beach (15km)', 'Napier Museum'],
    transportHubs: ['Thiruvananthapuram Central (0.5km)', 'Trivandrum Airport (6km)'],
    images: ['/images/hotels/ktdc-mascot-1.jpg'],
    description: 'Government-run hotel with basic amenities and central location.',
    checkIn: '12:00',
    checkOut: '11:00',
    policies: ['Government rates', 'Central location', 'Basic amenities']
  },

  // PWD Rest Houses
  {
    id: 'pwd-001',
    name: 'PWD Rest House Munnar',
    location: {
      address: 'Munnar Town',
      city: 'Munnar',
      district: 'Idukki',
      coordinates: { lat: 10.0889, lng: 77.0595 }
    },
    priceRange: { min: 800, max: 1500, currency: 'INR' },
    category: 'budget',
    type: 'pwd',
    rating: 3.2,
    reviewCount: 280,
    amenities: ['Basic WiFi', 'Parking', 'Basic Restaurant'],
    contact: {
      phone: '+91-4865-230000',
      email: 'pwd.munnar@kerala.gov.in'
    },
    bookingLinks: {
      direct: 'https://www.pwd.kerala.gov.in'
    },
    nearbyAttractions: ['Tea Gardens', 'Munnar Town', 'Mattupetty Dam'],
    transportHubs: ['Munnar Bus Stand (1km)', 'Kochi Airport (110km)'],
    images: ['/images/hotels/pwd-munnar-1.jpg'],
    description: 'Basic government accommodation with essential facilities.',
    checkIn: '12:00',
    checkOut: '10:00',
    policies: ['Government rates', 'Basic facilities', 'Advance booking required']
  }
];

export const getHotelsByCategory = (category: string) => {
  return keralaHotels.filter(hotel => hotel.category === category);
};

export const getHotelsByType = (type: string) => {
  return keralaHotels.filter(hotel => hotel.type === type);
};

export const getHotelsByLocation = (city: string) => {
  return keralaHotels.filter(hotel => 
    hotel.location.city.toLowerCase().includes(city.toLowerCase()) ||
    hotel.location.district.toLowerCase().includes(city.toLowerCase())
  );
};

export const getHotelsByPriceRange = (min: number, max: number) => {
  return keralaHotels.filter(hotel => 
    hotel.priceRange.min >= min && hotel.priceRange.max <= max
  );
};

export const searchHotels = (query: string) => {
  const lowercaseQuery = query.toLowerCase();
  return keralaHotels.filter(hotel => 
    hotel.name.toLowerCase().includes(lowercaseQuery) ||
    hotel.location.city.toLowerCase().includes(lowercaseQuery) ||
    hotel.location.district.toLowerCase().includes(lowercaseQuery) ||
    hotel.nearbyAttractions.some(attraction => 
      attraction.toLowerCase().includes(lowercaseQuery)
    )
  );
};


















