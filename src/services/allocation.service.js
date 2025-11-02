import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// === Get All Allocations ===
export const findAll = async () => {
  return prisma.sakuAllocation.findMany({
    include: {
      saku: true,
      category: true,
      subcategory: true,
    },
  })
}

// === Get Allocation by ID ===
export const findById = async (id) => {
  return prisma.sakuAllocation.findUnique({
    where: { id },
    include: {
      saku: true,
      category: true,
      subcategory: true,
    },
  })
}

// === Create Allocation ===
export const create = async (data) => {
  return prisma.sakuAllocation.create({
    data,
  })
}

// === Update Allocation ===
export const update = async (id, data) => {
  return prisma.sakuAllocation.update({
    where: { id },
    data,
  })
}

// === Delete Allocation ===
export const deleteById = async (id) => {
  return prisma.sakuAllocation.delete({
    where: { id },
  })
}

// === Distribute Budget (auto allocation logic) ===
export const distributeBudget = async (sakuId, allocations) => {
  const saku = await prisma.saku.findUnique({ where: { id: sakuId } })
  if (!saku) throw new Error("Saku not found")

  const totalSalary = saku.salary ?? 0

  const totalPercentage = allocations.reduce((acc, a) => acc + a.percentage, 0)
  if (totalPercentage > 100) {
    throw new Error("Total percentage cannot exceed 100%")
  }

  // Hitung amount tiap alokasi
  const calculated = allocations.map((a) => ({
    sakuId,
    categoryId: a.categoryId,
    subcategoryId: a.subcategoryId ?? null,
    percentage: a.percentage,
    fixedAmount: a.fixedAmount ?? 0,
    amount: Math.round((a.percentage / 100) * totalSalary),
  }))

  // Hapus alokasi lama sebelum insert baru
  await prisma.sakuAllocation.deleteMany({ where: { sakuId } })

  // Simpan semua alokasi baru
  const result = await prisma.sakuAllocation.createMany({
    data: calculated,
  })

  return { totalSalary, totalPercentage, inserted: result.count }
}
