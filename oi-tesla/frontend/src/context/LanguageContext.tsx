'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { usePathname } from 'next/navigation';

export type Language = 'en' | 'bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isDriverAlwaysBangla: boolean;
}

const translations: Record<string, { en: string; bn: string }> = {
  // Navigation & Branding
  brand_title: { en: 'Oi Tesla', bn: 'ওই টেসলা' },
  brand_subtitle: { en: 'Dhaka Micro-Pool', bn: 'ঢাকা ইলেকট্রিক মাইক্রো-পুল' },
  nav_book: { en: 'Book', bn: 'বুকিং' },
  nav_tracking: { en: 'Tracking', bn: 'ট্র্যাকিং' },
  nav_history: { en: 'History', bn: 'ইতিহাস' },
  nav_profile: { en: 'Profile', bn: 'প্রোফাইল' },
  nav_cockpit: { en: 'Cockpit', bn: 'পাইলট ককপিট' },
  nav_earnings: { en: 'Earnings', bn: 'আয় ও হিসাব' },
  nav_rider_view: { en: 'Rider View', bn: 'যাত্রী ভিউ' },

  // Booking Page
  book_title: { en: 'Share a seat. Split the fare.', bn: 'সিট শেয়ার করুন। ভাড়া ভাগ করুন।' },
  book_subtitle: { en: 'Survive Dhaka traffic with electric trike micro-pooling.', bn: 'ব্যাটারিচালিত টেসলা রিকশায় সহজে বাঁচুন জ্যাম থেকে।' },
  pickup_point: { en: 'Pickup Stand', bn: 'উঠার স্থান (পিকআপ)' },
  destination_point: { en: 'Destination Point', bn: 'নামার স্থান (গন্তব্য)' },
  seats_label: { en: 'Seats Needed', bn: 'সিট সংখ্যা' },
  payment_method: { en: 'Payment Method', bn: 'পেমেন্ট মাধ্যম' },
  cash: { en: 'Cash (নগদ)', bn: 'নগদ টাকা (ক্যাশ)' },
  tesla_pay: { en: 'TeslaPay Wallet', bn: 'টেসলাপেই ওয়ালেট' },
  confirm_booking: { en: 'Confirm & Request Micro-Pool', bn: 'টেসলা রিকশা পুল নিশ্চিত করুন' },
  booking_success: { en: 'Ride requested successfully! Connecting to Pilot Jashim...', bn: 'রিকশা রিকোয়েস্ট সফল! পাইলট জসিমের সাথে যুক্ত হচ্ছে...' },

  // Fare Details
  fare_breakdown: { en: 'Hand-Verifiable Fare Breakdown', bn: 'স্বচ্ছ ভাড়া হিসাব (পয়সায়)' },
  base_fare: { en: 'Base Fare', bn: 'মূল ভাড়া (বেস ফেয়ার)' },
  distance_charge: { en: 'Distance Charge', bn: 'দূরত্ব চার্জ' },
  pool_discount: { en: 'Micro-Pool Discount (30%)', bn: 'শেয়ারিং ছাড় (৩০% ডিসকাউন্ট)' },
  total_fare: { en: 'Total Fare', bn: 'মোট প্রদেয় ভাড়া' },
  poysha_currency: { en: 'poysha', bn: 'পয়সা' },

  // Tracking Page
  searching_pool: { en: 'Searching for Pool Pod...', bn: 'কাছের টেসলা রিকশা খোঁজা হচ্ছে...' },
  waiting_pilot: { en: 'Waiting for Pilot', bn: 'পাইলটের অপেক্ষায়' },
  matched_heading: { en: 'Matched & On the Way', bn: 'রিকশা ম্যাচ হয়েছে এবং আসছে' },
  driver_arrived: { en: 'Bullet Arrived at Stand!', bn: 'বুলেট রিকশা স্ট্যান্ডে পৌঁছেছে!' },
  trip_started: { en: 'Trip In Progress', bn: 'যাত্রা চলছে' },
  trip_completed: { en: 'Trip Completed', bn: 'যাত্রা সফলভাবে সম্পন্ন হয়েছে' },
  call_pilot: { en: 'Call Pilot', bn: 'চালককে কল' },
  message_pilot: { en: 'Message', bn: 'মেসেজ দিন' },
  cancel_ride: { en: 'Cancel', bn: 'বাতিল' },
  pool_visualization: { en: 'Pool Pod Visualization', bn: '৩-সিট রিকশা কেবিন লেআউট' },
  seat_occupancy: { en: 'Bullet (3 Seats Max)', bn: 'বুলেট (সর্বোচ্চ ৩ সিট)' },

  // Driver Cockpit (Always Bangla for drivers)
  pilot_cockpit: { en: 'Pilot Cockpit', bn: 'পাইলট জসিম উদ্দিনের ককপিট' },
  vehicle_status: { en: 'Vehicle Status', bn: 'রিকশার অবস্থা' },
  battery: { en: 'Battery Level', bn: 'ব্যাটারি চার্জ' },
  accept_pool: { en: 'Accept into Pool', bn: 'পুলে সিট বরাদ্দ দিন' },
  mark_arrived: { en: 'Mark Arrived at Pickup', bn: 'স্ট্যান্ডে পৌঁছানোর ঘোষণা' },
  start_trip: { en: 'Start Trip', bn: 'ট্রিপ শুরু করুন' },
  complete_trip: { en: 'Complete Trip', bn: 'ট্রিপ সমাপ্ত ও ভাড়া গ্রহণ' },
  occupied_seats: { en: 'Occupied Seats', bn: 'পূর্ণ সিট' },
  available_seats: { en: 'Available Seats', bn: 'খালি সিট' },

  // Profile Page
  profile_title: { en: 'My Account', bn: 'আমার প্রোফাইল' },
  edit_profile: { en: 'Edit Info', bn: 'তথ্য পরিবর্তন' },
  full_name: { en: 'Full Name', bn: 'পুরো নাম' },
  mobile_number: { en: 'Mobile Number', bn: 'মোবাইল নম্বর' },
  save_changes: { en: 'Save Changes', bn: 'সংরক্ষণ করুন' },
  my_history: { en: 'Personal Trip History', bn: 'আমার পূর্ববর্তী ট্রিপসমূহ' },
  sign_out: { en: 'Sign Out / Switch', bn: 'লগআউট / অ্যাকাউন্ট পরিবর্তন' },
  rating: { en: 'Rating', bn: 'রেটিং' },
  pools_taken: { en: 'Pools Taken', bn: 'মোট পুল ট্রিপ' },
  wallet_balance: { en: 'TeslaPay Digital Wallet', bn: 'টেসলাপেই ডিজিটাল ওয়ালেট' },
  top_up: { en: '+ Top Up', bn: '+ রিচার্জ' },

  // Auth & General
  login_welcome: { en: 'Welcome to', bn: 'স্বাগতম' },
  login_subtitle: { en: 'Share a seat. Split the fare. Enter your mobile number to ride or drive.', bn: 'সিট শেয়ার করুন। ভাড়া ভাগ করুন। আপনার মোবাইল নম্বর দিয়ে প্রবেশ করুন।' },
  phone_number: { en: 'Mobile Phone Number', bn: 'মোবাইল ফোন নম্বর' },
  continue_phone: { en: 'Continue with Phone', bn: 'মোবাইল দিয়ে এগিয়ে যান' },
  demo_cast: { en: 'Or One-Tap Demo Cast', bn: 'অথবা এক ক্লিকে ডেমো প্রোফাইল' },
  create_account: { en: 'Create an account', bn: 'নতুন অ্যাকাউন্ট তৈরি করুন' },
  no_account: { en: "Don't have an account yet?", bn: 'এখনও অ্যাকাউন্ট নেই?' },
  already_account: { en: 'Already have an account?', bn: 'আগে থেকেই অ্যাকাউন্ট আছে?' },
  join_title: { en: 'Join Oi Tesla', bn: 'ওই টেসলায় যোগ দিন' },
  join_subtitle: { en: 'Start pooling rides or drive a 3-seater EV along Banani, Gulshan, and Mohakhali.', bn: 'বনানী, গুলশান ও মহাখালীর মাঝে ব্যাটারি রিকশা পুলে যোগ দিন।' },
  role_passenger: { en: 'Passenger', bn: 'যাত্রী' },
  role_driver: { en: 'Tesla Pilot', bn: 'টেসলা চালক (পাইলট)' },
  register_submit: { en: 'Complete Sign Up', bn: 'অ্যাকাউন্ট তৈরি করুন' },
  welcome_bonus: { en: 'Welcome Bonus', bn: 'স্বাগতম বোনাস' },
  welcome_credit: { en: '৳100 TeslaPay Credit', bn: '৳১০০ টেসলাপেই ব্যালেন্স' },

  // Tracking Extra
  pickup_stand: { en: 'Pickup Stand', bn: 'পিকআপ পয়েন্ট' },
  heading_to: { en: 'Heading to', bn: 'গন্তব্য' },
  no_active_ride: { en: 'No Active Ride', bn: 'কোনো চলমান রাইড নেই' },
  no_active_ride_desc: { en: "You don't have an active ride request right now. Request a seat with Bullet to get started!", bn: 'আপনার কোনো চলমান রাইড রিকোয়েস্ট নেই। বুলেটে সিট বুক করতে এখনই শুরু করুন!' },
  book_ride_now: { en: 'Book a Ride Now', bn: 'এখনই রাইড বুক করুন' },
  connecting_telemetry: { en: 'Connecting to Tesla Telemetry...', bn: 'টেসলা সংযোগ স্থাপন করা হচ্ছে...' },
  your_share: { en: 'Your Share (Pooled 30% Off):', bn: 'আপনার প্রদেয় ভাড়া (৩০% ছাড় সহ):' },
  payment: { en: 'Payment', bn: 'পেমেন্ট' },
  cockpit_header: { en: 'Cockpit: Pilot Jashim', bn: 'ককপিট: পাইলট জসিম' },
  you: { en: 'You', bn: 'আপনি' },
  seat: { en: 'Seat', bn: 'সিট' },
  boarded: { en: 'Boarded', bn: 'উঠেছেন' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  const pathname = usePathname();

  const [savedLanguage, setSavedLanguage] = useState<Language>('en');

  useEffect(() => {
    const local = localStorage.getItem('oi_tesla_lang') as Language;
    if (local === 'en' || local === 'bn') {
      setSavedLanguage(local);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setSavedLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('oi_tesla_lang', lang);
    }
  };

  // RULE FROM USER: "and for the rickshaw rider it should always be bangla"
  // If the user's role is driver OR user is navigating driver cockpit pages, language is STRICTLY Bangla ('bn')!
  const isDriver = role === 'driver' || pathname?.startsWith('/driver');
  const activeLanguage: Language = isDriver ? 'bn' : savedLanguage;

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[activeLanguage] || entry['en'] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language: activeLanguage,
        setLanguage: handleSetLanguage,
        t,
        isDriverAlwaysBangla: isDriver,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
