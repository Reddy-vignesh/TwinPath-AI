// Decision Twin AI — Unified Taxonomy & Autocomplete Data Source

export interface UniversityOption {
  name: string;
  shortName?: string;
  location: string;
  tier?: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Global';
}

export const CAREER_STAGES = [
  'Final-Year Student',
  'Fresh Graduate',
  'Working Professional',
] as const;

export const DEGREE_LEVELS = [
  'Undergraduate',
  'Postgraduate',
] as const;

export const DEGREE_PROGRAMS_BY_LEVEL: Record<string, string[]> = {
  'Undergraduate': [
    'B.Tech',
    'B.E.',
    'BCA',
    'B.Sc',
    'BBA',
    'B.Com',
    'BA',
    'MBBS',
    'BDS',
    'B.Pharm',
    'B.Arch',
    'BHM',
    'BPT',
    'LLB',
    'Other Undergraduate Degree'
  ],
  'Postgraduate': [
    'M.Tech',
    'M.E.',
    'MBA',
    'MCA',
    'M.Sc',
    'M.Com',
    'MA',
    'M.Pharm',
    'MD',
    'MS',
    'MDS',
    'LLM',
    'Other Postgraduate Degree'
  ]
};

export const BRANCHES_BY_DEGREE: Record<string, string[]> = {
  'B.Tech': [
    'Computer Science & Engineering',
    'Artificial Intelligence & Machine Learning',
    'Data Science & Big Data Analytics',
    'Information Technology',
    'Electronics & Communication Engineering',
    'Electrical & Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Biotechnology & Bioinformatics',
    'Robotics & Automation',
    'Cybersecurity & Digital Forensics',
    'Aerospace Engineering',
    'Automobile Engineering',
    'Industrial & Production Engineering',
    'Metallurgical & Materials Engineering',
    'Instrumentation & Control Engineering',
    'Other Engineering Specialization'
  ],
  'B.E.': [
    'Computer Science & Engineering',
    'Information Science & Engineering',
    'Artificial Intelligence & Data Science',
    'Electronics & Telecommunication Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Mechatronics Engineering',
    'Biomedical Engineering',
    'Other Engineering Branch'
  ],
  'BCA': [
    'Computer Applications',
    'Cloud Computing & DevOps',
    'Data Analytics & Web Technologies',
    'Cybersecurity & Network Security',
    'Mobile Application Development',
    'Full Stack Software Development',
    'Other Computer Applications Track'
  ],
  'B.Sc': [
    'Computer Science',
    'Data Science & Statistics',
    'Mathematics & Computing',
    'Applied Physics & Electronics',
    'Biotechnology & Genetics',
    'Chemistry & Biochemistry',
    'Information Technology',
    'Artificial Intelligence',
    'Other Science Stream'
  ],
  'BBA': [
    'Business Analytics & Intelligence',
    'Digital Marketing & Growth Strategy',
    'Finance & Fintech',
    'Human Resource Management',
    'Operations & Supply Chain',
    'Entrepreneurship & Innovation',
    'International Business',
    'Other Management Track'
  ],
  'B.Com': [
    'Accounting & Finance',
    'Banking & Financial Services',
    'Taxation & Corporate Law',
    'Financial Technology & Analytics',
    'General Commerce',
    'Other Commerce Track'
  ],
  'BA': [
    'Economics & Econometrics',
    'Psychology & Behavioral Science',
    'English Language & Literature',
    'Journalism & Mass Communication',
    'Public Policy & Governance',
    'Political Science',
    'Sociology',
    'Other Humanities Track'
  ],
  'MBBS': [
    'General Medicine & Surgery',
    'Clinical Medicine',
    'Pre-Clinical Sciences',
    'Other Medical Branch'
  ],
  'BDS': [
    'Dental Surgery & Dentistry',
    'Oral & Maxillofacial Pathology',
    'Orthodontics',
    'Periodontics'
  ],
  'B.Pharm': [
    'Pharmaceutical Sciences',
    'Pharmacology & Toxicology',
    'Clinical Pharmacy',
    'Pharmaceutics'
  ],
  'B.Arch': [
    'Architectural Design & Planning',
    'Urban Planning & Sustainable Cities',
    'Landscape Architecture',
    'Interior Design'
  ],
  'LLB': [
    'Corporate & Commercial Law',
    'Cyber Law & Data Privacy',
    'Intellectual Property Law',
    'Criminal & Constitutional Law',
    'Civil & Family Law',
    'International Trade Law'
  ],
  'M.Tech': [
    'Computer Science & Engineering',
    'Artificial Intelligence & Machine Learning',
    'Data Science & Engineering',
    'VLSI Design & Embedded Systems',
    'Software Engineering & Cloud Architecture',
    'Cybersecurity & Information Assurance',
    'Thermal & Aerospace Engineering',
    'Structural & Earthquake Engineering',
    'Robotics & Autonomous Systems',
    'Digital Signal Processing & Communication',
    'Power Systems & Renewable Energy',
    'Other M.Tech Specialization'
  ],
  'M.E.': [
    'Computer Science & Engineering',
    'Applied Electronics & Communication',
    'CAD / CAM & Manufacturing Engineering',
    'Power Electronics & Drives',
    'Structural Engineering',
    'Other M.E. Branch'
  ],
  'MBA': [
    'Technology & Product Management',
    'Business Analytics & Data Science',
    'Finance & Investment Banking',
    'Marketing & Brand Strategy',
    'Operations & Supply Chain Management',
    'Strategic Management & Consulting',
    'Human Resource Management',
    'Health Care & Hospital Management',
    'FinTech & Quantitative Finance',
    'Other MBA Specialization'
  ],
  'MCA': [
    'Computer Applications & Systems Software',
    'Cloud Computing & Distributed Systems',
    'Artificial Intelligence & Deep Learning',
    'Full Stack Web & Mobile Engineering',
    'Cybersecurity & Network Defense',
    'Data Science & Analytics',
    'Other MCA Track'
  ],
  'M.Sc': [
    'Computer Science',
    'Data Science & Machine Learning',
    'Mathematics & Computational Science',
    'Applied Statistics & Predictive Modeling',
    'Physics & Quantum Computing',
    'Biotechnology & Computational Biology',
    'Electronics & Embedded Systems',
    'Other M.Sc Specialization'
  ],
  'M.Com': [
    'Advanced Accounting & Financial Analysis',
    'Corporate Finance & Investment Analysis',
    'Banking, Financial Services & Insurance (BFSI)',
    'International Business & Trade',
    'Other M.Com Track'
  ],
  'MA': [
    'Applied Economics & Quantitative Analysis',
    'Organizational Psychology',
    'Public Policy & Sustainable Development',
    'Mass Media & Digital Communication',
    'English & Comparative Literature',
    'Other MA Stream'
  ],
  'M.Pharm': [
    'Pharmaceutics & Drug Delivery',
    'Pharmacology & Experimental Therapeutics',
    'Pharmaceutical Chemistry',
    'Regulatory Affairs & Quality Assurance'
  ],
  'MD': [
    'General Medicine',
    'Pediatrics',
    'Cardiology & Interventional Medicine',
    'Neurology',
    'Dermatology & Venereology',
    'Anesthesiology & Critical Care',
    'Radiology & Radiodiagnosis',
    'Psychiatry'
  ],
  'MS': [
    'General Surgery',
    'Orthopedics & Traumatology',
    'Ophthalmology',
    'Otorhinolaryngology (ENT)',
    'Obstetrics & Gynecology'
  ],
  'MDS': [
    'Orthodontics & Dentofacial Orthopedics',
    'Conservative Dentistry & Endodontics',
    'Oral & Maxillofacial Surgery',
    'Periodontology'
  ],
  'LLM': [
    'Corporate & Securities Law',
    'Cyber Law, AI & Technology Governance',
    'Intellectual Property Rights & Innovation',
    'International Commercial Arbitration',
    'Constitutional & Human Rights Law'
  ]
};

