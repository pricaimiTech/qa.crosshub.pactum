import {
	appointmentsBusiness,
	assertTs,
	authBusiness,
	describeName,
	packageBuilder,
	personBuilder,
	serviceBuilder,
} from "@core/constants"
import type { IParamsDefault } from "@core/interfaces/global.interface"
import type { IPackageContract } from "@core/interfaces/shared/IShared.interface"
import getPersonFinancialSummary from "@core/services/appointments/getPersonFinancialSummary.service"
import getPersonPackages from "@core/services/appointments/getPersonPackages.service"
import postContractPayment from "@core/services/appointments/postContractPayment.service"
import postCreatePackage from "@core/services/appointments/postCreatePackage.service"
import postCreateService from "@core/services/appointments/postCreateService.service"
import postCreatePerson from "@core/services/people/postCreatePerson.service"
import postSellPackage from "@core/services/appointments/postSellPackage.service"
import { packagesAG33 } from "@appointments-data/packages.data"

describe(describeName.dashboard, () => {
	let adminParams: IParamsDefault
	let personId: string
	let packageId: string

	before("Pessoa nova e pacote do caso, sem nenhum lançamento financeiro", async () => {
		adminParams = await authBusiness.loginAsTenantAdmin(
			`${process.env.TENANT_SLUG}`,
			`${process.env.TENANT_EMAIL}`,
			`${process.env.TENANT_PASSWORD}`,
			packagesAG33.loginParams,
		)

		await appointmentsBusiness.cleanupByPrefix(packagesAG33.casePrefix, adminParams)

		const service = await postCreateService(
			serviceBuilder.withName(packagesAG33.casePrefix).build(),
			packagesAG33.paramsDefault201(adminParams.token),
		)

		const person = await postCreatePerson(
			personBuilder
				.withName(packagesAG33.casePrefix)
				.withEmail(packagesAG33.casePrefix)
				.build(),
			packagesAG33.paramsDefault201(adminParams.token),
		)
		personId = person.json.id

		const createdPackage = await postCreatePackage(
			packageBuilder
				.withName(packagesAG33.packageName)
				.withCredits(packagesAG33.priceCents, packagesAG33.totalCredits)
				.withService(service.json.id, packagesAG33.creditsPerSession)
				.build(),
			packagesAG33.paramsDefault201(adminParams.token),
		)
		packageId = createdPackage.json.id
	})

	it("[AG-33-F] - Venda de pacote entra no financeiro: em aberto sem pagamento, abatido pelo contrato e quitado na venda paga", async () => {
		const unpaidContract = await postSellPackage(
			personId,
			{ packageId },
			packagesAG33.paramsDefault201(adminParams.token),
		)
		const summaryUnpaid = await getPersonFinancialSummary(
			personId,
			packagesAG33.paramsDefault200(adminParams.token),
		)
		const listUnpaid = await getPersonPackages(
			personId,
			packagesAG33.paramsDefault200(adminParams.token),
		)

		const partial = await postContractPayment(
			unpaidContract.json.id,
			{
				amountCents: packagesAG33.partialPaymentCents,
				method: packagesAG33.partialMethod,
				notes: packagesAG33.partialNotes,
			},
			packagesAG33.paramsDefault201(adminParams.token),
		)
		const summaryPartial = await getPersonFinancialSummary(
			personId,
			packagesAG33.paramsDefault200(adminParams.token),
		)
		const overOutstanding = await postContractPayment(
			unpaidContract.json.id,
			{
				amountCents: packagesAG33.overOutstandingCents,
				method: packagesAG33.partialMethod,
			},
			packagesAG33.paramsDefault409(adminParams.token),
		)

		const paidContract = await postSellPackage(
			personId,
			{
				packageId,
				paymentAmountCents: packagesAG33.priceCents,
				paymentMethod: packagesAG33.fullMethod,
			},
			packagesAG33.paramsDefault201(adminParams.token),
		)
		const listPaid = await getPersonPackages(
			personId,
			packagesAG33.paramsDefault200(adminParams.token),
		)
		const missingMethod = await postSellPackage(
			personId,
			{ packageId, paymentAmountCents: packagesAG33.partialPaymentCents },
			packagesAG33.paramsDefault400(adminParams.token),
		)

		const unpaidInList = (listUnpaid.json as Array<IPackageContract>).filter(
			(contract) => contract.id === unpaidContract.json.id,
		)
		const paidInList = (listPaid.json as Array<IPackageContract>).filter(
			(contract) => contract.id === paidContract.json.id,
		)

		assertTs.equal(
			summaryUnpaid.json.receivedCents,
			0,
			"A venda sem pagamento não deveria somar nada em Recebido.",
		)
		assertTs.equal(
			summaryUnpaid.json.outstandingCents,
			packagesAG33.priceCents,
			"A venda sem pagamento não deixou o valor cheio do pacote em aberto.",
		)
		assertTs.equal(
			unpaidInList[0].paidCents,
			0,
			"A listagem de contratos não traz `paidCents` zerado no contrato sem pagamento.",
		)
		assertTs.equal(
			unpaidInList[0].outstandingCents,
			packagesAG33.priceCents,
			"A listagem de contratos não traz o valor cheio em `outstandingCents`.",
		)

		assertTs.equal(
			partial.json.payment.type,
			packagesAG33.paymentType,
			"O pagamento do contrato não foi registrado como `payment`.",
		)
		assertTs.equal(
			partial.json.payment.packageContractId,
			unpaidContract.json.id,
			"O pagamento não ficou vinculado ao contrato de pacote.",
		)
		assertTs.equal(
			partial.json.paidCents,
			packagesAG33.partialPaymentCents,
			"O `paidCents` da resposta não é o valor pago.",
		)
		assertTs.equal(
			partial.json.outstandingCents,
			packagesAG33.expectedOutstandingAfterPartial,
			"O `outstandingCents` da resposta não é o preço menos o pago.",
		)
		assertTs.equal(
			summaryPartial.json.receivedCents,
			packagesAG33.partialPaymentCents,
			"O pagamento do contrato não entrou em Recebido no resumo da pessoa.",
		)
		assertTs.equal(
			summaryPartial.json.outstandingCents,
			packagesAG33.expectedOutstandingAfterPartial,
			"O pagamento do contrato não abateu o Em aberto do resumo da pessoa.",
		)
		assertTs.equal(
			overOutstanding.json.message,
			packagesAG33.overOutstandingMessage,
			"A mensagem do pagamento acima do saldo não é a especificada.",
		)

		assertTs.equal(
			paidInList[0].paidCents,
			packagesAG33.priceCents,
			"A venda com pagamento integral não nasceu com `paidCents` igual ao preço.",
		)
		assertTs.equal(
			paidInList[0].outstandingCents,
			0,
			"A venda com pagamento integral deixou saldo em aberto.",
		)
		assertTs.include(
			JSON.stringify(missingMethod.json.message),
			packagesAG33.missingMethodMessage,
			"A venda com valor e sem forma de pagamento não devolveu a mensagem especificada.",
		)
	})
})
