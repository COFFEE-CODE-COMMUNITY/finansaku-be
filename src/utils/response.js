export const ok = (res, message, data = {}) => {
  return res.status(200).json({
    success: true,
    message,
    data
  })
}

export const fail = (res, message, status = 400) => {
  return res.status(status).json({
    success: false,
    message
  })
}
