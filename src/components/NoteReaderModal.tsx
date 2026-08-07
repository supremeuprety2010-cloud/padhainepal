import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Download, Bookmark, Share2, Check, Sparkles, FileText, Printer } from 'lucide-react';
import GlassCard from './GlassCard';

export interface NoteItem {
  id: number;
  title: string;
  subject_name: string;
  grade?: number;
  content: string;
  created_at?: string;
}

interface NoteReaderModalProps {
  note: NoteItem | null;
  isOpen: boolean;
  onClose: () => void;
  onBookmark?: (note: NoteItem) => void;
  isBookmarked?: boolean;
}

export default function NoteReaderModal({ note, isOpen, onClose, onBookmark, isBookmarked = false }: NoteReaderModalProps) {
  const [downloaded, setDownloaded] = useState(false);
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  if (!isOpen || !note) return null;

  const handleDownload = () => {
    try {
      // Create clean plain text / markdown file for student download
      const header = `========================================================\nPADHAINEPAL — ${note.title.toUpperCase()}\nSubject: ${note.subject_name} ${note.grade ? `| Grade ${note.grade}` : ''}\nDownloaded: ${new Date().toLocaleDateString()}\n========================================================\n\n`;
      const fullText = header + note.content.replace(/#+\s/g, '').replace(/\*\*/g, '');

      const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${note.title.replace(/[^a-zA-Z0-9]/g, '_')}_Notes.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  const handleBookmarkToggle = () => {
    setBookmarked(prev => !prev);
    if (onBookmark) onBookmark(note);
  };

  // Convert simple markdown headings & bullet points to clean JSX
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      if (!trimmed) return <div key={idx} className="h-2" />;

      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-xl font-black text-gray-900 border-b border-gray-200 pb-2 mt-4 mb-3">
            {trimmed.replace('# ', '')}
          </h1>
        );
      }

      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-base font-bold text-blue-900 bg-blue-50/70 border-l-4 border-blue-600 px-3 py-1.5 rounded-r-xl mt-4 mb-2">
            {trimmed.replace('## ', '')}
          </h2>
        );
      }

      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-sm font-bold text-gray-800 mt-3 mb-1">
            {trimmed.replace('### ', '')}
          </h3>
        );
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const text = trimmed.replace(/^[-*]\s/, '');
        return (
          <li key={idx} className="text-sm text-gray-700 ml-4 list-disc leading-relaxed my-1">
            <span dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          </li>
        );
      }

      if (trimmed.startsWith('|')) {
        return (
          <p key={idx} className="font-mono text-xs text-blue-950 bg-gray-100 p-2 rounded-lg my-1 overflow-x-auto whitespace-pre">
            {trimmed}
          </p>
        );
      }

      return (
        <p
          key={idx}
          className="text-sm text-gray-700 leading-relaxed my-1.5"
          dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>') }}
        />
      );
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10"
        >
          {/* Top Bar */}
          <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 px-5 pt-4 pb-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {note.subject_name}
                  </span>
                  {note.grade && (
                    <span className="text-teal-100 text-xs font-semibold">Grade {note.grade}</span>
                  )}
                </div>
                <h2 className="font-bold text-white text-sm sm:text-base truncate mt-0.5">{note.title}</h2>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleBookmarkToggle}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  bookmarked ? 'bg-amber-400 text-amber-950' : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
                title={bookmarked ? 'Bookmarked' : 'Bookmark note'}
              >
                <Bookmark size={17} fill={bookmarked ? 'currentColor' : 'none'} />
              </motion.button>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Action Bar (Download & Read) */}
          <div className="bg-teal-50/80 border-b border-teal-100 px-5 py-2.5 flex items-center justify-between gap-3 text-xs">
            <span className="text-teal-800 font-semibold flex items-center gap-1">
              <Sparkles size={13} className="text-teal-600" /> CDC NEB Verified Study Material
            </span>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleDownload}
              className={`font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${
                downloaded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              {downloaded ? <Check size={14} /> : <Download size={14} />}
              <span>{downloaded ? 'Downloaded!' : 'Download Note'}</span>
            </motion.button>
          </div>

          {/* Note Reader Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-white space-y-1 selection:bg-teal-100 selection:text-teal-900">
            {renderFormattedContent(note.content)}
          </div>

          {/* Footer Bar */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 px-5">
            <span>📖 Read online or download anytime</span>
            <button
              onClick={handleDownload}
              className="text-teal-700 font-bold hover:underline flex items-center gap-1"
            >
              <Download size={13} /> Save to device
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
