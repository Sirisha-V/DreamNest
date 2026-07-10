import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  open: boolean;
  onClose: () => void;
}

const Toast = ({ message, open, onClose }: ToastProps) => {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timer);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="toast"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default Toast;
