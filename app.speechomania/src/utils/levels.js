export const LEVELS = [
  { id: 'violet', name: 'Violet', colour: '#8b3fd9' },
  { id: 'indigo', name: 'Indigo', colour: '#4b3fb8' },
  { id: 'blue', name: 'Blue', colour: '#1f7ae0' },
  { id: 'green', name: 'Green', colour: '#23a05a' },
  { id: 'yellow', name: 'Yellow', colour: '#f2c21b' },
  { id: 'orange', name: 'Orange', colour: '#f08a1c' },
  { id: 'red', name: 'Red', colour: '#e0403a' }
]

export const levelOf = (id) => LEVELS.find((level) => level.id === id) ?? null
