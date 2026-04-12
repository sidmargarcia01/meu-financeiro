const fs = require('fs')
const path = require('path')

/**
 * Script para adicionar export const dynamic = 'force-dynamic' 
 * a todas as páginas que ainda não têm
 */

function findPageFiles(dir) {
  const files = []

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir)

    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        traverse(fullPath)
      } else if (item === 'page.tsx') {
        files.push(fullPath)
      }
    }
  }

  traverse(dir)
  return files
}

function fixPage(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')

    // Verificar se já tem export const dynamic
    if (content.includes('export const dynamic')) {
      console.log(`[SKIP] ${filePath} - já tem dynamic export`)
      return false
    }

    // Encontrar o lugar correto para inserir (depois de 'use client' e antes dos imports)
    const lines = content.split('\n')
    let insertIndex = -1

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Pular comentários no início
      if (line.trim().startsWith('/*') ||
        line.trim().startsWith('*') ||
        line.trim().startsWith('*/') ||
        line.trim().startsWith('//') ||
        line.trim() === '') {
        continue
      }

      // Se encontrar 'use client', inserir depois dele
      if (line.trim().startsWith('\'use client\'')) {
        insertIndex = i + 1
        break
      }

      // Se encontrar o primeiro import, inserir antes dele
      if (line.trim().startsWith('import')) {
        insertIndex = i
        break
      }

      // Se não encontrar nada, inserir no início
      insertIndex = i
      break
    }

    if (insertIndex === -1) {
      console.log(`[ERROR] ${filePath} - não encontrou ponto de inserção`)
      return false
    }

    // Inserir export const dynamic no lugar correto
    lines.splice(insertIndex, 0, "export const dynamic = 'force-dynamic'")

    const newContent = lines.join('\n')
    fs.writeFileSync(filePath, newContent, 'utf8')

    console.log(`[FIXED] ${filePath} - adicionado export const dynamic`)
    return true

  } catch (error) {
    console.error(`[ERROR] ${filePath} - ${error.message}`)
    return false
  }
}

// Executar o script
const pagesDir = path.join(__dirname, '..', 'src', 'app')
const pageFiles = findPageFiles(pagesDir)

console.log(`Encontradas ${pageFiles.length} páginas...`)
console.log('')

let fixedCount = 0
for (const pageFile of pageFiles) {
  if (fixPage(pageFile)) {
    fixedCount++
  }
}

console.log('')
console.log(`Concluído! ${fixedCount} páginas foram corrigidas.`)
