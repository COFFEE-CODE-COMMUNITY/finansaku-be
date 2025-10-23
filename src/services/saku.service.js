import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const findAll = async () => {
  return prisma.saku.findMany({
    include: { user: true }, // ikut ambil info user
  })
}

export const findById = async (id) => {
  return prisma.saku.findUnique({
    where: { id },
    include: { user: true },
  })
}

export const create = async (data) => {
  // pastikan userId dikirim di body
  return prisma.saku.create({ data })
}

export const update = async (id, data) => {
  return prisma.saku.update({ where: { id }, data })
}

export const deleteById = async (id) => {
  return prisma.saku.delete({ where: { id } })
}
