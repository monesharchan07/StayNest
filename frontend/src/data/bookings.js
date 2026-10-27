/**
 * Mock bookings & payments data
 * Matches BOOKING and PAYMENT entities from PDF:
 * - BOOKING: ID, User ID, Property ID, Check-in, Check-out, Guests, Number of Nights, Total Amount, Booking Status
 * - PAYMENT: ID, Booking ID, Amount, Method (UPI / CARD / NET_BANKING), Status (SUCCESS / FAILED / PENDING), Transaction ID
 */

export const bookings = [
  {
    id: 101,
    userId: 1, // Arjun Mehta
    propertyId: 1,
    propertyName: "Serene Palms Villa with Private Pool",
    propertyImage: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&auto=format&fit=crop&q=80",
    city: "Goa",
    checkIn: "2025-01-18",
    checkOut: "2025-01-21",
    guests: 4,
    numberOfNights: 3,
    pricePerNight: 7500,
    totalAmount: 24750, // 3 * 7500 = 22500 + 2250 (10% fee)
    status: "COMPLETED",
    createdAt: "2025-01-05",
    payment: {
      id: 201,
      amount: 24750,
      paymentMethod: "UPI",
      status: "SUCCESS",
      transactionId: "TXN_UPI_9832718921",
      paymentDate: "2025-01-05 14:32:10"
    },
    hasReview: true
  },
  {
    id: 102,
    userId: 1, // Arjun Mehta
    propertyId: 3,
    propertyName: "Pinecrest Heritage Cottage in the Pines",
    propertyImage: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&auto=format&fit=crop&q=80",
    city: "Manali",
    checkIn: "2025-04-10",
    checkOut: "2025-04-14",
    guests: 2,
    numberOfNights: 4,
    pricePerNight: 5200,
    totalAmount: 22880, // 4 * 5200 = 20800 + 2080
    status: "CONFIRMED",
    createdAt: "2025-02-15",
    payment: {
      id: 202,
      amount: 22880,
      paymentMethod: "CARD",
      status: "SUCCESS",
      transactionId: "TXN_CRD_4920194819",
      paymentDate: "2025-02-15 11:20:45"
    },
    hasReview: false
  },
  {
    id: 103,
    userId: 4, // Sneha Patel
    propertyId: 2,
    propertyName: "Sunlit Minimalist Loft near Cyber City",
    propertyImage: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&auto=format&fit=crop&q=80",
    city: "Bengaluru",
    checkIn: "2025-03-20",
    checkOut: "2025-03-23",
    guests: 2,
    numberOfNights: 3,
    pricePerNight: 3800,
    totalAmount: 12540,
    status: "PENDING",
    createdAt: "2025-02-20",
    payment: {
      id: 203,
      amount: 12540,
      paymentMethod: "UPI",
      status: "PENDING",
      transactionId: "TXN_UPI_8372847291",
      paymentDate: "2025-02-20 09:15:00"
    },
    hasReview: false
  },
  {
    id: 104,
    userId: 6, // Vikram Singh
    propertyId: 5,
    propertyName: "Coastal Breeze Seafront Portuguese House",
    propertyImage: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&auto=format&fit=crop&q=80",
    city: "Goa",
    checkIn: "2025-02-01",
    checkOut: "2025-02-04",
    guests: 6,
    numberOfNights: 3,
    pricePerNight: 8900,
    totalAmount: 29370,
    status: "CANCELLED",
    createdAt: "2025-01-12",
    payment: {
      id: 204,
      amount: 29370,
      paymentMethod: "NET_BANKING",
      status: "FAILED",
      transactionId: "TXN_NB_1290384756",
      paymentDate: "2025-01-12 16:45:22"
    },
    hasReview: false
  }
];