// Autocomplete Universities Catalog (500+ Indian & Global Universities)
export const UNIVERSITIES_DATABASE: UniversityOption[] = [
  // JNTU System
  { name: 'JNTUH - Jawaharlal Nehru Technological University Hyderabad', shortName: 'JNTUH', location: 'Hyderabad, Telangana, India', tier: 'Tier 1' },
  { name: 'JNTUK - Jawaharlal Nehru Technological University Kakinada', shortName: 'JNTUK', location: 'Kakinada, Andhra Pradesh, India', tier: 'Tier 1' },
  { name: 'JNTUA - Jawaharlal Nehru Technological University Anantapur', shortName: 'JNTUA', location: 'Ananthapuramu, Andhra Pradesh, India', tier: 'Tier 1' },
  { name: 'JNTU College of Engineering Hyderabad (JNTUH CEH)', shortName: 'JNTUH CEH', location: 'Hyderabad, Telangana, India', tier: 'Tier 1' },
  { name: 'JNTU College of Engineering Kakinada', shortName: 'JNTUK CEK', location: 'Kakinada, Andhra Pradesh, India', tier: 'Tier 1' },
  { name: 'JNTU College of Engineering Anantapur', shortName: 'JNTUA CEA', location: 'Anantapur, Andhra Pradesh, India', tier: 'Tier 1' },
  { name: 'JNTU College of Engineering Pulivendula', shortName: 'JNTUA CEP', location: 'Pulivendula, Andhra Pradesh, India', tier: 'Tier 2' },
  { name: 'JNTU College of Engineering Vizianagaram', shortName: 'JNTUK CEV', location: 'Vizianagaram, Andhra Pradesh, India', tier: 'Tier 2' },
  { name: 'JNTU College of Engineering Jagtial', shortName: 'JNTUH CEJ', location: 'Jagtial, Telangana, India', tier: 'Tier 2' },
  { name: 'JNTU College of Engineering Manthani', shortName: 'JNTUH CEM', location: 'Manthani, Telangana, India', tier: 'Tier 2' },
  { name: 'JNTU College of Engineering Sultanpur', shortName: 'JNTUH CES', location: 'Sultanpur, Telangana, India', tier: 'Tier 2' },
  { name: 'JNTU College of Engineering Rajanna Sircilla', shortName: 'JNTUH CERS', location: 'Sircilla, Telangana, India', tier: 'Tier 2' },

  // Indian Institutes of Technology (IITs)
  { name: 'IIT Bombay - Indian Institute of Technology Bombay', shortName: 'IITB', location: 'Mumbai, Maharashtra, India', tier: 'Tier 1' },
  { name: 'IIT Delhi - Indian Institute of Technology Delhi', shortName: 'IITD', location: 'New Delhi, Delhi, India', tier: 'Tier 1' },
  { name: 'IIT Madras - Indian Institute of Technology Madras', shortName: 'IITM', location: 'Chennai, Tamil Nadu, India', tier: 'Tier 1' },
  { name: 'IIT Kharagpur - Indian Institute of Technology Kharagpur', shortName: 'IITKGP', location: 'Kharagpur, West Bengal, India', tier: 'Tier 1' },
  { name: 'IIT Kanpur - Indian Institute of Technology Kanpur', shortName: 'IITK', location: 'Kanpur, Uttar Pradesh, India', tier: 'Tier 1' },
  { name: 'IIT Roorkee - Indian Institute of Technology Roorkee', shortName: 'IITR', location: 'Roorkee, Uttarakhand, India', tier: 'Tier 1' },
  { name: 'IIT Guwahati - Indian Institute of Technology Guwahati', shortName: 'IITG', location: 'Guwahati, Assam, India', tier: 'Tier 1' },
  { name: 'IIT Hyderabad - Indian Institute of Technology Hyderabad', shortName: 'IITH', location: 'Sangareddy, Telangana, India', tier: 'Tier 1' },
  { name: 'IIT BHU - Indian Institute of Technology (BHU) Varanasi', shortName: 'IIT BHU', location: 'Varanasi, Uttar Pradesh, India', tier: 'Tier 1' },
  { name: 'IIT Indore - Indian Institute of Technology Indore', shortName: 'IITI', location: 'Indore, Madhya Pradesh, India', tier: 'Tier 1' },
  { name: 'IIT Gandhinagar - Indian Institute of Technology Gandhinagar', shortName: 'IITGN', location: 'Gandhinagar, Gujarat, India', tier: 'Tier 1' },
  { name: 'IIT Ropar - Indian Institute of Technology Ropar', shortName: 'IIT Ropar', location: 'Rupnagar, Punjab, India', tier: 'Tier 1' },
  { name: 'IIT Patna - Indian Institute of Technology Patna', shortName: 'IITP', location: 'Patna, Bihar, India', tier: 'Tier 1' },
  { name: 'IIT Bhubaneswar - Indian Institute of Technology Bhubaneswar', shortName: 'IITBBS', location: 'Bhubaneswar, Odisha, India', tier: 'Tier 1' },
  { name: 'IIT Jodhpur - Indian Institute of Technology Jodhpur', shortName: 'IITJ', location: 'Jodhpur, Rajasthan, India', tier: 'Tier 1' },
  { name: 'IIT Mandi - Indian Institute of Technology Mandi', shortName: 'IIT Mandi', location: 'Mandi, Himachal Pradesh, India', tier: 'Tier 1' },
  { name: 'IIT Tirupati - Indian Institute of Technology Tirupati', shortName: 'IITTP', location: 'Tirupati, Andhra Pradesh, India', tier: 'Tier 1' },
  { name: 'IIT Palakkad - Indian Institute of Technology Palakkad', shortName: 'IITPKD', location: 'Palakkad, Kerala, India', tier: 'Tier 1' },
  { name: 'IIT Goa - Indian Institute of Technology Goa', shortName: 'IIT Goa', location: 'Ponda, Goa, India', tier: 'Tier 1' },
  { name: 'IIT Dharwad - Indian Institute of Technology Dharwad', shortName: 'IIT Dharwad', location: 'Dharwad, Karnataka, India', tier: 'Tier 1' },
  { name: 'IIT Bhilai - Indian Institute of Technology Bhilai', shortName: 'IIT Bhilai', location: 'Durg, Chhattisgarh, India', tier: 'Tier 1' },
  { name: 'IIT Jammu - Indian Institute of Technology Jammu', shortName: 'IIT Jammu', location: 'Jammu, Jammu and Kashmir, India', tier: 'Tier 1' },
  { name: 'IIT (ISM) Dhanbad - Indian Institute of Technology (ISM) Dhanbad', shortName: 'IIT ISM', location: 'Dhanbad, Jharkhand, India', tier: 'Tier 1' },

  // BITS Pilani
  { name: 'BITS Pilani - Birla Institute of Technology and Science, Pilani Campus', shortName: 'BITS Pilani', location: 'Pilani, Rajasthan, India', tier: 'Tier 1' },
  { name: 'BITS Pilani, Hyderabad Campus', shortName: 'BITS Hyderabad', location: 'Hyderabad, Telangana, India', tier: 'Tier 1' },
  { name: 'BITS Pilani, K. K. Birla Goa Campus', shortName: 'BITS Goa', location: 'Vasco da Gama, Goa, India', tier: 'Tier 1' },
  { name: 'BITS Pilani, Dubai Campus', shortName: 'BITS Dubai', location: 'Dubai, UAE', tier: 'Tier 1' },

  // National Institutes of Technology (NITs)
  { name: 'NIT Trichy - National Institute of Technology Tiruchirappalli', shortName: 'NITT', location: 'Tiruchirappalli, Tamil Nadu, India', tier: 'Tier 1' },
  { name: 'NIT Surathkal - National Institute of Technology Karnataka', shortName: 'NITK', location: 'Surathkal, Karnataka, India', tier: 'Tier 1' },
  { name: 'NIT Warangal - National Institute of Technology Warangal', shortName: 'NITW', location: 'Warangal, Telangana, India', tier: 'Tier 1' },
  { name: 'NIT Rourkela - National Institute of Technology Rourkela', shortName: 'NITRKL', location: 'Rourkela, Odisha, India', tier: 'Tier 1' },
  { name: 'NIT Calicut - National Institute of Technology Calicut', shortName: 'NITC', location: 'Kozhikode, Kerala, India', tier: 'Tier 1' },
  { name: 'VNIT Nagpur - Visvesvaraya National Institute of Technology', shortName: 'VNIT', location: 'Nagpur, Maharashtra, India', tier: 'Tier 1' },
  { name: 'MNIT Jaipur - Malaviya National Institute of Technology', shortName: 'MNIT', location: 'Jaipur, Rajasthan, India', tier: 'Tier 1' },
  { name: 'MNNIT Allahabad - Motilal Nehru National Institute of Technology', shortName: 'MNNIT', location: 'Prayagraj, Uttar Pradesh, India', tier: 'Tier 1' },
  { name: 'NIT Kurukshetra - National Institute of Technology Kurukshetra', shortName: 'NITKKR', location: 'Kurukshetra, Haryana, India', tier: 'Tier 1' },
  { name: 'NIT Durgapur - National Institute of Technology Durgapur', shortName: 'NITDGP', location: 'Durgapur, West Bengal, India', tier: 'Tier 1' },
  { name: 'NIT Silchar - National Institute of Technology Silchar', shortName: 'NITS', location: 'Silchar, Assam, India', tier: 'Tier 1' },
  { name: 'SVNIT Surat - Sardar Vallabhbhai National Institute of Technology', shortName: 'SVNIT', location: 'Surat, Gujarat, India', tier: 'Tier 1' },
  { name: 'NIT Jamshedpur - National Institute of Technology Jamshedpur', shortName: 'NITJSR', location: 'Jamshedpur, Jharkhand, India', tier: 'Tier 1' },
  { name: 'NIT Patna - National Institute of Technology Patna', shortName: 'NITP', location: 'Patna, Bihar, India', tier: 'Tier 1' },
  { name: 'NIT Raipur - National Institute of Technology Raipur', shortName: 'NITRR', location: 'Raipur, Chhattisgarh, India', tier: 'Tier 1' },
  { name: 'NIT Andhra Pradesh - National Institute of Technology Andhra Pradesh', shortName: 'NIT AP', location: 'Tadepalligudem, Andhra Pradesh, India', tier: 'Tier 1' },

  // IIITs
  { name: 'IIIT Hyderabad - International Institute of Information Technology, Hyderabad', shortName: 'IIITH', location: 'Hyderabad, Telangana, India', tier: 'Tier 1' },
  { name: 'IIIT Bangalore - International Institute of Information Technology, Bangalore', shortName: 'IIITB', location: 'Bengaluru, Karnataka, India', tier: 'Tier 1' },
  { name: 'IIIT Delhi - Indraprastha Institute of Information Technology Delhi', shortName: 'IIITD', location: 'New Delhi, Delhi, India', tier: 'Tier 1' },
  { name: 'IIIT Allahabad - Indian Institute of Information Technology Allahabad', shortName: 'IIITA', location: 'Prayagraj, Uttar Pradesh, India', tier: 'Tier 1' },
  { name: 'IIIT Sri City - Indian Institute of Information Technology Sri City', shortName: 'IIITS', location: 'Chittoor, Andhra Pradesh, India', tier: 'Tier 1' },
  { name: 'IIIT Lucknow - Indian Institute of Information Technology Lucknow', shortName: 'IIITL', location: 'Lucknow, Uttar Pradesh, India', tier: 'Tier 1' },
  { name: 'IIIT Gwalior - ABV-Indian Institute of Information Technology and Management', shortName: 'IIITM', location: 'Gwalior, Madhya Pradesh, India', tier: 'Tier 1' },

  // Premier State & Central Universities in India
  { name: 'Osmania University', shortName: 'OU', location: 'Hyderabad, Telangana, India', tier: 'Tier 1' },
  { name: 'University of Hyderabad (HCU)', shortName: 'UoH / HCU', location: 'Hyderabad, Telangana, India', tier: 'Tier 1' },
  { name: 'Andhra University', shortName: 'AU', location: 'Visakhapatnam, Andhra Pradesh, India', tier: 'Tier 1' },
  { name: 'Sri Venkateswara University (SVU)', shortName: 'SVU', location: 'Tirupati, Andhra Pradesh, India', tier: 'Tier 1' },
  { name: 'Anna University, Chennai', shortName: 'Anna Univ', location: 'Chennai, Tamil Nadu, India', tier: 'Tier 1' },
  { name: 'Delhi University (University of Delhi)', shortName: 'DU', location: 'New Delhi, Delhi, India', tier: 'Tier 1' },
  { name: 'University of Mumbai', shortName: 'MU', location: 'Mumbai, Maharashtra, India', tier: 'Tier 1' },
  { name: 'Savitribai Phule Pune University', shortName: 'SPPU / Pune Univ', location: 'Pune, Maharashtra, India', tier: 'Tier 1' },
  { name: 'Visvesvaraya Technological University (VTU)', shortName: 'VTU', location: 'Belagavi, Karnataka, India', tier: 'Tier 1' },
  { name: 'Jadavpur University', shortName: 'JU', location: 'Kolkata, West Bengal, India', tier: 'Tier 1' },
  { name: 'Banaras Hindu University (BHU)', shortName: 'BHU', location: 'Varanasi, Uttar Pradesh, India', tier: 'Tier 1' },
  { name: 'Aligarh Muslim University (AMU)', shortName: 'AMU', location: 'Aligarh, Uttar Pradesh, India', tier: 'Tier 1' },
  { name: 'Jamia Millia Islamia', shortName: 'JMI', location: 'New Delhi, Delhi, India', tier: 'Tier 1' },

  // Top Telangana & AP Autonomous Colleges
  { name: 'Chaitanya Bharathi Institute of Technology (CBIT)', shortName: 'CBIT', location: 'Hyderabad, Telangana, India', tier: 'Tier 1' },
  { name: 'Vasavi College of Engineering (VCE)', shortName: 'Vasavi', location: 'Hyderabad, Telangana, India', tier: 'Tier 1' },
  { name: 'VNR Vignana Jyothi Institute of Engineering and Technology (VNR VJIET)', shortName: 'VNR VJIET', location: 'Hyderabad, Telangana, India', tier: 'Tier 1' },
  { name: 'Gokaraju Rangaraju Institute of Engineering and Technology (GRIET)', shortName: 'GRIET', location: 'Hyderabad, Telangana, India', tier: 'Tier 1' },
  { name: 'Sreenidhi Institute of Science and Technology (SNIST)', shortName: 'SNIST', location: 'Hyderabad, Telangana, India', tier: 'Tier 1' },
  { name: 'Keshav Memorial Institute of Technology (KMIT)', shortName: 'KMIT', location: 'Hyderabad, Telangana, India', tier: 'Tier 1' },
  { name: 'CVR College of Engineering', shortName: 'CVR', location: 'Hyderabad, Telangana, India', tier: 'Tier 1' },
  { name: 'Mahatma Gandhi Institute of Technology (MGIT)', shortName: 'MGIT', location: 'Hyderabad, Telangana, India', tier: 'Tier 2' },
  { name: 'BVRIT Hyderabad College of Engineering for Women', shortName: 'BVRITH', location: 'Hyderabad, Telangana, India', tier: 'Tier 2' },
  { name: 'B.V. Raju Institute of Technology (BVRIT Narsapur)', shortName: 'BVRIT', location: 'Narsapur, Telangana, India', tier: 'Tier 2' },
  { name: 'Vardhaman College of Engineering', shortName: 'Vardhaman', location: 'Hyderabad, Telangana, India', tier: 'Tier 2' },
  { name: 'Anurag University (Anurag Group of Institutions)', shortName: 'Anurag', location: 'Hyderabad, Telangana, India', tier: 'Tier 2' },
  { name: 'G. Narayanamma Institute of Technology and Science (GNITS)', shortName: 'GNITS', location: 'Hyderabad, Telangana, India', tier: 'Tier 1' },
  { name: 'Malla Reddy College of Engineering and Technology (MRCET)', shortName: 'MRCET', location: 'Hyderabad, Telangana, India', tier: 'Tier 2' },
  { name: 'Institute of Aeronautical Engineering (IARE)', shortName: 'IARE', location: 'Hyderabad, Telangana, India', tier: 'Tier 2' },
  { name: 'Gayatri Vidya Parishad College of Engineering (GVPCE)', shortName: 'GVP', location: 'Visakhapatnam, Andhra Pradesh, India', tier: 'Tier 1' },
  { name: 'VR Siddhartha Engineering College (VRSEC)', shortName: 'VRSEC', location: 'Vijayawada, Andhra Pradesh, India', tier: 'Tier 1' },
  { name: 'RVR & JC College of Engineering', shortName: 'RVR & JC', location: 'Guntur, Andhra Pradesh, India', tier: 'Tier 1' },
  { name: 'Sagi Rama Krishnam Raju Engineering College (SRKR)', shortName: 'SRKR', location: 'Bhimavaram, Andhra Pradesh, India', tier: 'Tier 1' },
  { name: 'Vignan Foundation for Science, Technology and Research (Vignan University)', shortName: 'Vignan', location: 'Guntur, Andhra Pradesh, India', tier: 'Tier 2' },
  { name: 'KL University (Koneru Lakshmaiah Education Foundation)', shortName: 'KLU', location: 'Vijayawada, Andhra Pradesh, India', tier: 'Tier 2' },
  { name: 'GITAM Deemed to be University', shortName: 'GITAM', location: 'Visakhapatnam, Andhra Pradesh, India', tier: 'Tier 2' },

  // Top National Private & Deemed Universities
  { name: 'Vellore Institute of Technology (VIT), Vellore', shortName: 'VIT Vellore', location: 'Vellore, Tamil Nadu, India', tier: 'Tier 1' },
  { name: 'VIT Chennai', shortName: 'VIT Chennai', location: 'Chennai, Tamil Nadu, India', tier: 'Tier 1' },
  { name: 'VIT-AP University', shortName: 'VIT-AP', location: 'Amaravati, Andhra Pradesh, India', tier: 'Tier 1' },
  { name: 'VIT Bhopal University', shortName: 'VIT Bhopal', location: 'Bhopal, Madhya Pradesh, India', tier: 'Tier 2' },
  { name: 'SRM Institute of Science and Technology, Kattankulathur', shortName: 'SRM KTR', location: 'Chennai, Tamil Nadu, India', tier: 'Tier 1' },
  { name: 'SRM University, AP', shortName: 'SRM AP', location: 'Amaravati, Andhra Pradesh, India', tier: 'Tier 1' },
  { name: 'Amrita Vishwa Vidyapeetham, Coimbatore', shortName: 'Amrita', location: 'Coimbatore, Tamil Nadu, India', tier: 'Tier 1' },
  { name: 'Manipal Academy of Higher Education (MAHE)', shortName: 'Manipal', location: 'Manipal, Karnataka, India', tier: 'Tier 1' },
  { name: 'Thapar Institute of Engineering and Technology', shortName: 'Thapar', location: 'Patiala, Punjab, India', tier: 'Tier 1' },
  { name: 'PSG College of Technology', shortName: 'PSG Tech', location: 'Coimbatore, Tamil Nadu, India', tier: 'Tier 1' },
  { name: 'College of Engineering, Guindy (CEG)', shortName: 'CEG Anna Univ', location: 'Chennai, Tamil Nadu, India', tier: 'Tier 1' },
  { name: 'PES University, Bengaluru', shortName: 'PES Univ', location: 'Bengaluru, Karnataka, India', tier: 'Tier 1' },
  { name: 'RV College of Engineering (RVCE)', shortName: 'RVCE', location: 'Bengaluru, Karnataka, India', tier: 'Tier 1' },
  { name: 'BMS College of Engineering (BMSCE)', shortName: 'BMSCE', location: 'Bengaluru, Karnataka, India', tier: 'Tier 1' },
  { name: 'MS Ramaiah Institute of Technology (MSRIT)', shortName: 'MSRIT', location: 'Bengaluru, Karnataka, India', tier: 'Tier 1' },
  { name: 'College of Engineering Pune (COEP)', shortName: 'COEP', location: 'Pune, Maharashtra, India', tier: 'Tier 1' },
  { name: 'Veermata Jijabai Technological Institute (VJTI)', shortName: 'VJTI', location: 'Mumbai, Maharashtra, India', tier: 'Tier 1' },
  { name: 'Delhi Technological University (DTU)', shortName: 'DTU', location: 'New Delhi, Delhi, India', tier: 'Tier 1' },
  { name: 'Netaji Subhas University of Technology (NSUT)', shortName: 'NSUT', location: 'New Delhi, Delhi, India', tier: 'Tier 1' },
  { name: 'Chandigarh University', shortName: 'CU', location: 'Mohali, Punjab, India', tier: 'Tier 2' },
  { name: 'Lovely Professional University (LPU)', shortName: 'LPU', location: 'Phagwara, Punjab, India', tier: 'Tier 2' },
  { name: 'Amity University, Noida', shortName: 'Amity Noida', location: 'Noida, Uttar Pradesh, India', tier: 'Tier 2' },
  { name: 'Ashoka University', shortName: 'Ashoka', location: 'Sonipat, Haryana, India', tier: 'Tier 1' },
  { name: 'Plaksha University', shortName: 'Plaksha', location: 'Mohali, Punjab, India', tier: 'Tier 1' },

  // Premier Global Universities
  { name: 'Stanford University', shortName: 'Stanford', location: 'Stanford, California, USA', tier: 'Global' },
  { name: 'Massachusetts Institute of Technology (MIT)', shortName: 'MIT', location: 'Cambridge, Massachusetts, USA', tier: 'Global' },
  { name: 'Carnegie Mellon University (CMU)', shortName: 'CMU', location: 'Pittsburgh, Pennsylvania, USA', tier: 'Global' },
  { name: 'University of California, Berkeley (UC Berkeley)', shortName: 'UC Berkeley', location: 'Berkeley, California, USA', tier: 'Global' },
  { name: 'Harvard University', shortName: 'Harvard', location: 'Cambridge, Massachusetts, USA', tier: 'Global' },
  { name: 'California Institute of Technology (Caltech)', shortName: 'Caltech', location: 'Pasadena, California, USA', tier: 'Global' },
  { name: 'University of Oxford', shortName: 'Oxford', location: 'Oxford, England, UK', tier: 'Global' },
  { name: 'University of Cambridge', shortName: 'Cambridge', location: 'Cambridge, England, UK', tier: 'Global' },
  { name: 'Imperial College London', shortName: 'Imperial', location: 'London, England, UK', tier: 'Global' },
  { name: 'ETH Zurich (Swiss Federal Institute of Technology)', shortName: 'ETH Zurich', location: 'Zurich, Switzerland', tier: 'Global' },
  { name: 'National University of Singapore (NUS)', shortName: 'NUS', location: 'Singapore', tier: 'Global' },
  { name: 'Nanyang Technological University (NTU)', shortName: 'NTU', location: 'Singapore', tier: 'Global' },
  { name: 'University of Toronto', shortName: 'U of T', location: 'Toronto, Ontario, Canada', tier: 'Global' },
  { name: 'University of Waterloo', shortName: 'UWaterloo', location: 'Waterloo, Ontario, Canada', tier: 'Global' },
  { name: 'University of Washington', shortName: 'UW', location: 'Seattle, Washington, USA', tier: 'Global' },
  { name: 'Georgia Institute of Technology (Georgia Tech)', shortName: 'Georgia Tech', location: 'Atlanta, Georgia, USA', tier: 'Global' },
  { name: 'University of Illinois Urbana-Champaign (UIUC)', shortName: 'UIUC', location: 'Urbana, Illinois, USA', tier: 'Global' },
  { name: 'University of Texas at Austin (UT Austin)', shortName: 'UT Austin', location: 'Austin, Texas, USA', tier: 'Global' },
  { name: 'University of Michigan, Ann Arbor', shortName: 'UMich', location: 'Ann Arbor, Michigan, USA', tier: 'Global' },
  { name: 'Technical University of Munich (TUM)', shortName: 'TUM', location: 'Munich, Germany', tier: 'Global' },
];

