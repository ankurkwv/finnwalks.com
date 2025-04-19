import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface BookingAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
}

const BookingAnimation: React.FC<BookingAnimationProps> = ({ isVisible, onComplete }) => {
  const [step, setStep] = useState(0);
  
  // Reset and start animation when visibility changes
  useEffect(() => {
    if (isVisible) {
      setStep(0);
      const timer = setTimeout(() => {
        setStep(1); // Show dog after success checkmark
        
        // Complete animation and call onComplete callback
        const completeTimer = setTimeout(() => {
          onComplete();
        }, 3000); // Total animation time
        
        return () => clearTimeout(completeTimer);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);
  
  // Don't render anything if not visible
  if (!isVisible) return null;
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <motion.div 
          className="bg-white rounded-xl p-8 flex flex-col items-center shadow-2xl max-w-sm w-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          {step === 0 && (
            <motion.div 
              className="bg-green-100 p-4 rounded-full"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Check className="h-14 w-14 text-green-600" />
            </motion.div>
          )}
          
          {step === 1 && (
            <>
              <motion.div
                className="mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <svg width="120" height="120" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Dog silhouette */}
                  <motion.path 
                    d="M300,170 C320,160 340,160 350,180 C360,200 350,220 330,230 C320,240 310,230 300,220 C290,210 280,200 260,190 C240,180 220,180 200,190 C180,200 170,210 160,230 C150,250 140,270 130,290 C120,310 100,320 80,310 C60,300 50,280 60,260 C70,240 90,230 110,240 C130,250 140,270 160,280 C180,290 200,290 220,280 C240,270 250,250 260,230 C270,210 280,190 300,170 Z"
                    fill="#F9B17A"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />

                  {/* Dog ear */}
                  <motion.path 
                    d="M330,180 C340,170 350,150 340,130 C330,110 310,100 290,110 C270,120 260,140 270,160 C280,180 290,190 310,190 C320,190 325,185 330,180 Z"
                    fill="#E89B6D"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  />

                  {/* Dog eye */}
                  <motion.circle 
                    cx="310" 
                    cy="170" 
                    r="8" 
                    fill="#333333"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1 }}
                  />

                  {/* Dog nose */}
                  <motion.circle 
                    cx="340" 
                    cy="190" 
                    r="10" 
                    fill="#333333"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.2 }}
                  />

                  {/* Tail wagging animation */}
                  <motion.path 
                    d="M120,290 C100,280 80,260 70,240 C60,220 50,200 60,180 C70,160 90,150 110,160"
                    stroke="#F9B17A"
                    strokeWidth="15"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ 
                      pathLength: 1,
                      opacity: 1,
                      rotate: [0, 10, -10, 10, -10, 0],
                    }}
                    transition={{ 
                      pathLength: { duration: 0.8, delay: 0.8 },
                      opacity: { duration: 0.8, delay: 0.8 },
                      rotate: { 
                        duration: 1.5, 
                        delay: 1.5, 
                        repeat: Infinity,
                        repeatType: "mirror"
                      }
                    }}
                  />

                  {/* Celebratory stars/particles */}
                  {[...Array(8)].map((_, i) => (
                    <motion.circle
                      key={i}
                      cx={200 + Math.cos(i * Math.PI / 4) * 150}
                      cy={200 + Math.sin(i * Math.PI / 4) * 150}
                      r="6"
                      fill="#FFD700"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 1.5, 0],
                        opacity: [0, 1, 0],
                        x: [0, Math.cos(i * Math.PI / 4) * 30],
                        y: [0, Math.sin(i * Math.PI / 4) * 30]
                      }}
                      transition={{ 
                        duration: 1.5,
                        delay: 1.2 + (i * 0.1),
                        repeat: 2,
                        repeatType: "loop"
                      }}
                    />
                  ))}
                </svg>
              </motion.div>
              
              <motion.h3 
                className="text-xl font-bold text-gray-900 mb-2 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Walk Booked!
              </motion.h3>
              
              <motion.p 
                className="text-gray-600 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Finn is excited for the walk!
              </motion.p>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BookingAnimation;