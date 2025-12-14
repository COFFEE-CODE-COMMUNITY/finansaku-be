import prisma from "../config/prisma.js"

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
