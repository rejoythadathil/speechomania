import { readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const roots = ['src/components', 'src/utils', 'src/styles']

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, files)
    else files.push(path)
  }
  return files
}

let converted = 0
for (const file of roots.flatMap((root) => walk(root))) {
  if (/\.tsx?$/.test(file)) {
    const output = ts.transpileModule(readFileSync(file, 'utf8'), {
      fileName: file,
      compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.Preserve, removeComments: true }
    }).outputText.replace(/^"use client";\n/m, '')
    writeFileSync(file.replace(/\.tsx$/, '.jsx').replace(/\.ts$/, '.js'), output)
    unlinkSync(file)
    converted += 1
  } else if (file.endsWith('.css')) {
    const css = readFileSync(file, 'utf8')
    const stripped = css.replace(/\/\*[\s\S]*?\*\/\n?/g, '')
    if (stripped !== css) writeFileSync(file, stripped)
  }
}

console.log(`converted ${converted} BoardUI files to JSX`)
