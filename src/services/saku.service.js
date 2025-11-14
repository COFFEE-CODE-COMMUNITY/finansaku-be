import { prisma } from "../config/prisma.js"

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

export const create = async (userId, payload) => {
  const { cityId, year, month, salary, notes } = payload

  // 1. Validate required fields
  if (!cityId || !year || !month || salary === undefined) {
    const err = new Error("Missing required fields: cityId, year, month, and salary are required.")
    err.statusCode = 422
    throw err
  }

  // 2. Automatically find the UMK record
  const umkRecord = await prisma.uMK.findUnique({
    where: { cityId_year: { cityId, year } },
    select: { id: true }
  })

  if (!umkRecord) {
      const err = new Error(`UMK data not found for cityId ${cityId} and year ${year}. Cannot create Saku.`)
      err.statusCode = 404
      throw err
  }

  // 3. Construct the data
  const dataToCreateOrUpdate = {
    userId,
    cityId,
    umkId: umkRecord.id,
    year,
    month,
    salary,
    notes: notes || null
  }

  // 4. Use upsert-like logic
  const existingSaku = await prisma.saku.findFirst({
    where: { userId, cityId, year, month }
  })

  if (existingSaku) {
    // === REVISED: Saku exists, perform an update ===
    const updatedSaku = await prisma.saku.update({
      where: { id: existingSaku.id },
      data: {
        salary: salary,
        umkId: umkRecord.id,
        notes: notes || null
      },
      include: { user: true },
    })
    return { saku: updatedSaku, wasCreated: false }
  } else {
    const newSaku = await prisma.saku.create({
      data: dataToCreateOrUpdate,
      include: { user: true }
    })
    return { saku: newSaku, wasCreated: true }
  }
}

export const update = async (id, data) => {
  // We only allow updating salary or notes, not core fields
  const dataToUpdate = {
    salary: data.salary,
    notes: data.notes
  }
  return prisma.saku.update({
    where: { id },
    data: dataToUpdate,
    include: { user: true }
  })
}

export const deleteById = async (id) => {
  return prisma.saku.delete({
    where: { id }
  })
}
