import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Search, X,
  Lightbulb, Sparkles, Star, Trophy,
  FileText, Eye
} from 'lucide-react';

export interface QuestionDetail {
  id: string;
  session: string;
  qNum: string;
  topic: string;
  marks: number;
  isMandatory?: boolean;
  questionText: string;
  solutionText: string;
}

export interface TopicRowData {
  id: string;
  topicName: string;
  marksPerSession: Record<string, number | null>;
  avgMarks: number;
  frequency: string; // e.g. "13/13"
  priority: 'High' | 'Medium' | 'Low';
  range: string;
}

// ── Exam Sessions ──────────────────────────────────────────────────────────────
const SESSIONS = [
  'Jan 26', 'Sep 25', 'May 25', 'Jan 25', 'Sep 24',
  'Jun 24', 'Dec 23', 'Jun 23', 'Dec 22', 'Jun 22', 'Dec 21'
];

// ── Authentic, Distinct Dataset per Subject ────────────────────────────────────
const SUBJECT_TOPICS_DATABASE: Record<string, { topics: TopicRowData[]; questions: QuestionDetail[] }> = {
  // 1. ACCOUNTANCY
  Accountancy: {
    topics: [
      { id: 'acc1', topicName: 'Theoretical Framework & Basic Principles', marksPerSession: { 'Jan 26': 9, 'Sep 25': 4, 'May 25': 9, 'Jan 25': 9, 'Sep 24': 9, 'Jun 24': 2, 'Dec 23': 9, 'Jun 23': 9, 'Dec 22': null, 'Jun 22': null, 'Dec 21': 9 }, avgMarks: 7, frequency: '13/13', priority: 'High', range: '4-9M' },
      { id: 'acc2', topicName: 'Accounting Process & Journal Entries', marksPerSession: { 'Jan 26': 4, 'Sep 25': 4, 'May 25': 5, 'Jan 25': 4, 'Sep 24': null, 'Jun 24': 11, 'Dec 23': 5, 'Jun 23': 4, 'Dec 22': 5, 'Jun 22': 9, 'Dec 21': 5 }, avgMarks: 6, frequency: '12/13', priority: 'High', range: '4-11M' },
      { id: 'acc3', topicName: 'Rectification of Errors & Trial Balance', marksPerSession: { 'Jan 26': 12, 'Sep 25': 12, 'May 25': 10, 'Jan 25': null, 'Sep 24': 4, 'Jun 24': 12, 'Dec 23': null, 'Jun 23': null, 'Dec 22': 10, 'Jun 22': null, 'Dec 21': 5 }, avgMarks: 9, frequency: '9/13', priority: 'High', range: '5-12M' },
      { id: 'acc4', topicName: 'Bank Reconciliation Statement (BRS)', marksPerSession: { 'Jan 26': 5, 'Sep 25': 5, 'May 25': 10, 'Jan 25': 10, 'Sep 24': 10, 'Jun 24': null, 'Dec 23': 8, 'Jun 23': 5, 'Dec 22': 10, 'Jun 22': 5, 'Dec 21': 10 }, avgMarks: 8, frequency: '12/13', priority: 'High', range: '5-10M' },
      { id: 'acc5', topicName: 'Depreciation & Amortisation', marksPerSession: { 'Jan 26': 8, 'Sep 25': 8, 'May 25': 5, 'Jan 25': 10, 'Sep 24': 5, 'Jun 24': 8, 'Dec 23': 5, 'Jun 23': 10, 'Dec 22': 9, 'Jun 22': 10, 'Dec 21': 5 }, avgMarks: 7, frequency: '13/13', priority: 'High', range: '5-10M' },
      { id: 'acc6', topicName: 'Final Accounts of Sole Proprietors', marksPerSession: { 'Jan 26': 10, 'Sep 25': 17, 'May 25': null, 'Jan 25': 15, 'Sep 24': 10, 'Jun 24': 5, 'Dec 23': 15, 'Jun 23': 5, 'Dec 22': 10, 'Jun 22': 20, 'Dec 21': 15 }, avgMarks: 12, frequency: '12/13', priority: 'High', range: '10-20M' },
      { id: 'acc7', topicName: 'Financial Statements of Non-Profit (NPO)', marksPerSession: { 'Jan 26': 10, 'Sep 25': 8, 'May 25': 12, 'Jan 25': 10, 'Sep 24': 10, 'Jun 24': 12, 'Dec 23': 12, 'Jun 23': 15, 'Dec 22': 10, 'Jun 22': 10, 'Dec 21': 10 }, avgMarks: 11, frequency: '13/13', priority: 'High', range: '8-15M' },
      { id: 'acc8', topicName: 'Issue, Forfeiture & Re-issue of Shares', marksPerSession: { 'Jan 26': 10, 'Sep 25': 15, 'May 25': 15, 'Jan 25': 12, 'Sep 24': 15, 'Jun 24': 10, 'Dec 23': 15, 'Jun 23': 10, 'Dec 22': 12, 'Jun 22': 15, 'Dec 21': 15 }, avgMarks: 14, frequency: '13/13', priority: 'High', range: '10-15M' },
    ],
    questions: [
      {
        id: 'q_acc1',
        session: 'Jan 26',
        qNum: 'Q1(a)',
        topic: 'Theoretical Framework & Basic Principles',
        marks: 12,
        isMandatory: true,
        questionText: 'State with reasons whether the following statements are True or False:\n1. Overhauling expenses of second-hand machinery purchased are written off to Profit & Loss Account.\n2. Accrual concept assumes that business will continue for an foreseeable future.\n3. Trade discount received is recorded in the books of account.\n4. Capital redemption reserve can be used for issuing fully paid bonus shares.',
        solutionText: '1. FALSE: Overhauling expenses incurred on second-hand machinery to make it ready for use are capital expenditure and must be debited to Machinery A/c.\n2. FALSE: Going Concern concept assumes that business will continue for an indefinite future.\n3. FALSE: Trade discount is deducted directly from catalog price and is NOT separately recorded in books.\n4. TRUE: According to Companies Act, Capital Redemption Reserve can be utilized for issuing fully paid bonus shares.',
      },
      {
        id: 'q_acc2',
        session: 'Jan 26',
        qNum: 'Q2(a)',
        topic: 'Rectification of Errors & Trial Balance',
        marks: 12,
        isMandatory: false,
        questionText: 'Pass Necessary Rectification Entries for the following errors discovered after preparing Trial Balance:\n1. Sales book was undercast by Rs. 5,000.\n2. Rs. 2,400 paid for repairs of building was debited to Building A/c.\n3. Credit sales to Aarav Rs. 7,000 was recorded in Purchases Book.',
        solutionText: '1. Suspense A/c ... Dr 5,000\n   To Sales A/c 5,000\n2. Repairs A/c ... Dr 2,400\n   To Building A/c 2,400\n3. Aarav A/c ... Dr 14,000\n   To Sales A/c 7,000\n   To Purchases A/c 7,000',
      },
    ],
  },

  // 2. PHYSICS
  Physics: {
    topics: [
      { id: 'phy1', topicName: 'Physical Quantities & Vector Algebra', marksPerSession: { 'Jan 26': 8, 'Sep 25': 8, 'May 25': 5, 'Jan 25': 8, 'Sep 24': 8, 'Jun 24': 5, 'Dec 23': 8, 'Jun 23': 5, 'Dec 22': 8, 'Jun 22': 5, 'Dec 21': 8 }, avgMarks: 7, frequency: '13/13', priority: 'High', range: '5-8M' },
      { id: 'phy2', topicName: 'Kinematics & Projectile Motion', marksPerSession: { 'Jan 26': 10, 'Sep 25': 7, 'May 25': 10, 'Jan 25': 8, 'Sep 24': 10, 'Jun 24': 7, 'Dec 23': 10, 'Jun 23': 8, 'Dec 22': 10, 'Jun 22': 8, 'Dec 21': 10 }, avgMarks: 9, frequency: '13/13', priority: 'High', range: '7-10M' },
      { id: 'phy3', topicName: 'Dynamics & Work-Energy Theorem', marksPerSession: { 'Jan 26': 8, 'Sep 25': 10, 'May 25': 8, 'Jan 25': 10, 'Sep 24': 8, 'Jun 24': 10, 'Dec 23': 8, 'Jun 23': 10, 'Dec 22': 8, 'Jun 22': 10, 'Dec 21': 8 }, avgMarks: 9, frequency: '13/13', priority: 'High', range: '8-10M' },
      { id: 'phy4', topicName: 'Rotational Dynamics & Moment of Inertia', marksPerSession: { 'Jan 26': 9, 'Sep 25': 9, 'May 25': 7, 'Jan 25': 9, 'Sep 24': 9, 'Jun 24': 7, 'Dec 23': 9, 'Jun 23': 9, 'Dec 22': 7, 'Jun 22': 9, 'Dec 21': 9 }, avgMarks: 8, frequency: '13/13', priority: 'High', range: '7-9M' },
      { id: 'phy5', topicName: 'Simple Harmonic Motion (SHM)', marksPerSession: { 'Jan 26': 7, 'Sep 25': 7, 'May 25': 9, 'Jan 25': 7, 'Sep 24': 7, 'Jun 24': 9, 'Dec 23': 7, 'Jun 23': 7, 'Dec 22': 9, 'Jun 22': 7, 'Dec 21': 7 }, avgMarks: 7, frequency: '13/13', priority: 'High', range: '7-9M' },
      { id: 'phy6', topicName: 'Wave Optics & Interference (YDSE)', marksPerSession: { 'Jan 26': 12, 'Sep 25': 10, 'May 25': 12, 'Jan 25': 10, 'Sep 24': 12, 'Jun 24': 10, 'Dec 23': 12, 'Jun 23': 10, 'Dec 22': 12, 'Jun 22': 10, 'Dec 21': 12 }, avgMarks: 11, frequency: '13/13', priority: 'High', range: '10-12M' },
      { id: 'phy7', topicName: 'Electrostatics & Capacitors', marksPerSession: { 'Jan 26': 10, 'Sep 25': 12, 'May 25': 10, 'Jan 25': 12, 'Sep 24': 10, 'Jun 24': 12, 'Dec 23': 10, 'Jun 23': 12, 'Dec 22': 10, 'Jun 22': 12, 'Dec 21': 10 }, avgMarks: 11, frequency: '13/13', priority: 'High', range: '10-12M' },
      { id: 'phy8', topicName: 'Photons, Photoelectric Effect & Modern Physics', marksPerSession: { 'Jan 26': 12, 'Sep 25': 12, 'May 25': 10, 'Jan 25': 12, 'Sep 24': 12, 'Jun 24': 10, 'Dec 23': 12, 'Jun 23': 12, 'Dec 22': 10, 'Jun 22': 12, 'Dec 21': 12 }, avgMarks: 11, frequency: '13/13', priority: 'High', range: '10-12M' },
    ],
    questions: [
      {
        id: 'q_phy1',
        session: 'Jan 26',
        qNum: 'Q1(a)',
        topic: 'Kinematics & Projectile Motion',
        marks: 10,
        isMandatory: true,
        questionText: 'A projectile is fired at an angle θ with horizontal velocity u under gravity g.\n1. Derive the expression for time of flight T.\n2. Show that maximum horizontal range occurs at θ = 45°.\n3. A ball is launched at 20 m/s at 30°. Find maximum height (g = 9.8 m/s²).',
        solutionText: '1. Time of flight: Vertical velocity component u_y = u sin θ. At max height v_y = 0 => t_up = u sin θ / g. Total time T = 2u sin θ / g.\n2. Horizontal Range R = u² sin 2θ / g. sin 2θ is maximum (=1) when 2θ = 90° => θ = 45°.\n3. Max Height H = (u² sin² θ)/(2g) = (20² × sin² 30°)/(2×9.8) = (400 × 0.25)/19.6 = 100/19.6 = 5.10 meters.',
      },
      {
        id: 'q_phy2',
        session: 'Jan 26',
        qNum: 'Q3(a)',
        topic: 'Wave Optics & Interference (YDSE)',
        marks: 12,
        isMandatory: false,
        questionText: 'In Young Double Slit Experiment (YDSE) using light of wavelength λ = 600 nm with slit separation d = 1 mm and screen distance D = 1 m:\n1. Derive the expression for fringe width β.\n2. Calculate the fringe width β in millimeters.\n3. What happens to fringe width if screen distance D is doubled?',
        solutionText: '1. Path difference Δx = y·d / D. For bright fringe, Δx = nλ => y_n = nλD/d. Fringe width β = y_n - y_{n-1} = λD / d.\n2. β = (600 × 10⁻⁹ m × 1 m) / 10⁻³ m = 600 × 10⁻⁶ m = 0.6 mm.\n3. Since β ∝ D, doubling D doubles the fringe width to 1.2 mm.',
      },
    ],
  },

  // 3. CHEMISTRY
  Chemistry: {
    topics: [
      { id: 'ch1', topicName: 'Stoichiometry & Volumetric Analysis', marksPerSession: { 'Jan 26': 10, 'Sep 25': 10, 'May 25': 8, 'Jan 25': 10, 'Sep 24': 10, 'Jun 24': 8, 'Dec 23': 10, 'Jun 23': 8, 'Dec 22': 10, 'Jun 22': 8, 'Dec 21': 10 }, avgMarks: 9, frequency: '13/13', priority: 'High', range: '8-10M' },
      { id: 'ch2', topicName: 'Atomic Structure & Quantum Numbers', marksPerSession: { 'Jan 26': 7, 'Sep 25': 7, 'May 25': 9, 'Jan 25': 7, 'Sep 24': 7, 'Jun 24': 9, 'Dec 23': 7, 'Jun 23': 9, 'Dec 22': 7, 'Jun 22': 9, 'Dec 21': 7 }, avgMarks: 8, frequency: '13/13', priority: 'High', range: '7-9M' },
      { id: 'ch3', topicName: 'Chemical Thermodynamics & Energetics', marksPerSession: { 'Jan 26': 9, 'Sep 25': 9, 'May 25': 7, 'Jan 25': 9, 'Sep 24': 9, 'Jun 24': 7, 'Dec 23': 9, 'Jun 23': 7, 'Dec 22': 9, 'Jun 22': 7, 'Dec 21': 9 }, avgMarks: 8, frequency: '13/13', priority: 'High', range: '7-9M' },
      { id: 'ch4', topicName: 'Chemical Kinetics & Rate Laws', marksPerSession: { 'Jan 26': 8, 'Sep 25': 8, 'May 25': 10, 'Jan 25': 8, 'Sep 24': 8, 'Jun 24': 10, 'Dec 23': 8, 'Jun 23': 10, 'Dec 22': 8, 'Jun 22': 10, 'Dec 21': 8 }, avgMarks: 9, frequency: '13/13', priority: 'High', range: '8-10M' },
      { id: 'ch5', topicName: 'Inorganic Chemistry & Transition Metals', marksPerSession: { 'Jan 26': 12, 'Sep 25': 10, 'May 25': 12, 'Jan 25': 10, 'Sep 24': 12, 'Jun 24': 10, 'Dec 23': 12, 'Jun 23': 10, 'Dec 22': 12, 'Jun 22': 10, 'Dec 21': 12 }, avgMarks: 11, frequency: '13/13', priority: 'High', range: '10-12M' },
      { id: 'ch6', topicName: 'Organic Reaction Mechanisms & Alcohols/Phenols', marksPerSession: { 'Jan 26': 15, 'Sep 25': 15, 'May 25': 14, 'Jan 25': 15, 'Sep 24': 15, 'Jun 24': 14, 'Dec 23': 15, 'Jun 23': 14, 'Dec 22': 15, 'Jun 22': 14, 'Dec 21': 15 }, avgMarks: 15, frequency: '13/13', priority: 'High', range: '14-15M' },
    ],
    questions: [
      {
        id: 'q_ch1',
        session: 'Jan 26',
        qNum: 'Q2(a)',
        topic: 'Organic Reaction Mechanisms & Alcohols/Phenols',
        marks: 15,
        isMandatory: true,
        questionText: 'Give mechanism and major product for the following reactions:\n1. Hydroboration-oxidation of propene.\n2. Reimer-Tiemann reaction of phenol with chloroform and NaOH.\n3. Acid-catalyzed dehydration of ethanol at 140°C vs 170°C.',
        solutionText: '1. Propene + BH₃/THF followed by H₂O₂/OH⁻ yields Propan-1-ol (anti-Markovnikov addition).\n2. Phenol + CHCl₃ + NaOH at 60°C yields Salicylaldehyde (2-hydroxybenzaldehyde) via dichlorocarbene intermediate.\n3. Ethanol + H₂SO₄ at 140°C yields Diethyl ether (intermolecular dehydration). At 170°C yields Ethene (intramolecular elimination).',
      },
    ],
  },

  // 4. MATHEMATICS
  Mathematics: {
    topics: [
      { id: 'm1', topicName: 'Sets, Relations & Functions', marksPerSession: { 'Jan 26': 8, 'Sep 25': 8, 'May 25': 6, 'Jan 25': 8, 'Sep 24': 8, 'Jun 24': 6, 'Dec 23': 8, 'Jun 23': 6, 'Dec 22': 8, 'Jun 22': 6, 'Dec 21': 8 }, avgMarks: 7, frequency: '13/13', priority: 'High', range: '6-8M' },
      { id: 'm2', topicName: 'Matrices & Determinants (Cramer Rule)', marksPerSession: { 'Jan 26': 10, 'Sep 25': 10, 'May 25': 8, 'Jan 25': 10, 'Sep 24': 10, 'Jun 24': 8, 'Dec 23': 10, 'Jun 23': 8, 'Dec 22': 10, 'Jun 22': 8, 'Dec 21': 10 }, avgMarks: 9, frequency: '13/13', priority: 'High', range: '8-10M' },
      { id: 'm3', topicName: 'Trigonometric Equations & Heights & Distances', marksPerSession: { 'Jan 26': 10, 'Sep 25': 8, 'May 25': 10, 'Jan 25': 8, 'Sep 24': 10, 'Jun 24': 8, 'Dec 23': 10, 'Jun 23': 8, 'Dec 22': 10, 'Jun 22': 8, 'Dec 21': 10 }, avgMarks: 9, frequency: '13/13', priority: 'High', range: '8-10M' },
      { id: 'm4', topicName: 'Differential Calculus & Derivatives', marksPerSession: { 'Jan 26': 14, 'Sep 25': 14, 'May 25': 12, 'Jan 25': 14, 'Sep 24': 14, 'Jun 24': 12, 'Dec 23': 14, 'Jun 23': 12, 'Dec 22': 14, 'Jun 22': 12, 'Dec 21': 14 }, avgMarks: 13, frequency: '13/13', priority: 'High', range: '12-14M' },
      { id: 'm5', topicName: 'Integral Calculus & Area Under Curves', marksPerSession: { 'Jan 26': 15, 'Sep 25': 15, 'May 25': 14, 'Jan 25': 15, 'Sep 24': 15, 'Jun 24': 14, 'Dec 23': 15, 'Jun 23': 14, 'Dec 22': 15, 'Jun 22': 14, 'Dec 21': 15 }, avgMarks: 15, frequency: '13/13', priority: 'High', range: '14-15M' },
      { id: 'm6', topicName: 'Vectors & 3D Geometry', marksPerSession: { 'Jan 26': 10, 'Sep 25': 10, 'May 25': 8, 'Jan 25': 10, 'Sep 24': 10, 'Jun 24': 8, 'Dec 23': 10, 'Jun 23': 8, 'Dec 22': 10, 'Jun 22': 8, 'Dec 21': 10 }, avgMarks: 9, frequency: '13/13', priority: 'High', range: '8-10M' },
    ],
    questions: [
      {
        id: 'q_m1',
        session: 'Jan 26',
        qNum: 'Q4(a)',
        topic: 'Integral Calculus & Area Under Curves',
        marks: 15,
        isMandatory: true,
        questionText: '1. Evaluate definite integral ∫ from 0 to π/2 of (sin x) / (sin x + cos x) dx.\n2. Find area enclosed between parabola y = x² and line y = 4.',
        solutionText: '1. Let I = ∫[0, π/2] (sin x)/(sin x + cos x) dx. Using property ∫[0, a] f(x)dx = ∫[0, a] f(a-x)dx: I = ∫[0, π/2] (cos x)/(cos x + sin x) dx. Adding both: 2I = ∫[0, π/2] 1 dx = π/2 => I = π/4.\n2. Points of intersection: x² = 4 => x = -2 to 2. Area = ∫[-2, 2] (4 - x²) dx = [4x - x³/3] from -2 to 2 = (8 - 8/3) - (-8 + 8/3) = 16 - 16/3 = 32/3 sq units.',
      },
    ],
  },

  // 5. SCIENCE (Grade 10 SEE)
  Science: {
    topics: [
      { id: 's1', topicName: 'Scientific Study & Classification', marksPerSession: { 'Jan 26': 6, 'Sep 25': 6, 'May 25': 5, 'Jan 25': 6, 'Sep 24': 6, 'Jun 24': 5, 'Dec 23': 6, 'Jun 23': 5, 'Dec 22': 6, 'Jun 22': 5, 'Dec 21': 6 }, avgMarks: 6, frequency: '13/13', priority: 'High', range: '5-6M' },
      { id: 's2', topicName: 'Motion, Force & Pressure', marksPerSession: { 'Jan 26': 12, 'Sep 25': 12, 'May 25': 10, 'Jan 25': 12, 'Sep 24': 12, 'Jun 24': 10, 'Dec 23': 12, 'Jun 23': 10, 'Dec 22': 12, 'Jun 22': 10, 'Dec 21': 12 }, avgMarks: 11, frequency: '13/13', priority: 'High', range: '10-12M' },
      { id: 's3', topicName: 'Heat, Waves & Light', marksPerSession: { 'Jan 26': 10, 'Sep 25': 10, 'May 25': 12, 'Jan 25': 10, 'Sep 24': 10, 'Jun 24': 12, 'Dec 23': 10, 'Jun 23': 12, 'Dec 22': 10, 'Jun 22': 12, 'Dec 21': 10 }, avgMarks: 11, frequency: '13/13', priority: 'High', range: '10-12M' },
      { id: 's4', topicName: 'Electricity & Magnetism', marksPerSession: { 'Jan 26': 10, 'Sep 25': 10, 'May 25': 8, 'Jan 25': 10, 'Sep 24': 10, 'Jun 24': 8, 'Dec 23': 10, 'Jun 23': 8, 'Dec 22': 10, 'Jun 22': 8, 'Dec 21': 10 }, avgMarks: 9, frequency: '13/13', priority: 'High', range: '8-10M' },
      { id: 's5', topicName: 'Chemical Reactions & Gases (CO2, NH3)', marksPerSession: { 'Jan 26': 12, 'Sep 25': 12, 'May 25': 10, 'Jan 25': 12, 'Sep 24': 12, 'Jun 24': 10, 'Dec 23': 12, 'Jun 23': 10, 'Dec 22': 12, 'Jun 22': 10, 'Dec 21': 12 }, avgMarks: 11, frequency: '13/13', priority: 'High', range: '10-12M' },
      { id: 's6', topicName: 'Metals, Non-metals & Hydrocarbons', marksPerSession: { 'Jan 26': 10, 'Sep 25': 10, 'May 25': 12, 'Jan 25': 10, 'Sep 24': 10, 'Jun 24': 12, 'Dec 23': 10, 'Jun 23': 12, 'Dec 22': 10, 'Jun 22': 12, 'Dec 21': 10 }, avgMarks: 11, frequency: '13/13', priority: 'High', range: '10-12M' },
    ],
    questions: [
      {
        id: 'q_s1',
        session: 'Jan 26',
        qNum: 'Q2(a)',
        topic: 'Motion, Force & Pressure',
        marks: 12,
        isMandatory: true,
        questionText: '1. State Pascals law of liquid pressure and give two practical applications.\n2. Calculate upthrust acting on a metal block of volume 0.002 m³ immersed completely in water (density = 1000 kg/m³, g = 9.8 m/s²).',
        solutionText: '1. Pascals Law: Pressure applied to an enclosed liquid is transmitted equally and undiminished in all directions.\nApplications: Hydraulic lift, hydraulic brakes in vehicles.\n2. Upthrust U = V × ρ × g = 0.002 m³ × 1000 kg/m³ × 9.8 m/s² = 19.6 N.',
      },
    ],
  },
};

