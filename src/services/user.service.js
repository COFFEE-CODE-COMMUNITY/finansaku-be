import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const findAll = async () => {
  return prisma.user.findMany()
}

export const findById = async (id) => {
  return prisma.user.findUnique({ where: { id } })
}

export const create = async (data) => {
  return prisma.user.create({ data })
}

export const update = async (id, data) => {
  return prisma.user.update({ where: { id }, data })
}

export const deleteById = async (id) => {
  return prisma.user.delete({ where: { id } })
}