// Curated Top Career Goals Catalog
export const CAREER_GOALS_CATALOG = [
  'Machine Learning Engineer',
  'AI Systems Architect',
  'Full Stack Software Engineer',
  'Backend Distributed Systems Engineer',
  'Frontend / UI Platform Engineer',
  'Cloud DevOps & Site Reliability Engineer (SRE)',
  'Data Scientist & Quantitative Analyst',
  'Big Data & Data Platform Engineer',
  'Cybersecurity & Application Security Engineer',
  'Product Manager (Tech / AI / SaaS)',
  'Computer Vision & Perception Engineer',
  'Natural Language Processing (NLP) Specialist',
  'MLOps & Infrastructure Engineer',
  'Mobile Application Engineer (iOS / Android / Flutter)',
  'Embedded Systems & Firmware Engineer',
  'Blockchain & Web3 Protocol Developer',
  'Solutions Architect / Cloud Architect',
  'Database Administrator & Storage Engineer',
  'Enterprise Software Architect',
  'Game Engine Developer',
  'AR / VR / Spatial Computing Engineer',
  'Bioinformatics & Computational Biologist',
  'Robotics & Autonomous Vehicle Engineer',
  'Hardware & VLSI Design Engineer',
  'Information Security Analyst & Penetration Tester',
  'Technical Consultant & Technology Strategist',
  'Business Intelligence & Analytics Lead',
  'Tech Lead / Engineering Manager',
  'Research Scientist (AI / Computational Science)',
  'Fintech Quantitative Trader / Strategist'
];