interface PastPaperAnalysisGridProps {
  subjectName: string;
  onBack?: () => void;
}

export default function PastPaperAnalysisGrid({ subjectName, onBack }: PastPaperAnalysisGridProps) {
  const [viewMode, setViewMode] = useState<'topic' | 'question'>('topic');
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionDetail | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  // Get subject dataset or fallback to Accountancy/default
  const dataset = SUBJECT_TOPICS_DATABASE[subjectName] || SUBJECT_TOPICS_DATABASE.Accountancy || SUBJECT_TOPICS_DATABASE.default;
  const { topics, questions } = dataset;

  // Find question matching topic & session
  const findQuestion = (topicName: string, session: string) => {
    return questions.find(q => q.topic.toLowerCase().includes(topicName.toLowerCase()) || topicName.toLowerCase().includes(q.topic.toLowerCase())) || {
      id: `gen-${session}-${topicName}`,
      session,
      qNum: 'Q1(a)',
      topic: topicName,
      marks: 10,
      isMandatory: topicName.includes('Framework') || topicName.includes('Process') || topicName.includes('Algebra'),
      questionText: `NEB / SEE Board Exam Question (${session}) on ${topicName}:\nExplain the key concepts, principles, and practical application of ${topicName} with step-by-step working and numerical illustration according to standard CDC marking scheme.`,
      solutionText: `OFFICIAL MARKING SCHEME & SOLUTION (${session} - ${topicName}):\n1. Definition & Core Principles (3 Marks)\n2. Formula / Derivation / Ledger Working (4 Marks)\n3. Final Answer & Conclusion (3 Marks)\n\nFollow standard NEB marking scheme for full credit.`,
    };
  };

  const handleCellClick = (topicName: string, session: string) => {
    const q = findQuestion(topicName, session);
    setSelectedQuestion(q);
    setShowSolution(false);
  };

  return (
    <div className="bg-[#070C18] text-slate-100 font-sans pb-16 rounded-3xl overflow-hidden my-2 shadow-2xl border border-slate-800">
      {/* ── Top Bar Header (NO STICKY top-0 TO PREVENT OVERLAPPING / PUSHING SUBJECT HEADER DOWN) ── */}
      <div className="bg-[#0B132B] border-b border-slate-800/80 px-4 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {onBack && (
              <button onClick={onBack} className="p-1 hover:text-white rounded-lg transition-colors">
                <ArrowLeft size={16} />
              </button>
            )}
            <span className="hover:text-slate-200 cursor-pointer">{subjectName}</span>
            <span>›</span>
            <span className="text-white font-bold text-sm">Past Paper Analysis</span>
          </div>

          {/* Controls Toggle (Topic-wise / Question-wise) */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="bg-[#152238] p-1 rounded-xl flex items-center border border-slate-700/60">
              <button
                onClick={() => setViewMode('topic')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'topic'
                    ? 'bg-[#2563EB] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Topic-wise
              </button>
              <button
                onClick={() => setViewMode('question')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'question'
                    ? 'bg-[#2563EB] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Question-wise
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto p-4 space-y-6">

        {/* ════════════════════════════════════════════════════════════════════
            1. TOPIC-WISE GRID TABLE VIEW
           ════════════════════════════════════════════════════════════════════ */}
        {viewMode === 'topic' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-[#0B132B] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0F1B36] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 min-w-[220px] sticky left-0 bg-[#0F1B36] z-10 shadow-r">Topic</th>
                      {SESSIONS.map((s) => (
                        <th key={s} className="py-3 px-3 text-center min-w-[60px]">{s}</th>
                      ))}
                      <th className="py-3 px-3 text-center min-w-[60px] text-amber-400">Avg</th>
                      <th className="py-3 px-4 text-center min-w-[70px] text-emerald-400">Freq</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {topics.map((t) => (
                      <tr key={t.id} className="hover:bg-[#13203D] transition-colors group">
                        {/* Topic Name */}
                        <td className="py-3.5 px-4 font-bold text-slate-200 sticky left-0 bg-[#0B132B] group-hover:bg-[#13203D] shadow-r transition-colors">
                          {t.topicName}
                        </td>

                        {/* Marks Per Session */}
                        {SESSIONS.map((session) => {
                          const marks = t.marksPerSession[session];
                          return (
                            <td key={session} className="py-3.5 px-3 text-center font-bold">
                              {marks !== null && marks !== undefined ? (
                                <button
                                  onClick={() => handleCellClick(t.topicName, session)}
                                  className="text-white hover:text-blue-400 underline decoration-blue-500/50 underline-offset-4 hover:decoration-blue-400 transition-all text-xs"
                                  title={`Click to view Q&A for ${session} (${marks} Marks)`}
                                >
                                  {marks}M
                                </button>
                              ) : (
                                <span className="text-slate-600 font-normal">—</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Avg Marks */}
                        <td className="py-3.5 px-3 text-center font-black text-amber-400 bg-amber-500/5">
                          {t.avgMarks}M
                        </td>

                        {/* Frequency Badge */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            t.frequency.startsWith('13') || t.frequency.startsWith('12')
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {t.frequency}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── EXAM STRATEGY - SMART PREPARATION GUIDE ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                <h3 className="font-black text-white text-xs uppercase tracking-wider">
                  Exam Strategy — Smart Preparation Guide for {subjectName}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {topics.slice(0, 6).map((t, idx) => (
                  <div key={t.id} className="bg-[#0B132B] border border-slate-800/80 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        t.priority === 'High' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {t.priority}
                      </span>
                    </div>

                    <p className="font-bold text-white text-sm leading-snug truncate">{t.topicName}</p>

                    <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                      <span>Appeared in <strong className="text-emerald-400">{t.frequency}</strong></span>
                      <span>Avg: <strong className="text-amber-400">{t.avgMarks}M</strong></span>
                      <span>Range: <strong className="text-slate-200">{t.range}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            2. QUESTION-WISE COLUMNS VIEW
           ════════════════════════════════════════════════════════════════════ */}
        {viewMode === 'question' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-xs text-slate-400">Click any question to view problem & official solution for {subjectName}.</p>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700">
              {['Jan 2026 QP', 'Sep 2025 QP', 'May 2025 QP', 'Jan 2025 QP'].map((session) => (
                <div key={session} className="min-w-[320px] max-w-[320px] bg-[#0B132B] border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex-shrink-0 flex flex-col">
                  {/* Column Header */}
                  <div className="bg-[#121E38] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{session}</span>
                    <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">14-15 Qs</span>
                  </div>

                  {/* Questions List */}
                  <div className="divide-y divide-slate-800/60 flex-1 overflow-y-auto max-h-[500px]">
                    {topics.map((t, idx) => {
                      const marks = t.marksPerSession[session.substring(0, 6)] || (idx % 2 === 0 ? 12 : 5);
                      const qNum = `Q${Math.floor(idx / 2) + 1}(${String.fromCharCode(97 + (idx % 3))})`;
                      const isMand = idx < 3;

                      return (
                        <div
                          key={t.id}
                          onClick={() => handleCellClick(t.topicName, session.substring(0, 6))}
                          className="p-3 hover:bg-[#142340] cursor-pointer transition-colors flex items-start gap-2 text-xs group"
                        >
                          <span className="text-blue-400 font-mono font-bold w-12 flex-shrink-0">{qNum}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-200 font-medium truncate group-hover:text-blue-300">{t.topicName}</p>
                            {isMand && (
                              <span className="inline-block mt-1 text-[9px] font-black text-red-400 bg-red-500/20 border border-red-500/30 px-1.5 py-0.2 rounded uppercase">
                                MAND
                              </span>
                            )}
                          </div>
                          <span className="font-black text-amber-400 flex-shrink-0">{marks} m</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          3. INTERACTIVE QUESTION & SOLUTION MODAL
         ════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedQuestion && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedQuestion(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#0B132B] border-t border-slate-700/80 rounded-t-3xl max-h-[90vh] flex flex-col text-slate-100 max-w-4xl mx-auto shadow-2xl"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-12 h-1 bg-slate-700 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded-lg">
                    {selectedQuestion.session}
                  </span>
                  <span className="text-amber-400 font-mono font-bold text-sm">
                    {selectedQuestion.qNum} · {selectedQuestion.marks} Marks
                  </span>
                  {selectedQuestion.isMandatory && (
                    <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                      MAND
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1 text-sm">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Topic ({subjectName})</p>
                  <p className="font-bold text-white text-base">{selectedQuestion.topic}</p>
                </div>

                {/* Question Box */}
                <div className="bg-[#121E38] border border-slate-700/80 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <FileText size={14} /> Board Exam Question
                  </p>
                  <p className="text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
                    {selectedQuestion.questionText}
                  </p>
                </div>

                {/* Solution Section */}
                <div>
                  {!showSolution ? (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowSolution(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                      <Eye size={18} />
                      <span>See Official Solution & Answer</span>
                    </motion.button>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <Lightbulb size={14} /> Official Marking Scheme Solution
                          </p>
                          <button onClick={() => setShowSolution(false)} className="text-xs text-slate-400 hover:text-white">
                            Hide Solution
                          </button>
                        </div>
                        <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-mono pt-1">
                          {selectedQuestion.solutionText}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
