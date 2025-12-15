import prisma from "../config/prisma.js"

// Ambil SEMUA kota (buat dropdown FE)
export const getAllCities = async () => {
  return prisma.city.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  })
}

// Ambil kota dengan pagination
export const getCitiesPaginated = async ({ page, limit }) => {
  const skip = (page - 1) * limit

  return prisma.city.findMany({
    skip,
    take: limit,
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  })
}