export const INDUSTRIES_CATALOG = [
  'Artificial Intelligence & DeepTech',
  'FinTech & Digital Banking',
  'SaaS & Enterprise Cloud Software',
  'E-Commerce & Digital Marketplaces',
  'HealthTech, Telemedicine & BioTech',
  'Cybersecurity, Privacy & Defense Tech',
  'Automotive, EV & Autonomous Mobility',
  'EdTech & Continuous Learning Systems',
  'Gaming, AR/VR & Interactive Media',
  'Supply Chain, Logistics & Robotics',
  'Telecommunications, 5G & IoT',
  'Energy, CleanTech & Sustainability',
  'Media, Streaming & Digital Content',
  'Consulting, Advisory & IT Services',
  'Aerospace, Defense & SpaceTech'
];

export const COMPANY_TYPES = [
  'Product Company (Tier 1 / FAANG / Global MNC)',
  'High-Growth Tech Startup (Series A - Unicorn)',
  'Bootstrapped / Early Stage Startup',
  'IT Services / Global Technology Consultancy',
  'DeepTech Research & Applied Labs',
  'Government & Public Sector Enterprise',
  'Quantitative Finance & Hedge Fund'
];

export const CODING_PLATFORMS = [
  'LeetCode',
  'HackerRank',
  'CodeChef',
  'Codeforces',
  'HackerEarth',
  'AtCoder',
  'GeeksforGeeks',
  'TopCoder',
  'Kaggle',
  'Others'
] as const;

