export interface Airport {
  IATA: string | null;
  ICAO: string | null;
  Airport_name: string | null;
  Location_served: string | null;
  Time: string | null;
  DST: string | null;
}

export interface FlightSegment {
  id: string;
  departure: {
    iataCode: string;
    at: string;
    terminal?: string;
  };
  arrival: {
    iataCode: string;
    at: string;
    terminal?: string;
  };
  carrierCode: string;
  number: string;
  aircraft?: {
    code: string;
  };
  operating?: {
    carrierCode?: string;
    carrierName?: string;
  };
  duration: string;
  numberOfStops: number;
  blacklistedInEU: boolean;
}

export interface Itinerary {
  duration: string;
  segments: FlightSegment[];
}

export interface PriceBreakdown {
  currency: string;
  total: string;
  base: string;
  grandTotal?: string;
  fees?: Array<{
    amount: string;
    type: string;
  }>;
}

export interface TravelerPricingDetail {
  segmentId: string;
  cabin: string;
  fareBasis: string;
  brandedFare?: string;
  brandedFareLabel?: string;
  class?: string;
  includedCheckedBags?: {
    quantity?: number;
    weight?: number;
    weightUnit?: string;
  };
  includedCabinBags?: {
    quantity?: number;
  };
  amenities?: Array<{
    description: string;
    isChargeable: boolean;
    amenityType: string;
    amenityProvider?: {
      name: string;
    };
  }>;
}

export interface TravelerPricing {
  travelerId: string;
  fareOption?: string;
  travelerType: string;
  price: {
    currency: string;
    total: string;
    base: string;
  };
  fareDetailsBySegment: TravelerPricingDetail[];
}

export interface FlightOffer {
  type: string;
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  isUpsellOffer?: boolean;
  upsellFlightOfferIds?: string[];
  lastTicketingDate?: string;
  lastTicketingDateTime?: string;
  numberOfBookableSeats: number;
  itineraries: Itinerary[];
  price: PriceBreakdown;
  pricingOptions?: {
    fareType?: string[];
    includedCheckedBagsOnly?: boolean;
  };
  validatingAirlineCodes?: string[];
  travelerPricings: TravelerPricing[];
  fareRules?: {
    rules: Array<{
      category: string;
      maxPenaltyAmount?: string;
      notApplicable?: boolean;
    }>;
  };
}

export interface FlightPriceCheckPayload {
  flight: FlightOffer;
}

export interface FlightPriceCheckResponse {
  data: {
    type: string; // "flight-offers-pricing"
    flightOffers: FlightOffer[];
    bookingRequirements: BookingRequirements;
  };
  dictionaries?: FlightDictionaries;
  "detailed-fare-rules"?: DetailedFareRules;
}

export interface DetailedFareRules {
  [key: string]: FareRule; // keys like "1", "2", "3", ...
}

export interface FareRule {
  fareBasis: string;
  name: string;
  fareNotes: FareNotes;
  segmentId: string;
}

export interface FareNotes {
  descriptions: FareDescription[];
}

export interface FareDescription {
  descriptionType: string; // e.g., "GENERAL INFORMATION", "PENALTIES"
  text: string;
}
export interface BookingRequirements {
  emailAddressRequired: boolean;
  mobilePhoneNumberRequired: boolean;
}

export interface FlightDictionaries {
  locations?: Record<string, { cityCode: string; countryCode: string }>;
  aircraft?: Record<string, string>;
  currencies?: Record<string, string>;
  carriers?: Record<string, string>;
}

export interface FlightRightsResponse {
  flightRights: FlightOffer[];
  flightRightsDictionaries: FlightDictionaries;
  fetchedAt?: string;
}

export interface PassengerCounts {
  adults: number;
  children: number;
  infants: number;
  travelClass?: string;
}

export interface FlightSearchSegment {
  id: number;
  originLocationCode: string;
  destinationLocationCode: string;
  departureDateTimeRange?: string;
  departureDate?: string;
  tripClass?: string;
  from?: string;
  to?: string;
}

export interface FlightSearchPayload {
  flexible?: boolean;
  passenger: PassengerCounts;
  flightSearch: FlightSearchSegment[];
  currencyCode?: string;
}
