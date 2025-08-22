'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, Variants } from 'framer-motion'

interface DoctorInteractiveLandingProps {
  doctor: {
    name: string
    email: string
  }
}

export default function DoctorInteractiveLanding({ doctor }: DoctorInteractiveLandingProps) {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'prescription'>('dashboard')
  const [isHovering, setIsHovering] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [destinationPage, setDestinationPage] = useState<string>('')
  const router = useRouter()

  // Handle navigation with loading animation
  const handleNavigation = (path: string, pageName: string) => {
    setIsNavigating(true)
    setDestinationPage(pageName)
    
    // Simulate loading time for smooth transition
    setTimeout(() => {
      router.push(path)
    }, 1500)
  }

  const containerVariants: Variants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1, 
      transition: { 
        duration: 0.6,
        staggerChildren: 0.2
      } 
    }
  }

  const sectionVariants: Variants = {
    inactive: { 
      flex: 1,
      filter: 'brightness(0.8)',
      transition: { duration: 0.8, ease: 'easeInOut' }
    },
    active: { 
      flex: 2.5,
      filter: 'brightness(1)',
      transition: { duration: 0.8, ease: 'easeInOut' }
    },
    hover: {
      filter: 'brightness(1.1)',
      transition: { duration: 0.3 }
    }
  }

  const contentVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.6,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 }
    }
  }

  const buttonVariants: Variants = {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: { 
        delay: 0.8,
        type: 'spring',
        stiffness: 200,
        damping: 15
      }
    },
    hover: { 
      scale: 1.05,
      y: -2,
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.95 }
  }

  const iconVariants: Variants = {
    initial: { rotate: 0 },
    animate: { 
      rotate: 360,
      transition: { 
        duration: 2,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatDelay: 3
      }
    }
  }

  // Loading overlay when navigating
  const LoadingOverlay = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div className="text-center">
        {/* Animated Logo */}
        <motion.div 
          className="w-24 h-24 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-2xl"
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7z"/>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
        </motion.div>
        
        <motion.h3 
          className="text-2xl font-bold text-white mb-2"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Opening {destinationPage}
        </motion.h3>
        
        <motion.div 
          className="flex space-x-1 justify-center"
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-2 h-2 bg-blue-400 rounded-full"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: index * 0.2
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  )

  return (
    <>
      <motion.div 
        className="min-h-screen flex flex-col lg:flex-row overflow-hidden relative"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {/* Floating Welcome Message */}
        <motion.div 
          className="absolute top-4 sm:top-8 left-1/2 transform -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg mx-4"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <p className="text-gray-800 font-medium text-xs sm:text-sm text-center">
            Welcome back, <span className="text-blue-600 font-bold">Dr. {doctor.name}</span>! 👋
          </p>
        </motion.div>

        {/* Dashboard Section */}
        <motion.div
          className="relative cursor-pointer bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex flex-col justify-center items-center text-white overflow-hidden min-h-[50vh] lg:min-h-screen"
          variants={sectionVariants}
          animate={activeSection === 'dashboard' ? 'active' : 'inactive'}
          whileHover="hover"
          onClick={() => setActiveSection('dashboard')}
          onHoverStart={() => setIsHovering('dashboard')}
          onHoverEnd={() => setIsHovering(null)}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-y-12"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform skew-y-12"></div>
          </div>

          {/* Floating Particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 sm:w-2 sm:h-2 bg-white/30 rounded-full"
              animate={{
                y: [-20, -100, -20],
                x: [0, Math.random() * 100 - 50, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
            />
          ))}

          <div className="relative z-10 text-center max-w-xs sm:max-w-md px-4 sm:px-8 py-8 sm:py-12">
            {/* Dashboard Icon */}
            <motion.div 
              className="mb-4 sm:mb-6 flex justify-center"
              variants={iconVariants}
              initial="initial"
              animate={activeSection === 'dashboard' ? 'animate' : 'initial'}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {activeSection === 'dashboard' ? (
                <motion.div
                  key="dashboard-active"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                    Dashboard
                  </h2>
                  <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 text-blue-100 leading-relaxed">
                    Manage your patients, view prescriptions, and access all medical records in one comprehensive dashboard.
                  </p>
                  <motion.button
                    className="bg-white text-blue-700 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg shadow-xl"
                    variants={buttonVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => handleNavigation('/doctor/raw-prescriptions', 'Dashboard')}
                  >
                    Enter Dashboard →
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="dashboard-inactive"
                  variants={contentVariants}
                  initial="visible"
                  animate="hidden"
                >
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Dashboard</h3>
                  <p className="text-blue-200 text-sm sm:text-base">Click to expand</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Hover Effect Overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent"
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ 
              opacity: isHovering === 'dashboard' ? 1 : 0,
              x: isHovering === 'dashboard' ? '0%' : '-100%'
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>

        {/* Prescription Section */}
        <motion.div
          className="relative cursor-pointer bg-gradient-to-br from-green-600 via-green-700 to-green-900 flex flex-col justify-center items-center text-white overflow-hidden min-h-[50vh] lg:min-h-screen"
          variants={sectionVariants}
          animate={activeSection === 'prescription' ? 'active' : 'inactive'}
          whileHover="hover"
          onClick={() => setActiveSection('prescription')}
          onHoverStart={() => setIsHovering('prescription')}
          onHoverEnd={() => setIsHovering(null)}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/20 to-transparent transform skew-y-12"></div>
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/10 to-transparent transform -skew-y-12"></div>
          </div>

          {/* Floating Pills Animation */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-4 sm:w-3 sm:h-6 bg-white/20 rounded-full"
              animate={{
                y: [0, -50, 0],
                rotate: [0, 180, 360],
                opacity: [0.2, 0.8, 0.2]
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
            />
          ))}

          <div className="relative z-10 text-center max-w-xs sm:max-w-md px-4 sm:px-8 py-8 sm:py-12">
            {/* Prescription Icon */}
            <motion.div 
              className="mb-4 sm:mb-6 flex justify-center"
              variants={iconVariants}
              initial="initial"
              animate={activeSection === 'prescription' ? 'animate' : 'initial'}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {activeSection === 'prescription' ? (
                <motion.div
                  key="prescription-active"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                    Write Prescription
                  </h2>
                  <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 text-green-100 leading-relaxed">
                    Create custom prescriptions from scratch with our intuitive writing interface. Perfect for walk-in patients.
                  </p>
                  <motion.button
                    className="bg-white text-green-700 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg shadow-xl"
                    variants={buttonVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => handleNavigation('/doctor/prescription-pad', 'Prescription Pad')}
                  >
                    Start Writing ✏️
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="prescription-inactive"
                  variants={contentVariants}
                  initial="visible"
                  animate="hidden"
                >
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Write Rx</h3>
                  <p className="text-green-200 text-sm sm:text-base">Click to expand</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Hover Effect Overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-l from-green-400/20 to-transparent"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ 
              opacity: isHovering === 'prescription' ? 1 : 0,
              x: isHovering === 'prescription' ? '0%' : '100%'
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>

        {/* Divider Line - Hidden on mobile */}
        <motion.div 
          className="absolute left-1/2 top-1/4 bottom-1/4 w-1 bg-white/30 transform -translate-x-1/2 z-20 hidden lg:block"
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        />

        {/* Mobile Divider - Horizontal line */}
        <motion.div 
          className="absolute top-1/2 left-1/4 right-1/4 h-1 bg-white/30 transform -translate-y-1/2 z-20 lg:hidden"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        />
      </motion.div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isNavigating && <LoadingOverlay />}
      </AnimatePresence>
    </>
  )
}
