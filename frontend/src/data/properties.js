/**
 * Mock properties data
 * Matches schema:
 * - PROPERTY: ID, Host ID, Location ID, Name, Description, Type, Price per Night, Max Guests, Bedrooms, Bathrooms, Status
 * - LOCATION: City, State, Country, Address, Lat, Long
 * - PROPERTY_IMAGE: Array of image URLs with isPrimary indicator
 * - Derived: averageRating, reviewCount
 */

export const properties = [
  {
    id: 1,
    hostId: 2,
    hostName: "Priya Sharma",
    hostAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    name: "Serene Palms Villa with Private Pool",
    description: "Escape to this luxury villa nestled among swaying coconut palms in North Goa. Features a private plunge pool, open-concept tropical living area, modern modular kitchen, and curated antique Goan decor. Perfect for family retreats and peaceful workations.",
    propertyType: "Villa",
    pricePerNight: 7500,
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 3,
    status: "ACTIVE",
    location: {
      id: 101,
      city: "Goa",
      state: "Goa",
      country: "India",
      address: "14 Chogm Road, Porvorim",
      latitude: 15.5326,
      longitude: 73.8297
    },
    images: [
      { id: 1001, url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&auto=format&fit=crop&q=80", isPrimary: true, caption: "Front exterior with pool" },
      { id: 1002, url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80", isPrimary: false, caption: "Sunlit living lounge" },
      { id: 1003, url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80", isPrimary: false, caption: "Private pool patio" },
      { id: 1004, url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80", isPrimary: false, caption: "Master bedroom suite" },
      { id: 1005, url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&auto=format&fit=crop&q=80", isPrimary: false, caption: "En-suite spa bath" }
    ],
    amenityIds: [1, 2, 3, 4, 5, 6, 8, 9, 13],
    averageRating: 4.92,
    reviewCount: 38,
    createdAt: "2024-11-25"
  },
  {
    id: 2,
    hostId: 2,
    hostName: "Priya Sharma",
    hostAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    name: "Sunlit Minimalist Loft near Cyber City",
    description: "Modern, high-rise designer apartment with floor-to-ceiling windows overlooking the skyline. High-speed 300 Mbps fiber WiFi, ergonomic Herman Miller desk, full kitchen with espresso machine, and building gym access. Steps from premier cafes and metro.",
    propertyType: "Apartment",
    pricePerNight: 3800,
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    status: "ACTIVE",
    location: {
      id: 102,
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      address: "88 Indiranagar 100 Feet Road",
      latitude: 12.9716,
      longitude: 77.6412
    },
    images: [
      { id: 1006, url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80", isPrimary: true, caption: "Bright open-plan loft" },
      { id: 1007, url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80", isPrimary: false, caption: "Bedroom corner" },
      { id: 1008, url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&auto=format&fit=crop&q=80", isPrimary: false, caption: "Chef kitchen" },
      { id: 1009, url: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1200&auto=format&fit=crop&q=80", isPrimary: false, caption: "Modern bathroom" }
    ],
    amenityIds: [1, 2, 3, 6, 7, 8, 11, 12, 13, 15],
    averageRating: 4.85,
    reviewCount: 42,
    createdAt: "2024-12-05"
  },
  {
    id: 3,
    hostId: 3,
    hostName: "Rohan Kapoor",
    hostAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    name: "Pinecrest Heritage Cottage in the Pines",
    description: "Charming stone-and-wood Himalayan cottage with a wood-burning fireplace, panoramic snow peak views, and private pine garden. Sip artisanal tea on the glass conservatory deck while gazing over the Solang valley peaks.",
    propertyType: "Cottage",
    pricePerNight: 5200,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    status: "ACTIVE",
    location: {
      id: 103,
      city: "Manali",
      state: "Himachal Pradesh",
      country: "India",
      address: "Upper Old Manali Road",
      latitude: 32.2396,
      longitude: 77.1887
    },
    images: [
      { id: 1010, url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&auto=format&fit=crop&q=80", isPrimary: true, caption: "Exterior stone cottage" },
      { id: 1011, url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80", isPrimary: false, caption: "Cozy fireplace room" },
      { id: 1012, url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&auto=format&fit=crop&q=80", isPrimary: false, caption: "Master wooden suite" },
      { id: 1013, url: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1200&auto=format&fit=crop&q=80", isPrimary: false, caption: "Scenic mountain view deck" }
    ],
    amenityIds: [1, 3, 4, 8, 9, 10, 14],
    averageRating: 4.95,
    reviewCount: 56,
    createdAt: "2024-10-12"
  },
  {
    id: 4,
    hostId: 3,
    hostName: "Rohan Kapoor",
    hostAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    name: "Lakeview Haveli Courtyard Suite",
    description: "Restored 19th-century royal haveli room overlooking Lake Pichola. Features hand-painted Jharokha alcoves, antique brass fittings, marble courtyards, and rooftop sunset dining. Experience traditional Rajasthani warmth and royal hospitality.",
    propertyType: "Room",
    pricePerNight: 4200,
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    status: "ACTIVE",
    location: {
      id: 104,
      city: "Udaipur",
      state: "Rajasthan",
      country: "India",
      address: "21 Lal Ghat, Old City",
      latitude: 24.5794,
      longitude: 73.6828
    },
    images: [
      { id: 1014, url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80", isPrimary: true, caption: "Haveli facade on lake" },
      { id: 1015, url: "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1200&auto=format&fit=crop&q=80", isPrimary: false, caption: "Regal suite bedroom" },
      { id: 1016, url: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&auto=format&fit=crop&q=80", isPrimary: false, caption: "Marble bath" }
    ],
    amenityIds: [1, 2, 8, 12, 14],
    averageRating: 4.88,
    reviewCount: 29,
    createdAt: "2024-11-01"
  },
  {
    id: 5,
    hostId: 7,
    hostName: "Ananya Iyer",
    hostAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    name: "Coastal Breeze Seafront Portuguese House",
    description: "Authentic Portuguese-style tiled villa just 200m from Candolim Beach. High timber ceilings, lush frangipani courtyard, outdoor barbecue grill, and spacious wrap-around verandah to soak in the sea breeze with loved ones.",
    propertyType: "House",
    pricePerNight: 8900,
    maxGuests: 8,
    bedrooms: 4,
    bathrooms: 3,
    status: "ACTIVE",
    location: {
      id: 105,
      city: "Goa",
      state: "Goa",
      country: "India",
      address: "Pintor Vaddo, Candolim",
      latitude: 15.5186,
      longitude: 73.7634
    },
    images: [
      { id: 1017, url: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&auto=format&fit=crop&q=80", isPrimary: true, caption: "Traditional villa porch" },
      { id: 1018, url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80", isPrimary: false, caption: "Spacious salon" },
      { id: 1019, url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&auto=format&fit=crop&q=80", isPrimary: false, caption: "Dining veranda" }
    ],
    amenityIds: [1, 2, 3, 4, 6, 7, 8, 9, 10, 12, 13],
    averageRating: 4.79,
    reviewCount: 22,
    createdAt: "2025-01-10"
  },
  {
    id: 6,
    hostId: 7,
    hostName: "Ananya Iyer",
    hostAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    name: "Misty Hills Plantation Bungalow",
    description: "Perched amidst a 40-acre organic coffee and cardamom plantation. Enjoy fresh estate-brewed coffee, mist-covered mountain valleys, guided nature walks, birdwatching trails, and warm home-cooked Kodava meals.",
    propertyType: "Cottage",
    pricePerNight: 6100,
    maxGuests: 5,
    bedrooms: 2,
    bathrooms: 2,
    status: "ACTIVE",
    location: {
      id: 106,
      city: "Coorg",
      state: "Karnataka",
      country: "India",
      address: "Madenadu Estate, Madikeri",
      latitude: 12.4244,
      longitude: 75.7382
    },
    images: [
      { id: 1020, url: "https://images.unsplash.com/photo-1448630360428-65456885c650?w=1200&auto=format&fit=crop&q=80", isPrimary: true, caption: "Bungalow overlooking coffee shrubs" },
      { id: 1021, url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&auto=format&fit=crop&q=80", isPrimary: false, caption: "Warm plantation bedroom" },
      { id: 1022, url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&auto=format&fit=crop&q=80", isPrimary: false, caption: "Garden sitting patio" }
    ],
    amenityIds: [1, 3, 4, 8, 9, 10, 13, 14, 15],
    averageRating: 4.96,
    reviewCount: 31,
    createdAt: "2025-02-01"
  },
  {
    id: 8,
    hostId: 3,
    hostName: "Rohan Kapoor",
    hostAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    name: "Valley View Wooden Alpine Chalet",
    description: "Cozy timber chalet in the upper hills with dramatic views of snow peaks. Features floor heating, Nordic wooden sauna, hot tub overlooking the pines, and direct access to mountain trekking trails.",
    propertyType: "Villa",
    pricePerNight: 6800,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    status: "PENDING", // Matches schema PENDING status
    location: {
      id: 108,
      city: "Manali",
      state: "Himachal Pradesh",
      country: "India",
      address: "Hadimba Road, Manali",
      latitude: 32.2472,
      longitude: 77.1812
    },
    images: [
      { id: 1026, url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1200&auto=format&fit=crop&q=80", isPrimary: true, caption: "Chalet front in valley" }
    ],
    amenityIds: [1, 2, 3, 4, 8, 9, 14],
    averageRating: 0,
    reviewCount: 0,
    createdAt: "2025-02-18"
  }
];
