// Booking service for Kerala Horizon
import { handleAPIError } from '../utils/errorHandler';

export interface BookingRequest {
  type: 'hotel' | 'transport' | 'event' | 'experience';
  itemId: string;
  userId?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  preferences?: Record<string, any>;
  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface BookingResponse {
  bookingId: string;
  status: 'confirmed' | 'pending' | 'failed';
  confirmationNumber: string;
  totalAmount: number;
  currency: string;
  paymentUrl?: string;
  details: Record<string, any>;
}

export interface PaymentRequest {
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: 'card' | 'upi' | 'netbanking' | 'wallet';
  returnUrl: string;
}

class BookingService {
  private baseUrl = process.env.REACT_APP_BOOKING_API_URL || 'https://api.keralahorizon.com';

  // Hotel booking
  async bookHotel(request: BookingRequest): Promise<BookingResponse> {
    try {
      // In real implementation, this would call actual booking API
      const response = await this.simulateBookingAPI(request);
      
      // For demo, integrate with popular booking platforms
      const bookingPlatforms = {
        ktdc: 'https://www.ktdc.com/booking',
        makemytrip: 'https://www.makemytrip.com/hotels',
        booking: 'https://www.booking.com',
        agoda: 'https://www.agoda.com'
      };

      // Redirect to appropriate platform based on hotel type
      if (request.itemId.includes('ktdc')) {
        window.open(bookingPlatforms.ktdc, '_blank');
      } else {
        window.open(bookingPlatforms.makemytrip, '_blank');
      }

      return response;
    } catch (error) {
      throw new Error(handleAPIError(error, 'Hotel Booking'));
    }
  }

  // Transport booking
  async bookTransport(request: BookingRequest): Promise<BookingResponse> {
    try {
      const response = await this.simulateBookingAPI(request);
      
      // Redirect to transport booking platforms
      const transportPlatforms = {
        bus: 'https://www.ksrtc.in/',
        train: 'https://www.irctc.co.in/',
        flight: 'https://www.makemytrip.com/flights',
        cab: 'https://www.uber.com/'
      };

      // Determine transport type and redirect
      const transportType = this.getTransportType(request.itemId);
      if (transportPlatforms[transportType as keyof typeof transportPlatforms]) {
        window.open(transportPlatforms[transportType as keyof typeof transportPlatforms], '_blank');
      }

      return response;
    } catch (error) {
      throw new Error(handleAPIError(error, 'Transport Booking'));
    }
  }

  // Event booking
  async bookEvent(request: BookingRequest): Promise<BookingResponse> {
    try {
      const response = await this.simulateBookingAPI(request);
      
      // Redirect to event booking platforms
      const eventPlatforms = {
        cultural: 'https://www.keralatourism.org/events',
        performance: 'https://www.bookmyshow.com',
        workshop: 'https://www.eventbrite.com'
      };

      window.open(eventPlatforms.cultural, '_blank');
      return response;
    } catch (error) {
      throw new Error(handleAPIError(error, 'Event Booking'));
    }
  }

  // Experience booking (tours, activities)
  async bookExperience(request: BookingRequest): Promise<BookingResponse> {
    try {
      const response = await this.simulateBookingAPI(request);
      
      // Redirect to experience platforms
      const experiencePlatforms = {
        tour: 'https://www.viator.com',
        activity: 'https://www.getyourguide.com',
        local: 'https://www.keralatourism.org/experiences'
      };

      window.open(experiencePlatforms.local, '_blank');
      return response;
    } catch (error) {
      throw new Error(handleAPIError(error, 'Experience Booking'));
    }
  }

