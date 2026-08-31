import { mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

/**
 * JPEG válido de 1x1 pixel, em base64.
 *
 * Serve de semente para os arquivos de teste de upload: tem cabeçalho JPEG de
 * verdade, então passa por qualquer verificação de tipo por conteúdo (não só por
 * extensão).
 */
const jpegSeedBase64 =
	"/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a" +
	"HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAA" +
	"AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q=="

/** Pasta temporária dos arquivos gerados pela suíte. */
function fixturesDir(): string {
	const dir = join(tmpdir(), "qa-crosshub-fixtures")
	mkdirSync(dir, { recursive: true })

	return dir
}

/**
 * Gera um JPEG válido com o tamanho pedido.
 *
 * Os casos de upload precisam de arquivos nos dois lados do limite de 5 MB, e um
 * arquivo de 5 MB não deve ser versionado — por isso ele é escrito na pasta
 * temporária a cada execução.
 * @param name - Nome do arquivo gerado
 * @param sizeInBytes - Tamanho final; o excedente é preenchido depois do JPEG
 * @returns Caminho absoluto do arquivo
 */
export function writeJpeg(name: string, sizeInBytes: number): string {
	const seed = Buffer.from(jpegSeedBase64, "base64")
	const padding = Math.max(0, sizeInBytes - seed.length)
	const path = join(fixturesDir(), name)

	writeFileSync(path, Buffer.concat([seed, Buffer.alloc(padding)]))

	return path
}

/**
 * Gera um PDF mínimo, para provar que o tipo é recusado.
 * @param name - Nome do arquivo gerado
 * @returns Caminho absoluto do arquivo
 */
export function writePdf(name: string): string {
	const path = join(fixturesDir(), name)

	writeFileSync(
		path,
		"%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
	)

	return path
}
