import { getAllCities } from "../services/city.service.js"

export const getCities = async (req, res, next) => {
  try {
    const cities = await getAllCities()

    res.status(200).json({
      success: true,
      message: "Get all cities success",
      data: cities,
    })
  } catch (error) {
    next(error)
  }
}
