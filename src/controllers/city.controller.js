import { getAllCities, getCitiesPaginated } from "../services/city.service.js"

export const getCities = async (req, res, next) => {
  try {
    const { all, page = 1, limit = 20 } = req.query

    let cities

    // FE mau ambil SEMUA (dropdown, dll)
    if (all === "true") {
      cities = await getAllCities()
    } else {
      // default pagination
      cities = await getCitiesPaginated({
        page: Number(page),
        limit: Number(limit),
      })
    }

    res.status(200).json({
      success: true,
      message: "Get cities success",
      data: cities,
    })
  } catch (error) {
    next(error)
  }
}
