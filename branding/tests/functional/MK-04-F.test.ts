import {
	assertTs,
	authBusiness,
	brandingBuilder,
	describeName,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import getBrandingAsset from "@core/services/assets/getBranding.service"
import postUploadBranding from "@core/services/branding/postUploadBranding.service"
import putSaveBranding from "@core/services/branding/putSaveBranding.service"
import { writeJpeg } from "@core/utils/file.utils"
import { tenantFor } from "@core/utils/tenant.utils"
import { brandingMK04 } from "@branding-data/branding.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let tenantId: string
	let chaveAntiga: string
	let arquivoAntigo: string

	before("Marca com a primeira logo salva", async () => {
		const tenant = tenantFor(brandingMK04.caseId)
		tenantId = tenant.tenantId

		adminParams = await authBusiness.loginAsTenantAdmin(
			tenant.slug,
			tenant.adminEmail,
			tenant.adminPassword,
			brandingMK04.loginParams,
		)

		const primeira = await postUploadBranding(
			writeJpeg("marca-logo-antiga.jpg", brandingMK04.primeiraLogoBytes),
			brandingMK04.kind,
			brandingMK04.paramsDefault201(adminParams.token),
		)

		chaveAntiga = `${primeira.json.key}`
		arquivoAntigo = chaveAntiga.split("/").pop() as string

		await putSaveBranding(
			brandingBuilder
				.withDisplayName(brandingMK04.casePrefix)
				.withLogoKey(chaveAntiga)
				.build(),
			brandingMK04.paramsDefault200(adminParams.token),
		)
	})

	it("[MK-04-F] - Substituir a logo sobrescreve a chave `/current` e não deixa ativo órfão", async () => {
		const segunda = await postUploadBranding(
			writeJpeg("marca-logo-nova.jpg", brandingMK04.segundaLogoBytes),
			brandingMK04.kind,
			brandingMK04.paramsDefault201(adminParams.token),
		)

		assertTs.equal(
			`${segunda.json.key}`,
			chaveAntiga,
			"A segunda logo recebeu chave diferente da primeira. Para a logo a chave é fixa em `/current`, e é isso que mantém a URL pública válida durante a troca — chave nova deixaria a anterior órfã no armazenamento.",
		)

		assertTs.isTrue(
			chaveAntiga.endsWith(brandingMK04.chavePreservada),
			"A chave da logo não termina em `/current`. É esse sufixo que a especificação isenta da remoção; sem ele, o caso passa a exigir que o objeto antigo seja apagado.",
		)

		const salva = await putSaveBranding(
			brandingBuilder
				.withDisplayName(brandingMK04.casePrefix)
				.withLogoKey(segunda.json.key)
				.build(),
			brandingMK04.paramsDefault200(adminParams.token),
		)

		assertTs.exists(
			salva.json.logoUrl,
			"A marca ficou sem logo depois da substituição.",
		)

		// A URL continua válida — é o ponto do apelido estável. O que mudou é o
		// conteúdo, e é o único jeito de distinguir a logo nova da antiga quando
		// a chave é a mesma.
		const servida = await getBrandingAsset(
			tenantId,
			brandingMK04.kind,
			arquivoAntigo,
			brandingMK04.paramsDefault200(adminParams.token),
		)

		assertTs.equal(
			Number(servida.headers["content-length"]),
			brandingMK04.segundaLogoBytes,
			"A URL da logo continua servindo o arquivo ANTIGO depois da substituição. A chave é a mesma, então o upload não sobrescreveu o objeto.",
		)
	})
})