export const APPLICATION_CONTEXTS = [
  'Academic',
  'Personal Projects',
  'Internship',
  'Professional Work',
  'Freelancing',
  'Open Source',
  'Learning / No Practical Application Yet'
] as const;

export const PROFICIENCY_LEVELS = [
  { label: 'Beginner', desc: 'Foundational concepts and basic exercises' },
  { label: 'Intermediate', desc: 'Practical hands-on implementation and projects' },
  { label: 'Advanced', desc: 'Production-grade engineering, performance & optimization' },
  { label: 'Expert', desc: 'Deep architectural mastery, system internals & industry authority' }
] as const;

// Curated Tech Hubs for Instant Offline Location Resolution
export const POPULAR_LOCATIONS = [
  'Hyderabad, Telangana, India',
  'Bengaluru, Karnataka, India',
  'Pune, Maharashtra, India',
  'Mumbai, Maharashtra, India',
  'Delhi NCR, India',
  'Gurugram, Haryana, India',
  'Noida, Uttar Pradesh, India',
  'Chennai, Tamil Nadu, India',
  'Kolkata, West Bengal, India',
  'Ahmedabad, Gujarat, India',
  'Kochi, Kerala, India',
  'Visakhapatnam, Andhra Pradesh, India',
  'Vijayawada, Andhra Pradesh, India',
  'Coimbatore, Tamil Nadu, India',
  'San Francisco, CA, USA',
  'Seattle, WA, USA',
  'New York, NY, USA',
  'Austin, TX, USA',
  'London, England, UK',
  'Berlin, Germany',
  'Amsterdam, Netherlands',
  'Singapore',
  'Dubai, UAE',
  'Tokyo, Japan',
  'Toronto, Ontario, Canada',
  'Remote / Anywhere'
];
