'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'

interface DoctorInteractiveLandingProps {
  doctor: {
    name: string
    email: string
  }
}

export default function DoctorInteractiveLanding({ doctor }: DoctorInteractiveLandingProps) {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'prescription'>('dashboard')
  const [isHovering, setIsHovering] = useState<string | null>(null)

  const containerVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.6 } }
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

  return (
    <motion.div 
      className="h-screen flex overflow-hidden relative"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Floating Welcome Message */}
      <motion.div 
        className="absolute top-8 left-1/2 transform -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <p className="text-gray-800 font-medium">
          Welcome back, <span className="text-blue-600 font-bold">Dr. {doctor.name}</span>! 👋
        </p>
      </motion.div>

      {/* Dashboard Section */}
      <motion.div
        className="relative cursor-pointer bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex flex-col justify-center items-center text-white overflow-hidden"
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
            className="absolute w-2 h-2 bg-white/30 rounded-full"
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

        <div className="relative z-10 text-center max-w-md px-8">
          {/* Dashboard Icon */}
          <motion.div 
            className="mb-6 flex justify-center"
            variants={iconVariants}
            initial="initial"
            animate={activeSection === 'dashboard' ? 'animate' : 'initial'}
          >
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </motion.div>

          {activeSection === 'dashboard' ? (
            <motion.div
              key="dashboard-active"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Dashboard
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Manage your patients, view prescriptions, and access all medical records in one comprehensive dashboard.
              </p>
              <Link href="/doctor/raw-prescriptions">
                <motion.button
                  className="bg-white text-blue-700 px-8 py-4 rounded-full font-semibold text-lg shadow-xl"
                  variants={buttonVariants}
                  initial="initial"
                  animate="animate"
                  whileHover="hover"
                  whileTap="tap"
                >
                  Enter Dashboard →
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard-inactive"
              variants={contentVariants}
              initial="visible"
              animate="hidden"
            >
              <h3 className="text-3xl font-bold mb-2">Dashboard</h3>
              <p className="text-blue-200">Click to expand</p>
            </motion.div>
          )}
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
        className="relative cursor-pointer bg-gradient-to-br from-green-600 via-green-700 to-green-900 flex flex-col justify-center items-center text-white overflow-hidden"
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
            className="absolute w-3 h-6 bg-white/20 rounded-full"
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

        <div className="relative z-10 text-center max-w-md px-8">
          {/* Prescription Icon */}
          <motion.div 
            className="mb-6 flex justify-center"
            variants={iconVariants}
            initial="initial"
            animate={activeSection === 'prescription' ? 'animate' : 'initial'}
          >
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </motion.div>

          {activeSection === 'prescription' ? (
            <motion.div
              key="prescription-active"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                Write Prescription
              </h2>
              <p className="text-xl mb-8 text-green-100">
                Create custom prescriptions from scratch with our intuitive writing interface. Perfect for walk-in patients.
              </p>
              <Link href="/doctor/prescription-pad">
                <motion.button
                  className="bg-white text-green-700 px-8 py-4 rounded-full font-semibold text-lg shadow-xl"
                  variants={buttonVariants}
                  initial="initial"
                  animate="animate"
                  whileHover="hover"
                  whileTap="tap"
                >
                  Start Writing ✏️
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="prescription-inactive"
              variants={contentVariants}
              initial="visible"
              animate="hidden"
            >
              <h3 className="text-3xl font-bold mb-2">Write Rx</h3>
              <p className="text-green-200">Click to expand</p>
            </motion.div>
          )}
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

      {/* Divider Line */}
      <motion.div 
       
      />
    </motion.div>
  )
}
