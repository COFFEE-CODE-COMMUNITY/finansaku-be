export const success = (res, message = 'Success', data = null, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  })
}

export const fail = (res, message = 'Error', status = 400, errors = null) => {
  return res.status(status).json({
    success: false,
    message,
    errors,
  })
}

// ⬇️ alias supaya import { ok, fail } tetap jalan
export const ok = success
