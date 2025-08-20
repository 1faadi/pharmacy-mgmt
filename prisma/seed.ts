import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create roles
  const roles = ['ADMIN', 'DOCTOR', 'DISPENSER']
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName }
    })
  }

  // Create users
  const users = [
    {
      email: 'admin@pharmacy.com',
      displayName: 'System Admin',
      password: 'admin123',
      roles: ['ADMIN']
    },
    {
      email: 'doctor@pharmacy.com',
      displayName: 'Dr. John Smith',
      password: 'doctor123',
      roles: ['DOCTOR']
    },
    {
      email: 'dispenser@pharmacy.com',
      displayName: 'Dispenser User',
      password: 'dispenser123',
      roles: ['DISPENSER']
    }
  ]

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 10)
    
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        displayName: userData.displayName,
        passwordHash: hashedPassword
      }
    })

    // Assign roles
    for (const roleName of userData.roles) {
      await prisma.userRole.upsert({
        where: {
          userId_roleName: {
            userId: user.id,
            roleName: roleName
          }
        },
        update: {},
        create: {
          userId: user.id,
          roleName: roleName
        }
      })
    }
  }

  // Create sample medicines (Fixed approach)
  // Alternative seed approach for medicines
const medicines = [
  { name: 'Paracetamol', strength: '500mg', form: 'Tablet' },
  { name: 'Ibuprofen', strength: '400mg', form: 'Tablet' },
  { name: 'Amoxicillin', strength: '250mg', form: 'Capsule' },
  { name: 'Cough Syrup', strength: '100ml', form: 'Syrup' },
  { name: 'Aspirin', strength: '75mg', form: 'Tablet' }
]

for (const medicine of medicines) {
  // Check if medicine exists first
  const existing = await prisma.medicine.findFirst({
    where: {
      name: medicine.name,
      strength: medicine.strength,
      form: medicine.form
    }
  })

  if (!existing) {
    await prisma.medicine.create({
      data: medicine
    })
  }
}


  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
