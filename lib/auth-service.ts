import type { User } from "./users-service"

// Simulate current logged-in user
let currentUser: User | null = null

export const authService = {
  // Login user
  async login(email: string, password: string): Promise<User | null> {
    // In a real app, this would validate credentials against the database
    const { usersService } = await import("./users-service")
    const users = await usersService.getAll()
    const user = users.find((u) => u.email === email && u.status === "ativo")

    if (user) {
      currentUser = user
      // Store in localStorage for persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(user))
      }
      return user
    }
    return null
  },

  // Get current logged-in user
  getCurrentUser(): User | null {
    if (!currentUser && typeof window !== "undefined") {
      const stored = localStorage.getItem("currentUser")
      if (stored) {
        currentUser = JSON.parse(stored)
      }
    }
    return currentUser
  },

  // Update current user profile
  async updateProfile(userData: Partial<User>): Promise<User | null> {
    if (!currentUser) return null

    const { usersService } = await import("./users-service")
    const updatedUser = await usersService.update(currentUser.id, userData)

    if (updatedUser) {
      currentUser = updatedUser
      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
      }
    }

    return updatedUser
  },

  // Logout user
  logout(): void {
    currentUser = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser")
    }
  },
}
