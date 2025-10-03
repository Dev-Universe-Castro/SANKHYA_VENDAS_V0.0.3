export interface User {
  id: number
  name: string
  email: string
  role: string
  status: "ativo" | "pendente" | "bloqueado"
  password?: string
  avatar?: string
}

const usersCache: User[] = [
  {
    id: 0,
    name: "SUP",
    email: "sup@sankhya.com",
    role: "Administrador",
    status: "ativo",
    password: "sup123",
    avatar: "/placeholder-user.png",
  },
]

// Simulate async database operations
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const usersService = {
  // Get all users
  async getAll(): Promise<User[]> {
    await delay(100) // Simulate network delay
    return [...usersCache]
  },

  async getPending(): Promise<User[]> {
    await delay(100)
    return usersCache.filter((user) => user.status === "pendente")
  },

  // Get user by ID
  async getById(id: number): Promise<User | undefined> {
    await delay(100)
    return usersCache.find((user) => user.id === id)
  },

  async register(userData: { name: string; email: string; password: string }): Promise<User> {
    await delay(100)

    // Check if email already exists
    const existingUser = usersCache.find((user) => user.email === userData.email)
    if (existingUser) {
      throw new Error("Email já cadastrado")
    }

    const newUser: User = {
      id: Math.max(...usersCache.map((u) => u.id), 0) + 1,
      name: userData.name,
      email: userData.email,
      role: "Vendedor", // Default role
      status: "pendente", // Pending approval
      password: userData.password,
    }
    usersCache.push(newUser)
    return newUser
  },

  // Create new user (admin only)
  async create(userData: Omit<User, "id">): Promise<User> {
    await delay(100)
    const newUser: User = {
      id: Math.max(...usersCache.map((u) => u.id), 0) + 1,
      ...userData,
    }
    usersCache.push(newUser)
    return newUser
  },

  // Update user
  async update(id: number, userData: Partial<User>): Promise<User | null> {
    await delay(100)
    const index = usersCache.findIndex((user) => user.id === id)
    if (index === -1) return null

    usersCache[index] = { ...usersCache[index], ...userData }
    return usersCache[index]
  },

  async approve(id: number): Promise<User | null> {
    await delay(100)
    const index = usersCache.findIndex((user) => user.id === id)
    if (index === -1) return null

    usersCache[index].status = "ativo"
    return usersCache[index]
  },

  async block(id: number): Promise<User | null> {
    await delay(100)
    const index = usersCache.findIndex((user) => user.id === id)
    if (index === -1) return null

    usersCache[index].status = "bloqueado"
    return usersCache[index]
  },

  // Delete user
  async delete(id: number): Promise<boolean> {
    await delay(100)
    const index = usersCache.findIndex((user) => user.id === id)
    if (index === -1) return false

    usersCache.splice(index, 1)
    return true
  },

  // Search users
  async search(term: string): Promise<User[]> {
    await delay(100)
    const lowerTerm = term.toLowerCase()
    return usersCache.filter(
      (user) =>
        user.name.toLowerCase().includes(lowerTerm) ||
        user.email.toLowerCase().includes(lowerTerm) ||
        user.role.toLowerCase().includes(lowerTerm),
    )
  },
}
