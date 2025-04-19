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
              className="relative bg-green-100 p-6 rounded-full"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
              }}
              transition={{ 
                type: "spring",
                damping: 12,
                stiffness: 200
              }}
            >
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ 
                  delay: 0.2, 
                  duration: 0.5, 
                  ease: "easeOut" 
                }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <svg 
                  className="w-20 h-20" 
                  viewBox="0 0 50 50"
                  stroke="#22c55e"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    d="M 10,25 L 20,35 L 40,15"
                  />
                </svg>
              </motion.div>
              
              <motion.div
                className="absolute -inset-1 rounded-full opacity-50"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ 
                  delay: 0.1, 
                  duration: 0.8,
                  times: [0, 0.6, 1]
                }}
                style={{
                  background: "radial-gradient(circle, rgba(74, 222, 128, 0.4) 0%, rgba(74, 222, 128, 0) 70%)"
                }}
              />
              
              <Check className="h-14 w-14 text-green-600 opacity-0" />
            </motion.div>
          )}
          
          {step === 1 && (
            <>
              <motion.div
                className="mb-4 relative"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <svg width="200" height="170" viewBox="0 0 800 680" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Background circle */}
                  <motion.circle 
                    cx="400" 
                    cy="340" 
                    r="320" 
                    fill="#F0F9FF"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                  
                  {/* Dog body */}
                  <motion.path 
                    d="M460,360 C450,400 420,440 370,460 C320,480 250,480 200,460 C150,440 130,390 120,350 C110,310 120,270 130,240 C140,210 160,170 200,150 C240,130 280,130 320,140 C360,150 400,180 420,220 C440,260 450,290 460,360 Z" 
                    fill="#F9B17A"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                  
                  {/* Left ear */}
                  <motion.path 
                    d="M210,160 C190,130 150,110 120,130 C90,150 80,190 100,230 C120,270 150,290 190,280 C230,270 240,210 210,160 Z" 
                    fill="#E89B6D"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  />
                  
                  {/* Right ear */}
                  <motion.path 
                    d="M330,150 C350,120 400,110 430,140 C460,170 460,210 440,240 C420,270 390,280 360,260 C330,240 310,180 330,150 Z" 
                    fill="#E89B6D"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  />
                  
                  {/* Dog snout */}
                  <motion.path 
                    d="M250,330 C250,300 270,280 300,280 C330,280 350,300 350,330 C350,360 330,390 300,390 C270,390 250,360 250,330 Z" 
                    fill="#FFDBC2"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  />
                  
                  {/* Left eye */}
                  <motion.circle 
                    cx="250" 
                    cy="260" 
                    r="15" 
                    fill="#333333"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.7 }}
                  />
                  
                  {/* Right eye */}
                  <motion.circle 
                    cx="350" 
                    cy="260" 
                    r="15" 
                    fill="#333333"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.7 }}
                  />
                  
                  {/* Nose */}
                  <motion.circle 
                    cx="300" 
                    cy="330" 
                    r="20" 
                    fill="#333333"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.8 }}
                  />
                  
                  {/* Mouth */}
                  <motion.path 
                    d="M260,350 C280,380 320,380 340,350" 
                    stroke="#333333"
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                  />
                  
                  {/* Tongue */}
                  <motion.path 
                    d="M290,370 C300,390 310,390 320,370" 
                    fill="#FF6B6B"
                    stroke="#FF6B6B"
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ 
                      opacity: [0, 1, 1, 0],
                      y: [-10, 0, 0, -10]
                    }}
                    transition={{ 
                      duration: 2,
                      delay: 1.2,
                      repeat: Infinity,
                      repeatType: "loop",
                      times: [0, 0.1, 0.9, 1]
                    }}
                  />

                  {/* Tail */}
                  <motion.path 
                    d="M450,330 C480,310 510,300 540,310 C570,320 590,350 580,380 C570,410 540,420 510,410"
                    stroke="#F9B17A"
                    strokeWidth="25"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ 
                      pathLength: 1,
                      opacity: 1,
                      rotate: [0, 5, -5, 5, -5, 0],
                    }}
                    transition={{ 
                      pathLength: { duration: 0.5, delay: 0.5 },
                      opacity: { duration: 0.5, delay: 0.5 },
                      rotate: { 
                        duration: 1.5, 
                        delay: 1.0, 
                        repeat: Infinity,
                        repeatType: "mirror",
                        ease: "easeInOut"
                      }
                    }}
                    style={{
                      originX: "450px",
                      originY: "330px"
                    }}
                  />
                  
                  {/* Collar */}
                  <motion.path 
                    d="M240,420 C270,440 330,440 360,420" 
                    stroke="#4f46e5"
                    strokeWidth="12"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 1 }}
                  />
                  
                  {/* Collar tag */}
                  <motion.circle 
                    cx="300" 
                    cy="435" 
                    r="10" 
                    fill="#FFD700"
                    initial={{ scale: 0 }}
                    animate={{ 
                      scale: 1,
                      y: [0, -3, 0, -3, 0]
                    }}
                    transition={{ 
                      scale: { duration: 0.3, delay: 1.1 },
                      y: { 
                        duration: 1, 
                        delay: 1.5, 
                        repeat: Infinity,
                        repeatType: "loop",
                        times: [0, 0.25, 0.5, 0.75, 1]
                      }
                    }}
                  />
                  
                  {/* Celebratory stars/particles */}
                  {[...Array(12)].map((_, i) => (
                    <motion.g key={i}>
                      <motion.circle
                        cx={400 + Math.cos(i * Math.PI / 6) * 250}
                        cy={340 + Math.sin(i * Math.PI / 6) * 250}
                        r="8"
                        fill={i % 3 === 0 ? "#FFD700" : (i % 3 === 1 ? "#4f46e5" : "#FF6B6B")}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: [0, 1.5, 0],
                          opacity: [0, 1, 0],
                          x: [0, Math.cos(i * Math.PI / 6) * 40],
                          y: [0, Math.sin(i * Math.PI / 6) * 40]
                        }}
                        transition={{ 
                          duration: 2,
                          delay: 1 + (i * 0.1),
                          repeat: Infinity,
                          repeatType: "loop",
                          repeatDelay: 1
                        }}
                      />
                      <motion.path
                        d={`M${400 + Math.cos((i + 0.5) * Math.PI / 6) * 200},${340 + Math.sin((i + 0.5) * Math.PI / 6) * 200} l5,0 l-5,5 l-5,-5 l5,0 l0,-5 l0,5 Z`}
                        fill={i % 3 === 0 ? "#4f46e5" : (i % 3 === 1 ? "#FFD700" : "#FF6B6B")}
                        initial={{ scale: 0, opacity: 0, rotate: 0 }}
                        animate={{ 
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0],
                          rotate: [0, 180],
                          x: [0, Math.cos((i + 0.5) * Math.PI / 6) * 60],
                          y: [0, Math.sin((i + 0.5) * Math.PI / 6) * 60]
                        }}
                        transition={{ 
                          duration: 2.5,
                          delay: 1.5 + (i * 0.1),
                          repeat: Infinity,
                          repeatType: "loop",
                          repeatDelay: 0.5
                        }}
                      />
                    </motion.g>
                  ))}
                </svg>
              </motion.div>
              
              <motion.h3 
                className="text-2xl font-bold text-gray-900 mb-2 text-center"
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: 0.4,
                  type: "spring",
                  damping: 12 
                }}
              >
                Woohoo! Walk Booked!
              </motion.h3>
              
              <motion.p 
                className="text-gray-600 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Finn can't wait to go on this adventure!
              </motion.p>
              
              <motion.div
                className="mt-4 inline-flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: [0.8, 1.05, 1],
                  y: [20, 0]
                }}
                transition={{ 
                  delay: 0.8, 
                  duration: 0.5,
                  times: [0, 0.7, 1]
                }}
              >
                <motion.span 
                  className="text-sm bg-blue-100 text-blue-800 font-medium px-3 py-1 rounded-full"
                  whileHover={{ scale: 1.05 }}
                  animate={{ 
                    boxShadow: ["0 0 0 rgba(79, 70, 229, 0)", "0 0 10px rgba(79, 70, 229, 0.3)", "0 0 0 rgba(79, 70, 229, 0)"]
                  }}
                  transition={{
                    boxShadow: {
                      repeat: Infinity,
                      duration: 2,
                    }
                  }}
                >
                  💙 Thanks for walking Finn! 💙
                </motion.span>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BookingAnimation;