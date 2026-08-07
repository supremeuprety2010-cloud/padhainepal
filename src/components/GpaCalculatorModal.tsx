import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, X, Plus, Trash2, Info, ChevronDown, ChevronUp, GraduationCap, Award, Sparkles, Check } from 'lucide-react';
import GlassCard from './GlassCard';

export interface SubjectGrade {
  id: string;
  name: string;
  marks: number;
  creditHours: number;
}

export function marksToCdcGrade(marks: number): { grade: string; gp: number; remark: string; color: string } {
  if (marks >= 90) return { grade: 'A+', gp: 4.0, remark: 'Outstanding', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  if (marks >= 80) return { grade: 'A',  gp: 3.6, remark: 'Excellent',   color: 'text-green-600 bg-green-50 border-green-200' };
  if (marks >= 70) return { grade: 'B+', gp: 3.2, remark: 'Very Good',   color: 'text-blue-600 bg-blue-50 border-blue-200' };
  if (marks >= 60) return { grade: 'B',  gp: 2.8, remark: 'Good',        color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
  if (marks >= 50) return { grade: 'C+', gp: 2.4, remark: 'Satisfactory',color: 'text-amber-600 bg-amber-50 border-amber-200' };
  if (marks >= 40) return { grade: 'C',  gp: 2.0, remark: 'Acceptable',  color: 'text-orange-600 bg-orange-50 border-orange-200' };
  if (marks >= 35) return { grade: 'D',  gp: 1.6, remark: 'Basic',       color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
  return { grade: 'NG', gp: 0.0, remark: 'Non-Graded', color: 'text-red-600 bg-red-50 border-red-200' };
}

export function calculateCdcGpa(subjects: SubjectGrade[]): { gpa: number; remark: string; color: string } {
  if (!subjects.length) return { gpa: 0, remark: 'No subjects', color: 'text-gray-500' };
  let totalWeightedGp = 0;
  let totalCreditHours = 0;

  for (const s of subjects) {
    const { gp } = marksToCdcGrade(s.marks);
    totalWeightedGp += gp * s.creditHours;
    totalCreditHours += s.creditHours;
  }

  if (totalCreditHours === 0) return { gpa: 0, remark: 'Invalid credit hours', color: 'text-gray-500' };
  const gpa = Number((totalWeightedGp / totalCreditHours).toFixed(2));

  if (gpa >= 3.6) return { gpa, remark: 'Outstanding (A+ / A)', color: 'text-emerald-600' };
  if (gpa >= 3.2) return { gpa, remark: 'Very Good (B+)', color: 'text-blue-600' };
  if (gpa >= 2.8) return { gpa, remark: 'Good (B)', color: 'text-indigo-600' };
  if (gpa >= 2.4) return { gpa, remark: 'Satisfactory (C+)', color: 'text-amber-600' };
  if (gpa >= 2.0) return { gpa, remark: 'Acceptable (C)', color: 'text-orange-600' };
  if (gpa >= 1.6) return { gpa, remark: 'Basic (D)', color: 'text-yellow-700' };
  return { gpa, remark: 'Non-Graded (NG)', color: 'text-red-600' };
}

const CDC_SCALE_INFO = [
  { range: '90 - 100%', grade: 'A+', gp: '4.0', remark: 'Outstanding' },
  { range: '80 - 89%',  grade: 'A',  gp: '3.6', remark: 'Excellent' },
  { range: '70 - 79%',  grade: 'B+', gp: '3.2', remark: 'Very Good' },
  { range: '60 - 69%',  grade: 'B',  gp: '2.8', remark: 'Good' },
  { range: '50 - 59%',  grade: 'C+', gp: '2.4', remark: 'Satisfactory' },
  { range: '40 - 49%',  grade: 'C',  gp: '2.0', remark: 'Acceptable' },
  { range: '35 - 39%',  grade: 'D',  gp: '1.6', remark: 'Basic' },
  { range: 'Below 35%', grade: 'NG', gp: '0.0', remark: 'Non-Graded' },
];

interface GpaCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSubjects?: string[];
  userGrade?: number;
}

export default function GpaCalculatorModal({ isOpen, onClose, userSubjects = [], userGrade }: GpaCalculatorModalProps) {
  const defaultSubjects = userSubjects.length > 0 ? userSubjects : ['Mathematics', 'Science', 'English', 'Nepali', 'Social Studies'];

  const [subjects, setSubjects] = useState<SubjectGrade[]>(() =>
    defaultSubjects.map((s, idx) => ({
      id: `s-${idx}-${Date.now()}`,
      name: s,
      marks: 82, // default example mark
      creditHours: 4,
    }))
  );

  const [newSubName, setNewSubName] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [showScaleTable, setShowScaleTable] = useState(false);

  const { gpa, remark, color: gpaColor } = calculateCdcGpa(subjects);

  const updateMarks = (id: string, newMarks: number) => {
    const clamped = Math.min(100, Math.max(0, newMarks));
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, marks: clamped } : s));
  };

  const updateCreditHours = (id: string, hours: number) => {
    const clamped = Math.min(8, Math.max(1, hours));
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, creditHours: clamped } : s));
  };

  const addSubject = () => {
    if (!newSubName.trim()) return;
    setSubjects(prev => [
      ...prev,
      { id: `s-${Date.now()}`, name: newSubName.trim(), marks: 75, creditHours: 4 }
    ]);
    setNewSubName('');
    setShowAddInput(false);
  };

  const removeSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 px-5 pt-5 pb-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <GraduationCap size={13} /> CDC / NEB Nepal
              </span>
              {userGrade && <span className="text-blue-100 text-xs font-medium">Grade {userGrade}</span>}
            </div>

            <h2 className="text-xl font-black flex items-center gap-2">
              <Calculator size={22} className="text-amber-300" /> CDC GPA Calculator
            </h2>
            <p className="text-blue-100 text-xs mt-0.5">
              Adjust obtained marks per subject to calculate your official GPA according to Nepal CDC grading scale.
            </p>

            {/* GPA Result Display Banner */}
            <div className="mt-4 bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-100 font-semibold uppercase tracking-wider">Estimated CDC GPA</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-4xl font-black text-white tracking-tight">{gpa.toFixed(2)}</span>
                  <span className="text-sm font-bold text-amber-300">/ 4.00</span>
                </div>
                <p className="text-xs text-blue-100 font-medium mt-0.5 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-300" /> {remark}
                </p>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-white/20 flex flex-col items-center justify-center border border-white/30 text-white shadow-inner">
                <Award size={24} className="text-amber-300" />
                <span className="text-[10px] font-bold mt-0.5">CDC Scale</span>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* CDC Grading System Guide Collapse */}
            <div className="border border-blue-100 rounded-2xl overflow-hidden bg-blue-50/40">
              <button
                onClick={() => setShowScaleTable(prev => !prev)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-blue-800 hover:bg-blue-100/50 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Info size={14} className="text-blue-600" /> CDC Nepal Grading System Reference
                </span>
                {showScaleTable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              <AnimatePresence>
                {showScaleTable && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-3 pt-1 border-t border-blue-100/60 overflow-x-auto"
                  >
                    <table className="w-full text-xs text-left text-gray-700">
                      <thead>
                        <tr className="border-b border-blue-200 text-blue-900 font-bold">
                          <th className="py-1">Interval %</th>
                          <th className="py-1">Grade</th>
                          <th className="py-1">GP</th>
                          <th className="py-1">Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {CDC_SCALE_INFO.map((row, i) => (
                          <tr key={i} className="border-b border-blue-100/50 hover:bg-blue-100/30">
                            <td className="py-1 font-medium">{row.range}</td>
                            <td className="py-1 font-bold text-blue-700">{row.grade}</td>
                            <td className="py-1 font-bold">{row.gp}</td>
                            <td className="py-1 text-gray-600">{row.remark}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Subject List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  Subject Marks ({subjects.length})
                </h3>
                <span className="text-xs text-gray-400">Slide to adjust marks</span>
              </div>

              {subjects.map((s) => {
                const { grade, gp, remark: subRemark, color } = marksToCdcGrade(s.marks);

                return (
                  <GlassCard key={s.id} className="p-3.5 border border-gray-100 hover:border-blue-200 transition-all">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-gray-800 text-sm truncate block">{s.name}</span>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                          <span>Credit Hours:</span>
                          <select
                            value={s.creditHours}
                            onChange={(e) => updateCreditHours(s.id, Number(e.target.value))}
                            className="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 font-bold text-gray-700 text-xs focus:outline-none focus:border-blue-400"
                          >
                            {[1, 2, 3, 4, 5].map(ch => (
                              <option key={ch} value={ch}>{ch} Cr</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Grade Badge */}
                      <div className="flex items-center gap-2">
                        <div className={`px-2.5 py-1 rounded-xl border text-center ${color}`}>
                          <p className="text-sm font-black leading-none">{grade}</p>
                          <p className="text-[10px] font-bold opacity-80 mt-0.5">{gp.toFixed(1)} GP</p>
                        </div>

                        <button
                          onClick={() => removeSubject(s.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          title="Remove subject"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Marks Slider & Number Input */}
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Marks Obtained:</span>
                        <div className="flex items-center gap-1 font-bold text-gray-800">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={s.marks}
                            onChange={(e) => updateMarks(s.id, Number(e.target.value))}
                            className="w-14 bg-gray-100 border border-gray-200 rounded-lg px-2 py-0.5 text-right font-black text-sm text-blue-700 focus:outline-none focus:border-blue-400"
                          />
                          <span className="text-gray-400 text-xs">/ 100</span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={s.marks}
                        onChange={(e) => updateMarks(s.id, Number(e.target.value))}
                        className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </GlassCard>
                );
              })}

              {subjects.length === 0 && (
                <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-500 text-sm">No subjects added.</p>
                  <p className="text-gray-400 text-xs mt-1">Add subjects below to calculate GPA.</p>
                </div>
              )}
            </div>

            {/* Add Subject Section */}
            {showAddInput ? (
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3 flex gap-2 items-center">
                <input
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="Subject name (e.g. Accountancy)"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && addSubject()}
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-400"
                />
                <button
                  onClick={addSubject}
                  className="bg-blue-600 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddInput(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-200/50"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddInput(true)}
                className="w-full py-3 border-2 border-dashed border-blue-200 rounded-2xl text-blue-600 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-50/50 transition-colors"
              >
                <Plus size={16} /> Add Subject
              </button>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
            <div className="text-xs text-gray-500">
              Target CDC GPA: <span className="font-bold text-blue-600">{gpa.toFixed(2)}</span>
            </div>
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm shadow-md shadow-blue-200 transition-colors flex items-center gap-1"
            >
              <Check size={16} /> Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
