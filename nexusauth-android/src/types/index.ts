export interface Profile {
  id: string;
  full_name: string;
  email: string;
  date_of_birth: string | null;
  country_code: string | null;
  phone_number: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: Date;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  countryCode: string;
  phoneNumber: string;
}

export type AuthScreen = 'login' | 'register' | 'forgot-password' | 'create-new-password' | 'profile';