  // Payment processing
  async processPayment(request: PaymentRequest): Promise<{ paymentUrl: string; transactionId: string }> {
    try {
      // Simulate payment gateway integration
      const paymentGateways = {
        razorpay: 'https://checkout.razorpay.com',
        payu: 'https://secure.payu.in',
        ccavenue: 'https://secure.ccavenue.com',
        instamojo: 'https://www.instamojo.com'
      };

      // For demo, use Razorpay (popular in India)
      const paymentUrl = `${paymentGateways.razorpay}?amount=${request.amount}&currency=${request.currency}&booking_id=${request.bookingId}`;
      
      return {
        paymentUrl,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      throw new Error(handleAPIError(error, 'Payment Processing'));
    }
  }

  // Get booking status
  async getBookingStatus(bookingId: string): Promise<{
    status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
    details: Record<string, any>;
  }> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        status: 'confirmed',
        details: {
          bookingId,
          confirmationNumber: `KH${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(handleAPIError(error, 'Booking Status Check'));
    }
  }

  // Cancel booking
  async cancelBooking(bookingId: string, reason?: string): Promise<{
    success: boolean;
    refundAmount?: number;
    refundStatus?: string;
  }> {
    try {
      // Simulate cancellation API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        refundAmount: 0, // Would be calculated based on cancellation policy
        refundStatus: 'processing'
      };
    } catch (error) {
      throw new Error(handleAPIError(error, 'Booking Cancellation'));
    }
  }

  // Get user bookings
  async getUserBookings(userId: string): Promise<BookingResponse[]> {
    try {
      // Simulate API call to get user's booking history
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return [
        {
          bookingId: 'bk_001',
          status: 'confirmed',
          confirmationNumber: 'KH123456',
          totalAmount: 2500,
          currency: 'INR',
          details: {
            type: 'hotel',
            name: 'KTDC Hotel',
            checkIn: '2024-01-15',
            checkOut: '2024-01-17',
            guests: 2
          }
        }
      ];
    } catch (error) {
      throw new Error(handleAPIError(error, 'User Bookings Fetch'));
    }
  }

  // Private helper methods
  private async simulateBookingAPI(request: BookingRequest): Promise<BookingResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
      throw new Error('Booking service temporarily unavailable');
    }

    return {
      bookingId: `bk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'confirmed',
      confirmationNumber: `KH${Date.now()}`,
      totalAmount: this.calculateAmount(request),
      currency: 'INR',
      paymentUrl: `https://payment.keralahorizon.com/pay/${Date.now()}`,
      details: {
        ...request,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }
    };
  }

  private calculateAmount(request: BookingRequest): number {
    // Simple amount calculation based on type
    const basePrices = {
      hotel: 2500,
      transport: 150,
      event: 200,
      experience: 800
    };

    const basePrice = basePrices[request.type] || 1000;
    const guests = request.guests || 1;
    const rooms = request.rooms || 1;

    return basePrice * guests * rooms;
  }

  private getTransportType(itemId: string): string {
    if (itemId.includes('bus') || itemId.includes('ksrtc')) return 'bus';
    if (itemId.includes('train') || itemId.includes('railway')) return 'train';
    if (itemId.includes('flight') || itemId.includes('air')) return 'flight';
    if (itemId.includes('cab') || itemId.includes('taxi')) return 'cab';
    return 'bus'; // default
  }
}

export const bookingService = new BookingService();

// Utility functions for easy booking
export const quickBookHotel = async (hotelId: string, checkIn: string, checkOut: string, guests: number) => {
  return bookingService.bookHotel({
    type: 'hotel',
    itemId: hotelId,
    checkIn,
    checkOut,
    guests,
    contactInfo: {
      name: 'Guest User',
      email: 'guest@example.com',
      phone: '+91-9999999999'
    }
  });
};

export const quickBookTransport = async (transportId: string, date: string) => {
  return bookingService.bookTransport({
    type: 'transport',
    itemId: transportId,
    checkIn: date,
    contactInfo: {
      name: 'Guest User',
      email: 'guest@example.com',
      phone: '+91-9999999999'
    }
  });
};

export const quickBookEvent = async (eventId: string, date: string, guests: number = 1) => {
  return bookingService.bookEvent({
    type: 'event',
    itemId: eventId,
    checkIn: date,
    guests,
    contactInfo: {
      name: 'Guest User',
      email: 'guest@example.com',
      phone: '+91-9999999999'
    }
  });
};






















