import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Severity = "success" | "warning" | "error";

interface AlertComponentProps {
  open: boolean;
  message: string;
  severity: Severity;
  autoHideDuration?: number;
  setOpen: (value: boolean) => void;
}

const AlertComponent: React.FC<AlertComponentProps> = ({
  open,
  message,
  severity,
  autoHideDuration = 5000,
  setOpen,
}) => {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setOpen(false);
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [open, autoHideDuration, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -20, x: "-50%" }}
          transition={{ duration: 0.3 }}
          className={`
            fixed 
            top-4 
            left-1/2 
            p-4 
            rounded-md 
            text-white 
            w-80 
            text-center 
            z-50 
            shadow-lg 
            flex 
            items-center 
            gap-2 
            justify-center 
            ${severity === "error" ? "bg-error" : severity === "warning" ? "bg-warning" : "bg-success"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11 10.98a1 1 0 1 1 2 0v6a1 1 0 1 1-2 0zm1-4.929a1 1 0 1 0 0 2a1 1 0 0 0 0-2" />
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10S17.523 2 12 2M4 12a8 8 0 1 0 16 0a8 8 0 0 0-16 0"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlertComponent;
