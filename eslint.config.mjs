import next from 'eslint-config-next/core-web-vitals'
export default [...next, { ignores: ['.next/**'] }, { rules: { 'react-hooks/set-state-in-effect': 'warn', 'react-hooks/refs': 'warn', 'react-hooks/purity': 'warn', 'react-hooks/immutability': 'warn', 'react-hooks/preserve-manual-memoization': 'warn' } }]
