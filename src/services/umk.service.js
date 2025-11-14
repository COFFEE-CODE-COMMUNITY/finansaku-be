import { prisma } from "../config/prisma.js"

export const findAll = async () => {
  return prisma.uMK.findMany() // Sesuaikan dengan nama model di Prisma (misal "uMK" atau "UMK")
}

export const findById = async (id) => {
  return prisma.uMK.findUnique({ where: { id } })
}

export const update = async (id, data) => {
  return prisma.uMK.update({ where: { id }, data })
}