// Signature moment: forging-scan animation
import { motion } from "framer-motion";

export default function ScanAnimation({ label = "Forging analysis" }) {
  return (
    <div className="relative w-full bg-[#1A1814] rounded-lg overflow-hidden p-12 text-[#FAF7F2]">
      <div className="relative h-32 flex items-end gap-1.5 justify-center mb-8">
        {Array.from({ length: 32 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-1.5 bg-[#D97706] rounded-full"
            initial={{ height: 6 }}
            animate={{ height: [6, 60 + Math.random() * 50, 6] }}
            transition={{ duration: 1.4, delay: i * 0.03, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
        <motion.div
          className="absolute inset-x-0 h-px bg-[#D97706]/40"
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-[0.22em] text-[#FAF7F2]/40 mb-2">SignalForge</div>
        <div className="font-serif text-2xl">{label}</div>
        <motion.div
          className="text-xs text-[#FAF7F2]/50 mt-3"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          Cross-referencing signals · weighing evidence · sealing verdict
        </motion.div>
      </div>
    </div>
  );
}