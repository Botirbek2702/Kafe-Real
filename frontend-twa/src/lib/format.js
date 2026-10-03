// 35000 -> "35 000"
export const formatNumber = (n) => new Intl.NumberFormat('ru-RU').format(n).replace(/\u00a0/g, ' ')

// 35000 -> "35 000 so'm"
export const formatPrice = (n) => `${formatNumber(n)} so'm`
