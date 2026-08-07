import { useNavigate } from 'react-router-dom';

/**
 * Returns a back function that navigates to `fallback` if there's no
 * browser history to go back to (e.g. user opened the page directly).
 */
export function useSmartBack(fallback = '/home') {
  const navigate = useNavigate();
  return () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  };
}
