import 'next-auth'

declare module 'next-auth' {
  interface User {
    roles: string[]
  }
  
  interface Session {
    user: {
      id: string
      email: string
      name: string
      roles: string[]
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    roles: string[]
  }
}
