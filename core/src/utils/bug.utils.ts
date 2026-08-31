import type { IKnownBug } from "../interface/global.interface"

/**
 * Sufixo do título do `it` para um caso com bug aberto. Aparece no output do
 * Mocha e no `xunit.xml`, então o relatório de CI já mostra que aquela falha
 * é conhecida e onde ela está documentada.
 * @param bug - Bug aberto no board de QA
 */
export function bugTag(bug: IKnownBug): string {
	return `[BUG #${bug.number}]`
}

/**
 * Mensagem de asserção acrescida do link do bug — quando o teste falha, o
 * próprio output diz para onde ir.
 * @param message - Mensagem original da asserção
 * @param bug - Bug aberto no board de QA
 */
export function bugMessage(message: string, bug: IKnownBug): string {
	return `${message} Bug aberto: ${bug.url}`
}
