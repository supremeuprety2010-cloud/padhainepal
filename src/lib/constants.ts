export const GRADES = [8, 9, 10, 11, 12];

export const STREAMS = ['Science', 'Management', 'Humanities'];

export const SUBJECTS_BY_GRADE: Record<number, string[]> = {
  8: ['Mathematics', 'Science', 'English', 'Nepali', 'Social Studies', 'Health & Physical Education', 'Computer Science'],
  9: ['Mathematics', 'Science', 'English', 'Nepali', 'Social Studies', 'Health & Physical Education', 'Computer Science'],
  10: ['Mathematics', 'Science', 'English', 'Nepali', 'Social Studies', 'Health & Physical Education', 'Computer Science'],
  11: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'Nepali', 'Accountancy', 'Economics', 'Business Studies', 'Sociology', 'History'],
  12: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'Nepali', 'Accountancy', 'Economics', 'Business Studies', 'Sociology', 'History'],
};

export const SUBJECTS_BY_STREAM: Record<string, string[]> = {
  Science: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'Nepali'],
  Management: ['Mathematics', 'Accountancy', 'Economics', 'Business Studies', 'English', 'Nepali'],
  Humanities: ['Sociology', 'History', 'Economics', 'English', 'Nepali', 'Mathematics'],
};

export const PROVINCES = [
  'Koshi Province', 'Madhesh Province', 'Bagmati Province',
  'Gandaki Province', 'Lumbini Province', 'Karnali Province', 'Sudurpashchim Province'
];

export const DISTRICTS_BY_PROVINCE: Record<string, string[]> = {
  'Koshi Province': ['Taplejung', 'Panchthar', 'Ilam', 'Jhapa', 'Morang', 'Sunsari', 'Dhankuta', 'Terhathum', 'Sankhuwasabha', 'Bhojpur', 'Solukhumbu', 'Okhaldhunga', 'Khotang', 'Udayapur'],
  'Madhesh Province': ['Saptari', 'Siraha', 'Dhanusha', 'Mahottari', 'Sarlahi', 'Rautahat', 'Bara', 'Parsa'],
  'Bagmati Province': ['Sindhuli', 'Ramechhap', 'Dolakha', 'Sindhupalchok', 'Kavrepalanchok', 'Lalitpur', 'Bhaktapur', 'Kathmandu', 'Nuwakot', 'Rasuwa', 'Dhading', 'Makwanpur', 'Chitwan'],
  'Gandaki Province': ['Gorkha', 'Manang', 'Mustang', 'Myagdi', 'Kaski', 'Lamjung', 'Tanahu', 'Nawalpur', 'Syangja', 'Parbat', 'Baglung'],
  'Lumbini Province': ['Rukum East', 'Rolpa', 'Pyuthan', 'Gulmi', 'Arghakhanchi', 'Palpa', 'Nawalparasi', 'Rupandehi', 'Kapilvastu', 'Dang', 'Banke', 'Bardiya'],
  'Karnali Province': ['Dolpa', 'Mugu', 'Humla', 'Jumla', 'Kalikot', 'Dailekh', 'Jajarkot', 'Rukum West', 'Salyan', 'Surkhet'],
  'Sudurpashchim Province': ['Bajura', 'Bajhang', 'Achham', 'Doti', 'Kailali', 'Kanchanpur', 'Dadeldhura', 'Baitadi', 'Darchula'],
};

export const SUBSCRIPTION_PRICES: Record<number, number> = {
  8: 999,
  9: 999,
  10: 1299,
  11: 1499,
  12: 1499,
};

export const TRIAL_DAYS = 3;
