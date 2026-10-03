// 35000 -> "35 000 so'm"
export const formatPrice = (n) => `${new Intl.NumberFormat('ru-RU').format(n).replace(/\u00a0/g, ' ')} so'm`
