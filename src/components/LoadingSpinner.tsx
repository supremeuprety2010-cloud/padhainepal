export default function LoadingSpinner({ size = 'md', text }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin`} style={{ borderWidth: 3 }} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}
