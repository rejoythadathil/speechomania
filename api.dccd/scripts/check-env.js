try {
  await import('../config/index.js')
  console.log('env ok')
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
