import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircleAlert } from "../Common/Icon";

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
            z-100 
            shadow-lg 
            flex 
            items-center 
            gap-2 
            justify-center 
            ${severity === "error" ? "bg-error" : severity === "warning" ? "bg-warning" : "bg-success"
          }`}
        >
          <CircleAlert size={20} />
          <span className="text-sm font-medium">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlertComponent;
