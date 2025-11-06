export class HistoryQueryDto {
  constructor(query) {
    this.type = query.type || 'all'
    this.limit = Number(query.limit) || 10
    this.page = Number(query.page) || 1
  }

  validate() {
    const validTypes = ['income', 'expense', 'all']
    if (!validTypes.includes(this.type)) {
      throw new Error('Invalid type value. Use income, expense, or all.')
    }
    if (this.limit < 1 || this.page < 1) {
      throw new Error('Limit and page must be positive numbers.')
    }
    return this
  }
}
